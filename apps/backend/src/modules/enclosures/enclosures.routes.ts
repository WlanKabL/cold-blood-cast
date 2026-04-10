import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard, requireFeature } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listEnclosures,
    getEnclosure,
    createEnclosure,
    updateEnclosure,
    deleteEnclosure,
} from "./enclosures.service.js";

const CreateEnclosureSchema = z.object({
    name: z.string().min(1).max(100),
    type: z
        .enum(["TERRARIUM", "VIVARIUM", "AQUARIUM", "PALUDARIUM", "RACK", "OTHER"])
        .default("TERRARIUM"),
    species: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    lengthCm: z.number().int().positive().optional(),
    widthCm: z.number().int().positive().optional(),
    heightCm: z.number().int().positive().optional(),
    room: z.string().max(100).optional(),
});

const UpdateEnclosureSchema = CreateEnclosureSchema.partial().extend({
    active: z.boolean().optional(),
});

const ListQuerySchema = z.object({
    search: z.string().max(100).optional(),
    active: z
        .enum(["true", "false"])
        .transform((v) => v === "true")
        .optional(),
});

export async function enclosureRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);
    app.addHook("preHandler", requireFeature("enclosures"));

    app.get<{ Querystring: { search?: string; active?: string } }>("/", async (request) => {
        const query = ListQuerySchema.safeParse(request.query);
        const options = query.success ? query.data : {};
        const data = await listEnclosures(request.userId, options);
        return { success: true, data };
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getEnclosure(request.params.id, request.userId);
        return { success: true, data };
    });

    app.post("/", async (request, reply) => {
        const result = CreateEnclosureSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid enclosure data",
                result.error.flatten(),
            );
        }
        const enclosure = await createEnclosure(request.userId, result.data);
        return reply.status(201).send({ success: true, data: enclosure });
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateEnclosureSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid enclosure data",
                result.error.flatten(),
            );
        }
        const data = await updateEnclosure(request.params.id, request.userId, result.data);
        return { success: true, data };
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteEnclosure(request.params.id, request.userId);
        return { success: true, data: { ok: true } };
    });
}
