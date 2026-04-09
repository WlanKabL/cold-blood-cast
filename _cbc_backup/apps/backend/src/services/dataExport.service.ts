import crypto from "crypto";
import { prisma } from "../db/client.js";
import { notFound } from "../helpers/errors.js";

export async function requestDataExport(userId: string) {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return prisma.dataExport.create({
        data: { userId, status: "PENDING", token, expiresAt },
    });
}

export async function listUserDataExports(userId: string) {
    return prisma.dataExport.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
}

export async function generateDataExport(exportId: string) {
    const exportRecord = await prisma.dataExport.findUnique({ where: { id: exportId } });
    if (!exportRecord) throw notFound("Data export not found");

    try {
        const user = await prisma.user.findUnique({
            where: { id: exportRecord.userId },
            include: {
                enclosures: { include: { sensors: true, pets: true } },
                loginSessions: {
                    select: { id: true, ipAddress: true, userAgent: true, createdAt: true },
                },
                cookieConsents: true,
            },
        });

        if (!user) throw notFound("User not found");

        const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                lastActiveAt: user.lastActiveAt,
            },
            enclosures: user.enclosures.map((enc) => ({
                id: enc.id,
                name: enc.name,
                description: enc.description,
                createdAt: enc.createdAt,
                sensors: enc.sensors.map((s) => ({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    createdAt: s.createdAt,
                })),
                pets: enc.pets.map((p) => ({
                    id: p.id,
                    name: p.name,
                    species: p.species,
                    createdAt: p.createdAt,
                })),
            })),
            loginSessions: user.loginSessions,
            cookieConsents: user.cookieConsents,
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        return prisma.dataExport.update({
            where: { id: exportId },
            data: {
                status: "COMPLETED",
                filePath: jsonString,
            },
        });
    } catch (err) {
        await prisma.dataExport.update({
            where: { id: exportId },
            data: { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" },
        });
        throw err;
    }
}

export async function getDataExportByToken(token: string) {
    const exportRecord = await prisma.dataExport.findUnique({ where: { token } });
    if (!exportRecord) throw notFound("Data export not found");
    if (exportRecord.expiresAt && exportRecord.expiresAt < new Date()) {
        throw notFound("Data export expired");
    }
    return exportRecord;
}

export async function requestAccountDeletion(userId: string, deleteToken: string, expiresAt: Date) {
    return prisma.user.update({
        where: { id: userId },
        data: { deleteToken, deleteTokenExpiresAt: expiresAt },
    });
}

export async function confirmAccountDeletion(userId: string) {
    await prisma.$transaction([
        prisma.sensorReading.deleteMany({
            where: { sensor: { enclosure: { userId } } },
        }),
        prisma.sensor.deleteMany({
            where: { enclosure: { userId } },
        }),
        prisma.pet.deleteMany({
            where: { enclosure: { userId } },
        }),
        prisma.enclosure.deleteMany({ where: { userId } }),
        prisma.userRole.deleteMany({ where: { userId } }),
        prisma.userFeatureFlag.deleteMany({ where: { userId } }),
        prisma.userLimitOverride.deleteMany({ where: { userId } }),
        prisma.loginSession.deleteMany({ where: { userId } }),
        prisma.cookieConsent.deleteMany({ where: { userId } }),
        prisma.dataExport.deleteMany({ where: { userId } }),
        prisma.announcementRead.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
    ]);
}
