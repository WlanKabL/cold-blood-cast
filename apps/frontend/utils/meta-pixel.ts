// ─── Meta Pixel runtime helpers ─────────────────────────────
// Single source of truth for:
//   • injecting fbevents.js + fbq("init") + auto PageView
//   • reading marketing consent from localStorage
//   • reading / fetching the public marketing config (admin-managed)
//   • verifying the script actually loaded (callMethod is wired)
//
// The Nuxt plugin (`plugins/02.meta-pixel.client.ts`) and the
// `useMarketingTracking` composable both consume this util so we
// never duplicate Pixel-loading or consent-reading logic.

declare global {
    interface Window {
        fbq?: ((...args: unknown[]) => void) & {
            callMethod?: (...args: unknown[]) => void;
            queue?: unknown[];
            loaded?: boolean;
            version?: string;
            push?: unknown;
        };
        _fbq?: unknown;
    }
}

const FBQ_SCRIPT_ID = "cbc-meta-pixel-script";
const CONSENT_STORAGE_KEY = "cbc-cookie-consent";
const CONSENT_MIN_VERSION = 2;
const PUBLIC_CONFIG_CACHE_KEY = "cbc-marketing-public-config";
const PUBLIC_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;
/** How long to wait for fbevents.js to actually wire `fbq.callMethod` after injection. */
const PIXEL_READY_TIMEOUT_MS = 3000;
const PIXEL_READY_POLL_MS = 100;

export interface PublicMarketingConfig {
    metaPixelEnabled: boolean;
    metaPixelId: string | null;
}

interface CachedPublicConfig extends PublicMarketingConfig {
    cachedAt: number;
}

/** True only if the user has explicitly granted marketing consent on the current consent schema version. */
export function readMarketingConsent(): boolean {
    if (typeof localStorage === "undefined") return false;
    try {
        const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as { marketing?: boolean; version?: number };
        if (typeof parsed.version !== "number" || parsed.version < CONSENT_MIN_VERSION) {
            return false;
        }
        return parsed.marketing === true;
    } catch {
        return false;
    }
}

/** Reads cached public config if fresh; otherwise null. */
export function readCachedPublicMarketingConfig(): PublicMarketingConfig | null {
    if (typeof sessionStorage === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(PUBLIC_CONFIG_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CachedPublicConfig;
        if (typeof parsed.cachedAt !== "number") return null;
        if (Date.now() - parsed.cachedAt > PUBLIC_CONFIG_CACHE_TTL_MS) return null;
        return {
            metaPixelEnabled: !!parsed.metaPixelEnabled,
            metaPixelId: parsed.metaPixelId ?? null,
        };
    } catch {
        return null;
    }
}

function writeCachedPublicMarketingConfig(cfg: PublicMarketingConfig): void {
    if (typeof sessionStorage === "undefined") return;
    try {
        const payload: CachedPublicConfig = { ...cfg, cachedAt: Date.now() };
        sessionStorage.setItem(PUBLIC_CONFIG_CACHE_KEY, JSON.stringify(payload));
    } catch {
        // ignore quota errors / private mode
    }
}

/**
 * Fetches `/api/marketing/config` and caches the result. Always returns the
 * effective config; on network/parse failure returns the supplied fallback.
 * The cache is shared with the Pixel plugin and the registration composable.
 */
export async function fetchPublicMarketingConfig(
    apiBaseURL: string,
    fallback: PublicMarketingConfig,
): Promise<PublicMarketingConfig> {
    const cached = readCachedPublicMarketingConfig();
    if (cached) return cached;
    try {
        const res = await fetch(`${apiBaseURL}/api/marketing/config`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as {
            success?: boolean;
            data?: { metaPixelEnabled?: boolean; metaPixelId?: string | null };
        };
        if (body.success && body.data) {
            const cfg: PublicMarketingConfig = {
                metaPixelEnabled: !!body.data.metaPixelEnabled,
                metaPixelId: body.data.metaPixelId ?? null,
            };
            writeCachedPublicMarketingConfig(cfg);
            return cfg;
        }
    } catch {
        // fall through
    }
    writeCachedPublicMarketingConfig(fallback);
    return fallback;
}

/**
 * Injects the Meta Pixel base code, calls `fbq("init", pixelId)` and fires
 * `PageView` exactly once per browsing context. Idempotent — subsequent
 * calls with the same pixelId are no-ops; calls without consent are rejected.
 */
export function loadMetaPixel(pixelId: string): void {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (!pixelId) return;
    if (!readMarketingConsent()) return;
    if (window.fbq && document.getElementById(FBQ_SCRIPT_ID)) return;

    if (!window.fbq) {
        // Standard Meta Pixel base code, hand-translated to TS.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f: any = window;
        const b = document;
        const e = "script";
        const v = "https://connect.facebook.net/en_US/fbevents.js";
        if (!f.fbq) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const n: any = function (...args: unknown[]) {
                if (n.callMethod) n.callMethod(...args);
                else n.queue.push(args);
            };
            f.fbq = n;
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
            if (s?.parentNode) {
                s.parentNode.insertBefore(t, s);
            } else {
                (b.head ?? b.documentElement).appendChild(t);
            }
        }
    }

    window.fbq?.("init", pixelId);
    window.fbq?.("track", "PageView");
}

/** True once `fbevents.js` finished loading and wired `callMethod`. */
export function isMetaPixelReady(): boolean {
    return (
        typeof window !== "undefined" && !!window.fbq && typeof window.fbq.callMethod === "function"
    );
}

/** Resolves true once `isMetaPixelReady()`; resolves false on timeout. */
export async function waitForMetaPixelReady(
    timeoutMs: number = PIXEL_READY_TIMEOUT_MS,
): Promise<boolean> {
    if (isMetaPixelReady()) return true;
    if (typeof window === "undefined") return false;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, PIXEL_READY_POLL_MS));
        if (isMetaPixelReady()) return true;
    }
    return false;
}

/** Custom DOM event the consent banner dispatches when the user updates preferences. */
export const CONSENT_UPDATED_EVENT = "cbc:consent-updated";
