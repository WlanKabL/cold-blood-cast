export type AppConfig = {
    general: GeneralConfig;
    sensorSystem: SensorSystemConfig;
};

export type GeneralConfig = {
    name: string;
};

export type SensorSystemConfig = {
    pollingIntervalMs: number; // z. B. 10_000
    retentionMinutes: number; // wie lange live daten gespeichert werden dürfen
    autoLogIntervalMs: number; // wie oft gespeichert wird
    logFileLimit: number; // max logs in Speicher
    remoteSyncEnabled: boolean;
};
