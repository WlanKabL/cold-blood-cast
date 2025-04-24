import { SensorConfig, SensorReading, SensorStatus } from "../types/sensor.js";

export function calculateSensorStatus(
    sensor: SensorConfig,
    reading: SensorReading | undefined | null,
): SensorStatus {
    if (!reading || reading.value == null) return "unknown";

    // Spezialfall: Typ "water" + Unit "present"
    if (sensor.type === "water" && sensor.unit === "present") {
        return reading.value === 1 ? "ok" : "warning";
    }

    if (sensor.min != null && sensor.max != null) {
        if (reading.value < sensor.min || reading.value > sensor.max) {
            return "warning";
        } else {
            return "ok";
        }
    }

    return "unknown";
}
