import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listSensors,
    getSensor,
    createSensor,
    updateSensor,
    deleteSensor,
    getSensorReadings,
    createSensorReading,
} from "./sensors.service.js";

const CreateSensorSchema = z.object({
    enclosureId: z.string().cuid().optional(),
    name: z.string().min(1).max(100),
    type: z.enum(["TEMPERATURE", "HUMIDITY", "PRESSURE", "WATER"]),
    unit: z.string().min(1).max(20),
    homeAssistantEntityId: z.string().optional(),
    limitsJson: z.unknown().optional(),
    active: z.boolean().optional(),
});

const UpdateSensorSchema = CreateSensorSchema.partial();

const ReadingsQuerySchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(10000).default(100),
});

const CreateReadingSchema = z.object({
    value: z.number().nullable(),
    recordedAt: z.coerce.date(),
});

export async function sensorRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        return listSensors(request.userId);
    });

    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        return getSensor(request.params.id, request.userId);
    });

    app.post("/", async (request, reply) => {
        const result = CreateSensorSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid sensor data", result.error.flatten());
        }
        const sensor = await createSensor(request.userId, result.data);
        return reply.status(201).send(sensor);
    });

    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateSensorSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid sensor data", result.error.flatten());
        }
        return updateSensor(request.params.id, request.userId, result.data);
    });

    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteSensor(request.params.id, request.userId);
        return { ok: true };
    });

    // ── Readings sub-routes ──────────────────────

    app.get<{ Params: { id: string }; Querystring: Record<string, string> }>(
        "/:id/readings",
        async (request) => {
            const query = ReadingsQuerySchema.safeParse(request.query);
            if (!query.success) {
                throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid query parameters", query.error.flatten());
            }
            return getSensorReadings(request.params.id, request.userId, query.data);
        },
    );

    app.post<{ Params: { id: string } }>("/:id/readings", async (request, reply) => {
        const result = CreateReadingSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid reading data", result.error.flatten());
        }
        const reading = await createSensorReading(request.params.id, request.userId, result.data);
        return reply.status(201).send(reading);
    });
}
