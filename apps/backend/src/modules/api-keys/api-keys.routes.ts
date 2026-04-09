import { type FastifyInstance } from "fastify";
import { authGuard, emailVerifiedGuard, requireFeature } from "@/middleware/index.js";
import { badRequest, ErrorCodes } from "@/helpers/index.js";
import { createApiKeySchema } from "./api-keys.schemas.js";
import { listApiKeys, createApiKey, revokeApiKey, deleteApiKey } from "./api-keys.service.js";

export async function apiKeyRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);
    app.addHook("preHandler", requireFeature("api_access"));

    // ── GET /api/api-keys ────────────────────────
    app.get("/", async (request, reply) => {
        const keys = await listApiKeys(request.userId);
        return reply.send({ success: true, data: keys });
    });

    // ── POST /api/api-keys ───────────────────────
    app.post("/", async (request, reply) => {
        const parsed = createApiKeySchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }
        const result = await createApiKey(request.userId, parsed.data);
        return reply.status(201).send({ success: true, data: result });
    });

    // ── PATCH /api/api-keys/:id/revoke ───────────
    app.patch("/:id/revoke", async (request, reply) => {
        const { id } = request.params as { id: string };
        await revokeApiKey(request.userId, id);
        return reply.send({ success: true });
    });

    // ── DELETE /api/api-keys/:id ─────────────────
    app.delete("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        await deleteApiKey(request.userId, id);
        return reply.send({ success: true });
    });
}
