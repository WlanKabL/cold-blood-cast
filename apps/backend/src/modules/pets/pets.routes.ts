import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { listPets, getPet, createPet, updatePet, deletePet } from "./pets.service.js";

const PetBaseSchema = z.object({
    enclosureId: z.string().cuid().optional(),
    name: z.string().min(1).max(100),
    species: z.string().min(1).max(100),
    morph: z.string().max(100).optional(),
    gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
    birthDate: z.coerce.date().optional(),
    acquisitionDate: z.coerce.date().optional(),
    notes: z.string().max(2000).optional(),
    imageUrl: z.string().url().optional(),
    feedingIntervalMinDays: z.number().int().min(1).max(365).optional().nullable(),
    feedingIntervalMaxDays: z.number().int().min(1).max(365).optional().nullable(),
});

const feedingIntervalRefine = (data: {
    feedingIntervalMinDays?: number | null;
    feedingIntervalMaxDays?: number | null;
}) => {
    if (data.feedingIntervalMinDays && data.feedingIntervalMaxDays) {
        return data.feedingIntervalMinDays <= data.feedingIntervalMaxDays;
    }
    return true;
};
const feedingIntervalMessage = {
    message: "Min interval must be less than or equal to max interval",
    path: ["feedingIntervalMinDays"] as const,
};

const CreatePetSchema = PetBaseSchema.refine(feedingIntervalRefine, feedingIntervalMessage);
const UpdatePetSchema = PetBaseSchema.partial().refine(
    feedingIntervalRefine,
    feedingIntervalMessage,
);

export async function petRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        const data = await listPets(request.userId);
        return { success: true, data };
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getPet(request.params.id, request.userId);
        return { success: true, data };
    });

    app.post("/", async (request, reply) => {
        const result = CreatePetSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid pet data",
                result.error.flatten(),
            );
        }
        const pet = await createPet(request.userId, result.data);
        return reply.status(201).send({ success: true, data: pet });
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdatePetSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid pet data",
                result.error.flatten(),
            );
        }
        const data = await updatePet(request.params.id, request.userId, result.data);
        return { success: true, data };
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deletePet(request.params.id, request.userId);
        return { success: true, data: { ok: true } };
    });
}
