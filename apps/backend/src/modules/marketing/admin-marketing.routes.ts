// ─── Admin marketing dashboard routes ───────────────────────
// Plan v1.7 §13.

import type { FastifyInstance } from "fastify";
import type {
    MarketingAttributionRow,
    MarketingCampaignAggregate,
    MarketingEventRow,
    MarketingOverviewResponse,
} from "@cold-blood-cast/shared";
import { prisma } from "@/config/database.js";
import { adminGuard, authGuard } from "@/middleware/auth.js";
import { env } from "@/config/env.js";

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
            const activationDays = 7;
            const now = Date.now();
            const activationCutoff = new Date(now - activationDays * 24 * 60 * 60 * 1000);

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
                                select: { id: true, activationEvents: { select: { occurredAt: true } } },
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
                const activated = row.user.activationEvents.some(
                    (a) => a.occurredAt >= row.boundAt && a.occurredAt <= activationCutoff,
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
                    metaPixelEnabled: e.META_PIXEL_ENABLED,
                    metaCapiEnabled: e.META_CAPI_ENABLED,
                    metaCapiDryRun: e.META_CAPI_DRY_RUN,
                    attributionTtlDays: e.TRACKING_ATTRIBUTION_TTL_DAYS,
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
                eventSource: e.eventSource,
                consentState: e.consentState,
                metaEnabled: e.metaEnabled,
                status: e.status,
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
}
