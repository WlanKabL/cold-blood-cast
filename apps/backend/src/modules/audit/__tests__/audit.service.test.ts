import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    auditLog: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

// ─── Import SUT ──────────────────────────────────────────────

const { auditLog, getAuditLogs } = await import("../audit.service.js");

// ─── Setup ───────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── auditLog ────────────────────────────────────────────────

describe("auditLog", () => {
    it("creates an audit log entry", async () => {
        mockPrisma.auditLog.create.mockResolvedValue({ id: "al1" });

        await auditLog("user1", "LOGIN", "user", "user1", { method: "password" }, "1.2.3.4");

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: "user1",
                action: "LOGIN",
                entity: "user",
                entityId: "user1",
                details: { method: "password" },
                ipAddress: "1.2.3.4",
            }),
        });
    });

    it("does not throw when create fails (fire-and-forget)", async () => {
        mockPrisma.auditLog.create.mockRejectedValue(new Error("DB down"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(auditLog("user1", "LOGIN")).resolves.toBeUndefined();

        expect(consoleSpy).toHaveBeenCalledWith("Audit log write failed:", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it("handles null optional fields", async () => {
        mockPrisma.auditLog.create.mockResolvedValue({ id: "al1" });

        await auditLog("user1", "ACTION");

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                entity: null,
                entityId: null,
                ipAddress: null,
            }),
        });
    });
});

// ─── getAuditLogs ────────────────────────────────────────────

describe("getAuditLogs", () => {
    it("returns paginated logs with default page/limit", async () => {
        const logs = [{ id: "al1", action: "LOGIN" }];
        mockPrisma.auditLog.findMany.mockResolvedValue(logs);
        mockPrisma.auditLog.count.mockResolvedValue(1);

        const result = await getAuditLogs({});

        expect(result.items).toEqual(logs);
        expect(result.meta).toEqual({
            page: 1,
            perPage: 50,
            total: 1,
            totalPages: 1,
        });
    });

    it("applies userId, action, entity filters", async () => {
        mockPrisma.auditLog.findMany.mockResolvedValue([]);
        mockPrisma.auditLog.count.mockResolvedValue(0);

        await getAuditLogs({
            userId: "user1",
            action: "LOGIN",
            entity: "user",
            page: 2,
            limit: 25,
        });

        expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 25,
                take: 25,
            }),
        );
    });

    it("caps limit at 200", async () => {
        mockPrisma.auditLog.findMany.mockResolvedValue([]);
        mockPrisma.auditLog.count.mockResolvedValue(0);

        await getAuditLogs({ limit: 500 });

        expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 200 }),
        );
    });
});
