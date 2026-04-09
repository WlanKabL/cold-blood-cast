import { describe, it, expect, vi, beforeEach } from "vitest";

import { useResolveUrl } from "../useResolveUrl";

// ─── Mock Nuxt auto-imports ──────────────────────────────────

const mockAuthStore = { accessToken: "tok-abc" };
vi.stubGlobal("useAuthStore", () => mockAuthStore);
vi.stubGlobal("useRuntimeConfig", () => ({
    public: { apiBaseURL: "https://api.cold-blood-cast.app" },
}));

beforeEach(() => {
    mockAuthStore.accessToken = "tok-abc";
});

describe("useResolveUrl", () => {
    it("returns empty string for falsy input", () => {
        const resolve = useResolveUrl();
        expect(resolve("")).toBe("");
    });

    it("returns absolute http(s) URLs unchanged", () => {
        const resolve = useResolveUrl();
        expect(resolve("https://cdn.example.com/img.png")).toBe("https://cdn.example.com/img.png");
        expect(resolve("http://example.com/file")).toBe("http://example.com/file");
    });

    it("prefixes relative URLs with baseURL", () => {
        const resolve = useResolveUrl();
        expect(resolve("/api/health")).toBe("https://api.cold-blood-cast.app/api/health");
    });

    it("appends auth token for /uploads/ paths", () => {
        const resolve = useResolveUrl();
        expect(resolve("/uploads/screenshots/img.png")).toBe(
            "https://api.cold-blood-cast.app/uploads/screenshots/img.png?t=tok-abc",
        );
    });

    it("does not append token when no accessToken", () => {
        mockAuthStore.accessToken = "";
        const resolve = useResolveUrl();
        expect(resolve("/uploads/screenshots/img.png")).toBe(
            "https://api.cold-blood-cast.app/uploads/screenshots/img.png",
        );
    });

    it("does not append token for non-upload relative paths", () => {
        const resolve = useResolveUrl();
        expect(resolve("/api/enclosures")).toBe("https://api.cold-blood-cast.app/api/enclosures");
    });
});
