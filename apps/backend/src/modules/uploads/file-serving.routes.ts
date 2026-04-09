import { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import { resolve, join, normalize } from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { env } from "@/config/env.js";
import { prisma } from "@/config/index.js";
import { verifyAccessToken } from "@/helpers/index.js";
import { decryptFile } from "@/helpers/file-crypto.js";

const MIME_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
};

/**
 * Authenticated file-serving route.
 * Accepts auth via Authorization header OR ?t= query param (for <img src>).
 * Verifies the requesting user is the owner or in allowedUserIds.
 */
export async function fileServingRoutes(app: FastifyInstance) {
    app.get("/uploads/*", async (request: FastifyRequest, reply: FastifyReply) => {
        // ── 1. Authenticate ──────────────────────
        let userId: string | null = null;

        // Try Authorization header first
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const payload = verifyAccessToken(authHeader.slice(7));
                userId = payload.userId;
            } catch {
                // Token invalid — will try query param
            }
        }

        // Fallback: ?t= query param (for <img src="...?t=token">)
        if (!userId) {
            const { t } = request.query as { t?: string };
            if (t) {
                try {
                    const payload = verifyAccessToken(t);
                    userId = payload.userId;
                } catch {
                    // Token invalid
                }
            }
        }

        if (!userId) {
            return reply.status(401).send({
                success: false,
                error: { code: "E_UNAUTHORIZED", message: "Authentication required" },
            });
        }

        // ── 2. Resolve file path ─────────────────
        const requestPath = (request.params as { "*": string })["*"];
        const urlPath = `/uploads/${requestPath}`;

        // Prevent directory traversal
        const uploadDir = resolve(env().UPLOAD_DIR);
        const absPath = normalize(join(uploadDir, requestPath));
        if (!absPath.startsWith(uploadDir)) {
            return reply.status(403).send({
                success: false,
                error: { code: "E_FORBIDDEN", message: "Access denied" },
            });
        }

        // ── 3. Check ownership via DB ────────────
        const screenshot = await prisma.upload.findFirst({
            where: { url: urlPath },
            select: { userId: true, allowedUserIds: true },
        });

        if (!screenshot) {
            // No DB record — deny access (orphan file or non-existent)
            return reply.status(404).send({
                success: false,
                error: { code: "E_NOT_FOUND", message: "File not found" },
            });
        }

        // Check: is the requesting user the owner or in allowedUserIds?
        if (screenshot.userId !== userId && !screenshot.allowedUserIds.includes(userId)) {
            return reply.status(403).send({
                success: false,
                error: { code: "E_FORBIDDEN", message: "Access denied" },
            });
        }

        // ── 4. Serve the file ────────────────────
        // Try encrypted (.enc) first, fall back to plaintext (legacy/unmigrated)
        const encPath = `${absPath}.enc`;
        const ext = absPath.substring(absPath.lastIndexOf(".")).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        try {
            const encStat = await stat(encPath).catch(() => null);

            if (encStat?.isFile()) {
                // Encrypted file — decrypt and send buffer
                const decrypted = await decryptFile(encPath);
                return reply
                    .header("Content-Type", contentType)
                    .header("Content-Length", decrypted.length)
                    .header("Cache-Control", "private, max-age=3600")
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Cross-Origin-Resource-Policy", "cross-origin")
                    .send(decrypted);
            }

            // Plaintext fallback (legacy files not yet migrated)
            const plainStat = await stat(absPath).catch(() => null);
            if (plainStat?.isFile()) {
                return reply
                    .header("Content-Type", contentType)
                    .header("Content-Length", plainStat.size)
                    .header("Cache-Control", "private, max-age=3600")
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Cross-Origin-Resource-Policy", "cross-origin")
                    .send(createReadStream(absPath));
            }

            return reply.status(404).send({
                success: false,
                error: { code: "E_NOT_FOUND", message: "File not found" },
            });
        } catch {
            return reply.status(404).send({
                success: false,
                error: { code: "E_NOT_FOUND", message: "File not found" },
            });
        }
    });
}
