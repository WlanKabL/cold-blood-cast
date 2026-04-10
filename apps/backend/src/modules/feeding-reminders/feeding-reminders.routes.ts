import { type FastifyInstance } from "fastify";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { getFeedingStatuses } from "./feeding-reminders.service.js";

export async function feedingReminderRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get("/", async (request) => {
        const data = await getFeedingStatuses(request.userId);
        return { success: true, data };
    });
}
