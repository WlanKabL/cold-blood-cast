import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const findUnique = vi.fn();
const upsert = vi.fn();

vi.mock("../../db/client.js", () => ({
    prisma: {
        systemSetting: {
            findMany,
            findUnique,
            upsert,
        },
    },
}));

const {
    getSystemSettings,
    getSystemSetting,
    updateSystemSetting,
    isMaintenanceMode,
    getRegistrationMode,
} = await import("../settings.service.js");

describe("settings.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getSystemSettings", () => {
        it("returns array of { id, key, value } objects", async () => {
            const mockSettings = [
                { id: "1", key: "registration_mode", value: "open" },
                { id: "2", key: "maintenance_mode", value: "false" },
            ];
            findMany.mockResolvedValueOnce(mockSettings);

            const result = await getSystemSettings();

            expect(result).toEqual(mockSettings);
            expect(findMany).toHaveBeenCalledWith({
                select: { id: true, key: true, value: true },
                orderBy: { key: "asc" },
            });
        });

        it("returns empty array when no settings exist", async () => {
            findMany.mockResolvedValueOnce([]);

            const result = await getSystemSettings();

            expect(result).toEqual([]);
        });
    });

    describe("getSystemSetting", () => {
        it("returns value for existing key", async () => {
            findUnique.mockResolvedValueOnce({ key: "maintenance_mode", value: "false" });

            const result = await getSystemSetting("maintenance_mode");

            expect(result).toBe("false");
            expect(findUnique).toHaveBeenCalledWith({ where: { key: "maintenance_mode" } });
        });

        it("returns null for missing key", async () => {
            findUnique.mockResolvedValueOnce(null);

            const result = await getSystemSetting("nonexistent");

            expect(result).toBeNull();
        });
    });

    describe("updateSystemSetting", () => {
        it("upserts the setting", async () => {
            const updated = { id: "1", key: "maintenance_mode", value: "true" };
            upsert.mockResolvedValueOnce(updated);

            const result = await updateSystemSetting("maintenance_mode", "true");

            expect(result).toEqual(updated);
            expect(upsert).toHaveBeenCalledWith({
                where: { key: "maintenance_mode" },
                create: { key: "maintenance_mode", value: "true" },
                update: { value: "true" },
            });
        });
    });

    describe("isMaintenanceMode", () => {
        it("returns true when setting is 'true'", async () => {
            findUnique.mockResolvedValueOnce({ key: "maintenance_mode", value: "true" });

            expect(await isMaintenanceMode()).toBe(true);
        });

        it("returns false when setting is 'false'", async () => {
            findUnique.mockResolvedValueOnce({ key: "maintenance_mode", value: "false" });

            expect(await isMaintenanceMode()).toBe(false);
        });

        it("returns false when setting does not exist", async () => {
            findUnique.mockResolvedValueOnce(null);

            expect(await isMaintenanceMode()).toBe(false);
        });
    });

    describe("getRegistrationMode", () => {
        it("returns the stored value", async () => {
            findUnique.mockResolvedValueOnce({ key: "registration_mode", value: "invite_only" });

            expect(await getRegistrationMode()).toBe("invite_only");
        });

        it("defaults to 'open' when not set", async () => {
            findUnique.mockResolvedValueOnce(null);

            expect(await getRegistrationMode()).toBe("open");
        });
    });
});
