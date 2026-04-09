import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listFeedings,
    getFeeding,
    createFeeding,
    updateFeeding,
    deleteFeeding,
} from "./feedings.service.js";

const CreateFeedingSchema = z.object({
    petId: z.string().cuid(),
    fedAt: z.coerce.date(),
    foodType: z.string().min(1).max(100),
    foodSize: z.string().max(50).optional(),
    quantity: z.number().int().min(1).default(1),
    accepted: z.boolean().default(true),
    notes: z.string().max(1000).optional(),
});

const UpdateFeedingSchema = CreateFeedingSchema.omit({ petId: true }).partial();

const ListQuerySchema = z.object({
    petId: z.string().cuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(50),
});

export async function feedingRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        const query = ListQuerySchema.safeParse(request.query);
        if (!query.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid query parameters", query.error.flatten());
        }
        return listFeedings(request.userId, query.data);
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        return getFeeding(request.params.id, request.userId);
    });

    app.post("/", async (request, reply) => {
        const result = CreateFeedingSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid feeding data", result.error.flatten());
        }
        const feeding = await createFeeding(request.userId, result.data);
        return reply.status(201).send(feeding);
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateFeedingSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid feeding data", result.error.flatten());
        }
        return updateFeeding(request.params.id, request.userId, result.data);
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteFeeding(request.params.id, request.userId);
        return { ok: true };
    });
}
