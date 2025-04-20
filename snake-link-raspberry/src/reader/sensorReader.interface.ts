import { SensorConfig, SensorReading } from "../types/sensor.js";

export interface SensorReader {
    read(config: SensorConfig): Promise<SensorReading>;
}
