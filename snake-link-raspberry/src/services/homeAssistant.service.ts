import axios from "axios";
import { FileStore } from "../storage/dataStorageService.js";
import type { HassDevice } from "../types/hass.js";
import { validateEnv } from "../config.js";

const env = validateEnv(process.env);
const HASS_URL = env.HOME_ASSISTANT_URL;
const HASS_TOKEN = env.HOME_ASSISTANT_TOKEN;

export class HomeAssistantService {
    private deviceStore: FileStore<HassDevice[]>;

    constructor(deviceStore: FileStore<HassDevice[]>) {
        this.deviceStore = deviceStore;
    }

    private get headers() {
        return {
            Authorization: `Bearer ${HASS_TOKEN}`,
            "Content-Type": "application/json",
        };
    }

    private async get<T>(path: string) {
        const res = await axios.get<T>(`${HASS_URL}${path}`, { headers: this.headers });
        return res.data;
    }

    private async post<T>(path: string, body: any): Promise<T> {
        const res = await axios.post<T>(`${HASS_URL}${path}`, body, { headers: this.headers });
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
