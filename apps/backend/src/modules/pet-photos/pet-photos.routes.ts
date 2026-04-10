import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listPetPhotos,
    addPetPhoto,
    updatePetPhoto,
    setProfilePicture,
    deletePetPhoto,
    getSuggestedTags,
} from "./pet-photos.service.js";

const UpdatePhotoSchema = z.object({
    caption: z.string().max(500).optional(),
    tags: z.array(z.string().min(1).max(50)).max(10).optional(),
    takenAt: z.string().datetime({ offset: true }).optional(),
});

export async function petPhotoRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // ── GET /api/pets/:petId/photos ──────────────
    app.get<{
        Params: { petId: string };
        Querystring: { tag?: string; sort?: string };
    }>("/:petId/photos", async (request) => {
        const { petId } = request.params;
        const { tag, sort } = request.query;
        const sortOption = sort === "order" ? "order" : "date";
        const data = await listPetPhotos(petId, request.userId, { tag, sort: sortOption });
        return { success: true, data };
    });

    // ── GET /api/pets/:petId/photos/tags ─────────
    app.get<{ Params: { petId: string } }>("/:petId/photos/tags", async () => {
        return { success: true, data: getSuggestedTags() };
    });

    // ── POST /api/pets/:petId/photos ─────────────
    app.post<{ Params: { petId: string } }>("/:petId/photos", async (request, reply) => {
        const { petId } = request.params;

        const data = await request.file();
        if (!data) {
            throw badRequest(ErrorCodes.E_UPLOAD_FAILED, "No file provided");
        }

        const fields = data.fields as Record<string, { value?: string } | undefined>;
        const caption = fields.caption?.value || undefined;
        const tagsRaw = fields.tags?.value || undefined;
        const isProfilePicture = fields.isProfilePicture?.value === "true";
        const takenAt = fields.takenAt?.value || undefined;

        const tags = tagsRaw
            ? tagsRaw
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
            : undefined;

        const photo = await addPetPhoto(
            petId,
            request.userId,
            data,
            { caption, tags, isProfilePicture, takenAt },
            request.log,
        );

        return reply.status(201).send({ success: true, data: photo });
    });

    // ── PATCH /api/pets/:petId/photos/:id ────────
    app.patch<{
        Params: { petId: string; id: string };
    }>("/:petId/photos/:id", async (request) => {
        const result = UpdatePhotoSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid photo data",
                result.error.flatten(),
            );
        }

        const data = await updatePetPhoto(request.params.id, request.userId, result.data);
        return { success: true, data };
    });

    // ── POST /api/pets/:petId/photos/:id/profile ─
    app.post<{
        Params: { petId: string; id: string };
    }>("/:petId/photos/:id/profile", async (request) => {
        const data = await setProfilePicture(request.params.id, request.userId);
        return { success: true, data };
    });

    // ── DELETE /api/pets/:petId/photos/:id ───────
    app.delete<{
        Params: { petId: string; id: string };
    }>("/:petId/photos/:id", async (request) => {
        await deletePetPhoto(request.params.id, request.userId);
        return { success: true, data: { ok: true } };
    });
}
