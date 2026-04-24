// ─── Marketing first-touch attribution capture ──────────────
// Plan v1.7 §5 + §6 — runs once on first client load, persists landingSessionId
// for 90 days, posts to /api/marketing/landing.

import type { LandingAttributionInput } from "@cold-blood-cast/shared";

const STORAGE_KEY = "cbc-landing-attribution";
const STORAGE_TTL_DAYS = 90;

interface StoredAttribution {
    landingSessionId: string;
    capturedAt: number;
}

function uuidv4(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    // Fallback (RFC 4122 §4.4 minimal)
    const bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined") crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readStored(): StoredAttribution | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredAttribution;
        const ageDays = (Date.now() - parsed.capturedAt) / (24 * 60 * 60 * 1000);
        if (ageDays > STORAGE_TTL_DAYS) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeStored(landingSessionId: string): void {
    try {
        const value: StoredAttribution = { landingSessionId, capturedAt: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
        // ignore storage errors (private mode etc.)
    }
}

function readQueryParam(params: URLSearchParams, key: string): string | undefined {
    const value = params.get(key);
    return value && value.length > 0 ? value : undefined;
}

export default defineNuxtPlugin(async () => {
    if (import.meta.server) return;

    const url = new URL(window.location.href);
    const params = url.searchParams;

    const utmSource = readQueryParam(params, "utm_source");
    const utmMedium = readQueryParam(params, "utm_medium");
    const utmCampaign = readQueryParam(params, "utm_campaign");
    const utmContent = readQueryParam(params, "utm_content");
    const utmTerm = readQueryParam(params, "utm_term");
    // v3.1: extended attribution params
    const utmId = readQueryParam(params, "utm_id");
    const adsetId = readQueryParam(params, "adset_id");
    const adsetName = readQueryParam(params, "adset_name");
    const gclid = readQueryParam(params, "gclid");
    const fbclid = readQueryParam(params, "fbclid");
    const referrer =
        document.referrer && document.referrer.length > 0 ? document.referrer : undefined;
    const landingPath = url.pathname + (url.search || "");

    const hasAnyMarketingMarker = !!(
        utmSource ||
        utmMedium ||
        utmCampaign ||
        utmContent ||
        utmTerm ||
        utmId ||
        adsetId ||
        adsetName ||
        gclid ||
        fbclid
    );

    const stored = readStored();
    const landingSessionId = stored?.landingSessionId ?? uuidv4();
    if (!stored) writeStored(landingSessionId);

    // Skip backend POST if nothing meaningful to capture and we already have a session.
    if (stored && !hasAnyMarketingMarker) return;

    const payload: LandingAttributionInput = {
        landingSessionId,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        utmId,
        adsetId,
        adsetName,
        gclid,
        fbclid,
        referrer,
        landingPath,
    };

    try {
        const config = useRuntimeConfig();
        await $fetch("/api/marketing/landing", {
            baseURL: config.public.apiBaseURL,
            method: "POST",
            body: payload,
            credentials: "include",
        });
    } catch {
        // Silent — tracking must never break the app.
    }
});

export function getLandingSessionId(): string | null {
    if (typeof localStorage === "undefined") return null;
    return readStored()?.landingSessionId ?? null;
}
