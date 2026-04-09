import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { listPets, getPet, createPet, updatePet, deletePet } from "./pets.service.js";

const CreatePetSchema = z.object({
    enclosureId: z.string().cuid().optional(),
    name: z.string().min(1).max(100),
    species: z.string().min(1).max(100),
    morph: z.string().max(100).optional(),
    gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
    birthDate: z.coerce.date().optional(),
    acquisitionDate: z.coerce.date().optional(),
    notes: z.string().max(2000).optional(),
    imageUrl: z.string().url().optional(),
});

const UpdatePetSchema = CreatePetSchema.partial();

export async function petRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        return listPets(request.userId);
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        return getPet(request.params.id, request.userId);
    });

    app.post("/", async (request, reply) => {
        const result = CreatePetSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid pet data", result.error.flatten());
        }
        const pet = await createPet(request.userId, result.data);
        return reply.status(201).send(pet);
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdatePetSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid pet data", result.error.flatten());
        }
        return updatePet(request.params.id, request.userId, result.data);
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deletePet(request.params.id, request.userId);
        return { ok: true };
    });
}
