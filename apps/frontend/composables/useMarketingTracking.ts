// ─── Marketing tracking composable ──────────────────────────
// Plan v1.7 §11.1 — fires Meta Pixel CompleteRegistration with canonical eventId.

import { loadMetaPixel } from "~/plugins/02.meta-pixel.client";
import type { MarketingRegistrationDispatchInfo } from "@cold-blood-cast/shared";

export function useMarketingTracking() {
    const config = useRuntimeConfig();
    const api = useApi();

    function readPixelConfig(): { enabled: boolean; pixelId: string } {
        // Prefer the dynamic admin-managed config cached by the Meta Pixel plugin.
        try {
            const raw = sessionStorage.getItem("cbc-marketing-public-config");
            if (raw) {
                const parsed = JSON.parse(raw) as {
                    metaPixelEnabled?: boolean;
                    metaPixelId?: string | null;
                };
                if (typeof parsed.metaPixelEnabled === "boolean") {
                    return {
                        enabled: parsed.metaPixelEnabled,
                        pixelId: parsed.metaPixelId ?? "",
                    };
                }
            }
        } catch {
            // ignore
        }
        return {
            enabled: !!config.public.metaPixelEnabled,
            pixelId: String(config.public.metaPixelId || ""),
        };
    }

    function ensurePixelLoaded(): boolean {
        if (typeof window === "undefined") return false;
        const { enabled, pixelId } = readPixelConfig();
        if (!enabled || !pixelId) return false;
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
