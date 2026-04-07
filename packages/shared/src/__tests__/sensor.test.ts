import { describe, it, expect } from "vitest";
import {
    SensorConfigSchema,
    SensorReadingSchema,
    isValidSensorConfig,
    isValidPartialSensorConfig,
} from "../sensor.js";

describe("sensor schemas", () => {
    describe("SensorConfigSchema", () => {
        it("validates a general temperature sensor", () => {
            const config = {
                id: "temp-1",
                name: "Warm Side",
                type: "temperature",
                unit: "°C",
                limitsType: "general",
                readingLimits: { min: 20, max: 30 },
            };
            const result = SensorConfigSchema.safeParse(config);
            expect(result.success).toBe(true);
        });

        it("validates a time-based humidity sensor", () => {
            const config = {
                id: "hum-1",
                name: "Humidity",
                type: "humidity",
                unit: "%",
                limitsType: "timeBased",
                readingLimits: {
                    day: { min: 30, max: 50 },
                    night: { min: 50, max: 70 },
                },
            };
            const result = SensorConfigSchema.safeParse(config);
            expect(result.success).toBe(true);
        });

        it("rejects missing id", () => {
            const config = {
                name: "Test",
                type: "temperature",
                unit: "°C",
                limitsType: "general",
                readingLimits: { min: 20, max: 30 },
            };
            const result = SensorConfigSchema.safeParse(config);
            expect(result.success).toBe(false);
        });

        it("rejects invalid type", () => {
            const config = {
                id: "x",
                name: "X",
                type: "invalid",
                unit: "°C",
                limitsType: "general",
                readingLimits: { min: 0, max: 100 },
            };
            const result = SensorConfigSchema.safeParse(config);
            expect(result.success).toBe(false);
        });
    });

    describe("SensorReadingSchema", () => {
        it("validates a valid reading", () => {
            const reading = {
                name: "Temp",
                type: "temperature",
                value: 25.5,
                unit: "°C",
                timestamp: Date.now(),
            };
            expect(SensorReadingSchema.safeParse(reading).success).toBe(true);
        });

        it("allows null value", () => {
            const reading = {
                name: "Temp",
                type: "temperature",
                value: null,
                unit: "°C",
                timestamp: Date.now(),
            };
            expect(SensorReadingSchema.safeParse(reading).success).toBe(true);
        });
    });

    describe("isValidSensorConfig", () => {
        it("returns true for valid config", () => {
            expect(
                isValidSensorConfig({
                    id: "t-1",
                    name: "Temp",
                    type: "temperature",
                    unit: "°C",
                    limitsType: "general",
                    readingLimits: { min: 20, max: 30 },
                }),
            ).toBe(true);
        });

        it("returns false for invalid config", () => {
            expect(isValidSensorConfig({ id: "x" })).toBe(false);
        });
    });

    describe("isValidPartialSensorConfig", () => {
        it("returns true for partial update", () => {
            expect(isValidPartialSensorConfig({ name: "New Name" })).toBe(true);
        });

        it("returns true for empty object", () => {
            expect(isValidPartialSensorConfig({})).toBe(true);
        });
    });
});
