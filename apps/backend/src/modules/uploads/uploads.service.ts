import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import { join, extname } from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { MultipartFile } from "@fastify/multipart";
import type { FastifyBaseLogger } from "fastify";
import { prisma } from "@/config/index.js";
import { env } from "@/config/env.js";
import { badRequest, notFound, internalError, ErrorCodes } from "@/helpers/index.js";
import { encryptFile } from "@/helpers/file-crypto.js";
import { resolveUserLimits } from "@/modules/admin/feature-flags.service.js";

export const ALLOWED_MIME_IMAGES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
]);
export const ALLOWED_MIME_DOCUMENTS = new Set([...ALLOWED_MIME_IMAGES, "application/pdf"]);

async function ensureUploadDir(subDir: string): Promise<void> {
    const dir = join(env().UPLOAD_DIR, subDir);
    await mkdir(dir, { recursive: true });
}

// ─── Upload File ─────────────────────────────────────────────

export async function uploadFile(
    userId: string,
    file: MultipartFile,
    opts: {
        caption?: string;
        subDir?: string;
        allowedMime?: Set<string>;
    },
    log?: FastifyBaseLogger,
) {
    // ── Upload limit enforcement ─────────────────
    const limits = await resolveUserLimits(userId);
    const maxUploads = limits.max_uploads ?? -1;
    if (maxUploads !== -1) {
        const currentCount = await prisma.upload.count({ where: { userId } });
        if (currentCount >= maxUploads) {
            throw badRequest(
                ErrorCodes.E_UPLOAD_LIMIT_REACHED,
                `Upload limit reached (${maxUploads}). Upgrade your plan to upload more files.`,
            );
        }
    }

    const allowedMime = opts.allowedMime ?? ALLOWED_MIME_IMAGES;
    if (!allowedMime.has(file.mimetype)) {
        throw badRequest(ErrorCodes.E_UPLOAD_INVALID_TYPE, `Invalid file type: ${file.mimetype}`);
    }

    const subDir = opts.subDir ?? "uploads";
    try {
        await ensureUploadDir(subDir);
    } catch (err) {
        log?.error(
            { err, uploadDir: env().UPLOAD_DIR, subDir },
            "Failed to create upload directory",
        );
        throw internalError("Failed to create upload directory");
    }

    const ext = extname(file.filename) || ".png";
    const filename = `${randomUUID()}${ext}`;
    const relPath = `${subDir}/${filename}`;
    const absPath = join(env().UPLOAD_DIR, relPath);

    // Stream file to disk
    try {
        await pipeline(file.file, createWriteStream(absPath));
    } catch (err) {
        log?.error({ err, absPath }, "Failed to write uploaded file to disk");
        throw internalError("Failed to write file to disk");
    }

    // Check if file was truncated (too large)
    if (file.file.truncated) {
        await unlink(absPath).catch(() => {});
        throw badRequest(
            ErrorCodes.E_UPLOAD_TOO_LARGE,
            `File too large. Max size: ${(env().MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
        );
    }

    // Encrypt file at rest (AES-256-GCM)
    try {
        await encryptFile(absPath);
    } catch (err) {
        await unlink(absPath).catch(() => {});
        log?.error({ err, absPath }, "Failed to encrypt uploaded file");
        throw internalError("Failed to encrypt uploaded file");
    }

    // Create upload record in DB
    try {
        const upload = await prisma.upload.create({
            data: {
                userId,
                url: `/uploads/${relPath}`,
                originalName: file.filename,
                caption: opts.caption ?? null,
                allowedUserIds: [userId],
            },
        });

        return upload;
    } catch (err) {
        // Clean up the file if DB insert fails
        await unlink(absPath).catch(() => {});
        log?.error({ err, opts, userId }, "Failed to create upload DB record");
        throw internalError("Failed to save upload record");
    }
}

// ─── Delete Upload ───────────────────────────────────────────

export async function deleteUpload(userId: string, uploadId: string) {
    const upload = await prisma.upload.findUnique({
        where: { id: uploadId },
    });

    if (!upload) {
        throw notFound(ErrorCodes.E_NOT_FOUND, "Upload not found");
    }

    // Verify ownership
    if (upload.userId !== userId) {
        throw notFound(ErrorCodes.E_NOT_FOUND, "Upload not found");
    }

    // Delete file from disk (try .enc first, then plaintext)
    if (upload.url.startsWith("/uploads/")) {
        const absPath = join(env().UPLOAD_DIR, upload.url.replace("/uploads/", ""));
        await unlink(`${absPath}.enc`).catch(() => {});
        await unlink(absPath).catch(() => {});
    }

    await prisma.upload.delete({ where: { id: uploadId } });
}

// ─── List User Uploads ───────────────────────────────────────

export async function getUserUploads(userId: string) {
    return prisma.upload.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
    });
}
