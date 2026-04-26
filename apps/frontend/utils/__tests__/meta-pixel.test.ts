import { describe, it, expect, beforeEach, vi } from "vitest";

import {
    fetchPublicMarketingConfig,
    isMetaPixelReady,
    loadMetaPixel,
    readCachedPublicMarketingConfig,
    readMarketingConsent,
    waitForMetaPixelReady,
} from "../meta-pixel";

const CONSENT_KEY = "cbc-cookie-consent";
const CACHE_KEY = "cbc-marketing-public-config";

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Strip any window.fbq from a prior test.
    delete (window as unknown as { fbq?: unknown }).fbq;
    delete (window as unknown as { _fbq?: unknown })._fbq;
    document.getElementById("cbc-meta-pixel-script")?.remove();
});

describe("readMarketingConsent", () => {
    it("returns false when no consent stored", () => {
        expect(readMarketingConsent()).toBe(false);
    });

    it("returns false when only legacy v1 consent stored", () => {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, version: 1 }));
        expect(readMarketingConsent()).toBe(false);
    });

    it("returns false when marketing flag is false", () => {
        localStorage.setItem(
            CONSENT_KEY,
            JSON.stringify({ analytics: true, marketing: false, version: 2 }),
        );
        expect(readMarketingConsent()).toBe(false);
    });

    it("returns true when v2 marketing flag is true", () => {
        localStorage.setItem(
            CONSENT_KEY,
            JSON.stringify({ analytics: true, marketing: true, version: 2 }),
        );
        expect(readMarketingConsent()).toBe(true);
    });

    it("returns false on malformed JSON", () => {
        localStorage.setItem(CONSENT_KEY, "not-json");
        expect(readMarketingConsent()).toBe(false);
    });
});

describe("readCachedPublicMarketingConfig", () => {
    it("returns null when nothing cached", () => {
        expect(readCachedPublicMarketingConfig()).toBeNull();
    });

    it("returns null when cachedAt is missing", () => {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ metaPixelEnabled: true, metaPixelId: "1" }),
        );
        expect(readCachedPublicMarketingConfig()).toBeNull();
    });

    it("returns null when cache is older than the TTL", () => {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                metaPixelEnabled: true,
                metaPixelId: "1",
                cachedAt: Date.now() - 10 * 60 * 1000, // 10 minutes — TTL is 5
            }),
        );
        expect(readCachedPublicMarketingConfig()).toBeNull();
    });

    it("returns the cached payload when fresh", () => {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                metaPixelEnabled: true,
                metaPixelId: "12345",
                cachedAt: Date.now(),
            }),
        );
        expect(readCachedPublicMarketingConfig()).toEqual({
            metaPixelEnabled: true,
            metaPixelId: "12345",
        });
    });
});

describe("fetchPublicMarketingConfig", () => {
    it("returns the cached value without hitting the network", async () => {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                metaPixelEnabled: true,
                metaPixelId: "cached-id",
                cachedAt: Date.now(),
            }),
        );
        const fetchSpy = vi.fn();
        vi.stubGlobal("fetch", fetchSpy);
        const cfg = await fetchPublicMarketingConfig("http://api.local", {
            metaPixelEnabled: false,
            metaPixelId: null,
        });
        expect(cfg).toEqual({ metaPixelEnabled: true, metaPixelId: "cached-id" });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("fetches from the API and caches when no cache exists", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    success: true,
                    data: { metaPixelEnabled: true, metaPixelId: "from-api" },
                }),
                { status: 200, headers: { "content-type": "application/json" } },
            ),
        );
        vi.stubGlobal("fetch", fetchMock);
        const cfg = await fetchPublicMarketingConfig("http://api.local", {
            metaPixelEnabled: false,
            metaPixelId: null,
        });
        expect(cfg).toEqual({ metaPixelEnabled: true, metaPixelId: "from-api" });
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
        expect(cached.metaPixelId).toBe("from-api");
        expect(typeof cached.cachedAt).toBe("number");
    });

    it("returns the fallback when fetch rejects", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
        const cfg = await fetchPublicMarketingConfig("http://api.local", {
            metaPixelEnabled: false,
            metaPixelId: null,
        });
        expect(cfg).toEqual({ metaPixelEnabled: false, metaPixelId: null });
    });
});

describe("loadMetaPixel", () => {
    it("does nothing when consent is not granted", () => {
        loadMetaPixel("123");
        expect(window.fbq).toBeUndefined();
        expect(document.getElementById("cbc-meta-pixel-script")).toBeNull();
    });

    it("does nothing when pixelId is empty", () => {
        localStorage.setItem(
            CONSENT_KEY,
            JSON.stringify({ analytics: true, marketing: true, version: 2 }),
        );
        loadMetaPixel("");
        expect(window.fbq).toBeUndefined();
    });

    it("injects the script + fbq stub + fires PageView when consent is granted", () => {
        localStorage.setItem(
            CONSENT_KEY,
            JSON.stringify({ analytics: true, marketing: true, version: 2 }),
        );
        loadMetaPixel("999");
        expect(window.fbq).toBeDefined();
        expect(document.getElementById("cbc-meta-pixel-script")).not.toBeNull();
        // Inspect the queue our base-code stub built up before fbevents.js arrives.
        const queue = (window.fbq as unknown as { queue: unknown[][] }).queue;
        const initCall = queue.find((c) => c[0] === "init");
        const pageViewCall = queue.find((c) => c[0] === "track" && c[1] === "PageView");
        expect(initCall?.[1]).toBe("999");
        expect(pageViewCall).toBeDefined();
    });
});

describe("isMetaPixelReady / waitForMetaPixelReady", () => {
    it("isMetaPixelReady is false until callMethod is wired", () => {
        expect(isMetaPixelReady()).toBe(false);
        (window as unknown as { fbq: { loaded: true } }).fbq = {
            loaded: true,
        } as unknown as Window["fbq"] & object;
        expect(isMetaPixelReady()).toBe(false);
        (window as unknown as { fbq: object }).fbq = Object.assign(function () {}, {
            callMethod: function () {},
        });
        expect(isMetaPixelReady()).toBe(true);
    });

    it("waitForMetaPixelReady resolves false on timeout", async () => {
        const ok = await waitForMetaPixelReady(150);
        expect(ok).toBe(false);
    });
});
