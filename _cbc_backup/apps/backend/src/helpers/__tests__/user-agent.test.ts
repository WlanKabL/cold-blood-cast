import { describe, it, expect } from "vitest";
import { normalizeUserAgent } from "../user-agent.js";

describe("normalizeUserAgent", () => {
    it("detects Chrome on Windows", () => {
        const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        expect(normalizeUserAgent(ua)).toBe("Chrome:Windows");
    });

    it("detects Firefox on Linux", () => {
        const ua = "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0";
        expect(normalizeUserAgent(ua)).toBe("Firefox:Linux");
    });

    it("detects Safari on macOS", () => {
        const ua =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
        expect(normalizeUserAgent(ua)).toBe("Safari:macOS");
    });

    it("detects Edge on Windows", () => {
        const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
        expect(normalizeUserAgent(ua)).toBe("Edge:Windows");
    });

    it("detects Opera on Windows", () => {
        const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0";
        expect(normalizeUserAgent(ua)).toBe("Opera:Windows");
    });

    it("detects Chrome on Android", () => {
        const ua =
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
        expect(normalizeUserAgent(ua)).toBe("Chrome:Android");
    });

    it("detects Safari on iOS", () => {
        const ua =
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
        expect(normalizeUserAgent(ua)).toBe("Safari:iOS");
    });

    it("returns Unknown:Unknown for empty string", () => {
        expect(normalizeUserAgent("")).toBe("Unknown:Unknown");
    });

    it("returns Unknown:Unknown for random string", () => {
        expect(normalizeUserAgent("some-random-bot/1.0")).toBe("Unknown:Unknown");
    });
});
