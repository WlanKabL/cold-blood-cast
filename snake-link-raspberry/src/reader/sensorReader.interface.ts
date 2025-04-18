import { SensorConfig, SensorReading } from "../types/sensor";

export interface SensorReader {
    read(config: SensorConfig): Promise<SensorReading>;
}
