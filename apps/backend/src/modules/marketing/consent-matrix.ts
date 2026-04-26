// ─── Consent decision matrix ────────────────────────────────
// Plan v1.7 §7 — single source of truth for what is allowed per consent state.
// All marketing dispatch and storage logic must call `decideMarketingDispatch`.

import type {
    MarketingConsentState,
    MarketingEventName,
    MarketingEventStatus,
} from "@cold-blood-cast/shared";

export interface MarketingDispatchDecision {
    /** Persist a row in `marketing_events` (audit trail). */
    persistEvent: boolean;
    /** Store full marketing payload (identifiers etc.) on the event row. */
    storeFullPayload: boolean;
    /** Frontend may fire the Pixel event. */
    browserDispatchAllowed: boolean;
    /** Backend may dispatch to Meta CAPI. */
    serverDispatchAllowed: boolean;
    /** Initial status of the persisted event row. */
    initialStatus: MarketingEventStatus;
}

/** Decide what is allowed for the given consent state and event. */
export function decideMarketingDispatch(
    consentState: MarketingConsentState,
    _eventName: MarketingEventName,
): MarketingDispatchDecision {
    if (consentState === "granted") {
        return {
            persistEvent: true,
            storeFullPayload: true,
            browserDispatchAllowed: true,
            serverDispatchAllowed: true,
            initialStatus: "pending",
        };
    }

    // denied / unknown / revoked → conservative skip with audit trail
    return {
        persistEvent: true,
        storeFullPayload: false,
        browserDispatchAllowed: false,
        serverDispatchAllowed: false,
        initialStatus: "skipped",
    };
}
