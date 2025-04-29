import type { AppConfig } from "../../snake-link-raspberry/src/types/config";
import type { SensorConfig } from "../../snake-link-raspberry/src/types/sensor";

export const configService = {
    // ---- AppConfig ----
    getAppConfig(): Promise<AppConfig> {
        return useHttp().get<AppConfig>("/api/config/app").then((r) => r.data);
    },
    updateAppConfig(payload: Partial<AppConfig>): Promise<void> {
        return useHttp().post("/api/config/app", payload).then(() => {});
    },

    // ---- Sensors ----
    getSensors(): Promise<SensorConfig[]> {
        return useHttp().get<SensorConfig[]>("/api/config/sensors").then((r) => r.data);
    },
    createSensors(payload: { sensors: SensorConfig[] }): Promise<void> {
        return useHttp().post("/api/config/sensors", payload).then(() => {});
    },
    getSensor(id: string): Promise<SensorConfig> {
        return useHttp().get<SensorConfig>(`/api/config/sensor/${id}`).then((r) => r.data);
    },
    updateSensor(id: string, payload: SensorConfig): Promise<void> {
        return useHttp().put(`/api/config/sensor/${id}`, payload).then(() => {});
    },
};
