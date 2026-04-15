import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listSheddings,
    getShedding,
    createShedding,
    updateShedding,
    deleteShedding,
} from "./sheddings.service.js";

const CreateSheddingSchema = z.object({
    petId: z.string().cuid(),
    startedAt: z.coerce.date(),
    completedAt: z.coerce.date().optional(),
    complete: z.boolean().default(false),
    quality: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
});

const UpdateSheddingSchema = CreateSheddingSchema.omit({ petId: true }).partial();

const ListQuerySchema = z.object({
    petId: z.string().cuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(50),
    cursor: z.string().cuid().optional(),
});

export async function sheddingRoutes(app: FastifyInstance) {
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
        const data = await listSheddings(request.userId, query.data);
        return { success: true, data };
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getShedding(request.params.id, request.userId);
        return { success: true, data };
    });

    app.post("/", async (request, reply) => {
        const result = CreateSheddingSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid shedding data",
                result.error.flatten(),
            );
        }
        const shedding = await createShedding(request.userId, result.data);
        return reply.status(201).send({ success: true, data: shedding });
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateSheddingSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid shedding data",
                result.error.flatten(),
            );
        }
        const data = await updateShedding(request.params.id, request.userId, result.data);
        return { success: true, data };
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteShedding(request.params.id, request.userId);
        return { success: true, data: { ok: true } };
    });
}
