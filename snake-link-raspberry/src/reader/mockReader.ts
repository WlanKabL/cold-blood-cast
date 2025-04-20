import { SensorReader } from "./sensorReader.interface.js";
import { SensorConfig, SensorReading } from "../types/sensor.js";

export class MockReader implements SensorReader {
    async read(config: SensorConfig): Promise<SensorReading> {
        const value =
            config.type === "temperature"
                ? this.random(22, 34)
                : config.type === "humidity"
                  ? this.random(30, 70)
                  : config.type === "water"
                    ? this.random(0, 1, 0)
                    : this.random(0, 100);

        return {
            name: config.name,
            type: config.type,
            value,
            unit: config.unit,
            timestamp: Date.now(),
        };
    }

    private random(min: number, max: number, fixed = 1) {
        return +(Math.random() * (max - min) + min).toFixed(fixed);
    }
}
