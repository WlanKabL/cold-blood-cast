import { describe, it, expect, afterEach, vi } from "vitest";
import { detectBrowserLocale } from "../detect-locale";

const SUPPORTED = ["en", "de"] as const;

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("detectBrowserLocale", () => {
    it("returns 'de' when navigator.languages prefers German", () => {
        vi.stubGlobal("navigator", { languages: ["de-DE", "en-US"], language: "de-DE" });
        expect(detectBrowserLocale(SUPPORTED, "en")).toBe("de");
    });

    it("returns 'en' when navigator.languages prefers English", () => {
        vi.stubGlobal("navigator", { languages: ["en-US", "de-DE"], language: "en-US" });
        expect(detectBrowserLocale(SUPPORTED, "en")).toBe("en");
    });

    it("walks through unsupported locales until a supported one is found", () => {
        vi.stubGlobal("navigator", {
            languages: ["fr-FR", "es-ES", "de-AT", "en-GB"],
            language: "fr-FR",
        });
        expect(detectBrowserLocale(SUPPORTED, "en")).toBe("de");
    });

    it("falls back to navigator.language when navigator.languages is empty", () => {
        vi.stubGlobal("navigator", { languages: [], language: "de-CH" });
        expect(detectBrowserLocale(SUPPORTED, "en")).toBe("de");
    });

    it("returns the fallback when no supported locale is found", () => {
        vi.stubGlobal("navigator", { languages: ["fr-FR", "es-ES"], language: "fr-FR" });
        expect(detectBrowserLocale(SUPPORTED, "en")).toBe("en");
    });

    it("returns the fallback when navigator is undefined", () => {
        vi.stubGlobal("navigator", undefined);
        expect(detectBrowserLocale(SUPPORTED, "en")).toBe("en");
    });

    it("is case-insensitive on the language tag", () => {
        vi.stubGlobal("navigator", { languages: ["DE-de"], language: "DE-de" });
        expect(detectBrowserLocale(SUPPORTED, "en")).toBe("de");
    });

    it("matches just the primary subtag (de-AT → de)", () => {
        vi.stubGlobal("navigator", { languages: ["de-AT"], language: "de-AT" });
        expect(detectBrowserLocale(SUPPORTED, "en")).toBe("de");
    });
});
