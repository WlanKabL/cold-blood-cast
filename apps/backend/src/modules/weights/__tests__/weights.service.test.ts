import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: {
        findUnique: vi.fn(),
    },
    weightRecord: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const {
    getWeightChartData,
    computeGrowthRate,
    getGrowthRates,
    listWeightRecords,
    getWeightRecord,
    createWeightRecord,
    updateWeightRecord,
    deleteWeightRecord,
} = await import("../weights.service.js");

const USER_ID = "user_123";
const PET_ID_1 = "pet_001";
const PET_ID_2 = "pet_002";

function makeRecord(overrides: Record<string, unknown> = {}) {
    return {
        id: "wr_1",
        petId: PET_ID_1,
        weightGrams: 250,
        measuredAt: new Date("2024-06-01"),
        notes: null,
        pet: { id: PET_ID_1, name: "Monty" },
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ── computeGrowthRate (pure function) ────────────────────
describe("computeGrowthRate", () => {
    it("returns default values for empty points", () => {
        const result = computeGrowthRate([], PET_ID_1, "Monty");
        expect(result).toEqual({
            petId: PET_ID_1,
            petName: "Monty",
            firstRecord: null,
            latestRecord: null,
            totalGainGrams: 0,
            avgGramsPerMonth: 0,
            trend: "stable",
            recordCount: 0,
        });
    });

    it("returns stable trend for single record", () => {
        const result = computeGrowthRate(
            [{ date: "2024-06-01T00:00:00.000Z", weightGrams: 250 }],
            PET_ID_1,
            "Monty",
        );
        expect(result.recordCount).toBe(1);
        expect(result.totalGainGrams).toBe(0);
        expect(result.avgGramsPerMonth).toBe(0);
        expect(result.trend).toBe("stable");
        expect(result.firstRecord).toEqual({ date: "2024-06-01T00:00:00.000Z", weightGrams: 250 });
        expect(result.latestRecord).toEqual({ date: "2024-06-01T00:00:00.000Z", weightGrams: 250 });
    });

    it("calculates upward trend correctly", () => {
        const points = [
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 100 },
            { date: "2024-02-01T00:00:00.000Z", weightGrams: 150 },
            { date: "2024-03-01T00:00:00.000Z", weightGrams: 200 },
            { date: "2024-04-01T00:00:00.000Z", weightGrams: 250 },
        ];
        const result = computeGrowthRate(points, PET_ID_1, "Monty");
        expect(result.trend).toBe("up");
        expect(result.totalGainGrams).toBe(150);
        expect(result.avgGramsPerMonth).toBeGreaterThan(0);
        expect(result.recordCount).toBe(4);
    });

    it("calculates downward trend correctly", () => {
        const points = [
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 300 },
            { date: "2024-02-01T00:00:00.000Z", weightGrams: 280 },
            { date: "2024-03-01T00:00:00.000Z", weightGrams: 260 },
        ];
        const result = computeGrowthRate(points, PET_ID_1, "Monty");
        expect(result.trend).toBe("down");
        expect(result.totalGainGrams).toBe(-40);
    });

    it("calculates stable trend for minimal change", () => {
        const points = [
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 250 },
            { date: "2024-02-01T00:00:00.000Z", weightGrams: 250 },
            { date: "2024-03-01T00:00:00.000Z", weightGrams: 251 },
        ];
        const result = computeGrowthRate(points, PET_ID_1, "Monty");
        expect(result.trend).toBe("stable");
    });

    it("handles unsorted input correctly", () => {
        const points = [
            { date: "2024-03-01T00:00:00.000Z", weightGrams: 300 },
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 200 },
            { date: "2024-02-01T00:00:00.000Z", weightGrams: 250 },
        ];
        const result = computeGrowthRate(points, PET_ID_1, "Monty");
        expect(result.firstRecord!.weightGrams).toBe(200);
        expect(result.latestRecord!.weightGrams).toBe(300);
        expect(result.totalGainGrams).toBe(100);
    });

    it("uses last 3 records for trend calculation", () => {
        const points = [
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 100 },
            { date: "2024-02-01T00:00:00.000Z", weightGrams: 200 },
            { date: "2024-03-01T00:00:00.000Z", weightGrams: 300 },
            { date: "2024-04-01T00:00:00.000Z", weightGrams: 280 },
            { date: "2024-05-01T00:00:00.000Z", weightGrams: 260 },
        ];
        const result = computeGrowthRate(points, PET_ID_1, "Monty");
        expect(result.trend).toBe("down");
        expect(result.totalGainGrams).toBe(160);
    });

    it("calculates avgGramsPerMonth accurately over 3 months", () => {
        const points = [
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 100 },
            { date: "2024-04-01T00:00:00.000Z", weightGrams: 400 },
        ];
        const result = computeGrowthRate(points, PET_ID_1, "Monty");
        expect(result.avgGramsPerMonth).toBeGreaterThan(95);
        expect(result.avgGramsPerMonth).toBeLessThan(105);
    });
});

