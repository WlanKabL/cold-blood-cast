// ─── Marketing Tracking — Shared Types & Constants ──────────
// Used by both backend and frontend.
// Event names, sources, statuses and consent states are stable contract values.

import { z } from "zod";

// ─── Event names (taxonomy) ─────────────────────────────────

export const MARKETING_EVENT_NAMES = ["PageView", "CompleteRegistration"] as const;
export type MarketingEventName = (typeof MARKETING_EVENT_NAMES)[number];

/** Activation events allowed to count toward v1 KPI calculations (Phase 2). */
export const QUALIFYING_ACTIVATION_EVENTS = [
    "AnimalProfileCreated",
    "FirstCareEntryCreated",
] as const;
export type QualifyingActivationEvent = (typeof QUALIFYING_ACTIVATION_EVENTS)[number];

// ─── Event source ───────────────────────────────────────────

export const MARKETING_EVENT_SOURCES = ["browser", "server", "internal"] as const;
export type MarketingEventSource = (typeof MARKETING_EVENT_SOURCES)[number];

// ─── Event status ───────────────────────────────────────────

export const MARKETING_EVENT_STATUSES = [
    "pending",
    "processing",
    "sent",
    "failed",
    "skipped",
] as const;
export type MarketingEventStatus = (typeof MARKETING_EVENT_STATUSES)[number];

// ─── Consent states ─────────────────────────────────────────

export const MARKETING_CONSENT_STATES = ["granted", "denied", "unknown", "revoked"] as const;
export type MarketingConsentState = (typeof MARKETING_CONSENT_STATES)[number];

// ─── Attribution ────────────────────────────────────────────

export const ATTRIBUTION_MODELS = ["first_touch"] as const;
export type AttributionModel = (typeof ATTRIBUTION_MODELS)[number];

/** Default first-touch TTL — overridable via TRACKING_ATTRIBUTION_TTL_DAYS env var. */
export const ATTRIBUTION_TTL_DAYS_DEFAULT = 30;

/** v1 activation window in days for KPI calculation. */
export const ACTIVATION_WINDOW_DAYS_V1 = 7;

// ─── Zod: landing capture body ──────────────────────────────

/** Landing-session attribution body sent from client → POST /api/marketing/landing. */
export const landingAttributionInputSchema = z.object({
    landingSessionId: z.string().uuid(),
    utmSource: z.string().max(255).optional().nullable(),
    utmMedium: z.string().max(255).optional().nullable(),
    utmCampaign: z.string().max(255).optional().nullable(),
    utmContent: z.string().max(255).optional().nullable(),
    utmTerm: z.string().max(255).optional().nullable(),
    fbclid: z.string().max(512).optional().nullable(),
    fbc: z.string().max(512).optional().nullable(),
    fbp: z.string().max(512).optional().nullable(),
    referrer: z.string().max(2048).optional().nullable(),
    landingPath: z.string().max(2048).optional().nullable(),
});

export type LandingAttributionInput = z.infer<typeof landingAttributionInputSchema>;

// ─── API response types ─────────────────────────────────────

export interface MarketingLandingResponse {
    landingSessionId: string;
    expiresAt: string;
}

/** Returned to frontend after successful registration so it can fire the Pixel
 *  with the same canonical event_id used by the server-side CAPI dispatch. */
export interface MarketingRegistrationDispatchInfo {
    eventId: string;
    eventName: MarketingEventName;
    /** Whether the frontend may fire the Pixel event (consent gate result). */
    browserDispatchAllowed: boolean;
}

// ─── Admin dashboard payloads ───────────────────────────────

export interface MarketingAttributionRow {
    userId: string;
    username: string;
    email: string;
    boundAt: string;
    landingSessionId: string;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;
    fbclid: string | null;
    referrer: string | null;
    landingPath: string | null;
    firstSeenAt: string;
}

export interface MarketingEventRow {
    id: string;
    userId: string | null;
    landingSessionId: string | null;
    eventName: string;
    eventId: string;
    eventSource: MarketingEventSource;
    consentState: MarketingConsentState;
    metaEnabled: boolean;
    status: MarketingEventStatus;
    attemptCount: number;
    providerResponseCode: number | null;
    lastErrorCode: string | null;
    failureReason: string | null;
    sentAt: string | null;
    createdAt: string;
}

export interface MarketingCampaignAggregate {
    utmSource: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    signups: number;
    activated: number;
    activationRate: number;
    firstSeenAt: string;
}

export interface MarketingOverviewTotals {
    landings: number;
    attributedUsers: number;
    registrationEvents: number;
}

export interface MarketingOverviewConfig {
    metaPixelEnabled: boolean;
    metaCapiEnabled: boolean;
    metaCapiDryRun: boolean;
    attributionTtlDays: number;
}

export interface MarketingOverviewResponse {
    totals: MarketingOverviewTotals;
    eventStatusCounts: Record<string, number>;
    campaigns: MarketingCampaignAggregate[];
    config: MarketingOverviewConfig;
}

// ─── Admin: dynamic settings ────────────────────────────────

export interface MarketingSettingsResponse {
    metaPixelEnabled: boolean;
    metaPixelId: string | null;
    metaCapiEnabled: boolean;
    metaCapiDryRun: boolean;
    metaTestEventCode: string | null;
    /** True when the field is overridden in the database (vs falling back to env). */
    overrides: {
        metaPixelEnabled: boolean;
        metaPixelId: boolean;
        metaCapiEnabled: boolean;
        metaCapiDryRun: boolean;
        metaTestEventCode: boolean;
    };
    /** Whether the CAPI access token is configured in the environment. */
    metaAccessTokenConfigured: boolean;
}

export const marketingSettingsUpdateSchema = z.object({
    metaPixelEnabled: z.boolean().nullable().optional(),
    metaPixelId: z.string().max(64).nullable().optional(),
    metaCapiEnabled: z.boolean().nullable().optional(),
    metaCapiDryRun: z.boolean().nullable().optional(),
    metaTestEventCode: z.string().max(64).nullable().optional(),
});
export type MarketingSettingsUpdateInput = z.infer<typeof marketingSettingsUpdateSchema>;

// ─── Public marketing config (returned to all clients) ──────

export interface MarketingPublicConfig {
    metaPixelEnabled: boolean;
    metaPixelId: string | null;
}

// ─── Admin: BullMQ queue health (V2 §13.4) ──────────────────

export interface MarketingQueueHealth {
    name: string;
    counts: {
        waiting: number;
        active: number;
        delayed: number;
        completed: number;
        failed: number;
        paused: number;
    };
    paused: boolean;
    failedJobs: Array<{
        id: string;
        name: string;
        attemptsMade: number;
        failedReason: string | null;
        timestamp: string;
        data: Record<string, unknown>;
    }>;
}
