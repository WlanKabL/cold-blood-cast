/**
 * @file dataStorageService.ts
 * @description Generic file-backed storage for JSON data, and factory for
 *              specific application stores (sensors, presets, logs, etc.).
 */

import fs from "fs";
import path from "path";
import type { SensorConfig, SensorReading } from "../types/sensor.js";
import type { PresetDefinition } from "../types/presets.js";
import type { AppConfig } from "../types/config.js";
import type { LogEntry } from "../types/logs.js";
import { User } from "../types/users.js";

/**
 * Generic JSON file store.
 * @template T The shape of the data to store.
 */
export class FileStore<T> {
    private fallback: T;

    /**
     * @param filePath - Full path to the JSON file.
     * @param defaultData - Initial data if the file does not exist.
     */
    constructor(
        private filePath: string,
        defaultData?: T,
    ) {
        this.fallback = defaultData ?? ({} as T);
    }

    /**
     * Checks if the JSON file exists.
     * @returns True if the file exists.
     */
    exists(): boolean {
        return fs.existsSync(this.filePath);
    }

    /**
     * Ensures the directory and file exist.
     * If the file is missing, writes `data` or the fallback to disk.
     *
     * @param data - Optional override data for initial write.
     */
    private ensureFile(data?: T): void {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.filePath)) {
            const initial = data ?? this.fallback;
            fs.writeFileSync(this.filePath, JSON.stringify(initial, null, 2), "utf-8");
        }
    }

    /**
     * Loads and parses the JSON file.
     * Falls back to `overrideDefault` or the initial default on error/empty.
     *
     * @param overrideDefault - Data to use if file is empty or invalid.
     * @returns Parsed data of type T.
     */
    load(overrideDefault?: T): T {
        const fallback = overrideDefault ?? this.fallback;
        this.ensureFile(fallback);

        try {
            const raw = fs.readFileSync(this.filePath, "utf-8").trim();
            if (!raw) return fallback;
            return JSON.parse(raw) as T;
        } catch {
            return fallback;
        }
    }

    /**
     * Overwrites the JSON file with `data`.
     *
     * @param data - The data to write.
     */
    save(data: T): void {
        // ensure directory exists (but not file)
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 4), "utf-8");
    }
}

/**
 * Factory for all application file stores.
 */
export class DataStorageService {
    /**
     * @param basePath - Base directory for all JSON files.
     */
    constructor(private basePath = "./data") {}

    /**
     * Live sensor readings (keyed by sensor ID).
     */
    getLiveDataStore(): FileStore<Record<string, SensorReading>> {
        return new FileStore(path.join(this.basePath, "liveData.json"), {});
    }

    /**
     * Sensor configuration store.
     */
    getSensorConfigStore(): FileStore<{ sensors: SensorConfig[] }> {
        return new FileStore(path.join(this.basePath, "sensor.configs.json"), {
            sensors: [],
        });
    }

    /**
     * Preset definitions store.
     */
    getPresetsStore(): FileStore<Record<string, PresetDefinition>> {
        return new FileStore(path.join(this.basePath, "presets.json"), {});
    }

    /**
     * Application configuration store.
     */
    getAppConfigStore(): FileStore<AppConfig> {
        return new FileStore(path.join(this.basePath, "app.config.json"), {
            general: {
                name: "ColdBloodCast",
                dayStartHour: 8,
                nightStartHour: 20,
                timezone: "Europe/Berlin",
            },
            sensorSystem: {
                pollingIntervalMs: 10_000,
                retentionMinutes: 60,
                autoLogIntervalMs: 60_000,
                logFileLimit: 100,
                remoteSyncEnabled: false,
                alertCooldownMs: 1000,
            },
        });
    }

    /**
     * Historical sensor logs (array of entries).
     */
    getSensorLogStore(): FileStore<LogEntry[]> {
        return new FileStore(path.join(this.basePath, "sensor.logs.json"), []);
    }

    getRegistrationKeysStore(): FileStore<string[]> {
        return new FileStore(path.join(this.basePath, "registration.keys.json"), []);
    }

    getUserStore(): FileStore<User[]> {
        return new FileStore(path.join(this.basePath, "users.json"), []);
    }

    getTelegramRegistrationKeysStore(): FileStore<string[]> {
        return new FileStore(path.join(this.basePath, "telegram.registration.keys.json"), []);
    }

    getSubscriberStore(): FileStore<number[]> {
        return new FileStore(path.join(this.basePath, "subscribers.json"), []);
    }
}
