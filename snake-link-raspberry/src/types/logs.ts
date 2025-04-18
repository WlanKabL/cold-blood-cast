import { SensorReading } from "./sensor";

export type LogEntry = {
    timestamp: number;
    readings: Record<string, SensorReading>;
};
