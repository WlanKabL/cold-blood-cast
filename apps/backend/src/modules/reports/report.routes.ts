import { type FastifyInstance, type FastifyRequest } from "fastify";
import { z } from "zod";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { createReport, listReports, resolveReport, getReportStats } from "./report.service.js";
import { notifyNewReport } from "@/modules/notifications/notification.service.js";

// ─── Validation ──────────────────────────────────────────────

const CreateReportSchema = z.object({
    targetType: z.enum(["comment", "user_profile", "pet_profile"]),
    targetId: z.string().min(1),
    targetUrl: z.string().max(500).optional(),
    reason: z.string().min(1).max(100).trim(),
    description: z.string().max(1000).trim().optional(),
    reporterName: z.string().max(50).trim().optional(),
});

const ResolveReportSchema = z.object({
    status: z.enum(["reviewed", "dismissed"]),
    adminNote: z.string().max(1000).trim().optional(),
});

// ─── Public Routes (no auth) ─────────────────────────────────

export async function reportPublicRoutes(app: FastifyInstance) {
    app.post("/", async (request: FastifyRequest) => {
        const bodyResult = CreateReportSchema.safeParse(request.body);
        if (!bodyResult.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid report data",
                bodyResult.error.flatten(),
            );
        }

        const report = await createReport(bodyResult.data);

        notifyNewReport(
            bodyResult.data.targetType,
            bodyResult.data.reason,
            bodyResult.data.targetUrl,
        );

        return { success: true, data: { id: report.id } };
    });
}

// ─── Admin Routes ────────────────────────────────────────────

export async function reportAdminRoutes(app: FastifyInstance) {
    app.addHook("onRequest", authGuard);
    app.addHook("onRequest", emailVerifiedGuard);
    app.addHook("onRequest", adminGuard);

    app.get("/", async (request) => {
        const q = request.query as Record<string, string>;
        const result = await listReports({
            status: q.status,
            targetType: q.targetType,
            page: q.page ? Number(q.page) : undefined,
            limit: q.limit ? Number(q.limit) : undefined,
        });
        return {
            success: true,
            data: {
                items: result.items,
                meta: {
                    page: result.page,
                    perPage: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            },
        };
    });

    app.get("/stats", async () => {
        const data = await getReportStats();
        return { success: true, data };
    });

    app.patch("/:reportId", async (request: FastifyRequest<{ Params: { reportId: string } }>) => {
        const bodyResult = ResolveReportSchema.safeParse(request.body);
        if (!bodyResult.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid resolution data",
                bodyResult.error.flatten(),
            );
        }

        const data = await resolveReport(
            request.params.reportId,
            request.userId,
            bodyResult.data.status,
            bodyResult.data.adminNote,
        );

        return { success: true, data };
    });
}
