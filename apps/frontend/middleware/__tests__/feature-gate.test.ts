import { describe, it, expect, vi, beforeEach } from "vitest";

import featureGate from "../../middleware/feature-gate";

// ─── Mock Nuxt auto-imports (must be hoisted before import) ──

const { mockAuthStore, navigateToResult } = vi.hoisted(() => {
    const mockAuthStore = {
        hasFeature: vi.fn(),
    };
    const navigateToResult = vi.fn();

    (globalThis as Record<string, unknown>).useAuthStore = () => mockAuthStore;
    (globalThis as Record<string, unknown>).navigateTo = navigateToResult;
    (globalThis as Record<string, unknown>).defineNuxtRouteMiddleware = (
        fn: (...args: unknown[]) => unknown,
    ) => fn;

    return { mockAuthStore, navigateToResult };
});

type Route = { path: string; meta: Record<string, unknown> };
const mw = featureGate as unknown as (to: Route) => unknown;

function route(path: string, requiredFeature?: string): Route {
    return {
        path,
        meta: requiredFeature ? { requiredFeature } : {},
    };
}

describe("feature-gate middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does nothing when no requiredFeature in meta", () => {
        const result = mw(route("/some-page"));
        expect(result).toBeUndefined();
        expect(navigateToResult).not.toHaveBeenCalled();
    });

    it("allows access when user has the required feature", () => {
        mockAuthStore.hasFeature.mockReturnValue(true);
        const result = mw(route("/trades", "trades"));
        expect(result).toBeUndefined();
        expect(navigateToResult).not.toHaveBeenCalled();
    });

    it("redirects to /pricing when user lacks the feature", () => {
        mockAuthStore.hasFeature.mockReturnValue(false);
        mw(route("/analytics", "analytics"));
        expect(navigateToResult).toHaveBeenCalledWith("/pricing", { replace: true });
    });

    it("checks the correct feature key", () => {
        mockAuthStore.hasFeature.mockReturnValue(true);
        mw(route("/premium", "premium_analytics"));
        expect(mockAuthStore.hasFeature).toHaveBeenCalledWith("premium_analytics");
    });
});
