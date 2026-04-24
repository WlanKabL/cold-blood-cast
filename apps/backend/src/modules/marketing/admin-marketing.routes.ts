// ─── Admin marketing dashboard routes ───────────────────────
// Plan v1.7 §13.

import type { FastifyInstance } from "fastify";
import {
    createAudienceExportSchema,
    marketingSettingsUpdateSchema,
    recordHighValueEventSchema,
    type MarketingAttributionRow,
    type MarketingCampaignAggregate,
    type MarketingEventRow,
    type MarketingOverviewResponse,
    type MarketingQueueHealth,
    type MarketingSettingsResponse,
} from "@cold-blood-cast/shared";
import { prisma } from "@/config/database.js";
import { adminGuard, authGuard } from "@/middleware/auth.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { env } from "@/config/env.js";
import { getMarketingConfig, updateMarketingSettings } from "./marketing-config.service.js";
import { getMarketingQueue, rescueStuckPendingEvents } from "./marketing.queue.js";
import { recordHighValueEvent } from "./high-value-events.service.js";
import {
    createAudienceExport,
    deleteAudienceExport,
    findExportByToken,
    listAudienceExports,
} from "./audience-export.service.js";
import { buildRoiReport } from "./roi-report.service.js";
import { getAudienceSyncProvider } from "./audience-sync.service.js";
import { isActivatedWithinWindow } from "./activation-window.js";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

