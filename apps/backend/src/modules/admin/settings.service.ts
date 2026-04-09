import { prisma } from "@/config/database.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { SYSTEM_SETTING_KEYS, type SystemSettingKey } from "@cold-blood-cast/shared";

export async function getSystemSettings() {
    return prisma.systemSetting.findMany({
        orderBy: { key: "asc" },
    });
}

export async function getSystemSetting<T = unknown>(key: string, defaultValue?: T): Promise<T> {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) return defaultValue as T;
    try {
        return JSON.parse(setting.value) as T;
    } catch {
        return setting.value as T;
    }
}

export async function updateSystemSetting(key: string, value: unknown) {
    if (!SYSTEM_SETTING_KEYS.includes(key as SystemSettingKey)) {
        throw badRequest(
            ErrorCodes.E_VALIDATION_ERROR,
            `Invalid setting key: ${key}. Valid keys: ${SYSTEM_SETTING_KEYS.join(", ")}`,
        );
    }

    const jsonValue = JSON.stringify(value);
    return prisma.systemSetting.upsert({
        where: { key },
        update: { value: jsonValue },
        create: { key, value: jsonValue },
    });
}
