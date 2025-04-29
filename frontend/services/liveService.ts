export const liveService = {
    getLiveData(): Promise<unknown> {
        return useHttp().get<unknown>("/api/live").then((r) => r.data);
    },
    getLiveSensorData(sensorId: string): Promise<void> {
        return useHttp().get(`/api/live/${sensorId}`).then((r) => r.data);
    },
};
