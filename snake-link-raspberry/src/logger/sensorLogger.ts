import chalk from "chalk";
import { FileStore } from "../storage/dataStorageService.js";
import { SensorReading } from "../types/sensor.js";
import { LogEntry } from "../types/logs.js";

export function startSensorLogging(
    liveStore: FileStore<Record<string, SensorReading>>,
    logStore: FileStore<LogEntry[]>,
    intervalMs: number,
) {
    console.log(chalk.cyan(`📝 Logging sensors every ${intervalMs / 1000}s...`));

    setInterval(() => {
        const readings = liveStore.load();
        const logs = logStore.load([]);
        const entry: LogEntry = {
            timestamp: Date.now(),
            readings,
        };

        logs.push(entry);

        // truncate if too long (later controlled by config)
        const maxEntries = 500;
        if (logs.length > maxEntries) logs.splice(0, logs.length - maxEntries);

        logStore.save(logs);

        console.log(chalk.gray(`📌 Logged ${Object.keys(readings).length} sensor(s)`));
    }, intervalMs);
}