export async function adminMarketingRoutes(fastify: FastifyInstance) {
    fastify.addHook("preHandler", authGuard);
    fastify.addHook("preHandler", adminGuard);

    // ── GET /api/admin/marketing/overview ──
    fastify.get(
        "/overview",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Marketing KPIs aggregate",
            },
        },
        async (_request, reply) => {
            const e = env();
            const cfg = await getMarketingConfig();
            const activationDays = cfg.activationWindowDays;

            const [totalLandings, totalAttributed, registrationsTotal, eventStats, campaigns] =
                await Promise.all([
                    prisma.landingAttribution.count(),
                    prisma.userAttribution.count(),
                    prisma.marketingEvent.count({
                        where: { eventName: "CompleteRegistration", eventSource: "server" },
                    }),
                    prisma.marketingEvent.groupBy({
                        by: ["status"],
                        _count: { _all: true },
                        where: { eventSource: "server" },
                    }),
                    prisma.userAttribution.findMany({
                        select: {
                            boundAt: true,
                            user: {
                                select: {
                                    id: true,
                                    activationEvents: { select: { occurredAt: true } },
                                },
                            },
                            landingAttribution: {
                                select: { utmSource: true, utmCampaign: true, utmContent: true },
                            },
                        },
                    }),
                ]);

            const aggregates = new Map<
                string,
                { signups: number; activated: number; first: Date }
            >();
            for (const row of campaigns) {
                const key = [
                    row.landingAttribution.utmSource ?? "(direct)",
                    row.landingAttribution.utmCampaign ?? "(none)",
                    row.landingAttribution.utmContent ?? "(none)",
                ].join("|");
                const entry = aggregates.get(key) ?? {
                    signups: 0,
                    activated: 0,
                    first: row.boundAt,
                };
                entry.signups += 1;
                const activated = isActivatedWithinWindow(
                    row.boundAt,
                    row.user.activationEvents,
                    activationDays,
                );
                if (activated) entry.activated += 1;
                if (row.boundAt < entry.first) entry.first = row.boundAt;
                aggregates.set(key, entry);
            }

            const campaignAggregates: MarketingCampaignAggregate[] = Array.from(
                aggregates.entries(),
            ).map(([key, value]) => {
                const [utmSource, utmCampaign, utmContent] = key.split("|");
                return {
                    utmSource: utmSource === "(direct)" ? null : utmSource,
                    utmCampaign: utmCampaign === "(none)" ? null : utmCampaign,
                    utmContent: utmContent === "(none)" ? null : utmContent,
                    signups: value.signups,
                    activated: value.activated,
                    activationRate: value.signups > 0 ? value.activated / value.signups : 0,
                    firstSeenAt: value.first.toISOString(),
                };
            });

            const eventStatusCounts = Object.fromEntries(
                eventStats.map((s) => [s.status, s._count._all]),
            );

            const response: MarketingOverviewResponse = {
                totals: {
                    landings: totalLandings,
                    attributedUsers: totalAttributed,
                    registrationEvents: registrationsTotal,
                },
                eventStatusCounts,
                campaigns: campaignAggregates,
                config: {
                    metaPixelEnabled: cfg.metaPixelEnabled,
                    metaCapiEnabled: cfg.metaCapiEnabled,
                    metaCapiDryRun: cfg.metaCapiDryRun,
                    attributionTtlDays: e.TRACKING_ATTRIBUTION_TTL_DAYS,
                    activationWindowDays: cfg.activationWindowDays,
                },
            };
            return reply.send({ success: true, data: response });
        },
    );

    // ── GET /api/admin/marketing/users ──
    fastify.get(
        "/users",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Attributed users (paginated)",
                querystring: {
                    type: "object",
                    properties: {
                        page: { type: "integer", minimum: 1, default: 1 },
                        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 25 },
                    },
                },
            },
        },
        async (request, reply) => {
            const { page = 1, pageSize = 25 } = request.query as {
                page?: number;
                pageSize?: number;
            };
            const skip = (page - 1) * pageSize;

            const [items, total] = await Promise.all([
                prisma.userAttribution.findMany({
                    skip,
                    take: pageSize,
                    orderBy: { boundAt: "desc" },
                    include: {
                        user: { select: { id: true, email: true, username: true } },
                        landingAttribution: true,
                    },
                }),
                prisma.userAttribution.count(),
            ]);

            const rows: MarketingAttributionRow[] = items.map((row) => ({
                userId: row.userId,
                username: row.user.username,
                email: row.user.email,
                boundAt: row.boundAt.toISOString(),
                landingSessionId: row.landingAttribution.landingSessionId,
                utmSource: row.landingAttribution.utmSource,
                utmMedium: row.landingAttribution.utmMedium,
                utmCampaign: row.landingAttribution.utmCampaign,
                utmContent: row.landingAttribution.utmContent,
                utmTerm: row.landingAttribution.utmTerm,
                utmId: row.landingAttribution.utmId,
                adsetId: row.landingAttribution.adsetId,
                adsetName: row.landingAttribution.adsetName,
                gclid: row.landingAttribution.gclid,
                fbclid: row.landingAttribution.fbclid,
                referrer: row.landingAttribution.referrer,
                landingPath: row.landingAttribution.landingPath,
                firstSeenAt: row.landingAttribution.firstSeenAt.toISOString(),
            }));
            return reply.send({
                success: true,
                data: { items: rows, total, page, pageSize },
            });
        },
    );

    // ── GET /api/admin/marketing/events ──
    fastify.get(
        "/events",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Marketing events log",
                querystring: {
                    type: "object",
                    properties: {
                        page: { type: "integer", minimum: 1, default: 1 },
                        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 50 },
                        status: { type: "string" },
                        eventName: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const {
                page = 1,
                pageSize = 50,
                status,
                eventName,
            } = request.query as {
                page?: number;
                pageSize?: number;
                status?: string;
                eventName?: string;
            };
            const skip = (page - 1) * pageSize;
            const where: Record<string, unknown> = {};
            if (status) where.status = status;
            if (eventName) where.eventName = eventName;

            const [items, total] = await Promise.all([
                prisma.marketingEvent.findMany({
                    where,
                    skip,
                    take: pageSize,
                    orderBy: { createdAt: "desc" },
                }),
                prisma.marketingEvent.count({ where }),
            ]);

            const rows: MarketingEventRow[] = items.map((e) => ({
                id: e.id,
                userId: e.userId,
                landingSessionId: e.landingSessionId,
                eventName: e.eventName,
                eventId: e.eventId,
                eventSource: e.eventSource as MarketingEventRow["eventSource"],
                consentState: e.consentState as MarketingEventRow["consentState"],
                metaEnabled: e.metaEnabled,
                status: e.status as MarketingEventRow["status"],
                attemptCount: e.attemptCount,
                providerResponseCode: e.providerResponseCode,
                lastErrorCode: e.lastErrorCode,
                failureReason: e.failureReason,
                sentAt: e.sentAt ? e.sentAt.toISOString() : null,
                createdAt: e.createdAt.toISOString(),
            }));
            return reply.send({
                success: true,
                data: { items: rows, total, page, pageSize },
            });
        },
    );

    // ── GET /api/admin/marketing/settings ──
    fastify.get(
        "/settings",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Read dynamic marketing settings (DB overrides + env fallback)",
            },
        },
        async (_request, reply) => {
            const cfg = await getMarketingConfig({ fresh: true });
            const response: MarketingSettingsResponse = {
                metaPixelEnabled: cfg.metaPixelEnabled,
                metaPixelId: cfg.metaPixelId,
                metaCapiEnabled: cfg.metaCapiEnabled,
                metaCapiDryRun: cfg.metaCapiDryRun,
                metaTestEventCode: cfg.metaTestEventCode,
                activationWindowDays: cfg.activationWindowDays,
                metaAccessTokenConfigured: Boolean(cfg.metaAccessToken),
                overrides: {
                    metaPixelEnabled: cfg.overrides["marketing.metaPixelEnabled"],
                    metaPixelId: cfg.overrides["marketing.metaPixelId"],
                    metaCapiEnabled: cfg.overrides["marketing.metaCapiEnabled"],
                    metaCapiDryRun: cfg.overrides["marketing.metaCapiDryRun"],
                    metaTestEventCode: cfg.overrides["marketing.metaTestEventCode"],
                    activationWindowDays: cfg.overrides["marketing.activationWindowDays"],
                },
            };
            return reply.send({ success: true, data: response });
        },
    );

    // ── PUT /api/admin/marketing/settings ──
    // null clears the DB override (fall back to env). undefined leaves untouched.
    fastify.put(
        "/settings",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Update dynamic marketing settings",
                body: { type: "object", additionalProperties: true },
            },
        },
        async (request, reply) => {
            const parsed = marketingSettingsUpdateSchema.safeParse(request.body);
            if (!parsed.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    parsed.error.issues[0]?.message ?? "Invalid settings payload",
                );
            }
            const cfg = await updateMarketingSettings(parsed.data);
            const response: MarketingSettingsResponse = {
                metaPixelEnabled: cfg.metaPixelEnabled,
                metaPixelId: cfg.metaPixelId,
                metaCapiEnabled: cfg.metaCapiEnabled,
                metaCapiDryRun: cfg.metaCapiDryRun,
                metaTestEventCode: cfg.metaTestEventCode,
                activationWindowDays: cfg.activationWindowDays,
                metaAccessTokenConfigured: Boolean(cfg.metaAccessToken),
                overrides: {
                    metaPixelEnabled: cfg.overrides["marketing.metaPixelEnabled"],
                    metaPixelId: cfg.overrides["marketing.metaPixelId"],
                    metaCapiEnabled: cfg.overrides["marketing.metaCapiEnabled"],
                    metaCapiDryRun: cfg.overrides["marketing.metaCapiDryRun"],
                    metaTestEventCode: cfg.overrides["marketing.metaTestEventCode"],
                    activationWindowDays: cfg.overrides["marketing.activationWindowDays"],
                },
            };
            return reply.send({ success: true, data: response });
        },
    );

    // ── GET /api/admin/marketing/queue-health ── (V2 §13.4)
    fastify.get(
        "/queue-health",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "BullMQ marketing queue health + recent failed jobs",
            },
        },
        async (_request, reply) => {
            const queue = getMarketingQueue();
            const [counts, paused, failedJobs] = await Promise.all([
                queue.getJobCounts("waiting", "active", "delayed", "completed", "failed", "paused"),
                queue.isPaused(),
                queue.getFailed(0, 19),
            ]);

            const response: MarketingQueueHealth = {
                name: queue.name,
                counts: {
                    waiting: counts.waiting ?? 0,
                    active: counts.active ?? 0,
                    delayed: counts.delayed ?? 0,
                    completed: counts.completed ?? 0,
                    failed: counts.failed ?? 0,
                    paused: counts.paused ?? 0,
                },
                paused,
                failedJobs: failedJobs.map((job) => ({
                    id: String(job.id ?? ""),
                    name: job.name,
                    attemptsMade: job.attemptsMade,
                    failedReason: job.failedReason ?? null,
                    timestamp: new Date(job.timestamp).toISOString(),
                    data: (job.data ?? {}) as unknown as Record<string, unknown>,
                })),
            };
            return reply.send({ success: true, data: response });
        },
    );

    // ── POST /api/admin/marketing/events/:id/retry ──
    fastify.post(
        "/events/:id/retry",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Re-enqueue a failed marketing event for dispatch",
                params: {
                    type: "object",
                    required: ["id"],
                    properties: { id: { type: "string" } },
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params as { id: string };
            const event = await prisma.marketingEvent.findUnique({ where: { id } });
            if (!event) throw badRequest(ErrorCodes.E_NOT_FOUND, "Event not found");
            if (event.eventSource !== "server") {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Only server-side events can be re-dispatched",
                );
            }
            await prisma.marketingEvent.update({
                where: { id },
                data: { status: "pending", failureReason: null, lastErrorCode: null },
            });
            const queue = getMarketingQueue();
            // Remove old job (if any) so the unique jobId can be re-used.
            await queue.remove(id).catch(() => undefined);
            await queue.add("dispatch", { marketingEventId: id }, { jobId: id });
            return reply.send({ success: true, data: { enqueued: true } });
        },
    );

    // ── POST /api/admin/marketing/rescue-pending ──
    // Re-enqueue server events stuck in `pending` (e.g. after a Redis outage).
    // Idempotent: BullMQ ignores duplicate jobIds, so calling repeatedly is safe.
    fastify.post(
        "/rescue-pending",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Re-enqueue stuck pending server events (recovery)",
                body: {
                    type: "object",
                    properties: {
                        olderThanSeconds: { type: "integer", minimum: 0 },
                        limit: { type: "integer", minimum: 1, maximum: 5000 },
                    },
                    additionalProperties: false,
                },
            },
        },
        async (request, reply) => {
            const body = (request.body ?? {}) as {
                olderThanSeconds?: number;
                limit?: number;
            };
            const result = await rescueStuckPendingEvents({
                olderThanSeconds: body.olderThanSeconds,
                limit: body.limit,
            });
            return reply.send({ success: true, data: result });
        },
    );

    // ── GET /api/admin/marketing/reports/roi ── (V3 §23)
    fastify.get(
        "/reports/roi",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Per-campaign ROI report (signups, activation, revenue)",
                querystring: {
                    type: "object",
                    properties: {
                        from: { type: "string", format: "date-time" },
                        to: { type: "string", format: "date-time" },
                    },
                },
            },
        },
        async (request, reply) => {
            const { from, to } = request.query as { from?: string; to?: string };
            const report = await buildRoiReport({
                cohortFrom: from ? new Date(from) : null,
                cohortTo: to ? new Date(to) : null,
            });
            return reply.send({ success: true, data: report });
        },
    );

    // ── POST /api/admin/marketing/high-value-events ── (V3 §23)
    // Manual recording / hook endpoint for delayed conversion feedback.
    fastify.post(
        "/high-value-events",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Record a high-value conversion event for a user",
                body: { type: "object", additionalProperties: true },
            },
        },
        async (request, reply) => {
            const parsed = recordHighValueEventSchema.safeParse(request.body);
            if (!parsed.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    parsed.error.issues[0]?.message ?? "Invalid high-value payload",
                );
            }
            const result = await recordHighValueEvent(parsed.data);
            return reply.send({ success: true, data: result });
        },
    );

    // ── POST /api/admin/marketing/audience-exports ── (V3 §23)
    fastify.post(
        "/audience-exports",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Create a hashed-audience export (CSV/JSON) for ad platforms",
                body: { type: "object", additionalProperties: true },
            },
        },
        async (request, reply) => {
            const parsed = createAudienceExportSchema.safeParse(request.body);
            if (!parsed.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    parsed.error.issues[0]?.message ?? "Invalid export payload",
                );
            }
            const userId = request.userId;
            if (!userId) throw badRequest(ErrorCodes.E_FORBIDDEN, "No user context");
            const row = await createAudienceExport(parsed.data, userId);
            return reply.send({ success: true, data: row });
        },
    );

    // ── GET /api/admin/marketing/audience-exports ──
    fastify.get(
        "/audience-exports",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "List recent audience exports",
            },
        },
        async (_request, reply) => {
            const items = await listAudienceExports();
            return reply.send({ success: true, data: { items } });
        },
    );

    // ── DELETE /api/admin/marketing/audience-exports/:id ──
    fastify.delete(
        "/audience-exports/:id",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Delete an audience export and its file",
                params: {
                    type: "object",
                    required: ["id"],
                    properties: { id: { type: "string" } },
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params as { id: string };
            const ok = await deleteAudienceExport(id);
            if (!ok) throw badRequest(ErrorCodes.E_NOT_FOUND, "Export not found");
            return reply.send({ success: true, data: { deleted: true } });
        },
    );

    // ── GET /api/admin/marketing/audience-exports/download/:token ──
    // Token-protected so download links can be shared internally without
    // re-authenticating; admin guard still applies because the route is
    // registered under the admin prefix.
    fastify.get(
        "/audience-exports/download/:token",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Stream an audience export file",
                params: {
                    type: "object",
                    required: ["token"],
                    properties: { token: { type: "string", minLength: 16 } },
                },
            },
        },
        async (request, reply) => {
            const { token } = request.params as { token: string };
            const found = await findExportByToken(token);
            if (!found) throw badRequest(ErrorCodes.E_NOT_FOUND, "Export not available");
            const fileStat = await stat(found.filePath).catch(() => null);
            if (!fileStat) throw badRequest(ErrorCodes.E_NOT_FOUND, "File missing on disk");
            reply.header(
                "Content-Type",
                found.format === "csv" ? "text/csv; charset=utf-8" : "application/json",
            );
            reply.header("Content-Disposition", `attachment; filename="${found.fileName}"`);
            reply.header("Content-Length", fileStat.size);
            return reply.send(createReadStream(found.filePath));
        },
    );

    // ── POST /api/admin/marketing/audience-exports/:id/sync ── (V3 §23)
    // Provider-stub. Returns 501-style payload until a real upload is wired.
    fastify.post(
        "/audience-exports/:id/sync",
        {
            schema: {
                tags: ["Admin", "Marketing"],
                summary: "Sync an export to an ad platform (stub)",
                params: {
                    type: "object",
                    required: ["id"],
                    properties: { id: { type: "string" } },
                },
                body: { type: "object", additionalProperties: true },
            },
        },
        async (request, reply) => {
            const { id } = request.params as { id: string };
            const body = (request.body ?? {}) as {
                provider?: string;
                options?: Record<string, unknown>;
            };
            const providerName = (body.provider ??
                "meta_custom_audience") as "meta_custom_audience";
            const provider = getAudienceSyncProvider(providerName);
            if (!provider) {
                throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Unknown sync provider");
            }
            const row = await prisma.audienceExport.findUnique({ where: { id } });
            if (!row || !row.filePath) throw badRequest(ErrorCodes.E_NOT_FOUND, "Export not ready");
            const result = await provider.sync({
                exportId: row.id,
                filePath: row.filePath,
                format: row.format as "csv" | "json",
                rowCount: row.rowCount,
                options: body.options,
            });
            return reply.send({ success: true, data: result });
        },
    );
}
