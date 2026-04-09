import { join, relative } from "node:path";
import { readdir, stat, unlink } from "node:fs/promises";
import pino from "pino";
import { env } from "@/config/env.js";
import { prisma } from "@/config/database.js";
import { migrateFileToEncrypted } from "@/helpers/file-crypto.js";

const logger = pino({ name: "maintenance" });

interface MaintenanceResult {
    encrypted: number;
    orphansRemoved: number;
    retention: {
        cronJobLogs: number;
        emailLogs: number;
        loginSessions: number;
    };
}

// ─── 1. Encrypt plaintext files ─────────────────────────────

async function findPlaintextFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        return files;
    }

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await findPlaintextFiles(fullPath)));
        } else if (entry.isFile() && !entry.name.endsWith(".enc")) {
            const encExists = await stat(`${fullPath}.enc`).catch(() => null);
            if (!encExists) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

async function encryptPlaintextFiles(uploadDir: string): Promise<number> {
    const files = await findPlaintextFiles(uploadDir);
    if (files.length === 0) return 0;

    logger.info({ count: files.length }, "Found unencrypted files");

    let encrypted = 0;
    for (const absPath of files) {
        try {
            await migrateFileToEncrypted(absPath);
            encrypted++;
        } catch (err) {
            const relPath = relative(uploadDir, absPath);
            logger.error({ err, file: relPath }, "Failed to encrypt file");
        }
    }

    return encrypted;
}

// ─── 2. Remove orphaned upload files ─────────────────────

async function removeOrphanedUploads(uploadDir: string): Promise<number> {
    const uploadsDir = join(uploadDir, "uploads");

    let entries;
    try {
        entries = await readdir(uploadsDir);
    } catch {
        return 0; // Directory doesn't exist
    }

    // Get all upload URLs from DB
    const dbUploads = await prisma.upload.findMany({
        select: { url: true },
    });

    // Build a set of expected filenames (without .enc suffix)
    const expectedFiles = new Set<string>();
    for (const s of dbUploads) {
        // url = "/uploads/files/uuid.png"
        const parts = s.url.split("/");
        const filename = parts[parts.length - 1];
        if (filename) expectedFiles.add(filename);
    }

    let removed = 0;
    for (const entry of entries) {
        // Normalize: "uuid.png.enc" → "uuid.png" for lookup
        const baseName = entry.endsWith(".enc") ? entry.slice(0, -4) : entry;

        if (!expectedFiles.has(baseName)) {
            const fullPath = join(uploadsDir, entry);
            try {
                const fileStat = await stat(fullPath);
                if (!fileStat.isFile()) continue;

                await unlink(fullPath);
                removed++;
                logger.info({ file: entry }, "Removed orphaned upload");
            } catch (err) {
                logger.error({ err, file: entry }, "Failed to remove orphan");
            }
        }
    }

    return removed;
}

// ─── 3. Data retention cleanup ───────────────────────────────

async function cleanupRetentionData() {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // For login sessions: keep the latest session per fingerprint per user,
    // only delete older duplicates. This prevents false "new device" alerts
    // when retention cleanup runs.
    const duplicateSessions = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT ls.id FROM login_sessions ls
        INNER JOIN (
            SELECT user_id, fingerprint, MAX(created_at) as latest
            FROM login_sessions
            GROUP BY user_id, fingerprint
        ) keep ON ls.user_id = keep.user_id 
            AND ls.fingerprint = keep.fingerprint
        WHERE ls.created_at < keep.latest
            AND ls.created_at < ${oneYearAgo}
    `;

    const sessionIds = duplicateSessions.map((s) => s.id);

    const [cronJobLogs, emailLogs, loginSessions] = await Promise.all([
        prisma.cronJobLog.deleteMany({ where: { startedAt: { lt: oneYearAgo } } }),
        prisma.emailLog.deleteMany({ where: { sentAt: { lt: sixMonthsAgo } } }),
        sessionIds.length > 0
            ? prisma.loginSession.deleteMany({ where: { id: { in: sessionIds } } })
            : Promise.resolve({ count: 0 }),
    ]);

    const total = cronJobLogs.count + emailLogs.count + loginSessions.count;
    if (total > 0) {
        logger.info(
            {
                cronJobLogs: cronJobLogs.count,
                emailLogs: emailLogs.count,
                loginSessions: loginSessions.count,
            },
            "Retention cleanup completed",
        );
    }

    return {
        cronJobLogs: cronJobLogs.count,
        emailLogs: emailLogs.count,
        loginSessions: loginSessions.count,
    };
}

// ─── 4. Run all maintenance tasks ────────────────────────────

export async function runMaintenance(): Promise<MaintenanceResult> {
    const uploadDir = env().UPLOAD_DIR;

    const dirExists = await stat(uploadDir).catch(() => null);
    if (!dirExists?.isDirectory()) {
        logger.info("Upload directory does not exist, skipping file maintenance");
    }

    // File maintenance (only if upload dir exists)
    const encrypted = dirExists?.isDirectory() ? await encryptPlaintextFiles(uploadDir) : 0;
    const orphansRemoved = dirExists?.isDirectory() ? await removeOrphanedUploads(uploadDir) : 0;

    // Data retention cleanup (always runs)
    const retention = await cleanupRetentionData();

    return { encrypted, orphansRemoved, retention };
}
