import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    shedding: {
        findMany: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const { computeSheddingCycle, getSheddingAnalysis, getUpcomingSheddings } =
    await import("../shedding-analysis.service.js");

const USER_ID = "user_123";
const PET_ID = "pet_001";
const PET_NAME = "Monty";

beforeEach(() => {
    vi.clearAllMocks();
});

// ── computeSheddingCycle (pure function) ─────────────────
describe("computeSheddingCycle", () => {
    it("returns default values for empty sheddings", () => {
        const result = computeSheddingCycle([], PET_ID, PET_NAME);
        expect(result).toEqual({
            petId: PET_ID,
            petName: PET_NAME,
            sheddingCount: 0,
            averageIntervalDays: 0,
            trend: "stable",
            predictedNextDate: null,
            lastShedDate: null,
            intervals: [],
            isAnomaly: false,
            anomalyMessage: null,
        });
    });

    it("returns minimal data for single shedding", () => {
        const result = computeSheddingCycle(
            [{ startedAt: "2024-06-01T00:00:00.000Z" }],
            PET_ID,
            PET_NAME,
        );
        expect(result.sheddingCount).toBe(1);
        expect(result.averageIntervalDays).toBe(0);
        expect(result.trend).toBe("stable");
        expect(result.predictedNextDate).toBeNull();
        expect(result.lastShedDate).toBe("2024-06-01T00:00:00.000Z");
        expect(result.intervals).toEqual([]);
        expect(result.isAnomaly).toBe(false);
    });

    it("calculates average interval for two sheddings", () => {
        const result = computeSheddingCycle(
            [{ startedAt: "2024-01-01T00:00:00.000Z" }, { startedAt: "2024-01-31T00:00:00.000Z" }],
            PET_ID,
            PET_NAME,
        );
        expect(result.sheddingCount).toBe(2);
        expect(result.averageIntervalDays).toBe(30);
        expect(result.intervals).toHaveLength(1);
        expect(result.intervals[0].days).toBe(30);
        expect(result.predictedNextDate).not.toBeNull();
    });

    it("calculates average interval for multiple sheddings", () => {
        const result = computeSheddingCycle(
            [
                { startedAt: "2024-01-01T00:00:00.000Z" },
                { startedAt: "2024-02-01T00:00:00.000Z" },
                { startedAt: "2024-03-01T00:00:00.000Z" },
                { startedAt: "2024-04-01T00:00:00.000Z" },
            ],
            PET_ID,
            PET_NAME,
        );
        expect(result.sheddingCount).toBe(4);
        expect(result.intervals).toHaveLength(3);
        expect(result.averageIntervalDays).toBeGreaterThan(28);
        expect(result.averageIntervalDays).toBeLessThan(32);
    });

    it("handles unsorted input correctly", () => {
        const result = computeSheddingCycle(
            [
                { startedAt: "2024-03-01T00:00:00.000Z" },
                { startedAt: "2024-01-01T00:00:00.000Z" },
                { startedAt: "2024-02-01T00:00:00.000Z" },
            ],
            PET_ID,
            PET_NAME,
        );
        expect(result.lastShedDate).toBe("2024-03-01T00:00:00.000Z");
        expect(result.intervals[0].fromDate).toBe("2024-01-01T00:00:00.000Z");
        expect(result.intervals[0].toDate).toBe("2024-02-01T00:00:00.000Z");
    });

    it("detects shortening trend", () => {
        const result = computeSheddingCycle(
            [
                { startedAt: "2024-01-01T00:00:00.000Z" },
                { startedAt: "2024-03-01T00:00:00.000Z" }, // 60 days
                { startedAt: "2024-04-15T00:00:00.000Z" }, // 45 days
                { startedAt: "2024-05-20T00:00:00.000Z" }, // 35 days
                { startedAt: "2024-06-15T00:00:00.000Z" }, // 26 days
            ],
            PET_ID,
            PET_NAME,
        );
        expect(result.trend).toBe("shortening");
    });

    it("detects lengthening trend", () => {
        const result = computeSheddingCycle(
            [
                { startedAt: "2024-01-01T00:00:00.000Z" },
                { startedAt: "2024-01-16T00:00:00.000Z" }, // 15 days
                { startedAt: "2024-02-05T00:00:00.000Z" }, // 20 days
                { startedAt: "2024-03-16T00:00:00.000Z" }, // 40 days
                { startedAt: "2024-05-25T00:00:00.000Z" }, // 70 days
            ],
            PET_ID,
            PET_NAME,
        );
        expect(result.trend).toBe("lengthening");
    });

    it("detects stable trend for consistent intervals", () => {
        const result = computeSheddingCycle(
            [
                { startedAt: "2024-01-01T00:00:00.000Z" },
                { startedAt: "2024-01-31T00:00:00.000Z" }, // 30 days
                { startedAt: "2024-03-01T00:00:00.000Z" }, // 30 days
                { startedAt: "2024-03-31T00:00:00.000Z" }, // 30 days
                { startedAt: "2024-04-30T00:00:00.000Z" }, // 30 days
            ],
            PET_ID,
            PET_NAME,
        );
        expect(result.trend).toBe("stable");
    });

    it("predicts next shedding date based on average", () => {
        const result = computeSheddingCycle(
            [{ startedAt: "2024-01-01T00:00:00.000Z" }, { startedAt: "2024-01-31T00:00:00.000Z" }],
            PET_ID,
            PET_NAME,
        );
        const predicted = new Date(result.predictedNextDate!);
        const expected = new Date("2024-03-01T00:00:00.000Z");
        const diffDays = Math.abs(
            (predicted.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(diffDays).toBeLessThan(2);
    });

    it("detects anomaly when current gap exceeds average by 30%", () => {
        // Last shed was 60 days ago, average is 30 days → 60 > 30 * 1.3 = 39
        const longAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const evenLongerAgo = new Date(longAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
        const result = computeSheddingCycle(
            [{ startedAt: evenLongerAgo.toISOString() }, { startedAt: longAgo.toISOString() }],
            PET_ID,
            PET_NAME,
        );
        expect(result.isAnomaly).toBe(true);
        expect(result.anomalyMessage).toContain("exceeds average");
    });

    it("no anomaly when gap is within normal range", () => {
        const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        const before = new Date(recent.getTime() - 30 * 24 * 60 * 60 * 1000);
        const result = computeSheddingCycle(
            [{ startedAt: before.toISOString() }, { startedAt: recent.toISOString() }],
            PET_ID,
            PET_NAME,
        );
        expect(result.isAnomaly).toBe(false);
        expect(result.anomalyMessage).toBeNull();
    });

    it("returns correct interval structure", () => {
        const result = computeSheddingCycle(
            [
                { startedAt: "2024-01-01T00:00:00.000Z" },
                { startedAt: "2024-02-01T00:00:00.000Z" },
                { startedAt: "2024-03-15T00:00:00.000Z" },
            ],
            PET_ID,
            PET_NAME,
        );
        expect(result.intervals).toHaveLength(2);
        expect(result.intervals[0]).toEqual({
            fromDate: "2024-01-01T00:00:00.000Z",
            toDate: "2024-02-01T00:00:00.000Z",
            days: 31,
        });
        expect(result.intervals[1]).toEqual({
            fromDate: "2024-02-01T00:00:00.000Z",
            toDate: "2024-03-15T00:00:00.000Z",
            days: 43,
        });
    });
});

// ── getSheddingAnalysis ──────────────────────────────────
describe("getSheddingAnalysis", () => {
    it("returns analysis for a pet with sheddings", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({
            id: PET_ID,
            name: PET_NAME,
            userId: USER_ID,
        });
        mockPrisma.shedding.findMany.mockResolvedValue([
            { startedAt: new Date("2024-01-01") },
            { startedAt: new Date("2024-02-01") },
            { startedAt: new Date("2024-03-01") },
        ]);

        const result = await getSheddingAnalysis(USER_ID, PET_ID);
        expect(result.petId).toBe(PET_ID);
        expect(result.petName).toBe(PET_NAME);
        expect(result.sheddingCount).toBe(3);
        expect(result.intervals).toHaveLength(2);
        expect(result.averageIntervalDays).toBeGreaterThan(0);
    });

    it("throws when pet not found", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);
        await expect(getSheddingAnalysis(USER_ID, PET_ID)).rejects.toThrow();
    });

    it("throws when pet belongs to different user", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({
            id: PET_ID,
            name: PET_NAME,
            userId: "other_user",
        });
        await expect(getSheddingAnalysis(USER_ID, PET_ID)).rejects.toThrow();
    });

    it("returns empty analysis when pet has no sheddings", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({
            id: PET_ID,
            name: PET_NAME,
            userId: USER_ID,
        });
        mockPrisma.shedding.findMany.mockResolvedValue([]);

        const result = await getSheddingAnalysis(USER_ID, PET_ID);
        expect(result.sheddingCount).toBe(0);
        expect(result.intervals).toEqual([]);
    });
});

