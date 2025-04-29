export function todayAsFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}.json`;
}

import { DateTime } from "luxon";
import { AppConfig } from "../types/config.js";
import { SensorConfig } from "../types/sensor.js";

export function isNight(appConfig: AppConfig): boolean {
    const now = DateTime.now().setZone(appConfig.general.timezone);
    const hour = now.hour;
    return hour < appConfig.general.dayStartHour || hour >= appConfig.general.nightStartHour;
}

export function getEffectiveRange(
    sensor: SensorConfig,
    appConfig: AppConfig,
): { min?: number; max?: number } {
    if (sensor.limitsType === "general")
        return { min: sensor.readingLimits.min, max: sensor.readingLimits.max };

    const night = isNight(appConfig);
    const range = night ? sensor.readingLimits.night : sensor.readingLimits.day;
    return { min: range.min, max: range.max };
}
