// src/services/sensorWatchingService.ts
import chalk from "chalk";
import type { FileStore } from "../storage/dataStorageService.js";
import type { SensorConfig, SensorReading, SensorStatus, AppConfig } from "@cold-blood-cast/shared";
import { calculateSensorStatus } from "../utils/sensorStatus.js";
import { broadcastAlert } from "./alert.service.js";

/**
 * Watches sensor readings and fires exactly one alert per
 * status‐transition (ok→warning/unknown or warning/unknown→ok).
 */
export class SensorWatchingService {
    private timer: NodeJS.Timeout | null = null;
    private lastStatus = new Map<string, SensorStatus>();

    constructor(
        private configStore: FileStore<{ sensors: SensorConfig[] }>,
        private liveStore: FileStore<Record<string, SensorReading>>,
        private appConfigStore: FileStore<AppConfig>,
    ) {}

    start() {
        const interval = this.appConfigStore.load().sensorSystem.pollingIntervalMs;
        console.log(chalk.cyan(`🔎 SensorWatchingService starting (every ${interval / 1000}s)…`));
        this.checkAllSensors();
        this.timer = setInterval(() => this.checkAllSensors(), interval);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log(chalk.cyan("🔎 SensorWatchingService stopped."));
        }
    }

    private async checkAllSensors() {
        const { sensors = [] } = this.configStore.load();
        const live = this.liveStore.load();

        for (const sensor of sensors) {
            if (sensor.active === false) continue;

            const reading = live[sensor.id] ?? null;
            const status = calculateSensorStatus(
                sensor,
                reading,
                this.appConfigStore.load().general,
            );
            const prev = this.lastStatus.get(sensor.id) ?? "ok";

            if (status !== prev) {
                // log recovery or new alarm
                if (status === "ok") {
                    console.log(chalk.green(`✅ ${sensor.id} recovered (${prev}→ok)`));
                } else {
                    console.log(chalk.yellow(`🚨 ${sensor.id} ${prev}→${status}, sending alert…`));
                    try {
                        await broadcastAlert(sensor, status, reading);
                    } catch (err: any) {
                        console.error(
                            chalk.red(`❌ Failed to send alert for ${sensor.id}:`),
                            err.message,
                        );
                    }
                }
                this.lastStatus.set(sensor.id, status);
            }
        }
    }
}
