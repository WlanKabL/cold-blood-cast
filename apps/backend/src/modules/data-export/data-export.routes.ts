import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { basename } from "node:path";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { decryptFile } from "@/helpers/file-crypto.js";
import { getExportStatus, requestDataExport, downloadExport } from "./data-export.service.js";

const RequestExportSchema = z.object({
    password: z.string().min(1),
});

export async function dataExportRoutes(app: FastifyInstance) {
    // ── GET /api/data-export/status (auth required) ──
    app.get("/status", { preHandler: [authGuard, emailVerifiedGuard] }, async (request) => {
        const data = await getExportStatus(request.userId);
        return { success: true, data };
    });

    // ── POST /api/data-export (auth required) ────────
    app.post("/", { preHandler: [authGuard, emailVerifiedGuard] }, async (request, reply) => {
        const body = RequestExportSchema.parse(request.body);
        const data = await requestDataExport(request.userId, body.password, request.ip);
        return reply.status(201).send({ success: true, data });
    });

    // ── GET /api/data-export/download/:token (public, token-based) ─
    app.get<{ Params: { token: string } }>("/download/:token", async (request, reply) => {
        const filePath = await downloadExport(request.params.token);
        const fileName = basename(filePath);
        const encPath = `${filePath}.enc`;

        // Try encrypted file first, fall back to plaintext
        const encExists = await stat(encPath).catch(() => null);
        if (encExists?.isFile()) {
            const decrypted = await decryptFile(encPath);
            return reply
                .header("Content-Type", "application/zip")
                .header("Content-Disposition", `attachment; filename="cbc-export.zip"`)
                .header("Content-Length", decrypted.length)
                .send(decrypted);
        }

        // Fallback: stream plaintext file
        const fileStats = await stat(filePath);
        const stream = createReadStream(filePath);
        return reply
            .header("Content-Type", "application/zip")
            .header("Content-Disposition", `attachment; filename="${fileName}"`)
            .header("Content-Length", fileStats.size)
            .send(stream);
    });
}
