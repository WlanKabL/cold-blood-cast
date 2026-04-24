// ─── Marketing service ──────────────────────────────────────
// Plan v1.7 §10.1 — attribution binding + registration event recording.

import { randomUUID } from "node:crypto";
import pino from "pino";
import { Prisma } from "@prisma/client";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import type {
    LandingAttributionInput,
    MarketingConsentState,
    MarketingEventName,
    MarketingRegistrationDispatchInfo,
} from "@cold-blood-cast/shared";
import {
    computeExpiresAt,
    computeTouchPriority,
    isStillValid,
    isWeakerOrEqualThan,
    normalizeLandingInput,
} from "./attribution.js";
import { decideMarketingDispatch } from "./consent-matrix.js";
import { buildCanonicalEventId } from "./event-id.js";
import { buildMetaServerEventPayload } from "./meta-payload.js";
import { enqueueMarketingEventDispatch } from "./marketing.queue.js";
import { getMarketingConfig } from "./marketing-config.service.js";

const log = pino({ name: "marketing-service" });

// ─── Landing capture ────────────────────────────────────────

export async function recordLandingAttribution(
    input: LandingAttributionInput,
): Promise<{ landingSessionId: string; expiresAt: Date }> {
    const data = normalizeLandingInput(input);
    const now = new Date();
    const ttlDays = env().TRACKING_ATTRIBUTION_TTL_DAYS;
    const newExpiresAt = computeExpiresAt(now, ttlDays);

    const existing = await prisma.landingAttribution.findUnique({
        where: { landingSessionId: data.landingSessionId },
    });

    // Plan §6.2 — never weaken a stronger valid first-touch.
    if (existing && isStillValid(existing, now)) {
        const incumbent = computeTouchPriority(existing);
        const candidate = computeTouchPriority(data);
        if (isWeakerOrEqualThan(candidate, incumbent)) {
            return { landingSessionId: existing.landingSessionId, expiresAt: existing.expiresAt };
        }
    }

    const upserted = await prisma.landingAttribution.upsert({
        where: { landingSessionId: data.landingSessionId },
        create: { ...data, firstSeenAt: now, expiresAt: newExpiresAt },
        update: { ...data, expiresAt: newExpiresAt },
    });

    return { landingSessionId: upserted.landingSessionId, expiresAt: upserted.expiresAt };
}

// ─── Bind attribution to user at signup ─────────────────────

export async function bindAttributionToUser(
    userId: string,
    landingSessionId: string | null | undefined,
): Promise<{ landingAttributionId: string | null }> {
    if (!landingSessionId) return { landingAttributionId: null };

    const existing = await prisma.landingAttribution.findUnique({
        where: { landingSessionId },
    });
    if (!existing) {
        log.warn({ userId, landingSessionId }, "landing_session_id unknown at signup");
        return { landingAttributionId: null };
    }
    if (!isStillValid(existing, new Date())) {
        log.info({ userId, landingSessionId }, "landing attribution expired — not binding");
        return { landingAttributionId: null };
    }

    try {
        await prisma.userAttribution.create({
            data: {
                userId,
                landingAttributionId: existing.id,
                attributionModel: "first_touch",
            },
        });
        return { landingAttributionId: existing.id };
    } catch (err) {
        // Unique on user_id — already bound (race or duplicate call). Idempotent: ignore.
        log.warn({ userId, err: (err as Error).message }, "user_attribution already exists");
        return { landingAttributionId: existing.id };
    }
}

// ─── Record CompleteRegistration event ──────────────────────

export interface RecordRegistrationContext {
    userId: string;
    userEmail: string;
    consentState: MarketingConsentState;
    landingSessionId: string | null;
    requestIp?: string | null;
    requestUserAgent?: string | null;
    sourceUrl?: string;
}

