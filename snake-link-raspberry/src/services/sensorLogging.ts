// src/services/sensorLogger.ts
import chalk from "chalk";
import type { FileStore } from "../storage/dataStorageService.js";
import type { SensorReading } from "../types/sensor.js";
import type { LogEntry } from "../types/logs.js";
import type { AppConfig } from "../types/config.js";

/**
 * Service that handles periodic logging of sensor readings.
 */
export class SensorLoggingService {
    private loggerInstance: NodeJS.Timeout | null = null;

    /**
     * @param liveStore   Store for live sensor readings
     * @param logStore    Store for persisted log entries
     * @param configStore Store for application configuration
     */
    constructor(
        private liveStore: FileStore<Record<string, SensorReading>>,
        private logStore: FileStore<LogEntry[]>,
        private configStore: FileStore<AppConfig>,
    ) {}

    /**
     * Starts sensor logging at the interval defined in app config.
     * Reads the latest config upon each start.
     */
    start(): void {
        const config = this.configStore.load();
        const intervalMs = config.sensorSystem.autoLogIntervalMs;
        console.log(chalk.cyan(`📝 Starting sensor logging every ${intervalMs / 1000}s...`));

        if (this.loggerInstance) {
            console.log(chalk.yellow("⚠️ Sensor logging is already running"));
            return;
        }

        this.loggerInstance = setInterval(() => {
            const readings = this.liveStore.load();
            const logs = this.logStore.load([]);
            const entry: LogEntry = {
                timestamp: Date.now(),
                readings,
            };

            logs.push(entry);

            const maxEntries = config.sensorSystem.logFileLimit;
            if (logs.length > maxEntries) {
                logs.splice(0, logs.length - maxEntries);
            }

            this.logStore.save(logs);
            console.log(chalk.gray(`📌 Logged ${Object.keys(readings).length} sensor(s)`));
        }, intervalMs);
    }

    /**
     * Stops the currently running sensor logging.
     */
    stop(): void {
        if (this.loggerInstance) {
            clearInterval(this.loggerInstance);
            this.loggerInstance = null;
            console.log(chalk.cyan("📝 Stopped sensor logging"));
        } else {
            console.log(chalk.yellow("⚠️ Sensor logging is not running"));
        }
    }

    /**
     * Restarts sensor logging by stopping and then starting again.
     * The app config is re-read on restart.
     */
    restart(): void {
        this.stop();
        this.start();
    }
}