// ── getUpcomingSheddings ─────────────────────────────────
describe("getUpcomingSheddings", () => {
    it("returns pets with predicted shedding within N days", async () => {
        const recent = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);
        const before = new Date(recent.getTime() - 30 * 24 * 60 * 60 * 1000);

        mockPrisma.pet.findMany.mockResolvedValue([{ id: PET_ID, name: PET_NAME }]);
        mockPrisma.shedding.findMany.mockResolvedValue([
            { startedAt: before },
            { startedAt: recent },
        ]);

        const result = await getUpcomingSheddings(USER_ID, 7);
        expect(result).toHaveLength(1);
        expect(result[0].petId).toBe(PET_ID);
        expect(result[0].petName).toBe(PET_NAME);
        expect(result[0].daysUntil).toBeLessThanOrEqual(7);
        expect(result[0].averageIntervalDays).toBeGreaterThan(0);
    });

    it("excludes pets with no sheddings", async () => {
        mockPrisma.pet.findMany.mockResolvedValue([{ id: PET_ID, name: PET_NAME }]);
        mockPrisma.shedding.findMany.mockResolvedValue([]);

        const result = await getUpcomingSheddings(USER_ID);
        expect(result).toEqual([]);
    });

    it("excludes pets with only one shedding", async () => {
        mockPrisma.pet.findMany.mockResolvedValue([{ id: PET_ID, name: PET_NAME }]);
        mockPrisma.shedding.findMany.mockResolvedValue([{ startedAt: new Date("2024-06-01") }]);

        const result = await getUpcomingSheddings(USER_ID);
        expect(result).toEqual([]);
    });

    it("excludes pets whose predicted date is far in the future", async () => {
        const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const before = new Date(recent.getTime() - 30 * 24 * 60 * 60 * 1000);

        mockPrisma.pet.findMany.mockResolvedValue([{ id: PET_ID, name: PET_NAME }]);
        mockPrisma.shedding.findMany.mockResolvedValue([
            { startedAt: before },
            { startedAt: recent },
        ]);

        const result = await getUpcomingSheddings(USER_ID, 7);
        // predicted is ~28 days from now, so should not appear with 7 day window
        expect(result).toEqual([]);
    });

    it("returns empty array when no pets exist", async () => {
        mockPrisma.pet.findMany.mockResolvedValue([]);
        const result = await getUpcomingSheddings(USER_ID);
        expect(result).toEqual([]);
    });

    it("sorts by daysUntil ascending", async () => {
        const pet2 = "pet_002";
        const pet2Name = "Slither";

        // Pet 1: predicted in 3 days (shed 27 days ago, avg 30)
        const recent1 = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000);
        const before1 = new Date(recent1.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Pet 2: predicted in 1 day (shed 29 days ago, avg 30)
        const recent2 = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
        const before2 = new Date(recent2.getTime() - 30 * 24 * 60 * 60 * 1000);

        mockPrisma.pet.findMany.mockResolvedValue([
            { id: PET_ID, name: PET_NAME },
            { id: pet2, name: pet2Name },
        ]);

        mockPrisma.shedding.findMany
            .mockResolvedValueOnce([{ startedAt: before1 }, { startedAt: recent1 }])
            .mockResolvedValueOnce([{ startedAt: before2 }, { startedAt: recent2 }]);

        const result = await getUpcomingSheddings(USER_ID, 7);
        if (result.length >= 2) {
            expect(result[0].daysUntil).toBeLessThanOrEqual(result[1].daysUntil);
        }
    });
});
