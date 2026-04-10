import { describe, it, expect, vi, beforeEach } from "vitest";
import authMiddleware from "../../middleware/auth.global";

// ─── Mock Nuxt auto-imports (must be hoisted before import) ──

const { mockAuthStore, navigateToResult } = vi.hoisted(() => {
    const mockAuthStore = {
        isAuthenticated: false,
        emailVerified: true,
        isAdmin: false,
        init: vi.fn(),
    };
    const navigateToResult = vi.fn();

    (globalThis as Record<string, unknown>).useAuthStore = () => mockAuthStore;
    (globalThis as Record<string, unknown>).navigateTo = navigateToResult;
    (globalThis as Record<string, unknown>).defineNuxtRouteMiddleware = (
        fn: (...args: unknown[]) => unknown,
    ) => fn;

    return { mockAuthStore, navigateToResult };
});

function route(path: string, fullPath?: string, query?: Record<string, string>) {
    return { path, fullPath: fullPath ?? path, query: query ?? {} } as {
        path: string;
        fullPath: string;
        query: Record<string, string>;
    };
}

type Route = { path: string; fullPath: string; query: Record<string, string> };
const mw = authMiddleware as unknown as (to: Route) => Promise<unknown>;

describe("auth.global middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthStore.isAuthenticated = false;
        mockAuthStore.emailVerified = true;
        mockAuthStore.isAdmin = false;
    });

    // ── Public routes ────────────────────────────────────────

    it("allows access to public routes without auth", async () => {
        const publicRoutes = [
            "/",
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
            "/beta",
            "/unsubscribe",
            "/confirm-delete",
            "/pricing",
        ];

        for (const path of publicRoutes) {
            navigateToResult.mockClear();
            const result = await mw(route(path));
            // Should return undefined (no redirect) or not navigate anywhere
            if (result !== undefined) {
                expect(navigateToResult).not.toHaveBeenCalled();
            }
        }
    });

    it("allows access to /legal/* prefix routes", async () => {
        const result = await mw(route("/legal/privacy"));
        expect(result).toBeUndefined();
    });

    it("allows access to /export/* prefix routes", async () => {
        const result = await mw(route("/export/data"));
        expect(result).toBeUndefined();
    });

    // ── Authenticated user redirected from auth pages ────────

    it("redirects authenticated user from /login to /dashboard", async () => {
        mockAuthStore.isAuthenticated = true;
        await mw(route("/login"));
        expect(navigateToResult).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects authenticated user from /register to /dashboard", async () => {
        mockAuthStore.isAuthenticated = true;
        await mw(route("/register"));
        expect(navigateToResult).toHaveBeenCalledWith("/dashboard");
    });

    it("respects redirect query param on /login for authenticated user", async () => {
        mockAuthStore.isAuthenticated = true;
        await mw(route("/login", "/login?redirect=/enclosures", { redirect: "/enclosures" }));
        expect(navigateToResult).toHaveBeenCalledWith("/enclosures");
    });

    it("respects redirect query param on /register for authenticated user", async () => {
        mockAuthStore.isAuthenticated = true;
        await mw(route("/register", "/register?redirect=/pets", { redirect: "/pets" }));
        expect(navigateToResult).toHaveBeenCalledWith("/pets");
    });

    it("ignores absolute URL redirect to prevent open redirect", async () => {
        mockAuthStore.isAuthenticated = true;
        await mw(
            route("/login", "/login?redirect=https://evil.com", {
                redirect: "https://evil.com",
            }),
        );
        expect(navigateToResult).toHaveBeenCalledWith("/dashboard");
    });

    it("ignores protocol-relative redirect to prevent open redirect", async () => {
        mockAuthStore.isAuthenticated = true;
        await mw(route("/login", "/login?redirect=//evil.com", { redirect: "//evil.com" }));
        expect(navigateToResult).toHaveBeenCalledWith("/dashboard");
    });

    // ── Unauthenticated redirect to login ────────────────────

    it("calls init() when not authenticated on protected route", async () => {
        mockAuthStore.init.mockResolvedValue(undefined);
        await mw(route("/dashboard", "/dashboard"));
        expect(mockAuthStore.init).toHaveBeenCalled();
    });

    it("redirects to /login when not authenticated", async () => {
        mockAuthStore.init.mockResolvedValue(undefined);
        await mw(route("/dashboard", "/dashboard"));
        expect(navigateToResult).toHaveBeenCalledWith({
            path: "/login",
            query: undefined, // /dashboard is the default, so no redirect param
        });
    });

    it("includes redirect param for non-dashboard paths", async () => {
        mockAuthStore.init.mockResolvedValue(undefined);
        await mw(route("/trades", "/trades?page=2"));
        expect(navigateToResult).toHaveBeenCalledWith({
            path: "/login",
            query: { redirect: "/trades?page=2" },
        });
    });

    // ── Email verification gate ──────────────────────────────

    it("redirects unverified user to /verify-email", async () => {
        mockAuthStore.isAuthenticated = true;
        mockAuthStore.emailVerified = false;
        await mw(route("/dashboard", "/dashboard"));
        expect(navigateToResult).toHaveBeenCalledWith("/verify-email");
    });

    it("allows unverified user to stay on /verify-email", async () => {
        mockAuthStore.isAuthenticated = true;
        mockAuthStore.emailVerified = false;
        const result = await mw(route("/verify-email"));
        expect(result).toBeUndefined();
    });

    it("redirects verified user away from /verify-email", async () => {
        mockAuthStore.isAuthenticated = true;
        mockAuthStore.emailVerified = true;
        await mw(route("/verify-email"));
        expect(navigateToResult).toHaveBeenCalledWith("/dashboard");
    });

    // ── Admin route protection ───────────────────────────────

    it("redirects non-admin from /admin routes", async () => {
        mockAuthStore.isAuthenticated = true;
        mockAuthStore.isAdmin = false;
        await mw(route("/admin/users"));
        expect(navigateToResult).toHaveBeenCalledWith("/dashboard");
    });

    it("allows admin to access /admin routes", async () => {
        mockAuthStore.isAuthenticated = true;
        mockAuthStore.isAdmin = true;
        const result = await mw(route("/admin/users"));
        expect(result).toBeUndefined();
    });
});
