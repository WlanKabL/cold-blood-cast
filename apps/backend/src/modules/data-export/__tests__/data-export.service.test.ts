import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    dataExport: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    enclosure: { findMany: vi.fn() },
    pet: { findMany: vi.fn() },
    sensor: { findMany: vi.fn() },
    feeding: { findMany: vi.fn() },
    shedding: { findMany: vi.fn() },
    weightRecord: { findMany: vi.fn() },
    veterinarian: { findMany: vi.fn() },
    vetVisit: { findMany: vi.fn() },
    maintenanceTask: { findMany: vi.fn() },
    petPhoto: { findMany: vi.fn() },
    petDocument: { findMany: vi.fn() },
    vetVisitDocument: { findMany: vi.fn() },
    publicProfile: { findMany: vi.fn() },
    upload: { findMany: vi.fn() },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/config/env.js", () => ({
    env: () => ({
        FRONTEND_URL: "https://keeperlog.app",
        UPLOAD_DIR: "./uploads",
    }),
}));

const mockVerifyPassword = vi.fn();
vi.mock("@/helpers/hash.js", () => ({
    verifyPassword: mockVerifyPassword,
}));

vi.mock("@/helpers/file-crypto.js", () => ({
    encryptFile: vi.fn().mockResolvedValue("/tmp/test.zip.enc"),
    decryptFile: vi.fn().mockResolvedValue(Buffer.from("decrypted")),
}));

vi.mock("@/modules/mail/index.js", () => ({
    sendMail: vi.fn(),
    dataExportReadyTemplate: vi.fn().mockReturnValue("<html>"),
}));

vi.mock("@/modules/audit/audit.service.js", () => ({
    auditLog: vi.fn(),
}));

// ─── Import SUT ──────────────────────────────────────────────

const { getExportStatus, requestDataExport, downloadExport, cleanupExpiredExports } =
    await import("../data-export.service.js");

// ─── Setup ───────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── getExportStatus ─────────────────────────────────────────

describe("getExportStatus", () => {
    it("returns null if no export exists", async () => {
        mockPrisma.dataExport.findFirst.mockResolvedValue(null);

        const result = await getExportStatus("user1");

        expect(result).toBeNull();
    });

    it("returns the latest export", async () => {
        const exp = {
            id: "exp1",
            status: "ready",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 86400000),
        };
        mockPrisma.dataExport.findFirst.mockResolvedValue(exp);

        const result = await getExportStatus("user1");

        expect(result).toEqual(exp);
        expect(mockPrisma.dataExport.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: "user1" } }),
        );
    });

    it("marks expired exports and returns updated status", async () => {
        const exp = {
            id: "exp1",
            status: "ready",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() - 1000),
        };
        mockPrisma.dataExport.findFirst.mockResolvedValue(exp);
        mockPrisma.dataExport.update.mockResolvedValue({});

        const result = await getExportStatus("user1");

        expect(result!.status).toBe("expired");
        expect(mockPrisma.dataExport.update).toHaveBeenCalledWith({
            where: { id: "exp1" },
            data: { status: "expired" },
        });
    });

    it("does not mark non-ready exports as expired", async () => {
        const exp = {
            id: "exp1",
            status: "processing",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() - 1000),
        };
        mockPrisma.dataExport.findFirst.mockResolvedValue(exp);

        const result = await getExportStatus("user1");

        expect(result!.status).toBe("processing");
        expect(mockPrisma.dataExport.update).not.toHaveBeenCalled();
    });
});

// ─── requestDataExport ───────────────────────────────────────

