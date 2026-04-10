import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listFeedItems,
    getFeedItem,
    createFeedItem,
    updateFeedItem,
    deleteFeedItem,
} from "./feed-items.service.js";

const CreateFeedItemSchema = z.object({
    name: z.string().min(1).max(100),
    size: z.string().max(50).optional(),
    weightGrams: z.number().positive().optional(),
    notes: z.string().max(1000).optional(),
    suitablePetIds: z.array(z.string().cuid()).optional(),
});

const UpdateFeedItemSchema = CreateFeedItemSchema.partial();

export async function feedItemRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        const data = await listFeedItems(request.userId);
        return { success: true, data };
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getFeedItem(request.params.id, request.userId);
        return { success: true, data };
    });

    app.post("/", async (request, reply) => {
        const result = CreateFeedItemSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid feed item data", result.error.flatten());
        }
        const item = await createFeedItem(request.userId, result.data);
        return reply.status(201).send({ success: true, data: item });
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateFeedItemSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid feed item data", result.error.flatten());
        }
        const data = await updateFeedItem(request.params.id, request.userId, result.data);
        return { success: true, data };
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteFeedItem(request.params.id, request.userId);
        return { success: true, data: { ok: true } };
    });
}
