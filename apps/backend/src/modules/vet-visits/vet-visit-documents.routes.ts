import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listVetVisitDocuments,
    addVetVisitDocument,
    updateVetVisitDocument,
    deleteVetVisitDocument,
} from "./vet-visit-documents.service.js";

const UpdateDocumentSchema = z.object({
    label: z.string().max(200).optional(),
});

export async function vetVisitDocumentRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // ── GET /api/vet-visits/:visitId/documents ───
    app.get<{ Params: { visitId: string } }>("/:visitId/documents", async (request) => {
        const data = await listVetVisitDocuments(request.params.visitId, request.userId);
        return { success: true, data };
    });

    // ── POST /api/vet-visits/:visitId/documents ──
    app.post<{ Params: { visitId: string } }>("/:visitId/documents", async (request, reply) => {
        const { visitId } = request.params;

        const data = await request.file();
        if (!data) {
            throw badRequest(ErrorCodes.E_UPLOAD_FAILED, "No file provided");
        }

        const fields = data.fields as Record<string, { value?: string } | undefined>;
        const label = fields.label?.value || undefined;

        const doc = await addVetVisitDocument(visitId, request.userId, data, { label }, request.log);

        return reply.status(201).send({ success: true, data: doc });
    });

    // ── PATCH /api/vet-visits/:visitId/documents/:docId ─
    app.patch<{
        Params: { visitId: string; docId: string };
    }>("/:visitId/documents/:docId", async (request) => {
        const result = UpdateDocumentSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid document data",
                result.error.flatten(),
            );
        }

        const data = await updateVetVisitDocument(
            request.params.docId,
            request.userId,
            result.data,
        );
        return { success: true, data };
    });

    // ── DELETE /api/vet-visits/:visitId/documents/:docId ─
    app.delete<{
        Params: { visitId: string; docId: string };
    }>("/:visitId/documents/:docId", async (request) => {
        await deleteVetVisitDocument(request.params.docId, request.userId);
        return { success: true, data: null };
    });
}
