// ─── High-value conversion events service (V3) ──────────────
// Plan v1.7 §23 — delayed high-value conversion feedback to Meta.
//
// Records `Subscribe` / `Purchase` server-side events with monetary value
// and enqueues them through the same CAPI pipeline as registration events.
// Idempotent on (userId, eventName, externalId) so Stripe webhooks can
// retry safely.

import { randomUUID } from "node:crypto";
import pino from "pino";
import { Prisma } from "@prisma/client";
import {
    type HighValueEventName,
    type MarketingConsentState,
    type RecordHighValueEventInput,
} from "@cold-blood-cast/shared";
import { prisma } from "@/config/database.js";
import { buildCanonicalEventId } from "./event-id.js";
import { decideMarketingDispatch } from "./consent-matrix.js";
import { buildMetaServerEventPayload } from "./meta-payload.js";
import { enqueueMarketingEventDispatch } from "./marketing.queue.js";
import { getMarketingConfig } from "./marketing-config.service.js";

const log = pino({ name: "marketing-high-value" });

export interface RecordHighValueResult {
    recorded: boolean;
    eventId?: string;
    marketingEventId?: string;
    reason?: "duplicate" | "user_not_found" | "no_consent" | "error";
}

/**
 * Idempotently record a high-value conversion event.
 * - Looks up consent from the latest registration row for the user.
 * - Writes a server-side `MarketingEvent` row with `value` + `currency`.
 * - Enqueues CAPI dispatch only when consent allows.
 *
 * Safe to call from inside webhook handlers — catches its own errors.
 */
export async function recordHighValueEvent(
    input: RecordHighValueEventInput,
): Promise<RecordHighValueResult> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: input.userId },
            select: { id: true, email: true },
        });
        if (!user) return { recorded: false, reason: "user_not_found" };

        // Resolve consent from the user's registration event (most recent server row).
        const lastRegEvent = await prisma.marketingEvent.findFirst({
            where: {
                userId: input.userId,
                eventName: "CompleteRegistration",
                eventSource: "server",
            },
            orderBy: { createdAt: "desc" },
            select: { consentState: true, landingSessionId: true },
        });
        const consentState = (lastRegEvent?.consentState ??
            "unknown") as MarketingConsentState;
        const landingSessionId = lastRegEvent?.landingSessionId ?? null;

        // Build canonical event_id. Use externalId when supplied (e.g. Stripe charge id)
        // so webhook retries never create a second logical event.
        const transactionId = input.externalId ?? `${input.eventName}:${input.userId}:${Date.now()}`;
        const eventId = buildCanonicalEventId({
            registrationTransactionId: transactionId,
            userId: input.userId,
            eventName: input.eventName,
        });

        // Idempotency: dedup on canonical (event_name, event_id, event_source) unique index.
        const existing = await prisma.marketingEvent.findFirst({
            where: { eventName: input.eventName, eventId, eventSource: "server" },
            select: { id: true },
        });
        if (existing) {
            return { recorded: false, reason: "duplicate", eventId, marketingEventId: existing.id };
        }

        const decision = decideMarketingDispatch(consentState, input.eventName);
        const cfg = await getMarketingConfig();
        const now = new Date();

        const landing =
            landingSessionId && decision.storeFullPayload
                ? await prisma.landingAttribution.findUnique({
                      where: { landingSessionId },
                  })
                : null;

        const payload = decision.storeFullPayload
            ? buildMetaServerEventPayload({
                  eventName: input.eventName,
                  eventId,
                  eventTime: now,
                  user: { id: user.id, email: user.email },
                  landing,
                  customData: {
                      value: input.value,
                      currency: input.currency,
                  },
              })
            : null;

        const created = await prisma.marketingEvent.create({
            data: {
                userId: input.userId,
                landingSessionId: decision.storeFullPayload ? landingSessionId : null,
                eventName: input.eventName,
                eventId,
                eventSource: "server",
                metaEnabled: cfg.metaCapiEnabled,
                consentState,
                payload: (payload as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
                value: input.value,
                currency: input.currency,
                status: decision.serverDispatchAllowed ? "pending" : decision.initialStatus,
                failureReason: decision.serverDispatchAllowed ? null : `consent_${consentState}`,
                lockToken: randomUUID(),
            },
        });

        if (decision.serverDispatchAllowed) {
            await enqueueMarketingEventDispatch(created.id);
            log.info(
                { userId: input.userId, eventId, value: input.value, currency: input.currency },
                "high-value event enqueued",
            );
        } else {
            log.info(
                { userId: input.userId, eventId, consentState },
                "high-value event recorded but skipped (consent gate)",
            );
        }

        return {
            recorded: true,
            eventId,
            marketingEventId: created.id,
            reason: decision.serverDispatchAllowed ? undefined : "no_consent",
        };
    } catch (err) {
        log.error(
            { input, err: err instanceof Error ? err.message : String(err) },
            "recordHighValueEvent failed",
        );
        return { recorded: false, reason: "error" };
    }
}

/** Re-export the validated event names for convenience. */
export type { HighValueEventName };
