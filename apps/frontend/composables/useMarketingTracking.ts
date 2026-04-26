// ─── Marketing tracking composable ──────────────────────────
// Plan v1.7 §11.1 — fires Meta Pixel CompleteRegistration with the
// canonical eventId for Pixel ↔ CAPI dedup.
//
// Defense-in-depth gates (in addition to the backend's consent matrix):
//   • marketing consent must be granted in localStorage at fire time
//   • Pixel must be enabled + have an ID (cached/admin-managed config)
//   • we only mark the audit row "delivered" once fbevents.js actually
//     wired `fbq.callMethod` (script reached the browser, not blocked
//     by adblock or network failure)

import {
    fetchPublicMarketingConfig,
    loadMetaPixel,
    readCachedPublicMarketingConfig,
    readMarketingConsent,
    waitForMetaPixelReady,
    type PublicMarketingConfig,
} from "~/utils/meta-pixel";
import type { MarketingRegistrationDispatchInfo } from "@cold-blood-cast/shared";

export function useMarketingTracking() {
    const config = useRuntimeConfig();
    const api = useApi();

    function fallbackConfig(): PublicMarketingConfig {
        return {
            metaPixelEnabled: !!config.public.metaPixelEnabled,
            metaPixelId: config.public.metaPixelId ? String(config.public.metaPixelId) : null,
        };
    }

    async function resolvePixelConfig(): Promise<PublicMarketingConfig> {
        const cached = readCachedPublicMarketingConfig();
        if (cached) return cached;
        const apiBaseURL = String(config.public.apiBaseURL || "");
        return fetchPublicMarketingConfig(apiBaseURL, fallbackConfig());
    }

    /** Fire CompleteRegistration with the server-issued canonical eventId for dedup. */
    async function fireRegistrationPixel(
        dispatch: MarketingRegistrationDispatchInfo | null | undefined,
    ): Promise<void> {
        if (!dispatch) return;
        if (!dispatch.browserDispatchAllowed) return;
        if (typeof window === "undefined") return;

        // Defense-in-depth: re-check consent at fire time. Backend already
        // gates on the consent state captured during /register, but the user
        // could have revoked between request and response.
        if (!readMarketingConsent()) return;

        const cfg = await resolvePixelConfig();
        if (!cfg.metaPixelEnabled || !cfg.metaPixelId) return;

        // Inject + init the Pixel if the landing-page plugin didn't already.
        loadMetaPixel(cfg.metaPixelId);

        try {
            window.fbq?.("track", dispatch.eventName, {}, { eventID: dispatch.eventId });
        } catch {
            return;
        }

        // Wait until fbevents.js actually wired `callMethod`. If the script
        // never loads (adblock, CSP, offline) we leave the audit row as
        // `pending` — the backend's stuck-event rescue will eventually mark
        // it `failed`. Reporting "delivered" prematurely would corrupt the
        // dashboard and the dedup story with Meta CAPI.
        const ready = await waitForMetaPixelReady();
        if (!ready) return;

        try {
            await api.post(`/api/marketing/events/${dispatch.eventId}/browser-delivered`);
        } catch {
            // Backend retains the pending row; rescue path will reconcile.
        }
    }

    return { fireRegistrationPixel };
}