// ── getWeightChartData ───────────────────────────────────
describe("getWeightChartData", () => {
    it("returns grouped chart data for multiple pets", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([
            makeRecord({
                id: "wr_1",
                petId: PET_ID_1,
                weightGrams: 200,
                measuredAt: new Date("2024-01-01"),
            }),
            makeRecord({
                id: "wr_2",
                petId: PET_ID_1,
                weightGrams: 250,
                measuredAt: new Date("2024-02-01"),
            }),
            makeRecord({
                id: "wr_3",
                petId: PET_ID_2,
                weightGrams: 300,
                measuredAt: new Date("2024-01-15"),
                pet: { id: PET_ID_2, name: "Slinky" },
            }),
        ]);

        const result = await getWeightChartData(USER_ID, { petIds: [PET_ID_1, PET_ID_2] });
        expect(result).toHaveLength(2);

        const monty = result.find((r) => r.petId === PET_ID_1);
        expect(monty).toBeDefined();
        expect(monty!.petName).toBe("Monty");
        expect(monty!.points).toHaveLength(2);

        const slinky = result.find((r) => r.petId === PET_ID_2);
        expect(slinky).toBeDefined();
        expect(slinky!.petName).toBe("Slinky");
        expect(slinky!.points).toHaveLength(1);
    });

    it("passes date filters to prisma query", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        const from = new Date("2024-01-01");
        const to = new Date("2024-06-01");

        await getWeightChartData(USER_ID, { petIds: [PET_ID_1], from, to });
        expect(mockPrisma.weightRecord.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    measuredAt: { gte: from, lte: to },
                }),
            }),
        );
    });

    it("returns empty array when no records exist", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        const result = await getWeightChartData(USER_ID, { petIds: [PET_ID_1] });
        expect(result).toEqual([]);
    });

    it("orders results ascending by measuredAt", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        await getWeightChartData(USER_ID, { petIds: [PET_ID_1] });
        expect(mockPrisma.weightRecord.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { measuredAt: "asc" },
            }),
        );
    });

    it("does not add date filter when from/to are not provided", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        await getWeightChartData(USER_ID, { petIds: [PET_ID_1] });

        const callArg = mockPrisma.weightRecord.findMany.mock.calls[0][0];
        expect(callArg.where.measuredAt).toBeUndefined();
    });
});

// ── getGrowthRates ───────────────────────────────────────
describe("getGrowthRates", () => {
    it("computes growth rates for all pets", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([
            makeRecord({
                id: "wr_1",
                petId: PET_ID_1,
                weightGrams: 100,
                measuredAt: new Date("2024-01-01"),
            }),
            makeRecord({
                id: "wr_2",
                petId: PET_ID_1,
                weightGrams: 200,
                measuredAt: new Date("2024-04-01"),
            }),
            makeRecord({
                id: "wr_3",
                petId: PET_ID_2,
                weightGrams: 300,
                measuredAt: new Date("2024-01-01"),
                pet: { id: PET_ID_2, name: "Slinky" },
            }),
        ]);

        const result = await getGrowthRates(USER_ID);
        expect(result).toHaveLength(2);

        const monty = result.find((r) => r.petId === PET_ID_1);
        expect(monty!.totalGainGrams).toBe(100);
        expect(monty!.recordCount).toBe(2);

        const slinky = result.find((r) => r.petId === PET_ID_2);
        expect(slinky!.recordCount).toBe(1);
        expect(slinky!.totalGainGrams).toBe(0);
    });

    it("filters by petIds when provided", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        await getGrowthRates(USER_ID, [PET_ID_1]);
        expect(mockPrisma.weightRecord.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { pet: { userId: USER_ID }, petId: { in: [PET_ID_1] } },
            }),
        );
    });

    it("returns empty array when no records exist", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        const result = await getGrowthRates(USER_ID);
        expect(result).toEqual([]);
    });
});

