/**
 * readerFactory.ts
 *
 * Factory function to select the appropriate SensorReader implementation
 * based on the given SensorConfig.
 * Includes fallback to MockReader.
 */

import type { SensorConfig } from "../types/sensor.js";
import type { SensorReader } from "./sensorReader.interface.js";
import { MockReader } from "./mockReader.js";
import { DHTReader } from "./dhtReader.js";
import { BMEReader } from "./bmeReader.js";

/**
 * Returns a SensorReader instance corresponding to the hardware described in config.
 *
 * Priority:
 * 1. mock
 * 2. pin   → DHTReader
 * 3. i2cAddress (+ optional i2cBusNo) → BMEReader
 * 4. fallback → MockReader
 */
export function getReaderForSensor(config: SensorConfig): SensorReader {
    const hw = config.hardware;

    // 1. Mock or no hardware → MockReader
    if (!hw || hw.mock === true) {
        return new MockReader();
    }

    // 2. DHT (GPIO pin)
    if (typeof hw.pin === "number") {
        const model = hw.model === "11" ? "11" : "22";
        return new DHTReader(hw.pin, model);
    }

    // 3. BME280 (I²C address + optional bus number)
    if (typeof hw.i2cAddress === "number") {
        const busNo = hw.i2cBusNo ?? 1;
        return new BMEReader(hw.i2cAddress, busNo);
    }

    // 4. Fallback
    console.warn(
        `⚠️ Unknown hardware configuration for sensor "${config.name}", using MockReader.`,
    );
    return new MockReader();
}
