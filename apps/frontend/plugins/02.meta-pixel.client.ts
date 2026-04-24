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

const PUBLIC_CONFIG_CACHE_KEY = "cbc-marketing-public-config";
const PUBLIC_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedPublicConfig {
    metaPixelEnabled: boolean;
    metaPixelId: string | null;
    cachedAt: number;
}

async function loadPublicConfig(
    apiBaseURL: string,
    fallbackEnabled: boolean,
    fallbackPixelId: string,
): Promise<{ enabled: boolean; pixelId: string }> {
    // sessionStorage cache so we don't hit the API on every navigation.
    try {
        const cached = sessionStorage.getItem(PUBLIC_CONFIG_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as CachedPublicConfig;
            if (Date.now() - parsed.cachedAt < PUBLIC_CONFIG_CACHE_TTL_MS) {
                return {
                    enabled: parsed.metaPixelEnabled,
                    pixelId: parsed.metaPixelId ?? "",
                };
            }
        }
    } catch {
        // ignore
    }
    try {
        const res = await fetch(`${apiBaseURL}/api/marketing/config`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as {
            success: boolean;
            data: { metaPixelEnabled: boolean; metaPixelId: string | null };
        };
        if (body.success) {
            const cache: CachedPublicConfig = {
                metaPixelEnabled: body.data.metaPixelEnabled,
                metaPixelId: body.data.metaPixelId,
                cachedAt: Date.now(),
            };
            try {
                sessionStorage.setItem(PUBLIC_CONFIG_CACHE_KEY, JSON.stringify(cache));
            } catch {
                // ignore quota errors
            }
            return {
                enabled: body.data.metaPixelEnabled,
                pixelId: body.data.metaPixelId ?? "",
            };
        }
    } catch {
        // fall through to env-based fallback
    }
    return { enabled: fallbackEnabled, pixelId: fallbackPixelId };
}

export default defineNuxtPlugin(async () => {
    if (import.meta.server) return;
    const config = useRuntimeConfig();
    const apiBaseURL = String(config.public.apiBaseURL || "");
    const fallbackEnabled = !!config.public.metaPixelEnabled;
    const fallbackPixelId = String(config.public.metaPixelId || "");

    if (!readMarketingConsentFromStorage()) return;

    const { enabled, pixelId } = await loadPublicConfig(
        apiBaseURL,
        fallbackEnabled,
        fallbackPixelId,
    );
    if (!enabled || !pixelId) return;
    loadMetaPixel(pixelId);
});