describe("requestDataExport", () => {
    it("throws when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(requestDataExport("user1", "password")).rejects.toThrow();
    });

    it("throws when password is invalid", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: "user1",
            username: "testuser",
            email: "test@test.com",
            passwordHash: "hashed",
        });
        mockVerifyPassword.mockResolvedValue(false);

        await expect(requestDataExport("user1", "wrongpass")).rejects.toThrow("Invalid password");
    });

    it("throws on cooldown if recent export exists", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: "user1",
            username: "testuser",
            email: "test@test.com",
            passwordHash: "hashed",
        });
        mockVerifyPassword.mockResolvedValue(true);
        mockPrisma.dataExport.findFirst.mockResolvedValue({ id: "recent" });

        await expect(requestDataExport("user1", "pass")).rejects.toThrow("Please wait");
    });

    it("creates export record and returns processing status", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: "user1",
            username: "testuser",
            email: "test@test.com",
            passwordHash: "hashed",
        });
        mockVerifyPassword.mockResolvedValue(true);
        mockPrisma.dataExport.findFirst.mockResolvedValue(null);
        mockPrisma.dataExport.create.mockResolvedValue({ id: "exp1" });

        // Mock all the data queries for generateExport (runs async in background)
        mockPrisma.user.findUnique.mockResolvedValue({
            id: "user1",
            username: "testuser",
            email: "test@test.com",
            createdAt: new Date(),
            locale: "en",
            weeklyReportEnabled: false,
        });
        mockPrisma.enclosure.findMany.mockResolvedValue([]);
        mockPrisma.pet.findMany.mockResolvedValue([]);
        mockPrisma.sensor.findMany.mockResolvedValue([]);
        mockPrisma.feeding.findMany.mockResolvedValue([]);
        mockPrisma.shedding.findMany.mockResolvedValue([]);
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        mockPrisma.veterinarian.findMany.mockResolvedValue([]);
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);
        mockPrisma.maintenanceTask.findMany.mockResolvedValue([]);
        mockPrisma.petPhoto.findMany.mockResolvedValue([]);
        mockPrisma.petDocument.findMany.mockResolvedValue([]);
        mockPrisma.vetVisitDocument.findMany.mockResolvedValue([]);
        mockPrisma.publicProfile.findMany.mockResolvedValue([]);
        mockPrisma.upload.findMany.mockResolvedValue([]);

        const result = await requestDataExport("user1", "pass");

        expect(result.status).toBe("processing");
        expect(result.id).toBe("exp1");
        expect(mockPrisma.dataExport.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: "user1",
                status: "processing",
            }),
        });
    });
});

// ─── downloadExport ──────────────────────────────────────────

describe("downloadExport", () => {
    it("throws when export not found", async () => {
        mockPrisma.dataExport.findUnique.mockResolvedValue(null);

        await expect(downloadExport("badtoken")).rejects.toThrow("Export not found");
    });

    it("throws when export is not ready", async () => {
        mockPrisma.dataExport.findUnique.mockResolvedValue({
            id: "exp1",
            status: "processing",
        });

        await expect(downloadExport("token123")).rejects.toThrow("processing");
    });

    it("throws and marks as expired when past expiry", async () => {
        mockPrisma.dataExport.findUnique.mockResolvedValue({
            id: "exp1",
            status: "ready",
            expiresAt: new Date(Date.now() - 1000),
            filePath: "/exports/test.zip",
        });
        mockPrisma.dataExport.update.mockResolvedValue({});

        await expect(downloadExport("token123")).rejects.toThrow("expired");
        expect(mockPrisma.dataExport.update).toHaveBeenCalledWith({
            where: { id: "exp1" },
            data: { status: "expired" },
        });
    });

    it("throws when filePath is missing", async () => {
        mockPrisma.dataExport.findUnique.mockResolvedValue({
            id: "exp1",
            status: "ready",
            expiresAt: new Date(Date.now() + 86400000),
            filePath: null,
        });

        await expect(downloadExport("token123")).rejects.toThrow("not available");
    });

    it("returns file path for valid export", async () => {
        mockPrisma.dataExport.findUnique.mockResolvedValue({
            id: "exp1",
            status: "ready",
            expiresAt: new Date(Date.now() + 86400000),
            filePath: "/exports/cbc-export_user1_123.zip",
        });

        const result = await downloadExport("token123");

        expect(result).toBe("/exports/cbc-export_user1_123.zip");
    });
});

// ─── cleanupExpiredExports ───────────────────────────────────

describe("cleanupExpiredExports", () => {
    it("returns 0 when no expired exports exist", async () => {
        mockPrisma.dataExport.findMany.mockResolvedValue([]);

        const count = await cleanupExpiredExports();

        expect(count).toBe(0);
    });

    it("marks expired exports and returns count", async () => {
        mockPrisma.dataExport.findMany.mockResolvedValue([
            { id: "exp1", filePath: "/exports/old.zip" },
            { id: "exp2", filePath: null },
        ]);
        mockPrisma.dataExport.update.mockResolvedValue({});

        const count = await cleanupExpiredExports();

        expect(count).toBe(2);
        expect(mockPrisma.dataExport.update).toHaveBeenCalledTimes(2);
    });
});
