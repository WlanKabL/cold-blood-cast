import { computed } from "vue";
import type { PublicSensorResponse } from "~/../snake-link-raspberry/src/types/sensor";
import { ThermometerSun, Droplet, Waves, Gauge } from "lucide-vue-next";

/**
 * Composable that returns reactive icon component and color class
 * for a given sensor, based on type, status, and day/night from appConfig.
 */
export function useSensorHelpers(sensor: PublicSensorResponse) {
    const app = useAppConfigStore();

    // Compute current hour in configured timezone
    const currentHour = computed(() => {
        const tz = app.config?.general.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fmt = new Intl.DateTimeFormat("en-US", {
            hour12: false,
            hour: "2-digit",
            timeZone: tz,
        });
        return parseInt(fmt.format(new Date()), 10);
    });

    // Determine if it's day or night
    const isDay = computed(() => {
        if (!app.config) return true;
        const { dayStartHour, nightStartHour } = app.config.general;
        const h = currentHour.value;
        // handles when dayStart < nightStart or wraps midnight
        return dayStartHour < nightStartHour
            ? h >= dayStartHour && h < nightStartHour
            : h >= dayStartHour || h < nightStartHour;
    });

    // Icon selection
    const icon = computed(() => {
        switch (sensor.type) {
            case "temperature":
                return ThermometerSun;
            case "humidity":
                return Droplet;
            case "water":
                return Waves;
            case "pressure":
                return Gauge;
            default:
                return ThermometerSun;
        }
    });

    const textColor = computed(() => {
        switch (sensor.status) {
            case "ok":
                return "text-green-400";
            case "warning":
                return "text-yellow-400";
            case "unknown":
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    });

    const bgColor = computed(() => {
        switch (sensor.status) {
            case "ok":
                return "bg-green-600 text-white";
            case "warning":
                return "bg-yellow-600 text-white";
            case "unknown":
                return "bg-red-600 text-white";
            default:
                return "bg-gray-600 text-white";
        }
    });

    return { icon, textColor, bgColor, isDay };
}
