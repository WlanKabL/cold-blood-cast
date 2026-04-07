// Re-export all sensor types from shared package
export {
    SensorConfigSchema,
    PartialSensorConfigSchema,
    SensorReadingSchema,
    SensorHardwareSchema,
    isValidSensorConfig,
    isValidPartialSensorConfig,
} from "@cold-blood-cast/shared";
export type {
    SensorConfig,
    PartialSensorConfig,
    SensorReading,
    SensorStatus,
    SensorType,
    TimeBasedLimits,
    PublicSensorResponse,
} from "@cold-blood-cast/shared";
