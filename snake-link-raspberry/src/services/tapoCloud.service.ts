import axios from "axios";
import { FileStore } from "../storage/dataStorageService.js";

const CLOUD_URL = "https://eu-wap.tplinkcloud.com";

interface TapoLoginConfig {
    accountId: string;
    regTime: string;
    countryCode: string;
    riskDetected: number;
    nickname: string;
    email: string;
    token: string;
}

export class TapoCloudService {
    private email: string;
    private password: string;
    private terminalUUID: string = "59284a9c-e7b1-40f9-8ecd-b9e70c90d19b";
    private cloudTokenStore: FileStore<TapoLoginConfig | {}>;
    private deviceStore: FileStore<any[]>;

    constructor(
        email: string,
        password: string,
        cloudTokenStore: FileStore<TapoLoginConfig | {}>,
        deviceStore: FileStore<any[]>,
    ) {
        this.email = email;
        this.password = password;
        this.cloudTokenStore = cloudTokenStore;
        this.deviceStore = deviceStore;
    }

    /**
     * Get valid cloudToken, logging in if necessary.
     */
    private async getToken(): Promise<string> {
        const loginConfig = this.cloudTokenStore.load() as TapoLoginConfig;

        if (loginConfig && loginConfig.token) {
            try {
                const res = await axios.post(`${CLOUD_URL}?token=${loginConfig.token}`, {
                    method: "getDeviceList",
                });

                if (res.data.error_code === 0) {
                    return loginConfig.token;
                }
            } catch (_) {
                // continue to login
            }
        }

        const res = await axios.post(CLOUD_URL, {
            method: "login",
            params: {
                appType: "Tapo_Android",
                cloudUserName: this.email,
                cloudPassword: this.password,
                terminalUUID: this.terminalUUID,
            },
        });

        if (res.data.error_code !== 0) throw new Error("Login failed: " + res.data.msg);

        const newLoginConfig = res.data.result as TapoLoginConfig;
        this.cloudTokenStore.save(newLoginConfig);
        return newLoginConfig.token;
    }

    /**
     * List all smart plugs from the cloud and cache them.
     */
    async fetchDevices(): Promise<any[]> {
        const token = await this.getToken();
        const res = await axios.post(`${CLOUD_URL}?token=${token}`, {
            method: "getDeviceList",
        });

        if (res.data.error_code !== 0) throw new Error("Device listing failed: " + res.data.msg);

        const devices = res.data.result.deviceList.map((device: any) => ({
            ...device,
            alias: Buffer.from(device.alias, "base64").toString("utf-8"),
        }));

        this.deviceStore.save(devices);
        return devices;
    }

    /**
     * Get latest cached devices.
     */
    getCachedDevices(): any[] {
        return this.deviceStore.load();
    }

    /**
     * Query current device status from cloud.
     */
    async getDeviceStatus(deviceId: string): Promise<any> {
        const token = await this.getToken();
        const res = await axios.post(`${CLOUD_URL}?token=${token}`, {
            method: "passthrough",
            params: {
                deviceId,
                requestData: JSON.stringify({
                    method: "get_device_info",
                }),
            },
        });

        if (res.data.error_code !== 0) throw new Error("Device status failed: " + res.data.msg);

        return JSON.parse(res.data.result.response);
    }

    /**
     * Turn on a device using its deviceId.
     */
    async turnOn(deviceId: string): Promise<void> {
        await this.controlDevice(deviceId, true);
    }

    /**
     * Turn off a device using its deviceId.
     */
    async turnOff(deviceId: string): Promise<void> {
        await this.controlDevice(deviceId, false);
    }

    /**
     * Internal method to toggle device state via cloud.
     */
    private async controlDevice(deviceId: string, turnOn: boolean): Promise<void> {
        const token = await this.getToken();
        const res = await axios.post(`${CLOUD_URL}?token=${token}`, {
            method: "passthrough",
            params: {
                deviceId,
                requestData: JSON.stringify({
                    method: "set_device_info",
                    params: {
                        device_on: turnOn,
                    },
                }),
            },
        });

        if (res.data.error_code !== 0) {
            console.error("🔧 CONTROL ERROR:", {
                deviceId,
                token,
                raw: res.data,
            });
            throw new Error("Device control failed: " + res.data.msg);
        }
    }
}
