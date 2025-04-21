// src/services/SensorPollingService.ts
import chalk from "chalk";
import { FileStore } from "../storage/dataStorageService.js";
import { getReaderForSensor } from "../reader/readerFactory.js";
import type { SensorConfig, SensorReading } from "../types/sensor.js";
import type { AppConfig } from "../types/config.js";

/**
 * Service responsible for polling sensors at configured intervals,
 * saving their readings, and optionally broadcasting them.
 */
export class SensorPollingService {
    private timerId: NodeJS.Timeout | null = null;
    private readerCache = new Map<string, ReturnType<typeof getReaderForSensor>>();

    /**
     * @param configStore    FileStore containing `{ sensors: SensorConfig[] }`
     * @param liveStore      FileStore for saving latest sensor readings
     * @param appConfigStore FileStore containing `AppConfig` (with `sensorSystem.pollingIntervalMs`)
     * @param broadcast      Optional callback to broadcast readings externally
     */
    constructor(
        private configStore: FileStore<{ sensors: SensorConfig[] }>,
        private liveStore: FileStore<Record<string, SensorReading>>,
        private appConfigStore: FileStore<AppConfig>,
        private broadcast?: (data: Record<string, SensorReading>) => void,
    ) {}

    /**
     * Starts the sensor polling loop.
     * Reads the latest config for the interval before kicking off.
     */
    start(): void {
        if (this.timerId) {
            console.log(chalk.yellow("⚠️ Sensor polling is already running"));
            return;
        }

        const appConfig = this.appConfigStore.load();
        const intervalMs = appConfig.sensorSystem.pollingIntervalMs;
        console.log(chalk.cyan(`📡 Starting sensor polling every ${intervalMs / 1000}s...`));

        const poll = async (): Promise<void> => {
            const { sensors = [] } = this.configStore.load();
            const activeSensors = sensors.filter((s) => s.active !== false);
            const readings: Record<string, SensorReading> = {};

            for (const sensor of activeSensors) {
                console.log(chalk.gray(`🔍 Reading sensor: ${sensor.id}`));
                try {
                    // Optionally override hardware to mock mode
                    const config =
                        process.env.USE_MOCK === "true" && sensor.hardware
                            ? { ...sensor, hardware: { ...sensor.hardware, mock: true } }
                            : sensor;

                    let reader = this.readerCache.get(config.id);
                    if (!reader) {
                        reader = getReaderForSensor(config);
                        this.readerCache.set(config.id, reader);
                    }

                    const result = await reader.read(config);
                    if (result) {
                        readings[sensor.id] = result;
                    } else {
                        console.warn(chalk.yellow(`⚠️ No reading from sensor ${sensor.id}`));
                    }
                } catch (err: unknown) {
                    console.error(
                        chalk.red(`❌ Failed to read sensor ${sensor.id}:`),
                        (err as Error).message,
                    );
                }
            }

            this.liveStore.save(readings);

            if (this.broadcast) {
                try {
                    this.broadcast(readings);
                } catch (err: unknown) {
                    console.error(chalk.red("❌ Broadcast failed:"), (err as Error).message);
                }
            }

            console.log(chalk.gray(`✅ Polled ${Object.keys(readings).length} sensor(s)`));
            this.timerId = setTimeout(poll, intervalMs);
        };

        // Kick off the first poll immediately
        this.timerId = setTimeout(poll, 0);
    }

    /**
     * Stops the sensor polling loop.
     */
    stop(): void {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
            console.log(chalk.cyan("🛑 Stopped sensor polling."));
        } else {
            console.log(chalk.yellow("⚠️ Sensor polling is not running."));
        }
    }

    /**
     * Restarts the polling loop by stopping and then starting again.
     * The latest config is re-loaded when starting.
     */
    restart(): void {
        this.stop();
        this.start();
    }
}
