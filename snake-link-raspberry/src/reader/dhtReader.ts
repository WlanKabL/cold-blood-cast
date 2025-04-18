/**
 * @file dhtReader.js
 * @description Reads temperature and humidity from a DHT11 or DHT22 sensor,
 *              with a Windows stub that returns null values.
 */

import chalk from "chalk";
import type { SensorReader } from "./sensorReader.interface";
import type { SensorConfig, SensorReading } from "../types/sensor";

const isWindows = process.platform === "win32";

/**
 * DHTReader encapsulates the node-dht-sensor module.
 */
export class DHTReader implements SensorReader {
    private sensorLib: any = null;
    private initialized = false;

    /**
     * @param pin - GPIO pin number
     * @param model - "11" for DHT11, "22" for DHT22
     */
    constructor(
        private pin: number,
        private model: "11" | "22" = "22",
    ) {
        this.lazyInit();
    }

    /**
     * Lazy-initializes the native DHT sensor module or sets up a stub on Windows.
     *
     * @private
     */
    private async lazyInit(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;

        if (isWindows) {
            console.warn("⚠️ Windows detected: DHTReader will always return null values.");
            return;
        }

        try {
            const mod = await import("node-dht-sensor");
            this.sensorLib = mod.default ?? mod;
            // Some versions require `.initialize()`, uncomment if needed:
            // this.sensorLib.initialize(parseInt(this.model), this.pin);
        } catch (err: any) {
            console.warn("⚠️ DHT sensor module not available:", err.message);
        }
    }

    /**
     * Reads a sensor value (temperature or humidity).
     *
     * @param config - SensorConfig object defining name, type and unit
     * @returns Promise resolving to a SensorReading; value is null on stub or error.
     */
    async read(config: SensorConfig): Promise<SensorReading> {
        await this.lazyInit();

        if (!this.sensorLib) {
            return {
                name: config.name,
                type: config.type,
                unit: config.unit,
                value: null,
                timestamp: Date.now(),
            };
        }

        try {
            const { temperature, humidity } = this.sensorLib.read(
                parseInt(this.model, 10),
                this.pin,
            );

            const value =
                config.type === "temperature"
                    ? temperature
                    : config.type === "humidity"
                      ? humidity
                      : null;

            return {
                name: config.name,
                type: config.type,
                unit: config.unit,
                value,
                timestamp: Date.now(),
            };
        } catch (err: any) {
            console.error(chalk.red("❌ DHT read failed:"), err.message);
            return {
                name: config.name,
                type: config.type,
                unit: config.unit,
                value: null,
                timestamp: Date.now(),
            };
        }
    }
}
