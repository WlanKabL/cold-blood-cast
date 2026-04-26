// ─── Meta Pixel bootstrap (client-only Nuxt plugin) ─────────
// Plan v1.7 §11.1 — runs once on first client load:
//   1. Always fetches + caches the public marketing config
//      (so the registration composable can read it later).
//   2. If marketing consent is granted AND Pixel is enabled,
//      injects fbevents.js, calls fbq("init") and fires PageView.
//   3. Re-evaluates whenever the consent banner emits
//      `cbc:consent-updated` so accept-after-load works.
//
// All Pixel + consent + config logic lives in `~/utils/meta-pixel.ts`.

import {
    CONSENT_UPDATED_EVENT,
    fetchPublicMarketingConfig,
    loadMetaPixel,
    readMarketingConsent,
    type PublicMarketingConfig,
} from "~/utils/meta-pixel";

export default defineNuxtPlugin(() => {
    if (import.meta.server) return;

    const config = useRuntimeConfig();
    const apiBaseURL = String(config.public.apiBaseURL || "");
    const fallback: PublicMarketingConfig = {
        metaPixelEnabled: !!config.public.metaPixelEnabled,
        metaPixelId: config.public.metaPixelId ? String(config.public.metaPixelId) : null,
    };

    let bootstrapped = false;

    async function tryBootstrap(): Promise<void> {
        if (bootstrapped) return;
        const cfg = await fetchPublicMarketingConfig(apiBaseURL, fallback);
        if (!cfg.metaPixelEnabled || !cfg.metaPixelId) return;
        if (!readMarketingConsent()) return;
        loadMetaPixel(cfg.metaPixelId); // fires PageView internally
        bootstrapped = true;
    }

    // First pass — best-effort, never throws.
    void tryBootstrap();

    // React to consent updates issued by the cookie banner.
    window.addEventListener(CONSENT_UPDATED_EVENT, () => {
        void tryBootstrap();
    });
});