// ── CRUD operations ──────────────────────────────────────
describe("listWeightRecords", () => {
    it("calls prisma with correct filters", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        await listWeightRecords(USER_ID, { petId: PET_ID_1, limit: 10 });

        expect(mockPrisma.weightRecord.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    pet: { userId: USER_ID },
                    petId: PET_ID_1,
                }),
                take: 11,
                orderBy: { measuredAt: "desc" },
            }),
        );
    });

    it("omits petId filter when not provided", async () => {
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        await listWeightRecords(USER_ID, { limit: 50 });

        const callArg = mockPrisma.weightRecord.findMany.mock.calls[0][0];
        expect(callArg.where.petId).toBeUndefined();
    });
});

describe("getWeightRecord", () => {
    it("returns record when found and owned by user", async () => {
        const record = makeRecord({ pet: { id: PET_ID_1, name: "Monty", userId: USER_ID } });
        mockPrisma.weightRecord.findUnique.mockResolvedValue(record);

        const result = await getWeightRecord("wr_1", USER_ID);
        expect(result).toEqual(record);
    });

    it("throws when record not found", async () => {
        mockPrisma.weightRecord.findUnique.mockResolvedValue(null);
        await expect(getWeightRecord("wr_999", USER_ID)).rejects.toThrow("Weight record not found");
    });

    it("throws when record belongs to different user", async () => {
        const record = makeRecord({ pet: { id: PET_ID_1, name: "Monty", userId: "other_user" } });
        mockPrisma.weightRecord.findUnique.mockResolvedValue(record);
        await expect(getWeightRecord("wr_1", USER_ID)).rejects.toThrow("Weight record not found");
    });
});

describe("createWeightRecord", () => {
    it("creates record when pet is owned by user", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: PET_ID_1, userId: USER_ID });
        mockPrisma.weightRecord.create.mockResolvedValue(makeRecord());

        const result = await createWeightRecord(USER_ID, {
            petId: PET_ID_1,
            measuredAt: new Date("2024-06-01"),
            weightGrams: 250,
        });
        expect(result).toBeDefined();
        expect(mockPrisma.weightRecord.create).toHaveBeenCalled();
    });

    it("throws when pet not found", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);
        await expect(
            createWeightRecord(USER_ID, {
                petId: PET_ID_1,
                measuredAt: new Date("2024-06-01"),
                weightGrams: 250,
            }),
        ).rejects.toThrow("Pet not found");
    });

    it("throws when pet belongs to different user", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: PET_ID_1, userId: "other_user" });
        await expect(
            createWeightRecord(USER_ID, {
                petId: PET_ID_1,
                measuredAt: new Date("2024-06-01"),
                weightGrams: 250,
            }),
        ).rejects.toThrow("Pet not found");
    });
});

describe("updateWeightRecord", () => {
    it("updates record when owned by user", async () => {
        mockPrisma.weightRecord.findUnique.mockResolvedValue(
            makeRecord({ pet: { userId: USER_ID } }),
        );
        mockPrisma.weightRecord.update.mockResolvedValue(makeRecord({ weightGrams: 300 }));

        const result = await updateWeightRecord("wr_1", USER_ID, { weightGrams: 300 });
        expect(result.weightGrams).toBe(300);
    });

    it("throws when record not found", async () => {
        mockPrisma.weightRecord.findUnique.mockResolvedValue(null);
        await expect(updateWeightRecord("wr_999", USER_ID, { weightGrams: 300 })).rejects.toThrow(
            "Weight record not found",
        );
    });
});

describe("deleteWeightRecord", () => {
    it("deletes record when owned by user", async () => {
        mockPrisma.weightRecord.findUnique.mockResolvedValue(
            makeRecord({ pet: { userId: USER_ID } }),
        );
        mockPrisma.weightRecord.delete.mockResolvedValue(undefined);

        await deleteWeightRecord("wr_1", USER_ID);
        expect(mockPrisma.weightRecord.delete).toHaveBeenCalledWith({ where: { id: "wr_1" } });
    });

    it("throws when record not found", async () => {
        mockPrisma.weightRecord.findUnique.mockResolvedValue(null);
        await expect(deleteWeightRecord("wr_999", USER_ID)).rejects.toThrow(
            "Weight record not found",
        );
    });

    it("throws when record belongs to different user", async () => {
        mockPrisma.weightRecord.findUnique.mockResolvedValue(
            makeRecord({ pet: { userId: "other_user" } }),
        );
        await expect(deleteWeightRecord("wr_1", USER_ID)).rejects.toThrow(
            "Weight record not found",
        );
    });
});
