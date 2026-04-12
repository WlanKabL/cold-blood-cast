import { type FastifyInstance } from "fastify";
import { authGuard, emailVerifiedGuard, requireFeature } from "@/middleware/index.js";
import { checkAndAwardBadges, getUserBadges, getAllBadgeDefinitions } from "./badges.service.js";

export async function badgeRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);
    app.addHook("preHandler", requireFeature("user_public_profiles"));

    // GET / — get own badges
    app.get("/", async (request) => {
        const data = await getUserBadges(request.userId);
        return { success: true, data };
    });

    // POST /check — trigger badge check for current user
    app.post("/check", async (request) => {
        const newBadges = await checkAndAwardBadges(request.userId);
        const allBadges = await getUserBadges(request.userId);
        return { success: true, data: { newBadges, badges: allBadges } };
    });

    // GET /definitions — list all badge definitions
    app.get("/definitions", async () => {
        const data = await getAllBadgeDefinitions();
        return { success: true, data };
    });
}
