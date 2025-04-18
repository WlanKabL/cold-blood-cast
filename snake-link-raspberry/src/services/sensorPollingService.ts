/**
 * sensorPollingService.ts
 *
 * Polls configured sensors at regular intervals, stores the latest readings,
 * and optionally broadcasts them to a listener.
 * Provides a controller to stop the polling loop when needed.
 */

import chalk from "chalk";
import { FileStore } from "../storage/dataStorageService.js";
import { getReaderForSensor } from "../reader/readerFactory.js";
import type { SensorConfig, SensorReading } from "../types/sensor.js";
import type { AppConfig } from "../types/config.js";

/**
 * Default polling interval in milliseconds (10 seconds).
 */
const DEFAULT_POLLING_INTERVAL_MS = 10_000;

/**
 * Cache of SensorReader instances by sensor ID to avoid re-instantiation.
 */
const readerCache = new Map<string, ReturnType<typeof getReaderForSensor>>();

/**
 * Controller returned by startSensorPolling, allows stopping the polling loop.
 */
export interface PollingController {
    /** Stops the ongoing polling loop. */
    stop: () => void;
}

/**
 * Starts a polling loop that reads all active sensors, saves their readings,
 * and optionally broadcasts the results.
 *
 * @param configStore - FileStore containing an object with `sensors: SensorConfig[]`.
 * @param liveStore - FileStore for saving the latest readings (keyed by sensor ID).
 * @param appConfigStore - FileStore containing AppConfig with optional pollingIntervalMs.
 * @param broadcast - Optional callback to broadcast the readings externally.
 * @returns A PollingController with a `stop()` method.
 */
export function startSensorPolling(
    configStore: FileStore<{ sensors: SensorConfig[] }>,
    liveStore: FileStore<Record<string, SensorReading>>,
    appConfigStore: FileStore<AppConfig>,
    broadcast?: (data: Record<string, SensorReading>) => void,
): PollingController {
    const appConfig = appConfigStore.load();
    const intervalMs = appConfig.sensorSystem?.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS;

    const useMock = process.env.USE_MOCK === "true";

    console.log(
        chalk.cyan(`📡 Polling sensors every ${intervalMs / 1000}s (Mock mode: ${useMock})...`),
    );

    let timerId: NodeJS.Timeout;

    /**
     * Performs one polling cycle: reads each active sensor, saves results, broadcasts,
     * then schedules the next cycle.
     * @private
     */
    const pollSensors = async (): Promise<void> => {
        const { sensors = [] } = configStore.load();
        const activeSensors = sensors.filter((s) => s.active !== false);
        const readings: Record<string, SensorReading> = {};

        for (const sensor of activeSensors) {
            console.log(chalk.gray(`🔍 Reading sensor: ${sensor.id}`));
            try {
                const sensorConfig =
                    useMock && sensor.hardware ? { ...sensor, hardware: { mock: true } } : sensor;

                let reader = readerCache.get(sensorConfig.id);
                if (!reader) {
                    reader = getReaderForSensor(sensorConfig);
                    readerCache.set(sensorConfig.id, reader);
                }

                const result = await reader.read(sensorConfig);
                if (!result) {
                    console.warn(chalk.yellow(`⚠️ No reading from sensor ${sensor.id}`));
                    continue;
                }

                readings[sensor.id] = result;
            } catch (err: unknown) {
                console.error(
                    chalk.red(`❌ Failed to read sensor ${sensor.id}:`),
                    (err as Error).message,
                );
            }
        }

        // Save and broadcast
        liveStore.save(readings);
        if (broadcast) {
            try {
                broadcast(readings);
            } catch (err: unknown) {
                console.error(chalk.red("❌ Broadcast failed:"), (err as Error).message);
            }
        }

        console.log(
            chalk.gray(
                `✅ Polled ${
                    Object.keys(readings).length
                } sensor(s) at ${new Date().toISOString()}`,
            ),
        );

        // Schedule next poll
        timerId = setTimeout(pollSensors, intervalMs);
    };

    // Start first poll immediately
    timerId = setTimeout(pollSensors, 0);

    return {
        stop: () => {
            clearTimeout(timerId);
            console.log(chalk.cyan("🛑 Stopped sensor polling."));
        },
    };
}
