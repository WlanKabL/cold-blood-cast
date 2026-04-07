// Sensor types & schemas
export {
    SensorConfigSchema,
    PartialSensorConfigSchema,
    SensorReadingSchema,
    SensorHardwareSchema,
    isValidSensorConfig,
    isValidPartialSensorConfig,
} from "./sensor.js";
export type {
    SensorConfig,
    PartialSensorConfig,
    SensorReading,
    SensorStatus,
    SensorType,
    TimeBasedLimits,
    PublicSensorResponse,
} from "./sensor.js";

// Config types & schemas
export {
    AppConfigSchema,
    PartialAppConfigSchema,
    isValidPartialAppConfig,
    isValidAppConfig,
} from "./config.js";
export type { AppConfig } from "./config.js";

// Log types
export type { LogEntry } from "./logs.js";

// User types & schemas
export {
    UserPermissionsSchema,
    UserSchema,
    isValidPartialUser,
    isValidPartialUserPermissions,
    isValidUser,
    isValidUserPermissions,
} from "./users.js";
export type { UserPermissions, User } from "./users.js";

// Preset types
export type { PresetDefinition } from "./presets.js";

// Home Assistant types
export type { HassDevice } from "./hass.js";
