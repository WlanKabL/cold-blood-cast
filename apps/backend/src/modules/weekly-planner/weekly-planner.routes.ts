import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard, requireFeature } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { getWeekEvents } from "./weekly-planner.service.js";

const WeekQuerySchema = z.object({
    from: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
        .optional(),
});

export async function weeklyPlannerRoutes(app: FastifyInstance): Promise<void> {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);
    app.addHook("preHandler", requireFeature("weekly_planner"));

    // GET /api/planner/week?from=YYYY-MM-DD
    app.get("/week", async (request, reply) => {
        const parsed = WeekQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, parsed.error.issues[0].message);
        }

        let weekStart: Date;
        if (parsed.data.from) {
            weekStart = new Date(`${parsed.data.from}T00:00:00.000Z`);
            if (isNaN(weekStart.getTime())) {
                throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid date format");
            }
        } else {
            // Default: start of current week (Monday)
            weekStart = getMonday(new Date());
        }

        const days = await getWeekEvents(request.userId!, weekStart);
        return reply.send({ success: true, data: days });
    });
}

function getMonday(d: Date): Date {
    const date = new Date(d);
    date.setUTCHours(0, 0, 0, 0);
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday = 1, Sunday = 0 → go back 6
    date.setUTCDate(date.getUTCDate() + diff);
    return date;
}
