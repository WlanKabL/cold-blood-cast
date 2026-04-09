import { describe, it, expect } from "vitest";
import { normalizeUserAgent } from "../user-agent.js";

describe("normalizeUserAgent", () => {
    // ── Browser Detection ────────────────────────

    it("detects Chrome on Windows", () => {
        const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        expect(normalizeUserAgent(ua)).toBe("Chrome:Windows");
    });

    it("detects Chrome on macOS", () => {
        const ua =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        expect(normalizeUserAgent(ua)).toBe("Chrome:macOS");
    });

    it("detects Firefox on Linux", () => {
        const ua = "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0";
        expect(normalizeUserAgent(ua)).toBe("Firefox:Linux");
    });

    it("detects Edge on Windows (contains Chrome/ and Edg/)", () => {
        const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
        expect(normalizeUserAgent(ua)).toBe("Edge:Windows");
    });

    it("detects Safari on macOS", () => {
        const ua =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
        expect(normalizeUserAgent(ua)).toBe("Safari:macOS");
    });

    it("detects Safari on iOS", () => {
        const ua =
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
        expect(normalizeUserAgent(ua)).toBe("Safari:iOS");
    });

    it("detects Chrome on Android", () => {
        const ua =
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
        expect(normalizeUserAgent(ua)).toBe("Chrome:Android");
    });

    it("detects Opera", () => {
        const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0";
        expect(normalizeUserAgent(ua)).toBe("Opera:Windows");
    });

    // ── Stability ────────────────────────────────

    it("produces same result for different Chrome versions (stable fingerprint)", () => {
        const ua120 =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        const ua121 =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
        expect(normalizeUserAgent(ua120)).toBe(normalizeUserAgent(ua121));
    });

    it("produces same result for different Firefox versions", () => {
        const ua1 = "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0";
        const ua2 = "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0";
        expect(normalizeUserAgent(ua1)).toBe(normalizeUserAgent(ua2));
    });

    // ── Edge Cases ───────────────────────────────

    it("returns Unknown:Unknown for empty string", () => {
        expect(normalizeUserAgent("")).toBe("Unknown:Unknown");
    });

    it("returns Unknown:Unknown for unknown UA", () => {
        expect(normalizeUserAgent("some-random-bot/1.0")).toBe("Unknown:Unknown");
    });

    it("handles iPad as iOS", () => {
        const ua =
            "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
        expect(normalizeUserAgent(ua)).toBe("Safari:iOS");
    });
});
