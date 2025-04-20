import { z } from "zod";

const GeneralConfigSchema = z.object({ name: z.string() });
const SensorSystemConfigSchema = z.object({
    pollingIntervalMs: z.number().int(),
    retentionMinutes: z.number().int(),
    autoLogIntervalMs: z.number().int(),
    logFileLimit: z.number().int(),
    remoteSyncEnabled: z.boolean(),
});

export const AppConfigSchema = z.object({
    general: GeneralConfigSchema,
    sensorSystem: SensorSystemConfigSchema,
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

/** 1) make each nested schema partial (all its keys optional) */
const PartialGeneralConfigSchema = GeneralConfigSchema.partial();
const PartialSensorSystemConfigSchema = SensorSystemConfigSchema.partial();

/**
 * 2) allow the entire nested object to be omitted
 *    (so top-level keys become optional)
 */
export const PartialAppConfigSchema = z.object({
    general: PartialGeneralConfigSchema.optional(),
    sensorSystem: PartialSensorSystemConfigSchema.optional(),
});

/** Runtime guard for ANY partial of AppConfig */
export function isValidPartialAppConfig(input: unknown): input is Partial<AppConfig> {
    return PartialAppConfigSchema.safeParse(input).success;
}
