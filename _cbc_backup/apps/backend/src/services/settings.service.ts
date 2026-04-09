import { prisma } from "../db/client.js";

export async function getSystemSettings() {
    return prisma.systemSetting.findMany({
        select: { id: true, key: true, value: true },
        orderBy: { key: "asc" },
    });
}

export async function getSystemSetting(key: string): Promise<string | null> {
    const s = await prisma.systemSetting.findUnique({ where: { key } });
    return s?.value ?? null;
}

export async function updateSystemSetting(key: string, value: string) {
    return prisma.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
    });
}

// Convenience getters
export async function isMaintenanceMode(): Promise<boolean> {
    const val = await getSystemSetting("maintenance_mode");
    return val === "true";
}

export async function getRegistrationMode(): Promise<string> {
    const val = await getSystemSetting("registration_mode");
    return val ?? "open"; // "open" | "invite_only" | "closed"
}
