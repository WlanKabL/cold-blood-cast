import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { type TimelineEventType, getTimeline } from "./activity-timeline.service.js";

const VALID_TYPES: TimelineEventType[] = ["feeding", "shedding", "weight", "vet_visit", "photo"];

const TimelineQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    types: z
        .string()
        .optional()
        .transform((val) => {
            if (!val) return VALID_TYPES;
            return val
                .split(",")
                .filter((t): t is TimelineEventType =>
                    VALID_TYPES.includes(t as TimelineEventType),
                );
        }),
});

export async function activityTimelineRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // GET /:petId/timeline?page=1&limit=50&types=feeding,shedding,weight,vet_visit,photo
    app.get("/:petId/timeline", async (request) => {
        const params = z.object({ petId: z.string().cuid() }).safeParse(request.params);
        if (!params.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid pet ID",
                params.error.flatten(),
            );
        }

        const query = TimelineQuerySchema.safeParse(request.query);
        if (!query.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid query parameters",
                query.error.flatten(),
            );
        }

        const result = await getTimeline(request.userId, params.data.petId, query.data);
        return { success: true, data: result };
    });
}