export async function recordRegistrationEvent(
    ctx: RecordRegistrationContext,
): Promise<MarketingRegistrationDispatchInfo> {
    const eventName: MarketingEventName = "CompleteRegistration";
    const eventId = buildCanonicalEventId({
        registrationTransactionId: ctx.userId,
        userId: ctx.userId,
        eventName,
    });

    const decision = decideMarketingDispatch(ctx.consentState, eventName);
    const now = new Date();
    // Resolve effective config (env + DB overrides) so the audit-trail value
    // matches the actual decision used at dispatch time. Plan §15.
    const cfg = await getMarketingConfig();

    // Idempotency guard: a retried registration call (or a duplicate transactional
    // write) would otherwise hit the unique (eventName, eventId, eventSource)
    // constraint and explode. The deterministic eventId means the existing rows
    // already represent the same logical event — return the original dispatch info.
    const existingServer = await prisma.marketingEvent.findFirst({
        where: { eventName, eventId, eventSource: "server" },
        select: { id: true, status: true },
    });
    if (existingServer) {
        log.info(
            { userId: ctx.userId, eventId, existingId: existingServer.id },
            "registration event already recorded — idempotent skip",
        );
        return {
            eventId,
            eventName,
            browserDispatchAllowed:
                decision.browserDispatchAllowed && cfg.metaPixelEnabled && !!cfg.metaPixelId,
        };
    }

    // Effective dispatch gates: consent allows it AND the channel is enabled.
    // For the browser side, also require the Pixel ID to actually be present —
    // otherwise we'd ask the client to fire fbq with no id (no-op + audit lie).
    // When a channel is disabled at record-time we still persist the audit
    // row but skip enqueue and mark it `skipped` with a clear reason — this
    // avoids worker noise and keeps the dashboard honest.
    const pixelChannelLive = cfg.metaPixelEnabled && !!cfg.metaPixelId;
    const serverEffectiveAllowed = decision.serverDispatchAllowed && cfg.metaCapiEnabled;
    const browserEffectiveAllowed = decision.browserDispatchAllowed && pixelChannelLive;

    const serverSkipReason = !decision.serverDispatchAllowed
        ? `consent_${ctx.consentState}`
        : !cfg.metaCapiEnabled
          ? "capi_disabled"
          : null;
    const browserSkipReason = !decision.browserDispatchAllowed
        ? `consent_${ctx.consentState}`
        : !cfg.metaPixelEnabled
          ? "pixel_disabled"
          : !cfg.metaPixelId
            ? "pixel_id_missing"
            : null;

    const landing =
        ctx.landingSessionId && decision.storeFullPayload
            ? await prisma.landingAttribution.findUnique({
                  where: { landingSessionId: ctx.landingSessionId },
              })
            : null;

    const serverPayload = decision.storeFullPayload
        ? buildMetaServerEventPayload({
              eventName,
              eventId,
              eventTime: now,
              user: { id: ctx.userId, email: ctx.userEmail },
              landing,
              request: { ip: ctx.requestIp, userAgent: ctx.requestUserAgent },
              sourceUrl: ctx.sourceUrl,
          })
        : null;

    // ── Persist server-side event row (audit trail, even when skipped)
    const serverEvent = await prisma.marketingEvent.create({
        data: {
            userId: ctx.userId,
            landingSessionId: decision.storeFullPayload ? ctx.landingSessionId : null,
            eventName,
            eventId,
            eventSource: "server",
            metaEnabled: cfg.metaCapiEnabled,
            consentState: ctx.consentState,
            payload: (serverPayload as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
            status: serverEffectiveAllowed ? "pending" : "skipped",
            failureReason: serverSkipReason,
            lockToken: randomUUID(),
        },
    });

    // ── Persist browser-side audit row (fired by client when allowed)
    // Tolerate P2002 in case the browser row already exists from a prior partial run.
    try {
        await prisma.marketingEvent.create({
            data: {
                userId: ctx.userId,
                landingSessionId: decision.storeFullPayload ? ctx.landingSessionId : null,
                eventName,
                eventId,
                eventSource: "browser",
                metaEnabled: cfg.metaPixelEnabled,
                consentState: ctx.consentState,
                payload: Prisma.JsonNull,
                status: browserEffectiveAllowed ? "pending" : "skipped",
                failureReason: browserSkipReason,
            },
        });
    } catch (err) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
        ) {
            log.info({ userId: ctx.userId, eventId }, "browser audit row already exists");
        } else {
            throw err;
        }
    }

    // ── Enqueue server dispatch only when actually deliverable.
    // Skipping the queue when CAPI is globally off avoids dead worker churn.
    if (serverEffectiveAllowed) {
        await enqueueMarketingEventDispatch(serverEvent.id);
    }

    log.info(
        {
            userId: ctx.userId,
            eventId,
            consentState: ctx.consentState,
            serverDispatch: serverEffectiveAllowed,
            browserDispatch: browserEffectiveAllowed,
            capiEnabled: cfg.metaCapiEnabled,
            pixelEnabled: cfg.metaPixelEnabled,
        },
        "registration event recorded",
    );

    return {
        eventId,
        eventName,
        browserDispatchAllowed: browserEffectiveAllowed,
    };
}

// ─── Mark browser-side event delivered (client confirmation) ─

export async function markBrowserEventDelivered(eventId: string, userId: string): Promise<void> {
    const event = await prisma.marketingEvent.findFirst({
        where: { eventId, userId, eventSource: "browser" },
    });
    if (!event) return;
    if (event.status !== "pending") return;
    await prisma.marketingEvent.update({
        where: { id: event.id },
        data: { status: "sent", sentAt: new Date(), attemptCount: 1 },
    });
}
