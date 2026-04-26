// ─── Activation events service ──────────────────────────────
// Plan v1.7 §5.2 + §23 — feeds campaign quality KPIs.
//
// Activation = the user did something that proves they're a *real*
// reptile keeper, not just a curious sign-up. We currently track:
//   - AnimalProfileCreated  (first pet in their account)
//   - FirstCareEntryCreated (first care log entry ever)
//
// Each activation type fires AT MOST ONCE per user. Hooks must be
// best-effort: never block or fail the user-facing operation if
// activation tracking has a problem.

import pino from "pino";
import { Prisma } from "@prisma/client";
import { prisma } from "@/config/database.js";
import {
    QUALIFYING_ACTIVATION_EVENTS,
    type QualifyingActivationEvent,
} from "@cold-blood-cast/shared";

const log = pino({ name: "marketing-activation" });

export interface RecordActivationResult {
    recorded: boolean;
    reason?: "already_recorded" | "unknown_type" | "error";
}

/**
 * Idempotently record a qualifying activation event for a user.
 * Safe to call from inside a request handler (catches its own errors).
 */
export async function recordActivationEvent(
    userId: string,
    activationType: QualifyingActivationEvent,
    metadata?: Record<string, unknown>,
): Promise<RecordActivationResult> {
    if (!QUALIFYING_ACTIVATION_EVENTS.includes(activationType)) {
        return { recorded: false, reason: "unknown_type" };
    }
    try {
        const existing = await prisma.userActivationEvent.findFirst({
            where: { userId, activationType },
            select: { id: true },
        });
        if (existing) {
            return { recorded: false, reason: "already_recorded" };
        }
        await prisma.userActivationEvent.create({
            data: {
                userId,
                activationType,
                metadata: (metadata as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
            },
        });
        log.info({ userId, activationType }, "activation event recorded");
        return { recorded: true };
    } catch (err) {
        log.error(
            { userId, activationType, err: err instanceof Error ? err.message : String(err) },
            "activation event recording failed",
        );
        return { recorded: false, reason: "error" };
    }
}

/**
 * Convenience helper: record `FirstCareEntryCreated` only if this is
 * actually the user's first care entry. Pass the count *before* this
 * write happened (caller knows the context).
 */
export async function recordFirstCareEntryActivation(
    userId: string,
    isFirstEverEntry: boolean,
): Promise<RecordActivationResult> {
    if (!isFirstEverEntry) {
        return { recorded: false, reason: "already_recorded" };
    }
    return recordActivationEvent(userId, "FirstCareEntryCreated");
}
