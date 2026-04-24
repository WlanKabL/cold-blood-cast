// ─── Meta Pixel loader ──────────────────────────────────────
// Plan v1.7 §11.1 — only loads when META_PIXEL_ENABLED + marketing consent granted.
// Does NOT auto-fire PageView; explicit events are dispatched via useMarketingTracking().

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
        _fbq?: unknown;
    }
}

const FBQ_SCRIPT_ID = "cbc-meta-pixel-script";

export function loadMetaPixel(pixelId: string): void {
    if (typeof window === "undefined") return;
    if (window.fbq) return;
    if (document.getElementById(FBQ_SCRIPT_ID)) return;

    // Standard Meta Pixel base code, inlined to avoid an extra plugin dep.
    /* eslint-disable */
    (function (f: any, b: Document, e: string, v: string) {
        if (f.fbq) return;
        const n: any = (f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        });
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        const t = b.createElement(e) as HTMLScriptElement;
        t.async = true;
        t.id = FBQ_SCRIPT_ID;
        t.src = v;
        const s = b.getElementsByTagName(e)[0];
        s.parentNode!.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */

    window.fbq?.("init", pixelId);
}

function readMarketingConsentFromStorage(): boolean {
    try {
        const raw = localStorage.getItem("cbc-cookie-consent");
        if (!raw) return false;
        const parsed = JSON.parse(raw) as { marketing?: boolean };
        return parsed.marketing === true;
    } catch {
        return false;
    }
}

export default defineNuxtPlugin(() => {
    if (import.meta.server) return;
    const config = useRuntimeConfig();
    const enabled = !!config.public.metaPixelEnabled;
    const pixelId = String(config.public.metaPixelId || "");
    if (!enabled || !pixelId) return;
    if (!readMarketingConsentFromStorage()) return;
    loadMetaPixel(pixelId);
});
