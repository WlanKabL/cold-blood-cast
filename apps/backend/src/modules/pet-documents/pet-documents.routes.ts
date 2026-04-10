import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { PetDocumentCategory } from "@prisma/client";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listPetDocuments,
    addPetDocument,
    updatePetDocument,
    deletePetDocument,
} from "./pet-documents.service.js";

const categoryValues = Object.values(PetDocumentCategory) as [string, ...string[]];

const UpdateDocumentSchema = z.object({
    category: z.enum(categoryValues).optional(),
    label: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
    documentDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function petDocumentRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // ── GET /api/pets/:petId/documents ───────────
    app.get<{
        Params: { petId: string };
        Querystring: { category?: string };
    }>("/:petId/documents", async (request) => {
        const { category } = request.query;
        const validCategory =
            category && categoryValues.includes(category)
                ? (category as PetDocumentCategory)
                : undefined;

        const data = await listPetDocuments(request.params.petId, request.userId, {
            category: validCategory,
        });
        return { success: true, data };
    });

    // ── POST /api/pets/:petId/documents ──────────
    app.post<{ Params: { petId: string } }>("/:petId/documents", async (request, reply) => {
        const { petId } = request.params;

        const data = await request.file();
        if (!data) {
            throw badRequest(ErrorCodes.E_UPLOAD_FAILED, "No file provided");
        }

        const fields = data.fields as Record<string, { value?: string } | undefined>;
        const label = fields.label?.value || undefined;
        const notes = fields.notes?.value || undefined;
        const category = fields.category?.value || undefined;
        const documentDate = fields.documentDate?.value || undefined;

        const validCategory =
            category && categoryValues.includes(category)
                ? (category as PetDocumentCategory)
                : undefined;

        const doc = await addPetDocument(
            petId,
            request.userId,
            data,
            { category: validCategory, label, notes, documentDate },
            request.log,
        );

        return reply.status(201).send({ success: true, data: doc });
    });

    // ── PATCH /api/pets/:petId/documents/:docId ──
    app.patch<{
        Params: { petId: string; docId: string };
    }>("/:petId/documents/:docId", async (request) => {
        const result = UpdateDocumentSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid document data",
                result.error.flatten(),
            );
        }

        const data = await updatePetDocument(request.params.docId, request.userId, result.data);
        return { success: true, data };
    });

    // ── DELETE /api/pets/:petId/documents/:docId ─
    app.delete<{
        Params: { petId: string; docId: string };
    }>("/:petId/documents/:docId", async (request) => {
        await deletePetDocument(request.params.docId, request.userId);
        return { success: true, data: null };
    });
}
