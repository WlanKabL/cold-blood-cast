import { type FastifyInstance } from "fastify";
import { authGuard, emailVerifiedGuard, requireFeature } from "@/middleware/index.js";
import { badRequest, ErrorCodes } from "@/helpers/index.js";
import { uploadFile, deleteUpload, getUserUploads } from "./uploads.service.js";

export async function uploadRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // ── POST /api/uploads ────────────────────────
    // Multipart form: file, caption?
    app.post("/", { preHandler: requireFeature("uploads") }, async (request, reply) => {
        const data = await request.file();
        if (!data) {
            throw badRequest(ErrorCodes.E_UPLOAD_FAILED, "No file provided");
        }

        const fields = data.fields as Record<string, { value?: string } | undefined>;
        const caption = fields.caption?.value || undefined;

        const upload = await uploadFile(request.userId, data, { caption }, request.log);

        return reply.status(201).send({ success: true, data: upload });
    });

    // ── POST /api/uploads/multi ──────────────────
    // Multi-file upload
    app.post("/multi", { preHandler: requireFeature("uploads") }, async (request, reply) => {
        const parts = request.files();
        const results = [];

        const { caption } = request.query as { caption?: string };

        for await (const part of parts) {
            const upload = await uploadFile(request.userId, part, { caption }, request.log);
            results.push(upload);
        }

        return reply.status(201).send({ success: true, data: results });
    });

    // ── GET /api/uploads ─────────────────────────
    app.get("/", async (request, reply) => {
        const uploads = await getUserUploads(request.userId);
        return reply.send({ success: true, data: uploads });
    });

    // ── DELETE /api/uploads/:id ──────────────────
    app.delete("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        await deleteUpload(request.userId, id);
        return reply.send({ success: true });
    });
}
