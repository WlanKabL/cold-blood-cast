import type { SensorConfig, SensorReading } from "@cold-blood-cast/shared";

export interface SensorReader {
    read(config: SensorConfig): Promise<SensorReading>;
}
