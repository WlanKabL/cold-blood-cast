import axios from "axios";
import { FileStore } from "../storage/dataStorageService.js";
import type { HassDevice } from "@cold-blood-cast/shared";
import { validateEnv } from "../config.js";

function getEnv() {
    const env = validateEnv(process.env);
    return { url: env.HOME_ASSISTANT_URL, token: env.HOME_ASSISTANT_TOKEN };
}

export class HomeAssistantService {
    private deviceStore: FileStore<HassDevice[]>;

    constructor(deviceStore: FileStore<HassDevice[]>) {
        this.deviceStore = deviceStore;
    }

    private get headers() {
        const { token } = getEnv();
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    private async get<T>(path: string) {
        const { url } = getEnv();
        const res = await axios.get<T>(`${url}${path}`, { headers: this.headers });
        return res.data;
    }

    private async post<T>(path: string, body: any): Promise<T> {
        const { url } = getEnv();
        const res = await axios.post<T>(`${url}${path}`, body, { headers: this.headers });
        return res.data;
    }

    async fetchDevices(): Promise<HassDevice[]> {
        const devices = await this.get<HassDevice[]>("/api/states");
        this.deviceStore.save(devices);
        return devices;
    }

    getCachedDevices(): HassDevice[] {
        return this.deviceStore.load();
    }

    async getDeviceStatus(entityId: string): Promise<any> {
        return await this.get(`/api/states/${entityId}`);
    }

    async turnOn(entityId: string): Promise<void> {
        await this.post(`/api/services/homeassistant/turn_on`, { entity_id: entityId });
    }

    async turnOff(entityId: string): Promise<void> {
        await this.post(`/api/services/homeassistant/turn_off`, { entity_id: entityId });
    }

    async getDomains(): Promise<string[]> {
        const devices = await this.fetchDevices();
        const domains = new Set(devices.map((d) => d.entity_id.split(".")[0]));
        return Array.from(domains);
    }

    async getAvailableServices(): Promise<any> {
        return await this.get("/api/services");
    }
}
