import { SensorReading } from "./sensor.js";

export type LogEntry = {
    timestamp: number;
    readings: Record<string, SensorReading>;
};
