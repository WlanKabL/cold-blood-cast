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

/**
 * Reader types (sensor hardware backend).
 */
export const ReaderSchema = z.enum(["mock", "dht11", "dht22", "bme280"]);
export type Reader = z.infer<typeof ReaderSchema>;

/**
 * Union of all sensor units.
 */
export const SensorUnitSchema = z.union([
    TemperatureUnitSchema,
    HumidityUnitSchema,
    WaterUnitSchema,
    PressureUnitSchema,
]);
export type SensorUnit = z.infer<typeof SensorUnitSchema>;

/**
 * Zod schema and TS type for hardware-specific sensor settings.
 */
export const SensorHardwareSchema = z.object({
    pin: z.number().int().optional(),
    model: z.enum(["11", "22"]).optional(),
    i2cAddress: z.number().int().optional(),
    i2cBusNo: z.number().int().optional(),
    device: z.string().optional(),
    mock: z.boolean().optional(),
});
export type SensorHardware = z.infer<typeof SensorHardwareSchema>;

/**
 * Zod schema for time-based limits (different min/max for day and night).
 */
export const TimeBasedLimitsSchema = z.object({
    day: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
    }),
    night: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
    }),
});
export type TimeBasedLimits = z.infer<typeof TimeBasedLimitsSchema>;

/**
 * Zod schema and TS type for sensor configuration.
 */
export const SensorConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: SensorTypeSchema,
    unit: SensorUnitSchema,
    timeBasedLimits: TimeBasedLimitsSchema.optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    active: z.boolean().optional(),
    private: z.boolean().optional(),
    reader: ReaderSchema.optional(),
    hardware: SensorHardwareSchema.optional(),
});
export type SensorConfig = z.infer<typeof SensorConfigSchema>;

/**
 * Zod schema and TS type for sensor readings.
 */
export const SensorReadingSchema = z.object({
    name: z.string(),
    type: SensorTypeSchema,
    value: z.union([z.number(), z.null()]),
    unit: SensorUnitSchema,
    timestamp: z.number().int(),
});
export type SensorReading = z.infer<typeof SensorReadingSchema>;

/**
 * Zod schema for a deep-partial version of SensorConfig.
 */
export const PartialSensorConfigSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    type: SensorTypeSchema.optional(),
    unit: SensorUnitSchema.optional(),
    timeBasedLimits: TimeBasedLimitsSchema.optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    active: z.boolean().optional(),
    private: z.boolean().optional(),
    reader: ReaderSchema.optional(),
    hardware: SensorHardwareSchema.partial().optional(),
});
export type PartialSensorConfig = z.infer<typeof PartialSensorConfigSchema>;

/**
 * Runtime guard: checks whether input is a valid partial SensorConfig.
 */
export function isValidPartialSensorConfig(input: unknown): input is PartialSensorConfig {
    return PartialSensorConfigSchema.safeParse(input).success;
}

/**
 * Runtime guard: checks whether input is a valid full SensorConfig.
 */
export function isValidSensorConfig(input: unknown): input is SensorConfig {
    return SensorConfigSchema.safeParse(input).success;
}

/**
 * Sensor status types for UI / API feedback.
 */
export type SensorStatus = "ok" | "warning" | "unknown";

/**
 * Public API response type: SensorConfig without internal-only fields.
 */
export type PublicSensorResponse = Omit<
    SensorConfig,
    "hardware" | "reader" | "private" | "active"
> & {
    reading: SensorReading | null;
    status: SensorStatus;
};
