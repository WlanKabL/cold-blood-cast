import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard, requireFeature } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    listMaintenanceTasks,
    getMaintenanceTask,
    createMaintenanceTask,
    updateMaintenanceTask,
    completeMaintenanceTask,
    deleteMaintenanceTask,
    getOverdueTasksForUser,
} from "./enclosure-maintenance.service.js";

const MaintenanceTypeEnum = z.enum([
    "CLEANING",
    "SUBSTRATE_CHANGE",
    "LAMP_REPLACEMENT",
    "WATER_CHANGE",
    "FILTER_CHANGE",
    "DISINFECTION",
    "OTHER",
]);

const CreateMaintenanceTaskSchema = z.object({
    enclosureId: z.string().cuid(),
    type: MaintenanceTypeEnum.default("OTHER"),
    description: z.string().min(1).max(500).optional(),
    nextDueAt: z.coerce.date().optional(),
    intervalDays: z.number().int().min(1).max(365).optional(),
    recurring: z.boolean().default(false),
    notes: z.string().max(2000).optional(),
});

const UpdateMaintenanceTaskSchema = CreateMaintenanceTaskSchema.omit({
    enclosureId: true,
}).partial();

const ListQuerySchema = z.object({
    enclosureId: z.string().cuid().optional(),
    overdue: z
        .enum(["true", "false"])
        .transform((v) => v === "true")
        .optional(),
});

export async function enclosureMaintenanceRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);
    app.addHook("preHandler", requireFeature("enclosure_maintenance"));

    // ── List tasks (optional enclosureId + overdue filter) ───
    app.get("/", async (request) => {
        const query = ListQuerySchema.safeParse(request.query);
        if (!query.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid query parameters",
                query.error.flatten(),
            );
        }
        const data = await listMaintenanceTasks(request.userId, query.data);
        return { success: true, data };
    });

    // ── Get overdue tasks (for dashboard) ────────────────────
    app.get("/overdue", async (request) => {
        const data = await getOverdueTasksForUser(request.userId);
        return { success: true, data };
    });

    // ── Get single task ──────────────────────────────────────
    app.get<{ Params: { id: string } }>("/:id", async (request) => {
        const data = await getMaintenanceTask(request.params.id, request.userId);
        return { success: true, data };
    });

    // ── Create task ──────────────────────────────────────────
    app.post("/", async (request, reply) => {
        const result = CreateMaintenanceTaskSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid maintenance task data",
                result.error.flatten(),
            );
        }
        const data = await createMaintenanceTask(request.userId, result.data);
        return reply.status(201).send({ success: true, data });
    });

    // ── Update task ──────────────────────────────────────────
    app.put<{ Params: { id: string } }>("/:id", async (request) => {
        const result = UpdateMaintenanceTaskSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid maintenance task data",
                result.error.flatten(),
            );
        }
        const data = await updateMaintenanceTask(request.params.id, request.userId, result.data);
        return { success: true, data };
    });

    // ── Complete task (mark done + auto-schedule if recurring) ──
    app.post<{ Params: { id: string } }>("/:id/complete", async (request) => {
        const data = await completeMaintenanceTask(request.params.id, request.userId);
        return { success: true, data };
    });

    // ── Delete task ──────────────────────────────────────────
    app.delete<{ Params: { id: string } }>("/:id", async (request) => {
        await deleteMaintenanceTask(request.params.id, request.userId);
        return { success: true, data: { ok: true } };
    });
}
