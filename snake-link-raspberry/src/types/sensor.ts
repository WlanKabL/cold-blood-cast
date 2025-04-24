import { z } from "zod";

/**
 * Zod schema and TS type for sensor type.
 */
export const SensorTypeSchema = z.enum(["temperature", "humidity", "water", "pressure"]);
export type SensorType = z.infer<typeof SensorTypeSchema>;

/**
 * Zod schemas and TS types for units.
 */
export const TemperatureUnitSchema = z.enum(["°C", "°F"]);
export type TemperatureUnit = z.infer<typeof TemperatureUnitSchema>;

export const HumidityUnitSchema = z.literal("%");
export type HumidityUnit = z.infer<typeof HumidityUnitSchema>;

export const WaterUnitSchema = z.enum(["present", "ml"]);
export type WaterUnit = z.infer<typeof WaterUnitSchema>;

export const PressureUnitSchema = z.enum(["hPa", "mmHg"]);
export type PressureUnit = z.infer<typeof PressureUnitSchema>;

export const ReaderSchema = z.enum(["mock", "dht11", "dht22", "bme280"]);
export type Reader = z.infer<typeof ReaderSchema>;

/**
 * Union of all sensor units.
 */
export const SensorUnitSchema = z.union([
    TemperatureUnitSchema,
    HumidityUnitSchema,
    WaterUnitSchema,
]);
export type SensorUnit = z.infer<typeof SensorUnitSchema>;

/**
 * Zod schema and TS type for hardware-specific sensor settings.
 */
export const SensorHardwareSchema = z.object({
    /**
     * GPIO pin number (e.g. for DHT22).
     */
    pin: z.number().int().optional(),

    /**
     * DHT sensor model: "11" for DHT11, "22" for DHT22.
     */
    model: z.enum(["11", "22"]).optional(),

    /**
     * I²C device address (e.g. for BME280).
     */
    i2cAddress: z.number().int().optional(),

    /**
     * I²C bus number to use (default is usually 1).
     */
    i2cBusNo: z.number().int().optional(),

    /**
     * Device path for serial/SPI sensors (e.g. '/dev/ttyUSB0').
     */
    device: z.string().optional(),

    /**
     * If true, use a mock implementation regardless of other fields.
     */
    mock: z.boolean().optional(),
});
export type SensorHardware = z.infer<typeof SensorHardwareSchema>;

/**
 * Zod schema and TS type for sensor configuration.
 */
export const SensorConfigSchema = z.object({
    /** Unique sensor identifier */
    id: z.string(),

    /** Human-readable sensor name */
    name: z.string(),

    /** Sensor category/type */
    type: SensorTypeSchema,

    /** Measurement unit */
    unit: SensorUnitSchema,

    /** Minimum acceptable value */
    min: z.number().optional(),

    /** Maximum acceptable value */
    max: z.number().optional(),

    /** Whether the sensor is active */
    active: z.boolean().optional(),

    /** Whether the sensor data is private */
    private: z.boolean().optional(),

    /** Define the used reader */
    reader: ReaderSchema.optional(),

    /** Hardware-specific settings */
    hardware: SensorHardwareSchema.optional(),
});
export type SensorConfig = z.infer<typeof SensorConfigSchema>;

/**
 * Zod schema and TS type for sensor readings.
 */
export const SensorReadingSchema = z.object({
    /** Sensor name */
    name: z.string(),

    /** Sensor category/type */
    type: SensorTypeSchema,

    /** Measured value, or null if unavailable */
    value: z.union([z.number(), z.null()]),

    /** Measurement unit */
    unit: SensorUnitSchema,

    /** Unix timestamp in milliseconds */
    timestamp: z.number().int(),
});
export type SensorReading = z.infer<typeof SensorReadingSchema>;

/**
 * Zod schema for a deep-partial version of SensorConfig,
 * allowing any subset of fields (including nested hardware).
 */
const PartialSensorConfigSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    type: SensorTypeSchema.optional(),
    unit: SensorUnitSchema.optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    active: z.boolean().optional(),
    private: z.boolean().optional(),
    hardware: SensorHardwareSchema.partial().optional(),
});

/**
 * Runtime guard: checks whether `input` is a valid partial
 * of SensorConfig (no extra keys, correct types).
 *
 * @param input The raw data to validate (e.g., JSON payload)
 * @returns true if input is Partial<SensorConfig>
 */
export function isValidPartialSensorConfig(input: unknown): input is Partial<SensorConfig> {
    return PartialSensorConfigSchema.safeParse(input).success;
}

/**
 * Zod schema and TS type for sensor configuration updates.
 * This is a deep-partial version of SensorConfig.
 *
 * @param input The raw data to validate (e.g., JSON payload)
 * @returns true if input is SensorConfig
 */
export function isValidSensorConfig(input: unknown): input is SensorConfig {
    return SensorConfigSchema.safeParse(input).success;
}

export type SensorStatus = "ok" | "warning" | "unknown";

/**
 * Returned sensor config in API, with reading & status.
 * Fields like `hardware`, `reader`, `private`, and `active` are omitted.
 */
export type PublicSensorResponse = Omit<
    SensorConfig,
    "hardware" | "reader" | "private" | "active"
> & {
    reading: SensorReading | null;
    status: SensorStatus;
};
