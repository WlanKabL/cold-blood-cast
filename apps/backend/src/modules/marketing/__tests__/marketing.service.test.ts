import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    landingAttribution: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
    },
    userAttribution: {
        create: vi.fn(),
    },
    marketingEvent: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
};

const mockGetMarketingConfig = vi.fn();
const mockEnqueue = vi.fn();

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));
vi.mock("@/config/env.js", () => ({
    env: () => ({ TRACKING_ATTRIBUTION_TTL_DAYS: 90 }),
}));
vi.mock("../marketing-config.service.js", () => ({
    getMarketingConfig: mockGetMarketingConfig,
}));
vi.mock("../marketing.queue.js", () => ({
    enqueueMarketingEventDispatch: mockEnqueue,
}));

const { recordRegistrationEvent } = await import("../marketing.service.js");

const baseCtx = {
    userId: "user-1",
    userEmail: "alice@example.com",
    consentState: "granted" as const,
    landingSessionId: null,
    requestIp: null,
    requestUserAgent: null,
};

const fullPixelConfig = {
    metaPixelEnabled: true,
    metaPixelId: "9999",
    metaCapiEnabled: true,
    metaCapiDryRun: false,
    metaTestEventCode: null,
    activationWindowDays: 7,
    metaAccessToken: "tok",
    overrides: {},
};

beforeEach(() => {
    vi.clearAllMocks();
    mockGetMarketingConfig.mockResolvedValue(fullPixelConfig);
    mockPrisma.marketingEvent.findFirst.mockResolvedValue(null);
    mockPrisma.marketingEvent.create.mockImplementation(async ({ data }) => ({
        id: `me-${data.eventSource}`,
        ...data,
    }));
});

describe("recordRegistrationEvent — idempotency", () => {
    it("does not create duplicate rows when called twice for the same user", async () => {
        // First call: nothing exists yet.
        const first = await recordRegistrationEvent(baseCtx);
        expect(mockPrisma.marketingEvent.create).toHaveBeenCalledTimes(2); // server + browser
        expect(mockEnqueue).toHaveBeenCalledTimes(1);

        // Second call: server row exists → must short-circuit before any create.
        vi.clearAllMocks();
        mockGetMarketingConfig.mockResolvedValue(fullPixelConfig);
        mockPrisma.marketingEvent.findFirst.mockResolvedValueOnce({
            id: "me-server-prior",
            status: "pending",
        });

        const second = await recordRegistrationEvent(baseCtx);

        expect(second.eventId).toBe(first.eventId);
        expect(second.eventName).toBe("CompleteRegistration");
        expect(mockPrisma.marketingEvent.create).not.toHaveBeenCalled();
        expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it("survives a P2002 unique-violation on the browser audit row", async () => {
        const p2002 = Object.assign(new Error("Unique constraint failed"), {
            code: "P2002",
            // mark as PrismaClientKnownRequestError instance via prototype shim
        });
        // make instanceof check pass
        const { Prisma } = await import("@prisma/client");
        Object.setPrototypeOf(p2002, Prisma.PrismaClientKnownRequestError.prototype);

        mockPrisma.marketingEvent.create
            .mockResolvedValueOnce({ id: "server-ok" }) // server row succeeds
            .mockRejectedValueOnce(p2002); // browser row already exists

        await expect(recordRegistrationEvent(baseCtx)).resolves.toMatchObject({
            eventName: "CompleteRegistration",
        });
    });
});

describe("recordRegistrationEvent — truthful pixel gating", () => {
    it("browserDispatchAllowed=false when Pixel is enabled but ID missing", async () => {
        mockGetMarketingConfig.mockResolvedValue({
            ...fullPixelConfig,
            metaPixelId: null,
        });

        const result = await recordRegistrationEvent(baseCtx);

        expect(result.browserDispatchAllowed).toBe(false);

        // browser audit row should be marked skipped with `pixel_id_missing`
        const browserCall = mockPrisma.marketingEvent.create.mock.calls.find(
            (c) => c[0].data.eventSource === "browser",
        );
        expect(browserCall?.[0].data.status).toBe("skipped");
        expect(browserCall?.[0].data.failureReason).toBe("pixel_id_missing");
    });

    it("browserDispatchAllowed=true when Pixel + ID + consent are all present", async () => {
        const result = await recordRegistrationEvent(baseCtx);
        expect(result.browserDispatchAllowed).toBe(true);
    });
});
