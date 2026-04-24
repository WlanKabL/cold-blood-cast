import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    marketingEvent: {
        findMany: vi.fn(),
    },
};

const mockQueue = {
    add: vi.fn(),
    remove: vi.fn(),
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

vi.mock("@/config/env.js", () => ({
    env: () => ({
        TRACKING_PENDING_RESCUE_AFTER_SECONDS: 120,
        TRACKING_MAX_RETRY_COUNT: 5,
        TRACKING_RETRY_BASE_DELAY_MS: 5000,
    }),
}));

vi.mock("@/config/redis.js", () => ({ getRedis: () => ({}) }));

vi.mock("bullmq", () => {
    class Queue {
        constructor() {
            return mockQueue;
        }
    }
    class Worker {
        on() {}
        async close() {}
    }
    return { Queue, Worker };
});

vi.mock("../meta-capi.service.js", () => ({ dispatchMetaCapiEvent: vi.fn() }));

const { rescueStuckPendingEvents } = await import("../marketing.queue.js");

beforeEach(() => {
    vi.clearAllMocks();
    mockQueue.add.mockResolvedValue(undefined);
    mockQueue.remove.mockResolvedValue(undefined);
});

describe("rescueStuckPendingEvents", () => {
    it("re-enqueues stuck server events older than the threshold", async () => {
        mockPrisma.marketingEvent.findMany.mockResolvedValue([
            { id: "ev-a", attemptCount: 0 },
            { id: "ev-b", attemptCount: 0 },
        ]);

        const result = await rescueStuckPendingEvents();

        expect(result).toEqual({ scanned: 2, reEnqueued: 2, skipped: 0 });
        expect(mockQueue.remove).toHaveBeenCalledTimes(2);
        expect(mockQueue.add).toHaveBeenCalledTimes(2);
        expect(mockQueue.add).toHaveBeenCalledWith(
            "dispatch",
            { marketingEventId: "ev-a" },
            { jobId: "ev-a" },
        );

        // Filter must scope to status=pending + eventSource=server + age > cutoff
        const where = mockPrisma.marketingEvent.findMany.mock.calls[0][0].where;
        expect(where.status).toBe("pending");
        expect(where.eventSource).toBe("server");
        expect(where.createdAt.lt).toBeInstanceOf(Date);
    });

    it("idempotent: jobId equals marketing event id (BullMQ dedupe)", async () => {
        mockPrisma.marketingEvent.findMany.mockResolvedValue([{ id: "ev-1", attemptCount: 0 }]);

        await rescueStuckPendingEvents();

        const call = mockQueue.add.mock.calls[0];
        expect(call[2]).toEqual({ jobId: "ev-1" });
    });

    it("returns empty result when nothing is stuck", async () => {
        mockPrisma.marketingEvent.findMany.mockResolvedValue([]);

        const result = await rescueStuckPendingEvents();

        expect(result).toEqual({ scanned: 0, reEnqueued: 0, skipped: 0 });
        expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it("counts skipped when add() throws but does not abort the sweep", async () => {
        mockPrisma.marketingEvent.findMany.mockResolvedValue([
            { id: "ev-a", attemptCount: 0 },
            { id: "ev-b", attemptCount: 0 },
        ]);
        mockQueue.add
            .mockRejectedValueOnce(new Error("redis ping failed"))
            .mockResolvedValueOnce(undefined);

        const result = await rescueStuckPendingEvents();

        expect(result).toEqual({ scanned: 2, reEnqueued: 1, skipped: 1 });
    });

    it("respects custom olderThanSeconds and limit", async () => {
        mockPrisma.marketingEvent.findMany.mockResolvedValue([]);

        await rescueStuckPendingEvents({ olderThanSeconds: 30, limit: 10 });

        const args = mockPrisma.marketingEvent.findMany.mock.calls[0][0];
        expect(args.take).toBe(10);
        const cutoff = args.where.createdAt.lt as Date;
        const ageMs = Date.now() - cutoff.getTime();
        expect(ageMs).toBeGreaterThanOrEqual(30_000 - 200);
        expect(ageMs).toBeLessThanOrEqual(30_000 + 1_000);
    });
});
