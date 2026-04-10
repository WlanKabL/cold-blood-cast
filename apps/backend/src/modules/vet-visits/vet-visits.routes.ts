import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import {
    listVetVisits,
    getVetVisit,
    createVetVisit,
    updateVetVisit,
    deleteVetVisit,
    getUpcomingAppointments,
    getVetCosts,
    convertAppointment,
} from "./vet-visits.service.js";

const VetVisitTypeEnum = z.enum([
    "CHECKUP",
    "EMERGENCY",
    "SURGERY",
    "VACCINATION",
    "DEWORMING",
    "FECAL_TEST",
    "CONSULTATION",
    "FOLLOW_UP",
    "OTHER",
]);

const CreateVisitSchema = z.object({
    petId: z.string().min(1),
    veterinarianId: z.string().min(1).optional(),
    visitDate: z.string().datetime({ offset: true }),
    visitType: VetVisitTypeEnum.optional(),
    isAppointment: z.boolean().optional(),
    sourceVisitId: z.string().min(1).optional(),
    reason: z.string().max(500).optional(),
    diagnosis: z.string().max(2000).optional(),
    treatment: z.string().max(2000).optional(),
    costCents: z.number().int().min(0).optional(),
    weightGrams: z.number().min(0).optional(),
    nextAppointment: z.string().datetime({ offset: true }).optional(),
    notes: z.string().max(5000).optional(),
});

const UpdateVisitSchema = z.object({
    veterinarianId: z.string().min(1).nullable().optional(),
    visitDate: z.string().datetime({ offset: true }).optional(),
    visitType: VetVisitTypeEnum.optional(),
    reason: z.string().max(500).optional(),
    diagnosis: z.string().max(2000).optional(),
    treatment: z.string().max(2000).optional(),
    costCents: z.number().int().min(0).nullable().optional(),
    weightGrams: z.number().min(0).nullable().optional(),
    nextAppointment: z.string().datetime({ offset: true }).nullable().optional(),
    notes: z.string().max(5000).optional(),
});

export async function vetVisitRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // ── GET /api/vet-visits ──────────────────────
    app.get<{
        Querystring: {
            petId?: string;
            veterinarianId?: string;
            visitType?: string;
            isAppointment?: string;
            from?: string;
            to?: string;
        };
    }>("/", async (request) => {
        const { petId, veterinarianId, visitType, isAppointment, from, to } = request.query;
        const parsedType = visitType ? VetVisitTypeEnum.parse(visitType) : undefined;
        const parsedIsAppointment =
            isAppointment === "true" ? true : isAppointment === "false" ? false : undefined;
        const data = await listVetVisits(request.userId, {
            petId,
            veterinarianId,
            visitType: parsedType,
            isAppointment: parsedIsAppointment,
            from,
            to,
        });
        return { success: true, data };
    });

    // ── GET /api/vet-visits/upcoming ─────────────
    app.get<{ Querystring: { limit?: string } }>("/upcoming", async (request) => {
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;
        const data = await getUpcomingAppointments(request.userId, limit);
        return { success: true, data };
    });

    // ── GET /api/vet-visits/costs ────────────────
    app.get<{
        Querystring: { petId?: string; veterinarianId?: string; year?: string };
    }>("/costs", async (request) => {
        const { petId, veterinarianId, year } = request.query;
        const data = await getVetCosts(request.userId, {
            petId,
            veterinarianId,
            year: year ? parseInt(year, 10) : undefined,
        });
        return { success: true, data };
    });

    // ── GET /api/vet-visits/:id ──────────────────
    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getVetVisit(request.params.id, request.userId);
        return { success: true, data };
    });

    // ── POST /api/vet-visits ─────────────────────
    app.post("/", async (request, reply) => {
        const body = CreateVisitSchema.parse(request.body);
        const data = await createVetVisit(request.userId, body);
        return reply.status(201).send({ success: true, data });
    });

    // ── PUT /api/vet-visits/:id ──────────────────
    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const body = UpdateVisitSchema.parse(request.body);
        const data = await updateVetVisit(request.params.id, request.userId, body);
        return { success: true, data };
    });

    // ── DELETE /api/vet-visits/:id ───────────────
    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteVetVisit(request.params.id, request.userId);
        return { success: true, data: null };
    });

    // ── POST /api/vet-visits/:id/convert ──────────
    const ConvertSchema = z.object({
        visitDate: z.string().datetime({ offset: true }).optional(),
        diagnosis: z.string().max(2000).optional(),
        treatment: z.string().max(2000).optional(),
        costCents: z.number().int().min(0).optional(),
        weightGrams: z.number().min(0).optional(),
        nextAppointment: z.string().datetime({ offset: true }).optional(),
        notes: z.string().max(5000).optional(),
    });

    app.post<{ Params: { id: string } }>("/:id/convert", async (request) => {
        const body = ConvertSchema.parse(request.body);
        const data = await convertAppointment(request.params.id, request.userId, body);
        return { success: true, data };
    });
}
