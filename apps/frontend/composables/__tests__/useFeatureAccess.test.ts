import { describe, it, expect, vi, beforeEach } from "vitest";

import { useFeatureAccess } from "../useFeatureAccess";

// ─── Mock Auth Store ─────────────────────────────────────────

const mockHasFeature = vi.fn();

(globalThis as Record<string, unknown>).useAuthStore = () => ({
    hasFeature: mockHasFeature,
});

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

describe("useFeatureAccess", () => {
    it("returns true when the user has the feature", () => {
        mockHasFeature.mockReturnValue(true);
        const hasAccess = useFeatureAccess("sensors");
        expect(hasAccess.value).toBe(true);
        expect(mockHasFeature).toHaveBeenCalledWith("sensors");
    });

    it("returns false when the user does not have the feature", () => {
        mockHasFeature.mockReturnValue(false);
        const hasAccess = useFeatureAccess("premium_analytics");
        expect(hasAccess.value).toBe(false);
        expect(mockHasFeature).toHaveBeenCalledWith("premium_analytics");
    });

    it("returns a computed ref (not a plain value)", () => {
        mockHasFeature.mockReturnValue(true);
        const hasAccess = useFeatureAccess("enclosures");
        expect(hasAccess).toHaveProperty("value");
        expect(hasAccess).toHaveProperty("effect");
    });

    it("checks the correct feature key each time", () => {
        mockHasFeature.mockReturnValue(false);
        const a = useFeatureAccess("sensors");
        const b = useFeatureAccess("premium_analytics");
        const c = useFeatureAccess("enclosures");

        // Access .value to trigger computed evaluation
        expect(a.value).toBe(false);
        expect(b.value).toBe(false);
        expect(c.value).toBe(false);

        expect(mockHasFeature).toHaveBeenCalledWith("sensors");
        expect(mockHasFeature).toHaveBeenCalledWith("premium_analytics");
        expect(mockHasFeature).toHaveBeenCalledWith("enclosures");
    });
});
