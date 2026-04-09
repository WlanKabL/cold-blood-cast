import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    systemSetting: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/helpers/errors.js", async () => {
    const actual = await vi.importActual("@/helpers/errors.js");
    return actual;
});

// ─── Import SUT ──────────────────────────────────────────────

const { getSystemSettings, getSystemSetting, updateSystemSetting } =
    await import("../settings.service.js");

// ─── Setup ───────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── getSystemSettings ───────────────────────────────────────

describe("getSystemSettings", () => {
    it("returns all settings ordered by key", async () => {
        const settings = [
            { key: "default_role", value: '"USER"' },
            { key: "maintenance_mode", value: "false" },
        ];
        mockPrisma.systemSetting.findMany.mockResolvedValue(settings);

        const result = await getSystemSettings();

        expect(result).toEqual(settings);
        expect(mockPrisma.systemSetting.findMany).toHaveBeenCalledWith({
            orderBy: { key: "asc" },
        });
    });
});

// ─── getSystemSetting ────────────────────────────────────────

describe("getSystemSetting", () => {
    it("returns parsed JSON value", async () => {
        mockPrisma.systemSetting.findUnique.mockResolvedValue({
            key: "maintenance_mode",
            value: "true",
        });

        const result = await getSystemSetting("maintenance_mode");

        expect(result).toBe(true);
    });

    it("returns string when JSON parse fails", async () => {
        mockPrisma.systemSetting.findUnique.mockResolvedValue({
            key: "some_key",
            value: "not-json",
        });

        const result = await getSystemSetting("some_key");

        expect(result).toBe("not-json");
    });

    it("returns default value when setting not found", async () => {
        mockPrisma.systemSetting.findUnique.mockResolvedValue(null);

        const result = await getSystemSetting("missing_key", "fallback");

        expect(result).toBe("fallback");
    });

    it("returns undefined when no default and not found", async () => {
        mockPrisma.systemSetting.findUnique.mockResolvedValue(null);

        const result = await getSystemSetting("missing_key");

        expect(result).toBeUndefined();
    });
});

// ─── updateSystemSetting ─────────────────────────────────────

describe("updateSystemSetting", () => {
    it("upserts valid setting key", async () => {
        mockPrisma.systemSetting.upsert.mockResolvedValue({
            key: "maintenance_mode",
            value: "true",
        });

        await updateSystemSetting("maintenance_mode", true);

        expect(mockPrisma.systemSetting.upsert).toHaveBeenCalledWith({
            where: { key: "maintenance_mode" },
            update: { value: "true" },
            create: { key: "maintenance_mode", value: "true" },
        });
    });

    it("throws for invalid setting key", async () => {
        await expect(updateSystemSetting("invalid_key", "value")).rejects.toThrow(
            "Invalid setting key",
        );
    });
});
