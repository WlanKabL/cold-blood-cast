import { describe, it, expect } from "vitest";
import { AppConfigSchema, isValidAppConfig, isValidPartialAppConfig } from "../config.js";

const validConfig = {
    general: {
        name: "My Terrarium",
        dayStartHour: 6,
        nightStartHour: 22,
        timezone: "Europe/Berlin",
    },
    sensorSystem: {
        pollingIntervalMs: 5000,
        retentionMinutes: 60,
        autoLogIntervalMs: 300000,
        logFileLimit: 100,
        remoteSyncEnabled: false,
        alertCooldownMs: 600000,
    },
};

describe("config schemas", () => {
    describe("AppConfigSchema", () => {
        it("validates a valid config", () => {
            expect(AppConfigSchema.safeParse(validConfig).success).toBe(true);
        });

        it("rejects invalid hour values", () => {
            const invalid = {
                ...validConfig,
                general: { ...validConfig.general, dayStartHour: 25 },
            };
            expect(AppConfigSchema.safeParse(invalid).success).toBe(false);
        });

        it("rejects missing sensorSystem", () => {
            expect(AppConfigSchema.safeParse({ general: validConfig.general }).success).toBe(false);
        });
    });

    describe("isValidAppConfig", () => {
        it("returns true for valid config", () => {
            expect(isValidAppConfig(validConfig)).toBe(true);
        });

        it("returns false for empty object", () => {
            expect(isValidAppConfig({})).toBe(false);
        });
    });

    describe("isValidPartialAppConfig", () => {
        it("returns true for partial config", () => {
            expect(isValidPartialAppConfig({ general: { name: "New" } })).toBe(true);
        });

        it("returns true for empty object", () => {
            expect(isValidPartialAppConfig({})).toBe(true);
        });
    });
});
