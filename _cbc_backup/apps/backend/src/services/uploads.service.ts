import { randomUUID } from "node:crypto";
import { mkdir, unlink, stat as fsStat } from "node:fs/promises";
import { join, extname } from "node:path";
import { prisma } from "../db/client.js";
import { loadEnv } from "../config.js";
import { badRequest, notFound, internal } from "../helpers/errors.js";
import { encryptFile } from "../helpers/file-crypto.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]);

async function ensureUploadDir(subDir: string): Promise<string> {
    const env = loadEnv();
    const dir = join(env.UPLOAD_DIR, subDir);
    await mkdir(dir, { recursive: true });
    return dir;
}

// ─── Upload File ─────────────────────────────────────────────

export async function uploadFile(
    userId: string,
    file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
        path?: string;
    },
    opts: {
        entityType?: string;
        entityId?: string;
        caption?: string;
    },
) {
    const env = loadEnv();

    if (!ALLOWED_MIME.has(file.mimetype)) {
        throw badRequest(
            `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP, AVIF`,
        );
    }

    if (file.size > env.MAX_FILE_SIZE) {
        throw badRequest(
            `File too large. Max size: ${(env.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
        );
    }

    // Verify entity ownership if specified
    if (opts.entityType && opts.entityId) {
        await verifyEntityOwnership(userId, opts.entityType, opts.entityId);
    }

    const subDir = "images";
    await ensureUploadDir(subDir);

    const ext = extname(file.originalname) || ".png";
    const filename = `${randomUUID()}${ext}`;
    const relPath = `${subDir}/${filename}`;
    const absPath = join(env.UPLOAD_DIR, relPath);

    // Write file to disk
    const { writeFile } = await import("node:fs/promises");
    await writeFile(absPath, file.buffer);

    // Encrypt file at rest if ENCRYPTION_KEY is configured
    let encrypted = false;
    if (env.ENCRYPTION_KEY) {
        try {
            await encryptFile(absPath);
            encrypted = true;
        } catch {
            await unlink(absPath).catch(() => {});
            throw internal("Failed to encrypt uploaded file");
        }
    }

    const upload = await prisma.upload.create({
        data: {
            userId,
            filename: file.originalname,
            mimetype: file.mimetype,
            path: relPath,
            encrypted,
            caption: opts.caption ?? null,
            entityType: opts.entityType ?? null,
            entityId: opts.entityId ?? null,
        },
    });

    return upload;
}

// ─── Delete Upload ───────────────────────────────────────────

export async function deleteUpload(userId: string, uploadId: string) {
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.userId !== userId) {
        throw notFound("Upload not found");
    }

    const env = loadEnv();
    const absPath = join(env.UPLOAD_DIR, upload.path);

    // Try removing both encrypted and plain versions
    await unlink(`${absPath}.enc`).catch(() => {});
    await unlink(absPath).catch(() => {});

    await prisma.upload.delete({ where: { id: uploadId } });
}

// ─── List Uploads ────────────────────────────────────────────

export async function listUploads(
    userId: string,
    opts?: { entityType?: string; entityId?: string },
) {
    return prisma.upload.findMany({
        where: {
            userId,
            ...(opts?.entityType ? { entityType: opts.entityType } : {}),
            ...(opts?.entityId ? { entityId: opts.entityId } : {}),
        },
        orderBy: { createdAt: "desc" },
    });
}

// ─── Get Upload (with ownership check) ──────────────────────

export async function getUpload(userId: string, uploadId: string) {
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.userId !== userId) {
        throw notFound("Upload not found");
    }
    return upload;
}

// ─── Serve Upload File ───────────────────────────────────────

export async function getUploadBuffer(
    userId: string,
    uploadId: string,
): Promise<{
    buffer: Buffer;
    mimetype: string;
    filename: string;
}> {
    const upload = await getUpload(userId, uploadId);
    const env = loadEnv();
    const absPath = join(env.UPLOAD_DIR, upload.path);

    if (upload.encrypted) {
        const { decryptFile } = await import("../helpers/file-crypto.js");
        const buffer = await decryptFile(`${absPath}.enc`);
        return { buffer, mimetype: upload.mimetype, filename: upload.filename };
    }

    const { readFile } = await import("node:fs/promises");
    const buffer = await readFile(absPath);
    return { buffer, mimetype: upload.mimetype, filename: upload.filename };
}

// ─── Remove Orphaned Files ───────────────────────────────────

export async function removeOrphanedFiles(): Promise<number> {
    const env = loadEnv();
    const imageDir = join(env.UPLOAD_DIR, "images");

    const { readdir } = await import("node:fs/promises");
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
                const fileStat = await fsStat(fullPath);
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

// ─── Helpers ─────────────────────────────────────────────────

async function verifyEntityOwnership(userId: string, entityType: string, entityId: string) {
    switch (entityType) {
        case "enclosure": {
            const enclosure = await prisma.enclosure.findFirst({
                where: { id: entityId, userId },
            });
            if (!enclosure) throw notFound("Enclosure not found");
            break;
        }
        case "pet": {
            const pet = await prisma.pet.findFirst({
                where: { id: entityId, enclosure: { userId } },
            });
            if (!pet) throw notFound("Pet not found");
            break;
        }
        case "sensor": {
            const sensor = await prisma.sensor.findFirst({
                where: { id: entityId, enclosure: { userId } },
            });
            if (!sensor) throw notFound("Sensor not found");
            break;
        }
        default:
            throw badRequest(`Unknown entity type: ${entityType}`);
    }
}
