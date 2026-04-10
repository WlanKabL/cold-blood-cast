import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import {
    listVeterinarians,
    getVeterinarian,
    createVeterinarian,
    updateVeterinarian,
    deleteVeterinarian,
} from "./veterinarians.service.js";

const CreateVetSchema = z.object({
    name: z.string().min(1).max(200),
    clinicName: z.string().max(200).optional(),
    address: z.string().max(500).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().max(200).optional(),
    notes: z.string().max(2000).optional(),
});

const UpdateVetSchema = CreateVetSchema.partial();

export async function veterinarianRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // ── GET /api/veterinarians ───────────────────
    app.get("/", async (request) => {
        const data = await listVeterinarians(request.userId);
        return { success: true, data };
    });

    // ── GET /api/veterinarians/:id ───────────────
    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getVeterinarian(request.params.id, request.userId);
        return { success: true, data };
    });

    // ── POST /api/veterinarians ──────────────────
    app.post("/", async (request, reply) => {
        const body = CreateVetSchema.parse(request.body);
        const data = await createVeterinarian(request.userId, body);
        return reply.status(201).send({ success: true, data });
    });

    // ── PUT /api/veterinarians/:id ───────────────
    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const body = UpdateVetSchema.parse(request.body);
        const data = await updateVeterinarian(request.params.id, request.userId, body);
        return { success: true, data };
    });

    // ── DELETE /api/veterinarians/:id ────────────
    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteVeterinarian(request.params.id, request.userId);
        return { success: true, data: null };
    });
}
