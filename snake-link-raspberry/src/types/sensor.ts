import { z } from "zod";

/**
 * Primitive schemas reused below...
 */
const SensorTypeSchema = z.enum(["temperature", "humidity", "water", "pressure"]);
const TemperatureUnitSchema = z.enum(["°C", "°F"]);
const HumidityUnitSchema = z.literal("%");
const WaterUnitSchema = z.enum(["present", "ml"]);
const PressureUnitSchema = z.enum(["hPa", "mmHg"]);
const SensorUnitSchema = z.union([
    TemperatureUnitSchema,
    HumidityUnitSchema,
    WaterUnitSchema,
    PressureUnitSchema,
]);
const ReaderSchema = z.enum(["mock", "dht11", "dht22", "bme280"]);
const SensorHardwareBase = z.object({
    pin: z.number().int().optional(),
    model: z.enum(["11", "22"]).optional(),
    i2cAddress: z.number().int().optional(),
    i2cBusNo: z.number().int().optional(),
    device: z.string().optional(),
    mock: z.boolean().optional(),
});

export const SensorHardwareSchema = SensorHardwareBase.optional();

/**
 * Two kinds of limits:
 */
const GeneralLimitsSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional(),
});

const TimeBasedLimitsSchema = z.object({
    day: GeneralLimitsSchema,
    night: GeneralLimitsSchema,
});

/**
 * Now the SensorConfig is a discriminated union on `limitsType`.
 */
export const SensorConfigSchema = z.discriminatedUnion("limitsType", [
    // variant #1: flat/general limits
    z
        .object({
            limitsType: z.literal("general"),
            readingLimits: GeneralLimitsSchema,
        })
        .extend({
            id: z.string(),
            name: z.string(),
            type: SensorTypeSchema,
            unit: SensorUnitSchema,
            active: z.boolean().optional(),
            private: z.boolean().optional(),
            reader: ReaderSchema.optional(),
            hardware: SensorHardwareSchema,
        }),

    // variant #2: time-based limits
    z
        .object({
            limitsType: z.literal("timeBased"),
            readingLimits: TimeBasedLimitsSchema,
        })
        .extend({
            id: z.string(),
            name: z.string(),
            type: SensorTypeSchema,
            unit: SensorUnitSchema,
            active: z.boolean().optional(),
            private: z.boolean().optional(),
            reader: ReaderSchema.optional(),
            hardware: SensorHardwareSchema,
        }),
]);

export type SensorConfig = z.infer<typeof SensorConfigSchema>;

/**
 * Deep-partial for updates (you can omit any fields, but if you include
 * limitsType you must also include a matching readingLimits).
 */
export const PartialSensorConfigSchema = z
    .object({
        limitsType: z.enum(["general", "timeBased"]).optional(),
        readingLimits: z
            .union([GeneralLimitsSchema.partial(), TimeBasedLimitsSchema.partial()])
            .optional(),

        id: z.string().optional(),
        name: z.string().optional(),
        type: SensorTypeSchema.optional(),
        unit: SensorUnitSchema.optional(),
        active: z.boolean().optional(),
        private: z.boolean().optional(),
        reader: ReaderSchema.optional(),

        // <-- call .partial() on the base, then make it optional
        hardware: SensorHardwareBase.partial().optional(),
    })
    .refine(
        (o) =>
            (o.limitsType === undefined && o.readingLimits === undefined) ||
            (o.limitsType !== undefined && o.readingLimits !== undefined),
        {
            message:
                "readingLimits must be provided whenever limitsType is specified, and both omitted together",
        },
    );

export type PartialSensorConfig = z.infer<typeof PartialSensorConfigSchema>;

/**
 * Schema for live readings & the public-response type:
 */
export const SensorReadingSchema = z.object({
    name: z.string(),
    type: SensorTypeSchema,
    value: z.union([z.number(), z.null()]),
    unit: SensorUnitSchema,
    timestamp: z.number().int(),
});
export type SensorReading = z.infer<typeof SensorReadingSchema>;

export type SensorStatus = "ok" | "warning" | "unknown";
export type SensorType = z.infer<typeof SensorTypeSchema>;

export type PublicSensorResponse = Omit<
    SensorConfig,
    "hardware" | "reader" | "private" | "active"
> & {
    reading: SensorReading | null;
    status: SensorStatus;
};

/**
 * Runtime guards
 */
export function isValidSensorConfig(input: unknown): input is SensorConfig {
    return SensorConfigSchema.safeParse(input).success;
}

export function isValidPartialSensorConfig(input: unknown): input is PartialSensorConfig {
    return PartialSensorConfigSchema.safeParse(input).success;
}
