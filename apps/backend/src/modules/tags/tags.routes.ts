import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listTags,
    getTag,
    createTag,
    updateTag,
    deleteTag,
    listGlobalTags,
    createGlobalTag,
    updateGlobalTag,
    deleteGlobalTag,
} from "./tags.service.js";

const TAG_CATEGORIES = [
    "general",
    "care",
    "monitoring",
    "vet",
    "maintenance",
    "media",
    "organization",
] as const;

const CreateTagSchema = z.object({
    name: z.string().min(1).max(50),
    category: z.enum(TAG_CATEGORIES),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
});

const UpdateTagSchema = CreateTagSchema.partial();

// ─── User Tag Routes ─────────────────────────────────────────

export async function tagRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get<{ Querystring: { category?: string } }>("/", async (request) => {
        const data = await listTags(request.userId, request.query.category);
        return { success: true, data };
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getTag(request.params.id, request.userId);
        return { success: true, data };
    });

    app.post("/", async (request, reply) => {
        const result = CreateTagSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid tag data",
                result.error.flatten(),
            );
        }
        const tag = await createTag(request.userId, result.data);
        return reply.status(201).send({ success: true, data: tag });
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateTagSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid tag data",
                result.error.flatten(),
            );
        }
        const data = await updateTag(request.params.id, request.userId, result.data);
        return { success: true, data };
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteTag(request.params.id, request.userId);
        return { success: true, data: { ok: true } };
    });
}

// ─── Admin Tag Routes ────────────────────────────────────────

export async function tagAdminRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("onRequest", adminGuard);

    app.get("/", async () => {
        const data = await listGlobalTags();
        return { success: true, data };
    });

    app.post("/", async (request, reply) => {
        const result = CreateTagSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid tag data",
                result.error.flatten(),
            );
        }
        const tag = await createGlobalTag(result.data);
        return reply.status(201).send({ success: true, data: tag });
    });

    app.patch<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateTagSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid tag data",
                result.error.flatten(),
            );
        }
        const data = await updateGlobalTag(request.params.id, result.data);
        return { success: true, data };
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteGlobalTag(request.params.id);
        return { success: true, data: { ok: true } };
    });
}
