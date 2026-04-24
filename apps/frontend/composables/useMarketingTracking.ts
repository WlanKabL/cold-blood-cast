// ─── Marketing tracking composable ──────────────────────────
// Plan v1.7 §11.1 — fires Meta Pixel CompleteRegistration with canonical eventId.

import { loadMetaPixel } from "~/plugins/02.meta-pixel.client";
import type { MarketingRegistrationDispatchInfo } from "@cold-blood-cast/shared";

export function useMarketingTracking() {
    const config = useRuntimeConfig();
    const api = useApi();

    function ensurePixelLoaded(): boolean {
        if (typeof window === "undefined") return false;
        if (!config.public.metaPixelEnabled) return false;
        const pixelId = String(config.public.metaPixelId || "");
        if (!pixelId) return false;
        if (!window.fbq) loadMetaPixel(pixelId);
        return !!window.fbq;
    }

    /** Fire CompleteRegistration with the server-issued canonical eventId for dedup. */
    async function fireRegistrationPixel(
        dispatch: MarketingRegistrationDispatchInfo | null | undefined,
    ): Promise<void> {
        if (!dispatch) return;
        if (!dispatch.browserDispatchAllowed) return;
        if (!ensurePixelLoaded()) return;

        try {
            window.fbq?.("track", dispatch.eventName, {}, { eventID: dispatch.eventId });
        } catch {
            return;
        }

        // Confirm to backend so the audit row is closed.
        try {
            await api.post(`/api/marketing/events/${dispatch.eventId}/browser-delivered`);
        } catch {
            // ignore — backend will retry/cleanup
        }
    }

    return { fireRegistrationPixel };
}
