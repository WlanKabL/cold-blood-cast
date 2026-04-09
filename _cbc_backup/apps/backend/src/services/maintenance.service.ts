import { join, relative } from "node:path";
import { readdir, stat, unlink } from "node:fs/promises";
import { prisma } from "../db/client.js";
import { loadEnv } from "../config.js";
import { migrateFileToEncrypted } from "../helpers/file-crypto.js";

interface MaintenanceResult {
    encrypted: number;
    orphansRemoved: number;
    exportsExpired: number;
    retention: {
        emailLogs: number;
        loginSessions: number;
        maintenanceLogs: number;
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
    const env = loadEnv();
    if (!env.ENCRYPTION_KEY) return 0;

    const files = await findPlaintextFiles(uploadDir);
    if (files.length === 0) return 0;

    let encrypted = 0;
    for (const absPath of files) {
        try {
            await migrateFileToEncrypted(absPath);
            encrypted++;
        } catch (err) {
            const relPath = relative(uploadDir, absPath);
            console.error(`[maintenance] Failed to encrypt file: ${relPath}`, err);
        }
    }

    return encrypted;
}

// ─── 2. Remove orphaned upload files ─────────────────────────

async function removeOrphanedFiles(uploadDir: string): Promise<number> {
    const imageDir = join(uploadDir, "images");

    let entries: string[];
    try {
        entries = await readdir(imageDir);
    } catch {
        return 0;
    }

    const dbUploads = await prisma.upload.findMany({ select: { path: true } });
    const expectedFiles = new Set<string>();
    for (const u of dbUploads) {
        const parts = u.path.split("/");
        const filename = parts[parts.length - 1];
        if (filename) expectedFiles.add(filename);
    }

    let removed = 0;
    for (const entry of entries) {
        const baseName = entry.endsWith(".enc") ? entry.slice(0, -4) : entry;
        if (!expectedFiles.has(baseName)) {
            const fullPath = join(imageDir, entry);
            try {
                const fileStat = await stat(fullPath);
                if (!fileStat.isFile()) continue;
                await unlink(fullPath);
                removed++;
            } catch {
                // ignore cleanup errors
            }
        }
    }

    return removed;
}

// ─── 3. Cleanup expired data exports ─────────────────────────

async function cleanupExpiredExports(): Promise<number> {
    const now = new Date();
    const expired = await prisma.dataExport.findMany({
        where: {
            expiresAt: { lt: now },
            status: "completed",
        },
    });

    for (const exp of expired) {
        if (exp.filePath) {
            await unlink(exp.filePath).catch(() => {});
        }
    }

    const result = await prisma.dataExport.deleteMany({
        where: {
            expiresAt: { lt: now },
            status: "completed",
        },
    });

    return result.count;
}

// ─── 4. Data retention cleanup ───────────────────────────────

async function cleanupRetentionData() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // For login sessions: keep the latest session per fingerprint per user,
    // only delete older duplicates to prevent false "new device" alerts.
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

    const [emailLogs, loginSessions, maintenanceLogs] = await Promise.all([
        prisma.emailLog.deleteMany({ where: { sentAt: { lt: sixMonthsAgo } } }),
        sessionIds.length > 0
            ? prisma.loginSession.deleteMany({ where: { id: { in: sessionIds } } })
            : Promise.resolve({ count: 0 }),
        prisma.maintenanceLog.deleteMany({
            where: { startedAt: { lt: oneYearAgo } },
        }),
    ]);

    return {
        emailLogs: emailLogs.count,
        loginSessions: loginSessions.count,
        maintenanceLogs: maintenanceLogs.count,
    };
}

// ─── 5. Run all maintenance tasks ────────────────────────────

export async function runMaintenance(): Promise<MaintenanceResult> {
    const env = loadEnv();
    const uploadDir = env.UPLOAD_DIR;

    const dirExists = await stat(uploadDir).catch(() => null);

    // File maintenance (only if upload dir exists)
    const encrypted = dirExists?.isDirectory() ? await encryptPlaintextFiles(uploadDir) : 0;
    const orphansRemoved = dirExists?.isDirectory() ? await removeOrphanedFiles(uploadDir) : 0;
    const exportsExpired = await cleanupExpiredExports();

    // Data retention cleanup (always runs)
    const retention = await cleanupRetentionData();

    // Log the maintenance run
    const result: MaintenanceResult = { encrypted, orphansRemoved, exportsExpired, retention };
    await prisma.maintenanceLog.create({
        data: {
            type: "scheduled",
            result: result as object,
            startedAt: new Date(),
            completedAt: new Date(),
        },
    });

    return result;
}
