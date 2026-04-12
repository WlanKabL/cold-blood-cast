import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBerlinDayInfo, hasJobRunToday, logJobRun } from "../scheduler.js";

vi.mock("@/config/database.js", () => ({
    prisma: {
        cronJobLog: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
    },
}));

import { prisma } from "@/config/database.js";

const mockFindFirst = vi.mocked(prisma.cronJobLog.findFirst);
const mockCreate = vi.mocked(prisma.cronJobLog.create);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getBerlinDayInfo", () => {
    it("returns dateStr in YYYY-MM-DD format", () => {
        const result = getBerlinDayInfo(new Date("2025-06-15T12:00:00Z"));
        expect(result.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns correct hour for Berlin timezone", () => {
        // 12:00 UTC in summer (CEST) = 14:00 Berlin
        const result = getBerlinDayInfo(new Date("2025-06-15T12:00:00Z"));
        expect(result.hour).toBe(14);
    });

    it("returns correct dayOfWeek (Sunday = 0)", () => {
        // June 15, 2025 is a Sunday
        const result = getBerlinDayInfo(new Date("2025-06-15T12:00:00Z"));
        expect(result.dayOfWeek).toBe(0);
    });

    it("returns correct dayOfWeek (Monday = 1)", () => {
        // June 16, 2025 is a Monday
        const result = getBerlinDayInfo(new Date("2025-06-16T12:00:00Z"));
        expect(result.dayOfWeek).toBe(1);
    });

    it("handles winter time (CET = UTC+1)", () => {
        // 02:00 UTC in January (CET) = 03:00 Berlin
        const result = getBerlinDayInfo(new Date("2025-01-15T02:00:00Z"));
        expect(result.hour).toBe(3);
    });

    it("handles midnight boundary correctly", () => {
        // 23:30 UTC in summer (CEST) = 01:30 next day Berlin
        const result = getBerlinDayInfo(new Date("2025-06-15T23:30:00Z"));
        expect(result.hour).toBe(1);
        expect(result.dateStr).toBe("2025-06-16");
    });
});

describe("hasJobRunToday", () => {
    it("returns true when a log entry exists for today", async () => {
        mockFindFirst.mockResolvedValue({ id: "1" } as never);

        const result = await hasJobRunToday("maintenance", "2025-06-15");

        expect(result).toBe(true);
        expect(mockFindFirst).toHaveBeenCalledWith({
            where: {
                jobName: "maintenance",
                startedAt: {
                    gte: new Date("2025-06-15T00:00:00.000Z"),
                    lte: new Date("2025-06-15T23:59:59.999Z"),
                },
            },
        });
    });

    it("returns false when no log entry exists for today", async () => {
        mockFindFirst.mockResolvedValue(null);

        const result = await hasJobRunToday("feeding-reminders", "2025-06-15");

        expect(result).toBe(false);
    });
});

describe("logJobRun", () => {
    it("creates a success log entry", async () => {
        mockCreate.mockResolvedValue({} as never);

        const startedAt = new Date("2025-06-15T08:00:00Z");
        await logJobRun("feeding-reminders", "success", startedAt, { emailsSent: 3 });

        expect(mockCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                jobName: "feeding-reminders",
                status: "success",
                startedAt,
                details: { emailsSent: 3 },
            }),
        });
    });

    it("creates an error log entry", async () => {
        mockCreate.mockResolvedValue({} as never);

        const startedAt = new Date("2025-06-15T03:00:00Z");
        await logJobRun("maintenance", "error", startedAt, undefined, "Connection failed");

        expect(mockCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                jobName: "maintenance",
                status: "error",
                startedAt,
                error: "Connection failed",
            }),
        });
    });

    it("sets endedAt to current time", async () => {
        mockCreate.mockResolvedValue({} as never);

        const before = new Date();
        await logJobRun("weekly-planner", "success", new Date());
        const after = new Date();

        const callData = mockCreate.mock.calls[0]![0].data;
        expect(new Date(callData.endedAt as string).getTime()).toBeGreaterThanOrEqual(
            before.getTime(),
        );
        expect(new Date(callData.endedAt as string).getTime()).toBeLessThanOrEqual(after.getTime());
    });
});
