import type {
    SensorStatus,
    SensorType,
} from "~/../snake-link-raspberry/src/types/sensor";

export function getSensorIcon(type: SensorType) {
    switch (type) {
        case "temperature":
            return "ThermometerSun";
        case "humidity":
            return "Droplet";
        case "water":
            return "Waves";
        case "pressure":
            return "GaugeCircle";
        default:
            return "ThermometerSun";
    }
}

export function getSensorColor(type: SensorStatus) {
    switch (type) {
        case "unknown":
            return "text-red-400";
        case "warning":
            return "text-yellow-400";
        case "ok":
            return "text-green-400";
        default:
            return "text-grey-400";
    }
}