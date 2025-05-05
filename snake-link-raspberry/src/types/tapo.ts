export interface TapoLoginConfig {
    accountId: string;
    regTime: string;
    countryCode: string;
    riskDetected: number;
    nickname: string;
    email: string;
    token: string;
}

export interface TapoSmartDevice {
    deviceType: string;
    role: number;
    fwVer: string;
    appServerUrl: string;
    deviceRegion: string;
    deviceId: string;
    deviceName: string;
    deviceHwVer: string;
    alias: string;
    deviceMac: string;
    oemId: string;
    deviceModel: string;
    hwId: string;
    fwId: string;
    isSameRegion: boolean;
    appServerUrlV2: string;
    status: number;
}
