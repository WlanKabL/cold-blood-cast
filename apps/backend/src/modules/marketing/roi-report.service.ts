// ─── Marketing ROI report (V3) ──────────────────────────────
// Plan v1.7 §23 — richer ROI reporting on top of the campaign aggregation.
//
// Per-campaign aggregation of:
//   - signups (UserAttribution rows in cohort range)
//   - activated users (within configurable activation window)
//   - high-value events count + revenue sum + currency
//   - revenue per signup
//
// Cohort range is optional (defaults to all-time).

import type { MarketingRoiCampaignRow, MarketingRoiReport } from "@cold-blood-cast/shared";
import { prisma } from "@/config/database.js";
import { getMarketingConfig } from "./marketing-config.service.js";

export interface RoiReportInput {
    cohortFrom?: Date | null;
    cohortTo?: Date | null;
}

export async function buildRoiReport(input: RoiReportInput = {}): Promise<MarketingRoiReport> {
    const cfg = await getMarketingConfig();
    const windowMs = cfg.activationWindowDays * 24 * 60 * 60 * 1000;
    const now = new Date();

    const attrs = await prisma.userAttribution.findMany({
        where: {
            ...(input.cohortFrom ? { boundAt: { gte: input.cohortFrom } } : {}),
            ...(input.cohortTo ? { boundAt: { lte: input.cohortTo } } : {}),
        },
        select: {
            userId: true,
            boundAt: true,
            user: {
                select: {
                    activationEvents: { select: { occurredAt: true } },
                },
            },
            landingAttribution: {
                select: { utmSource: true, utmCampaign: true, utmContent: true },
            },
        },
    });

    const userIds = attrs.map((a) => a.userId);
    const highValueRows =
        userIds.length === 0
            ? []
            : await prisma.marketingEvent.groupBy({
                  by: ["userId", "currency"],
                  where: {
                      userId: { in: userIds },
                      eventName: { in: ["Subscribe", "Purchase"] },
                      status: "sent",
                      value: { not: null },
                  },
                  _sum: { value: true },
                  _count: { _all: true },
              });
    const hvByUser = new Map<string, { count: number; value: number; currency: string | null }>();
    for (const row of highValueRows) {
        if (!row.userId) continue;
        const prev = hvByUser.get(row.userId) ?? { count: 0, value: 0, currency: row.currency };
        prev.count += row._count._all;
        prev.value += row._sum.value ?? 0;
        if (!prev.currency) prev.currency = row.currency;
        hvByUser.set(row.userId, prev);
    }

    type Bucket = {
        signups: number;
        activated: number;
        highValueEvents: number;
        revenue: number;
        currency: string | null;
    };
    const buckets = new Map<string, { key: [string | null, string | null, string | null]; v: Bucket }>();

    for (const attr of attrs) {
        const key: [string | null, string | null, string | null] = [
            attr.landingAttribution.utmSource,
            attr.landingAttribution.utmCampaign,
            attr.landingAttribution.utmContent,
        ];
        const k = key.map((x) => x ?? "").join("|");
        const bucket = buckets.get(k) ?? {
            key,
            v: { signups: 0, activated: 0, highValueEvents: 0, revenue: 0, currency: null },
        };
        bucket.v.signups += 1;
        const cutoff = new Date(attr.boundAt.getTime() + windowMs);
        const activated = attr.user.activationEvents.some(
            (a) => a.occurredAt >= attr.boundAt && a.occurredAt <= cutoff,
        );
        if (activated) bucket.v.activated += 1;
        const hv = hvByUser.get(attr.userId);
        if (hv) {
            bucket.v.highValueEvents += hv.count;
            bucket.v.revenue += hv.value;
            if (!bucket.v.currency) bucket.v.currency = hv.currency;
        }
        buckets.set(k, bucket);
    }

    const campaigns: MarketingRoiCampaignRow[] = Array.from(buckets.values())
        .map(({ key, v }) => ({
            utmSource: key[0],
            utmCampaign: key[1],
            utmContent: key[2],
            signups: v.signups,
            activated: v.activated,
            activationRate: v.signups > 0 ? v.activated / v.signups : 0,
            highValueEvents: v.highValueEvents,
            revenue: Math.round(v.revenue * 100) / 100,
            currency: v.currency,
            revenuePerSignup: v.signups > 0 ? Math.round((v.revenue / v.signups) * 100) / 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue || b.signups - a.signups);

    const totals = campaigns.reduce(
        (acc, c) => {
            acc.signups += c.signups;
            acc.activated += c.activated;
            acc.highValueEvents += c.highValueEvents;
            acc.revenue += c.revenue;
            if (!acc.currency && c.currency) acc.currency = c.currency;
            return acc;
        },
        { signups: 0, activated: 0, highValueEvents: 0, revenue: 0, currency: null as string | null },
    );
    totals.revenue = Math.round(totals.revenue * 100) / 100;

    return {
        activationWindowDays: cfg.activationWindowDays,
        cohortFrom: input.cohortFrom?.toISOString() ?? null,
        cohortTo: input.cohortTo?.toISOString() ?? null,
        totals,
        campaigns,
    };
}
