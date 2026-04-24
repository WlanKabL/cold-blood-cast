import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockGetMarketingConfig = vi.fn();
vi.mock("../marketing-config.service.js", () => ({
    getMarketingConfig: mockGetMarketingConfig,
}));

vi.mock("@/config/env.js", () => ({
    env: () => ({ TRACKING_DISPATCH_TIMEOUT_MS: 5000 }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { dispatchMetaCapiEvent } = await import("../meta-capi.service.js");

const samplePayload = {
    event_name: "CompleteRegistration",
    event_id: "evt_123",
    event_time: 1_700_000_000,
    action_source: "website",
    user_data: { em: ["abc"], external_id: ["xyz"] },
} as const;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("dispatchMetaCapiEvent — MISSING_CREDENTIALS is failure, not skip", () => {
    it("returns failed (skipped=false) so admin retry can recover after creds land", async () => {
        mockGetMarketingConfig.mockResolvedValue({
            metaCapiEnabled: true,
            metaCapiDryRun: false,
            metaPixelId: null,
            metaAccessToken: null,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await dispatchMetaCapiEvent(samplePayload as any);

        expect(result.delivered).toBe(false);
        expect(result.skipped).toBe(false);
        expect(result.errorCode).toBe("MISSING_CREDENTIALS");
        expect(result.errorMessage).toBeDefined();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("DRY_RUN remains a deliberate skip (terminal)", async () => {
        mockGetMarketingConfig.mockResolvedValue({
            metaCapiEnabled: true,
            metaCapiDryRun: true,
            metaPixelId: "999",
            metaAccessToken: "tok",
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await dispatchMetaCapiEvent(samplePayload as any);

        expect(result.skipped).toBe(true);
        expect(result.errorCode).toBe("DRY_RUN");
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("DISABLED_BY_ENV remains a deliberate skip", async () => {
        mockGetMarketingConfig.mockResolvedValue({
            metaCapiEnabled: false,
            metaCapiDryRun: false,
            metaPixelId: "999",
            metaAccessToken: "tok",
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await dispatchMetaCapiEvent(samplePayload as any);

        expect(result.skipped).toBe(true);
        expect(result.errorCode).toBe("DISABLED_BY_ENV");
    });

    it("HTTP non-2xx is a hard failure (retried by worker)", async () => {
        mockGetMarketingConfig.mockResolvedValue({
            metaCapiEnabled: true,
            metaCapiDryRun: false,
            metaPixelId: "999",
            metaAccessToken: "tok",
        });
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: { message: "boom" } }),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await dispatchMetaCapiEvent(samplePayload as any);

        expect(result.delivered).toBe(false);
        expect(result.skipped).toBe(false);
        expect(result.errorCode).toBe("HTTP_500");
    });

    it("happy path: delivered=true on 2xx", async () => {
        mockGetMarketingConfig.mockResolvedValue({
            metaCapiEnabled: true,
            metaCapiDryRun: false,
            metaPixelId: "999",
            metaAccessToken: "tok",
        });
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ events_received: 1 }),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await dispatchMetaCapiEvent(samplePayload as any);

        expect(result.delivered).toBe(true);
        expect(result.skipped).toBe(false);
        expect(result.statusCode).toBe(200);
    });
});
