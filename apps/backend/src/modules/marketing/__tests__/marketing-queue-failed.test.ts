import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    marketingEvent: {
        update: vi.fn().mockResolvedValue({}),
    },
};

interface FailedHandler {
    (job: { id?: string; opts?: { attempts?: number }; attemptsMade?: number; data?: unknown } | undefined, err: Error): void;
}

let capturedFailedHandler: FailedHandler | null = null;

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
            return { add: vi.fn(), remove: vi.fn(), close: vi.fn() };
        }
    }
    class Worker {
        on(event: string, handler: FailedHandler) {
            if (event === "failed") capturedFailedHandler = handler;
        }
        async close() {}
    }
    return { Queue, Worker };
});

vi.mock("../meta-capi.service.js", () => ({ dispatchMetaCapiEvent: vi.fn() }));

const { startMarketingWorker } = await import("../marketing.queue.js");

beforeEach(() => {
    mockPrisma.marketingEvent.update.mockClear();
});

describe("worker `failed` listener — terminal failure transition", () => {
    it("marks the row as `failed` after BullMQ exhausts retries", async () => {
        startMarketingWorker();
        expect(capturedFailedHandler).toBeTruthy();

        capturedFailedHandler!(
            {
                id: "ev-x",
                opts: { attempts: 5 },
                attemptsMade: 5,
                data: { marketingEventId: "ev-x" },
            },
            new Error("Meta CAPI dispatch failed: HTTP_500"),
        );

        // wait a tick for the fire-and-forget update
        await new Promise((r) => setTimeout(r, 0));

        expect(mockPrisma.marketingEvent.update).toHaveBeenCalledWith({
            where: { id: "ev-x" },
            data: {
                status: "failed",
                failureReason: "Meta CAPI dispatch failed: HTTP_500",
            },
        });
    });

    it("does NOT mark `failed` while retries remain", async () => {
        startMarketingWorker();

        capturedFailedHandler!(
            {
                id: "ev-y",
                opts: { attempts: 5 },
                attemptsMade: 2,
                data: { marketingEventId: "ev-y" },
            },
            new Error("transient"),
        );

        await new Promise((r) => setTimeout(r, 0));
        expect(mockPrisma.marketingEvent.update).not.toHaveBeenCalled();
    });

    it("is a no-op when job/data is missing", async () => {
        startMarketingWorker();
        capturedFailedHandler!(undefined, new Error("nope"));
        await new Promise((r) => setTimeout(r, 0));
        expect(mockPrisma.marketingEvent.update).not.toHaveBeenCalled();
    });
});
