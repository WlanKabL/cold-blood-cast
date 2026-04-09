import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listWeightRecords,
    getWeightRecord,
    createWeightRecord,
    updateWeightRecord,
    deleteWeightRecord,
} from "./weights.service.js";

const CreateWeightSchema = z.object({
    petId: z.string().cuid(),
    measuredAt: z.coerce.date(),
    weightGrams: z.number().positive(),
    notes: z.string().max(1000).optional(),
});

const UpdateWeightSchema = CreateWeightSchema.omit({ petId: true }).partial();

const ListQuerySchema = z.object({
    petId: z.string().cuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(50),
});

export async function weightRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        const query = ListQuerySchema.safeParse(request.query);
        if (!query.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid query parameters", query.error.flatten());
        }
        return listWeightRecords(request.userId, query.data);
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        return getWeightRecord(request.params.id, request.userId);
    });

    app.post("/", async (request, reply) => {
        const result = CreateWeightSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid weight data", result.error.flatten());
        }
        const record = await createWeightRecord(request.userId, result.data);
        return reply.status(201).send(record);
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateWeightSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid weight data", result.error.flatten());
        }
        return updateWeightRecord(request.params.id, request.userId, result.data);
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteWeightRecord(request.params.id, request.userId);
        return { ok: true };
    });
}
