import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listHusbandryNotes,
    getHusbandryNote,
    createHusbandryNote,
    updateHusbandryNote,
    deleteHusbandryNote,
} from "./husbandry-notes.service.js";

const CreateNoteSchema = z.object({
    petId: z.string().cuid(),
    type: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    content: z.string().max(5000).optional(),
    occurredAt: z.coerce.date(),
});

const UpdateNoteSchema = CreateNoteSchema.omit({ petId: true }).partial();

const ListQuerySchema = z.object({
    petId: z.string().cuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(50),
    cursor: z.string().cuid().optional(),
});

export async function husbandryNoteRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        const query = ListQuerySchema.safeParse(request.query);
        if (!query.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid query parameters",
                query.error.flatten(),
            );
        }
        const data = await listHusbandryNotes(request.userId, query.data);
        return { success: true, data };
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getHusbandryNote(request.params.id, request.userId);
        return { success: true, data };
    });

    app.post("/", async (request, reply) => {
        const result = CreateNoteSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid husbandry note data",
                result.error.flatten(),
            );
        }
        const note = await createHusbandryNote(request.userId, result.data);
        return reply.status(201).send({ success: true, data: note });
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateNoteSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid husbandry note data",
                result.error.flatten(),
            );
        }
        const data = await updateHusbandryNote(request.params.id, request.userId, result.data);
        return { success: true, data };
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteHusbandryNote(request.params.id, request.userId);
        return { success: true, data: { ok: true } };
    });
}
