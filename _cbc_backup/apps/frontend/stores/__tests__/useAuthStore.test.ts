import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

// Mock useRuntimeConfig since auth store uses it for apiBaseURL
vi.stubGlobal("useRuntimeConfig", () => ({
    public: { apiBaseUrl: "http://localhost:3000" },
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocking
const { useAuthStore } = await import("~/stores/useAuthStore");

function jsonResponse(data: unknown, status = 200) {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
    });
}

describe("useAuthStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it("starts with no user and not initialized", () => {
        const store = useAuthStore();

        expect(store.user).toBeNull();
        expect(store.accessToken).toBeNull();
        expect(store.isLoggedIn).toBe(false);
        expect(store.isAdmin).toBe(false);
        expect(store.initialized).toBe(false);
    });

    it("computes userInitial safely with fallback", () => {
        const store = useAuthStore();

        // No user → falls back to "?"
        expect(store.userInitial).toBe("?");
    });

    it("login stores accessToken and fetches user", async () => {
        const store = useAuthStore();

        const mockUser = {
            id: "1",
            username: "testuser",
            email: "test@example.com",
            displayName: "Test User",
            isAdmin: false,
            roles: [],
            enabledFlags: [],
            limits: {},
        };

        // login response
        mockFetch.mockReturnValueOnce(jsonResponse({ accessToken: "token123" }));
        // fetchUser response
        mockFetch.mockReturnValueOnce(jsonResponse(mockUser));

        await store.login("testuser", "password");

        expect(store.accessToken).toBe("token123");
        expect(store.isLoggedIn).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);

        // Verify login call
        const [loginUrl, loginOpts] = mockFetch.mock.calls[0];
        expect(loginUrl).toBe("http://localhost:3000/api/auth/login");
        expect(loginOpts.method).toBe("POST");
        expect(loginOpts.credentials).toBe("include");
        expect(JSON.parse(loginOpts.body)).toEqual({ username: "testuser", password: "password" });
    });

    it("refresh sets accessToken on success", async () => {
        const store = useAuthStore();

        mockFetch.mockReturnValueOnce(jsonResponse({ accessToken: "new-token" }));

        const result = await store.refresh();

        expect(result).toBe(true);
        expect(store.accessToken).toBe("new-token");

        const [url, opts] = mockFetch.mock.calls[0];
        expect(url).toBe("http://localhost:3000/api/auth/refresh");
        expect(opts.method).toBe("POST");
        expect(opts.credentials).toBe("include");
    });

    it("refresh clears state on failure", async () => {
        const store = useAuthStore();
        store.accessToken = "old-token";

        mockFetch.mockReturnValueOnce(jsonResponse({ error: "Unauthorized" }, 401));

        const result = await store.refresh();

        expect(result).toBe(false);
        expect(store.accessToken).toBeNull();
        expect(store.user).toBeNull();
    });

    it("init calls refresh and fetchUser on success", async () => {
        const store = useAuthStore();

        // refresh
        mockFetch.mockReturnValueOnce(jsonResponse({ accessToken: "init-token" }));
        // fetchUser
        mockFetch.mockReturnValueOnce(
            jsonResponse({
                id: "1",
                username: "admin",
                email: "admin@cbc.dev",
                displayName: "Admin",
                isAdmin: true,
                roles: [],
                enabledFlags: ["feature1"],
                limits: { maxSensors: 10 },
            }),
        );

        await store.init();

        expect(store.initialized).toBe(true);
        expect(store.accessToken).toBe("init-token");
        expect(store.isLoggedIn).toBe(true);
        expect(store.isAdmin).toBe(true);
    });

    it("init marks initialized even on refresh failure", async () => {
        const store = useAuthStore();

        mockFetch.mockReturnValueOnce(jsonResponse({ error: "No cookie" }, 401));

        await store.init();

        expect(store.initialized).toBe(true);
        expect(store.isLoggedIn).toBe(false);
    });

    it("init does not run twice (idempotent)", async () => {
        const store = useAuthStore();

        mockFetch.mockReturnValueOnce(jsonResponse({ accessToken: "t" }));
        mockFetch.mockReturnValueOnce(
            jsonResponse({
                id: "1",
                username: "u",
                email: "e",
                isAdmin: false,
                roles: [],
                enabledFlags: [],
                limits: {},
            }),
        );

        await Promise.all([store.init(), store.init()]);

        // refresh + fetchUser = 2 calls total, even though init() was called twice
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("logout clears user and token", async () => {
        const store = useAuthStore();
        store.accessToken = "token";
        store.user = { id: "1", username: "u", email: "e", isAdmin: false } as never;

        mockFetch.mockReturnValueOnce(jsonResponse({ ok: true }));

        await store.logout();

        expect(store.user).toBeNull();
        expect(store.accessToken).toBeNull();
    });

    it("logout clears state even if request fails", async () => {
        const store = useAuthStore();
        store.accessToken = "token";
        store.user = { id: "1", username: "u", email: "e", isAdmin: false } as never;

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        await store.logout();

        expect(store.user).toBeNull();
        expect(store.accessToken).toBeNull();
    });

    it("authFetch sends Authorization header when token exists", async () => {
        const store = useAuthStore();
        store.accessToken = "bearer-token";

        mockFetch.mockReturnValueOnce(
            jsonResponse({
                id: "1",
                username: "u",
                email: "e",
                isAdmin: false,
                roles: [],
                enabledFlags: [],
                limits: {},
            }),
        );

        await store.fetchUser();

        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.headers.Authorization).toBe("Bearer bearer-token");
    });

    it("hasFeature checks enabledFlags", () => {
        const store = useAuthStore();
        store.user = {
            id: "1",
            username: "u",
            email: "e",
            isAdmin: false,
            roles: [],
            enabledFlags: ["dark_mode", "beta_features"],
            limits: {},
        } as never;

        expect(store.hasFeature("dark_mode")).toBe(true);
        expect(store.hasFeature("nonexistent")).toBe(false);
    });

    it("hasRole checks user roles", () => {
        const store = useAuthStore();
        store.user = {
            id: "1",
            username: "u",
            email: "e",
            isAdmin: false,
            roles: [{ name: "admin", displayName: "Admin" }],
            enabledFlags: [],
            limits: {},
        } as never;

        expect(store.hasRole("admin")).toBe(true);
        expect(store.hasRole("moderator")).toBe(false);
    });

    it("getLimit returns limit value or undefined", () => {
        const store = useAuthStore();
        store.user = {
            id: "1",
            username: "u",
            email: "e",
            isAdmin: false,
            roles: [],
            enabledFlags: [],
            limits: { maxSensors: 10, maxPets: 5 },
        } as never;

        expect(store.getLimit("maxSensors")).toBe(10);
        expect(store.getLimit("maxPets")).toBe(5);
        expect(store.getLimit("nonexistent")).toBeUndefined();
    });

    describe("register", () => {
        it("registers and sets token on normal flow", async () => {
            const store = useAuthStore();

            mockFetch.mockReturnValueOnce(jsonResponse({ accessToken: "reg-token" }));
            mockFetch.mockReturnValueOnce(
                jsonResponse({
                    id: "2",
                    username: "newuser",
                    email: "new@test.com",
                    isAdmin: false,
                    roles: [],
                    enabledFlags: [],
                    limits: {},
                }),
            );

            const result = await store.register({
                email: "new@test.com",
                username: "newuser",
                password: "Str0ng!Pass",
            });

            expect(result.pendingApproval).toBe(false);
            expect(store.accessToken).toBe("reg-token");
            expect(store.isLoggedIn).toBe(true);

            const [, opts] = mockFetch.mock.calls[0];
            expect(JSON.parse(opts.body)).toEqual({
                email: "new@test.com",
                username: "newuser",
                password: "Str0ng!Pass",
            });
        });

        it("returns pendingApproval when server requires approval", async () => {
            const store = useAuthStore();

            mockFetch.mockReturnValueOnce(jsonResponse({ pendingApproval: true }));

            const result = await store.register({
                email: "pending@test.com",
                username: "pendinguser",
                password: "Str0ng!Pass",
            });

            expect(result.pendingApproval).toBe(true);
            expect(store.accessToken).toBeNull();
            expect(store.isLoggedIn).toBe(false);
            // Should NOT have fetched user
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it("sends inviteCode when provided", async () => {
            const store = useAuthStore();

            mockFetch.mockReturnValueOnce(jsonResponse({ accessToken: "inv-token" }));
            mockFetch.mockReturnValueOnce(
                jsonResponse({
                    id: "3",
                    username: "invited",
                    email: "invited@test.com",
                    isAdmin: false,
                    roles: [],
                    enabledFlags: [],
                    limits: {},
                }),
            );

            await store.register({
                email: "invited@test.com",
                username: "invited",
                password: "Str0ng!Pass",
                inviteCode: "ABC123",
            });

            const [, opts] = mockFetch.mock.calls[0];
            const body = JSON.parse(opts.body);
            expect(body.inviteCode).toBe("ABC123");
        });

        it("throws on server error", async () => {
            const store = useAuthStore();

            mockFetch.mockReturnValueOnce(jsonResponse({ error: "Registration closed" }, 403));

            await expect(
                store.register({
                    email: "fail@test.com",
                    username: "failuser",
                    password: "Str0ng!Pass",
                }),
            ).rejects.toThrow();
        });
    });
});
