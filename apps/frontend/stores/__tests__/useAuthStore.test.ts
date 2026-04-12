import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useAuthStore } from "../useAuthStore";

// ─── Mock Nuxt auto-imports ──────────────────────────────────

vi.stubGlobal("useRuntimeConfig", () => ({
    public: { apiBaseURL: "http://localhost:3301" },
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock useSettingsStore (used in fetchMe)
vi.stubGlobal("useSettingsStore", () => ({
    currentLocale: "en",
    setLocale: vi.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────

function mockApiResponse(data: unknown, success = true) {
    mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success, data, error: success ? undefined : data }),
    });
}

function makeUser(overrides: Record<string, unknown> = {}) {
    return {
        id: "user_1",
        username: "keeper",
        email: "keeper@example.com",
        displayName: "Snake Keeper",
        emailVerified: true,
        ...overrides,
    };
}

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
});

describe("useAuthStore — state & computed", () => {
    it("starts unauthenticated", () => {
        const store = useAuthStore();
        expect(store.isAuthenticated).toBe(false);
        expect(store.user).toBeNull();
        expect(store.accessToken).toBeNull();
    });

    it("isAdmin when roles include ADMIN", () => {
        const store = useAuthStore();
        store.roles = ["ADMIN"];
        expect(store.isAdmin).toBe(true);
        expect(store.isModerator).toBe(true);
        expect(store.isPremium).toBe(true);
    });

    it("isModerator but not admin", () => {
        const store = useAuthStore();
        store.roles = ["MODERATOR"];
        expect(store.isAdmin).toBe(false);
        expect(store.isModerator).toBe(true);
    });

    it("hasRole checks specific role", () => {
        const store = useAuthStore();
        store.roles = ["FREE", "BETA"];
        expect(store.hasRole("FREE")).toBe(true);
        expect(store.hasRole("PREMIUM")).toBe(false);
    });

    it("hasFeature checks feature map", () => {
        const store = useAuthStore();
        store.features = { enclosures: true, sensors: false };
        expect(store.hasFeature("enclosures")).toBe(true);
        expect(store.hasFeature("sensors")).toBe(false);
        expect(store.hasFeature("unknown")).toBe(false);
    });

    it("isFeatureEnabled checks enabledFlags array", () => {
        const store = useAuthStore();
        store.enabledFlags = ["enclosures", "feedings"];
        expect(store.isFeatureEnabled("enclosures")).toBe(true);
        expect(store.isFeatureEnabled("unknown")).toBe(false);
    });

    it("getLimit returns value or fallback", () => {
        const store = useAuthStore();
        store.limits = { max_enclosures: 5 };
        expect(store.getLimit("max_enclosures")).toBe(5);
        expect(store.getLimit("unknown")).toBe(0);
        expect(store.getLimit("unknown", -1)).toBe(-1);
    });

    it("getFeatureTier returns tiers or empty array", () => {
        const store = useAuthStore();
        const tiers = [{ role: "PREMIUM", label: "Premium" }];
        store.featureTiers = { sensors: tiers as never };
        expect(store.getFeatureTier("sensors")).toEqual(tiers);
        expect(store.getFeatureTier("unknown")).toEqual([]);
    });
});

describe("useAuthStore — login", () => {
    it("sets tokens and user on successful login", async () => {
        const store = useAuthStore();
        const user = makeUser();

        // Login response
        mockApiResponse({ tokens: { accessToken: "at_123" }, user });
        // fetchMe response (called after login)
        mockApiResponse({
            user,
            roles: ["FREE"],
            features: { enclosures: true },
            limits: {},
            enabledFlags: ["enclosures"],
            featureTiers: {},
        });

        const result = await store.login({ login: "keeper", password: "pass" });

        expect(store.accessToken).toBe("at_123");
        expect(store.user).toEqual(user);
        expect(result).toEqual(user);
        expect(store.loading).toBe(false);
    });

    it("throws AuthApiError on failed login", async () => {
        const store = useAuthStore();
        mockApiResponse(
            { message: "Invalid credentials", code: "E_AUTH_INVALID_CREDENTIALS" },
            false,
        );

        await expect(store.login({ login: "x", password: "y" })).rejects.toThrow(
            "Invalid credentials",
        );
        expect(store.loading).toBe(false);
    });
});

describe("useAuthStore — register", () => {
    it("returns pendingApproval when in approval mode", async () => {
        const store = useAuthStore();
        mockApiResponse({ pendingApproval: true });

        const result = await store.register({
            username: "new",
            email: "new@example.com",
            password: "pass",
        });

        expect(result).toEqual({ pendingApproval: true });
        expect(store.isAuthenticated).toBe(false);
    });

    it("sets tokens and user on open registration", async () => {
        const store = useAuthStore();
        const user = makeUser();

        mockApiResponse({ tokens: { accessToken: "at_reg" }, user });
        mockApiResponse({
            user,
            roles: ["FREE"],
            features: {},
            limits: {},
            enabledFlags: [],
            featureTiers: {},
        });

        await store.register({
            username: "new",
            email: "new@example.com",
            password: "pass",
        });

        expect(store.accessToken).toBe("at_reg");
        expect(store.isAuthenticated).toBe(true);
    });
});

describe("useAuthStore — refresh & init", () => {
    it("tryRefresh updates accessToken on success", async () => {
        const store = useAuthStore();
        mockApiResponse({ tokens: { accessToken: "refreshed_at" } });

        const ok = await store.tryRefresh();

        expect(ok).toBe(true);
        expect(store.accessToken).toBe("refreshed_at");
    });

    it("tryRefresh returns false on failure", async () => {
        const store = useAuthStore();
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const ok = await store.tryRefresh();

        expect(ok).toBe(false);
    });

    it("init refreshes and fetches me", async () => {
        const store = useAuthStore();
        const user = makeUser();

        // tryRefresh response
        mockApiResponse({ tokens: { accessToken: "init_at" } });
        // fetchMe response
        mockApiResponse({
            user,
            roles: ["FREE"],
            features: {},
            limits: {},
            enabledFlags: [],
            featureTiers: {},
        });

        await store.init();

        expect(store.isAuthenticated).toBe(true);
        expect(store.user).toEqual(user);
    });
});

describe("useAuthStore — logout & clear", () => {
    it("clears all state on logout", async () => {
        const store = useAuthStore();
        store.accessToken = "some-token";
        store.user = makeUser() as never;
        store.roles = ["FREE"];

        // Best-effort logout call
        mockApiResponse({});

        await store.logout();

        expect(store.accessToken).toBeNull();
        expect(store.user).toBeNull();
        expect(store.roles).toEqual([]);
        expect(store.isAuthenticated).toBe(false);
    });
});
