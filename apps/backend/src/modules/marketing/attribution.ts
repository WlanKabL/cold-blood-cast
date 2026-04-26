// ─── Attribution rules — first-touch with priority + TTL ────
// Plan v1.7 §6.

import type { Prisma } from "@prisma/client";
import type { LandingAttributionInput } from "@cold-blood-cast/shared";

/** Priority of a touch — higher wins.
 *  Plan §6.4:
 *   1. paid traffic with valid campaign markers
 *   2. organic campaign-tagged traffic
 *   3. non-direct referrer traffic
 *   4. direct / none
 */
export const enum TouchPriority {
    DIRECT = 0,
    REFERRER = 1,
    ORGANIC_CAMPAIGN = 2,
    PAID_CAMPAIGN = 3,
}

const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paidsocial", "paid_social", "display"]);

/** Compute priority from raw attribution fields. */
export function computeTouchPriority(input: {
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    fbclid?: string | null;
    gclid?: string | null;
    referrer?: string | null;
}): TouchPriority {
    const hasCampaignMarkers = !!(
        input.utmSource ||
        input.utmCampaign ||
        input.fbclid ||
        input.gclid
    );
    const medium = (input.utmMedium ?? "").toLowerCase();

    if (hasCampaignMarkers && (PAID_MEDIUMS.has(medium) || !!input.fbclid || !!input.gclid)) {
        return TouchPriority.PAID_CAMPAIGN;
    }
    if (hasCampaignMarkers) {
        return TouchPriority.ORGANIC_CAMPAIGN;
    }
    if (input.referrer) {
        return TouchPriority.REFERRER;
    }
    return TouchPriority.DIRECT;
}

/** Plan §6.2 — never overwrite valid first-touch with weaker traffic. */
export function isWeakerOrEqualThan(candidate: TouchPriority, incumbent: TouchPriority): boolean {
    return candidate <= incumbent;
}

/** Compute expiry timestamp for a new landing attribution. */
export function computeExpiresAt(now: Date, ttlDays: number): Date {
    return new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
}

/** Normalize a free-form input into a Prisma-ready record. Trims & nulls empties. */
export function normalizeLandingInput(input: LandingAttributionInput): {
    landingSessionId: string;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;
    utmId: string | null;
    adsetId: string | null;
    adsetName: string | null;
    gclid: string | null;
    fbclid: string | null;
    fbc: string | null;
    fbp: string | null;
    referrer: string | null;
    landingPath: string | null;
} {
    const norm = (v: string | null | undefined): string | null => {
        if (!v) return null;
        const trimmed = v.trim();
        return trimmed.length === 0 ? null : trimmed;
    };
    return {
        landingSessionId: input.landingSessionId,
        utmSource: norm(input.utmSource),
        utmMedium: norm(input.utmMedium),
        utmCampaign: norm(input.utmCampaign),
        utmContent: norm(input.utmContent),
        utmTerm: norm(input.utmTerm),
        utmId: norm(input.utmId),
        adsetId: norm(input.adsetId),
        adsetName: norm(input.adsetName),
        gclid: norm(input.gclid),
        fbclid: norm(input.fbclid),
        fbc: norm(input.fbc),
        fbp: norm(input.fbp),
        referrer: norm(input.referrer),
        landingPath: norm(input.landingPath),
    };
}

/** Type alias for a landing attribution record (subset used by binding logic). */
export type LandingAttributionRecord = Pick<
    Prisma.LandingAttributionGetPayload<true>,
    "id" | "expiresAt" | "utmSource" | "utmMedium" | "utmCampaign" | "fbclid" | "referrer"
>;

/** Returns true if the landing attribution is still within its TTL. */
export function isStillValid(record: LandingAttributionRecord, now: Date): boolean {
    return record.expiresAt.getTime() > now.getTime();
}
