import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError, useApi } from "../useApi";

// ─── Mock Nuxt auto-imports ──────────────────────────────────

vi.stubGlobal("useRuntimeConfig", () => ({
    public: { apiBaseURL: "http://localhost:3001" },
}));

const mockAuthStore = {
    accessToken: null as string | null,
    tryRefresh: vi.fn(),
    logout: vi.fn(),
};
vi.stubGlobal("useAuthStore", () => mockAuthStore);

vi.stubGlobal("useAppToast", () => ({
    add: vi.fn(),
}));

vi.stubGlobal("useNuxtApp", () => ({
    $i18n: { t: (key: string) => key },
}));

vi.stubGlobal("navigateTo", vi.fn());

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Helpers ─────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
    return { json: () => Promise.resolve(body), status };
}

function successResponse<T>(data: T) {
    return jsonResponse({ success: true, data }, 200);
}

function errorResponse(code: string, message: string, status = 400) {
    return jsonResponse({ success: false, error: { code, message } }, status);
}

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    mockAuthStore.accessToken = null;
    mockAuthStore.tryRefresh.mockReset();
    mockAuthStore.logout.mockReset();
    mockFetch.mockReset();
});

describe("useApi — basic requests", () => {
    it("GET request returns data", async () => {
        mockFetch.mockResolvedValueOnce(successResponse({ items: [1, 2] }));
        const { get } = useApi();

        const result = await get<{ items: number[] }>("/api/test");

        expect(result).toEqual({ items: [1, 2] });
        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/test",
            expect.objectContaining({ credentials: "include" }),
        );
    });

    it("POST sends JSON body", async () => {
        mockFetch.mockResolvedValueOnce(successResponse({ id: "1" }));
        const { post } = useApi();

        await post("/api/items", { name: "test" });

        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.method).toBe("POST");
        expect(opts.body).toBe(JSON.stringify({ name: "test" }));
    });

    it("PUT, PATCH, DELETE methods work", async () => {
        const { put, patch, del } = useApi();

        mockFetch.mockResolvedValueOnce(successResponse(null));
        await put("/api/x", { a: 1 });
        expect(mockFetch.mock.calls[0][1].method).toBe("PUT");

        mockFetch.mockResolvedValueOnce(successResponse(null));
        await patch("/api/x", { a: 1 });
        expect(mockFetch.mock.calls[1][1].method).toBe("PATCH");

        mockFetch.mockResolvedValueOnce(successResponse(null));
        await del("/api/x");
        expect(mockFetch.mock.calls[2][1].method).toBe("DELETE");
    });
});

describe("useApi — auth token", () => {
    it("attaches Authorization header when token is present", async () => {
        mockAuthStore.accessToken = "my_token";
        mockFetch.mockResolvedValueOnce(successResponse(null));
        const { get } = useApi();

        await get("/api/protected");

        const headers = mockFetch.mock.calls[0][1].headers;
        expect(headers.get("Authorization")).toBe("Bearer my_token");
    });

    it("does not attach header when no token", async () => {
        mockFetch.mockResolvedValueOnce(successResponse(null));
        const { get } = useApi();

        await get("/api/public");

        const headers = mockFetch.mock.calls[0][1].headers;
        expect(headers.has("Authorization")).toBe(false);
    });
});

describe("useApi — 401 refresh flow", () => {
    it("retries with new token after successful refresh", async () => {
        mockAuthStore.accessToken = "old_token";
        mockAuthStore.tryRefresh.mockImplementation(() => {
            mockAuthStore.accessToken = "new_token";
            return true;
        });

        // First call: 401
        mockFetch.mockResolvedValueOnce(errorResponse("E_UNAUTHORIZED", "Expired", 401));
        // Retry: success
        mockFetch.mockResolvedValueOnce(successResponse({ ok: true }));

        const { get } = useApi();
        const result = await get<{ ok: boolean }>("/api/me");

        expect(result).toEqual({ ok: true });
        expect(mockAuthStore.tryRefresh).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws error when refresh fails", async () => {
        mockAuthStore.accessToken = "old_token";
        mockAuthStore.tryRefresh.mockResolvedValue(false);

        mockFetch.mockResolvedValueOnce(errorResponse("E_UNAUTHORIZED", "Expired", 401));

        const { get } = useApi();
        await expect(get("/api/me")).rejects.toThrow("Expired");
    });

    it("does not attempt refresh without token", async () => {
        mockAuthStore.accessToken = null;
        mockFetch.mockResolvedValueOnce(errorResponse("E_UNAUTHORIZED", "No token", 401));

        const { get } = useApi();
        await expect(get("/api/me")).rejects.toThrow("No token");
        expect(mockAuthStore.tryRefresh).not.toHaveBeenCalled();
    });
});

describe("useApi — error handling", () => {
    it("throws ApiError with code and statusCode", async () => {
        mockFetch.mockResolvedValueOnce(errorResponse("E_NOT_FOUND", "Not found", 404));

        const { get } = useApi();

        try {
            await get("/api/missing");
            expect.fail("Should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).code).toBe("E_NOT_FOUND");
            expect((err as ApiError).statusCode).toBe(404);
        }
    });

    it("handles ban detection (403 E_USER_BANNED)", async () => {
        mockAuthStore.accessToken = "tok";
        mockFetch.mockResolvedValueOnce(errorResponse("E_USER_BANNED", "Banned", 403));

        const { get } = useApi();
        await expect(get("/api/me")).rejects.toThrow("Banned");
        expect(mockAuthStore.logout).toHaveBeenCalled();
    });
});

describe("ApiError class", () => {
    it("stores code, statusCode, details", () => {
        const err = new ApiError(
            { success: false, error: { code: "E_TEST", message: "fail", details: { a: 1 } } },
            422,
        );
        expect(err.name).toBe("ApiError");
        expect(err.message).toBe("fail");
        expect(err.code).toBe("E_TEST");
        expect(err.statusCode).toBe(422);
        expect(err.details).toEqual({ a: 1 });
    });
});
