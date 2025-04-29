import { AppConfig } from "../types/config.js";
import { SensorConfig, SensorReading, SensorStatus } from "../types/sensor.js";

/**
 * Determines OK / warning / unknown for a given sensor + reading.
 *
 * @param sensor          the SensorConfig, including readingLimits + limitsType
 * @param reading         the latest reading or null/undefined
 * @param generalConfig   from AppConfig.general: { dayStartHour, nightStartHour, timezone }
 */
export function calculateSensorStatus(
    sensor: SensorConfig,
    reading: SensorReading | undefined | null,
    generalConfig: AppConfig["general"],
): SensorStatus {
    // 1) no reading → unknown
    if (!reading || reading.value == null) return "unknown";

    // 2) water-present special case
    if (sensor.type === "water" && sensor.unit === "present") {
        return reading.value === 1 ? "ok" : "warning";
    }

    // 3) figure out which min/max to use
    let min: number | undefined;
    let max: number | undefined;

    // a) timeBased limits
    if (sensor.limitsType === "timeBased" && sensor.readingLimits) {
        // get current hour in configured timezone
        const hourString = new Intl.DateTimeFormat("en-US", {
            hour12: false,
            hour: "2-digit",
            timeZone: generalConfig.timezone,
        }).format(new Date());
        const hour = parseInt(hourString, 10);

        const { dayStartHour, nightStartHour } = generalConfig;
        const { day, night } = sensor.readingLimits;

        // normal day/night split
        if (dayStartHour < nightStartHour) {
            if (hour >= dayStartHour && hour < nightStartHour) {
                min = day.min;
                max = day.max;
            } else {
                min = night.min;
                max = night.max;
            }
        }
        // wrap-around midnight (e.g. day starts at 20, night at 6)
        else {
            if (hour >= dayStartHour || hour < nightStartHour) {
                min = day.min;
                max = day.max;
            } else {
                min = night.min;
                max = night.max;
            }
        }
    }
    // b) general (flat) limits
    else if (sensor.limitsType === "general" && sensor.readingLimits) {
        min = sensor.readingLimits.min;
        max = sensor.readingLimits.max;
    }
    // no valid limits → unknown
    else {
        return "unknown";
    }

    // 4) compare
    if (min != null && max != null) {
        return reading.value < min || reading.value > max ? "warning" : "ok";
    }

    return "unknown";
}
