/**
 * @file bmeReader.ts
 * @description Reads temperature, humidity and pressure from a BME280 sensor,
 *              with a Windows stub that returns null values.
 */

import chalk from "chalk";
import type { SensorReader } from "./sensorReader.interface.js";
import type { SensorConfig, SensorReading } from "../types/sensor.js";

const isWindows = process.platform === "win32";

export class BMEReader implements SensorReader {
    private sensorInstance: any = null;
    private initialized = false;

    /**
     * @param address  I²C device address of the BME280 (default 0x76)
     * @param busNo    I²C bus number (default 1)
     */
    constructor(
        private address: number = 0x76,
        private busNo: number = 1,
    ) {
        this.lazyInit();
    }

    /**
     * Lazy-initializes the BME280 sensor or sets up a Windows stub.
     *
     * @private
     */
    private async lazyInit(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;

        if (isWindows) {
            console.warn("⚠️ Windows detected: BMEReader will always return null values.");
            return;
        }

        try {
            // @ts-ignore – bme280-sensor ist optional
            const mod = await import("bme280-sensor");
            const BME280 = mod.default ?? mod;
            this.sensorInstance = new BME280({
                i2cBusNo: this.busNo,
                i2cAddress: this.address,
            });
            await this.sensorInstance.init();
        } catch (err: any) {
            console.warn("⚠️ BME280 sensor module not available:", err.message);
        }
    }

    /**
     * Reads a sensor value (temperature, humidity or pressure).
     *
     * @param config  SensorConfig object defining name, type and unit
     * @returns       A SensorReading; value is null on stub or error.
     */
    async read(config: SensorConfig): Promise<SensorReading> {
        await this.lazyInit();

        if (!this.sensorInstance) {
            return {
                name: config.name,
                type: config.type,
                unit: config.unit,
                value: null,
                timestamp: Date.now(),
            };
        }

        try {
            const data = await this.sensorInstance.readSensorData();

            const value =
                config.type === "temperature"
                    ? data.temperature_C
                    : config.type === "humidity"
                      ? data.humidity
                      : config.type === "pressure"
                        ? data.pressure_hPa
                        : null;

            return {
                name: config.name,
                type: config.type,
                unit: config.unit,
                value,
                timestamp: Date.now(),
            };
        } catch (err: any) {
            console.error(chalk.red("❌ BME280 read failed:"), err.message);
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
