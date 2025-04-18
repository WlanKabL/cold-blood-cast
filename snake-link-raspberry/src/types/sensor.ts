export type SensorType = "temperature" | "humidity" | "water" | "pressure";

export type TemperatureUnit = "°C" | "°F";
export type HumidityUnit = "%";
export type WaterUnit = "present" | "ml";

export type SensorUnit = TemperatureUnit | HumidityUnit | WaterUnit;

/**
 * Configuration for a sensor.
 */
export interface SensorConfig {
    id: string;
    name: string;
    type: SensorType;
    unit: SensorUnit;
    min?: number;
    max?: number;
    active?: boolean;
    hardware?: SensorHardware;
}

export interface SensorReading {
    name: string;
    type: SensorType;
    value: number | null;
    unit: SensorUnit;
    timestamp: number;
}

/**
 * Hardware-specific settings for a sensor.
 */
export interface SensorHardware {
    /**
     * GPIO pin number (e.g. for DHT22).
     */
    pin?: number;

    /**
     * DHT sensor model: "11" for DHT11, "22" for DHT22.
     */
    model?: "11" | "22";

    /**
     * I²C device address (e.g. for BME280).
     */
    i2cAddress?: number;

    /**
     * I²C bus number to use (default is usually 1).
     */
    i2cBusNo?: number;

    /**
     * Device path for serial/SPI sensors (e.g. '/dev/ttyUSB0').
     */
    device?: string;

    /**
     * If true, use a mock implementation regardless of other fields.
     */
    mock?: boolean;
}
