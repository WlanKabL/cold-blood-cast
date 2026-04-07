import { describe, it, expect } from "vitest";
import { calculateSensorStatus } from "../sensorStatus.js";
import type { SensorConfig, SensorReading, AppConfig } from "@cold-blood-cast/shared";

const generalConfig: AppConfig["general"] = {
    name: "Test",
    dayStartHour: 6,
    nightStartHour: 22,
    timezone: "UTC",
};

function tempSensor(limitsType: "general", min: number, max: number): SensorConfig {
    return {
        id: "temp-1",
        name: "Temp",
        type: "temperature",
        unit: "°C",
        limitsType: "general",
        readingLimits: { min, max },
    } as SensorConfig;
}

function reading(value: number | null): SensorReading {
    return {
        name: "Temp",
        type: "temperature",
        value,
        unit: "°C",
        timestamp: Date.now(),
    };
}

describe("calculateSensorStatus", () => {
    it("returns 'unknown' when reading is null", () => {
        const sensor = tempSensor("general", 20, 30);
        expect(calculateSensorStatus(sensor, null, generalConfig)).toBe("unknown");
    });

    it("returns 'unknown' when reading is undefined", () => {
        const sensor = tempSensor("general", 20, 30);
        expect(calculateSensorStatus(sensor, undefined, generalConfig)).toBe("unknown");
    });

    it("returns 'unknown' when reading value is null", () => {
        const sensor = tempSensor("general", 20, 30);
        expect(calculateSensorStatus(sensor, reading(null), generalConfig)).toBe("unknown");
    });

    it("returns 'ok' when value is within limits", () => {
        const sensor = tempSensor("general", 20, 30);
        expect(calculateSensorStatus(sensor, reading(25), generalConfig)).toBe("ok");
    });

    it("returns 'ok' when value equals min", () => {
        const sensor = tempSensor("general", 20, 30);
        expect(calculateSensorStatus(sensor, reading(20), generalConfig)).toBe("ok");
    });

    it("returns 'ok' when value equals max", () => {
        const sensor = tempSensor("general", 20, 30);
        expect(calculateSensorStatus(sensor, reading(30), generalConfig)).toBe("ok");
    });

    it("returns 'warning' when value is below min", () => {
        const sensor = tempSensor("general", 20, 30);
        expect(calculateSensorStatus(sensor, reading(19), generalConfig)).toBe("warning");
    });

    it("returns 'warning' when value is above max", () => {
        const sensor = tempSensor("general", 20, 30);
        expect(calculateSensorStatus(sensor, reading(31), generalConfig)).toBe("warning");
    });

    it("returns 'ok' for water sensor with value 1", () => {
        const sensor = {
            id: "water-1",
            name: "Water",
            type: "water",
            unit: "present",
            limitsType: "general",
            readingLimits: {},
        } as SensorConfig;
        const r = {
            name: "Water",
            type: "water",
            value: 1,
            unit: "present",
            timestamp: Date.now(),
        } as SensorReading;
        expect(calculateSensorStatus(sensor, r, generalConfig)).toBe("ok");
    });

    it("returns 'warning' for water sensor with value 0", () => {
        const sensor = {
            id: "water-1",
            name: "Water",
            type: "water",
            unit: "present",
            limitsType: "general",
            readingLimits: {},
        } as SensorConfig;
        const r = {
            name: "Water",
            type: "water",
            value: 0,
            unit: "present",
            timestamp: Date.now(),
        } as SensorReading;
        expect(calculateSensorStatus(sensor, r, generalConfig)).toBe("warning");
    });
});
