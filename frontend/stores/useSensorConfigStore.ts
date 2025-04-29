import { defineStore } from "pinia";
import { configService } from "@/services/configService";
import type { SensorConfig } from "../../snake-link-raspberry/src/types/sensor";

export const useSensorConfigStore = defineStore("sensorConfig", {
    state: () => ({
        list: [] as SensorConfig[],
        current: null as SensorConfig | null,
        loading: false,
        error: "" as string,
    }),
    actions: {
        async fetchAll() {
            this.loading = true;
            this.error = "";
            try {
                this.list = await configService.getSensors();
            } catch (err: unknown) {
                this.error = (err as Error).message;
            } finally {
                this.loading = false;
            }
        },
        async createAll(sensors: SensorConfig[]) {
            this.loading = true;
            this.error = "";
            try {
                await configService.createSensors({ sensors });
                await this.fetchAll();
            } catch (err: unknown) {
                this.error = (err as Error).message;
            } finally {
                this.loading = false;
            }
        },
        async fetchOne(id: string) {
            this.loading = true;
            this.error = "";
            try {
                this.current = await configService.getSensor(id);
            } catch (err: unknown) {
                this.error = (err as Error).message;
            } finally {
                this.loading = false;
            }
        },
        async updateOne(updated: SensorConfig) {
            if (!updated.id) {
                this.error = "Missing sensor id";
                return;
            }
            this.loading = true;
            this.error = "";
            try {
                await configService.updateSensor(updated.id, updated);
                await this.fetchAll();
            } catch (err: unknown) {
                this.error = (err as Error).message;
            } finally {
                this.loading = false;
            }
        },
    },
});
