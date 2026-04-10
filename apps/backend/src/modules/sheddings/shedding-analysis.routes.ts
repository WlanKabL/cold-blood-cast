import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { getSheddingAnalysis, getUpcomingSheddings } from "./shedding-analysis.service.js";

const AnalysisParamsSchema = z.object({
    petId: z.string().cuid(),
});

const UpcomingQuerySchema = z.object({
    days: z.coerce.number().int().min(1).max(90).default(7),
});

export async function sheddingAnalysisRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    app.get<{ Params: { petId: string } }>("/analysis/:petId", async (request) => {
        const params = AnalysisParamsSchema.safeParse(request.params);
        if (!params.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid pet ID", params.error.flatten());
        }
        const data = await getSheddingAnalysis(request.userId, params.data.petId);
        return { success: true, data };
    });

    app.get("/upcoming", async (request) => {
        const query = UpcomingQuerySchema.safeParse(request.query);
        if (!query.success) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid query parameters", query.error.flatten());
        }
        const data = await getUpcomingSheddings(request.userId, query.data.days);
        return { success: true, data };
    });
}
