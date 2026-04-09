import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
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
});

const UpdateEnclosureSchema = CreateEnclosureSchema.partial();

export async function enclosureRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        return listEnclosures(request.userId);
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        return getEnclosure(request.params.id, request.userId);
    });

    app.post("/", async (request, reply) => {
        const result = CreateEnclosureSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid enclosure data", result.error.flatten());
        }
        const enclosure = await createEnclosure(request.userId, result.data);
        return reply.status(201).send(enclosure);
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateEnclosureSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid enclosure data", result.error.flatten());
        }
        return updateEnclosure(request.params.id, request.userId, result.data);
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteEnclosure(request.params.id, request.userId);
        return { ok: true };
    });
}
