import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    contentReport: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
    },
    userPublicProfile: {
        findMany: vi.fn().mockResolvedValue([]),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const { createReport, listReports, resolveReport, getReportStats } =
    await import("../report.service.js");

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── createReport ────────────────────────────────────────────

describe("createReport", () => {
    it("creates a report", async () => {
        mockPrisma.contentReport.create.mockResolvedValue({
            id: "report_1",
            targetType: "comment",
            targetId: "c_1",
            reason: "spam",
            status: "pending",
        });

        const result = await createReport({
            targetType: "comment",
            targetId: "c_1",
            reason: "spam",
        });

        expect(result.id).toBe("report_1");
        expect(mockPrisma.contentReport.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                targetType: "comment",
                targetId: "c_1",
                reason: "spam",
            }),
        });
    });

    it("includes optional fields when provided", async () => {
        mockPrisma.contentReport.create.mockResolvedValue({ id: "report_2" });

        await createReport({
            targetType: "user_profile",
            targetId: "profile_1",
            targetUrl: "https://example.com/keeper/test",
            reason: "harassment",
            description: "Offensive content",
            reporterName: "John",
        });

        expect(mockPrisma.contentReport.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                targetUrl: "https://example.com/keeper/test",
                description: "Offensive content",
                reporterName: "John",
            }),
        });
    });
});

// ─── listReports ─────────────────────────────────────────────

describe("listReports", () => {
    it("returns paginated reports", async () => {
        mockPrisma.contentReport.findMany.mockResolvedValue([{ id: "r_1", status: "pending" }]);
        mockPrisma.contentReport.count.mockResolvedValue(1);

        const result = await listReports({ page: 1, limit: 10 });
        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
    });

    it("filters by status", async () => {
        mockPrisma.contentReport.findMany.mockResolvedValue([]);
        mockPrisma.contentReport.count.mockResolvedValue(0);

        await listReports({ status: "pending" });
        expect(mockPrisma.contentReport.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: "pending" }),
            }),
        );
    });

    it("filters by targetType", async () => {
        mockPrisma.contentReport.findMany.mockResolvedValue([]);
        mockPrisma.contentReport.count.mockResolvedValue(0);

        await listReports({ targetType: "comment" });
        expect(mockPrisma.contentReport.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ targetType: "comment" }),
            }),
        );
    });

    it("caps limit at 100", async () => {
        mockPrisma.contentReport.findMany.mockResolvedValue([]);
        mockPrisma.contentReport.count.mockResolvedValue(0);

        const result = await listReports({ limit: 500 });
        expect(result.limit).toBe(100);
    });
});

// ─── resolveReport ───────────────────────────────────────────

describe("resolveReport", () => {
    it("marks a report as reviewed", async () => {
        mockPrisma.contentReport.findUnique.mockResolvedValue({
            id: "r_1",
            status: "pending",
        });
        mockPrisma.contentReport.update.mockResolvedValue({
            id: "r_1",
            status: "reviewed",
        });

        const result = await resolveReport("r_1", "admin_1", "reviewed", "Checked it out");
        expect(result.status).toBe("reviewed");
        expect(mockPrisma.contentReport.update).toHaveBeenCalledWith({
            where: { id: "r_1" },
            data: expect.objectContaining({
                status: "reviewed",
                adminNote: "Checked it out",
                resolvedById: "admin_1",
                resolvedAt: expect.any(Date),
            }),
        });
    });

    it("marks a report as dismissed", async () => {
        mockPrisma.contentReport.findUnique.mockResolvedValue({
            id: "r_2",
            status: "pending",
        });
        mockPrisma.contentReport.update.mockResolvedValue({
            id: "r_2",
            status: "dismissed",
        });

        const result = await resolveReport("r_2", "admin_1", "dismissed");
        expect(result.status).toBe("dismissed");
    });

    it("throws when report not found", async () => {
        mockPrisma.contentReport.findUnique.mockResolvedValue(null);

        await expect(resolveReport("r_nonexistent", "admin_1", "reviewed")).rejects.toThrow(
            "not found",
        );
    });
});

// ─── getReportStats ──────────────────────────────────────────

describe("getReportStats", () => {
    it("returns counts by status", async () => {
        mockPrisma.contentReport.count
            .mockResolvedValueOnce(5) // pending
            .mockResolvedValueOnce(10) // reviewed
            .mockResolvedValueOnce(2) // dismissed
            .mockResolvedValueOnce(17); // total

        const stats = await getReportStats();
        expect(stats).toEqual({ pending: 5, reviewed: 10, dismissed: 2, total: 17 });
    });
});
