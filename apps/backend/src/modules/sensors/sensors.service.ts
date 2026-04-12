import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, forbidden } from "@/helpers/errors.js";
import type { Prisma } from "@prisma/client";

export async function listSensors(userId: string) {
    return prisma.sensor.findMany({
        where: { userId },
        include: { enclosure: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
    });
}

export async function getSensor(id: string, userId: string) {
    const sensor = await prisma.sensor.findUnique({ where: { id } });
    if (!sensor || sensor.userId !== userId) {
        throw notFound(ErrorCodes.E_SENSOR_NOT_FOUND, "Sensor not found");
    }
    return sensor;
}

export async function createSensor(
    userId: string,
    data: {
        enclosureId?: string;
        name: string;
        type: string;
        unit: string;
        homeAssistantEntityId?: string;
        limitsJson?: unknown;
        active?: boolean;
    },
) {
    if (data.enclosureId) {
        const enclosure = await prisma.enclosure.findUnique({ where: { id: data.enclosureId } });
        if (!enclosure || enclosure.userId !== userId) {
            throw forbidden(ErrorCodes.E_FORBIDDEN, "Enclosure not found or not yours");
        }
    }
    return prisma.sensor.create({
        data: {
            userId,
            enclosureId: data.enclosureId ?? null,
            name: data.name,
            type: data.type as "TEMPERATURE" | "HUMIDITY" | "PRESSURE" | "WATER",
            unit: data.unit,
            homeAssistantEntityId: data.homeAssistantEntityId ?? null,
            limitsJson:
                data.limitsJson !== undefined
                    ? (data.limitsJson as Prisma.InputJsonValue)
                    : undefined,
            active: data.active ?? true,
        },
    });
}

export async function updateSensor(
    id: string,
    userId: string,
    data: Partial<{
        enclosureId: string;
        name: string;
        type: string;
        unit: string;
        homeAssistantEntityId: string;
        limitsJson: unknown;
        active: boolean;
    }>,
) {
    const existing = await prisma.sensor.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_SENSOR_NOT_FOUND, "Sensor not found");
    }
    if (data.enclosureId) {
        const enclosure = await prisma.enclosure.findUnique({ where: { id: data.enclosureId } });
        if (!enclosure || enclosure.userId !== userId) {
            throw forbidden(ErrorCodes.E_FORBIDDEN, "Enclosure not found or not yours");
        }
    }
    const updateData: Prisma.SensorUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined)
        updateData.type = data.type as "TEMPERATURE" | "HUMIDITY" | "PRESSURE" | "WATER";
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.enclosureId !== undefined) updateData.enclosureId = data.enclosureId;
    if (data.homeAssistantEntityId !== undefined)
        updateData.homeAssistantEntityId = data.homeAssistantEntityId;
    if (data.limitsJson !== undefined)
        updateData.limitsJson = data.limitsJson as Prisma.InputJsonValue;
    if (data.active !== undefined) updateData.active = data.active;

    return prisma.sensor.update({ where: { id }, data: updateData });
}

export async function deleteSensor(id: string, userId: string) {
    const existing = await prisma.sensor.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_SENSOR_NOT_FOUND, "Sensor not found");
    }
    await prisma.sensor.delete({ where: { id } });
}

export async function getSensorReadings(
    sensorId: string,
    userId: string,
    options: { from?: Date; to?: Date; limit: number },
) {
    const sensor = await prisma.sensor.findUnique({ where: { id: sensorId } });
    if (!sensor || sensor.userId !== userId) {
        throw notFound(ErrorCodes.E_SENSOR_NOT_FOUND, "Sensor not found");
    }
    return prisma.sensorReading.findMany({
        where: {
            sensorId,
            ...(options.from || options.to
                ? {
                      recordedAt: {
                          ...(options.from ? { gte: options.from } : {}),
                          ...(options.to ? { lte: options.to } : {}),
                      },
                  }
                : {}),
        },
        orderBy: { recordedAt: "desc" },
        take: options.limit,
    });
}

export async function createSensorReading(
    sensorId: string,
    userId: string,
    data: { value: number | null; recordedAt: Date },
) {
    const sensor = await prisma.sensor.findUnique({ where: { id: sensorId } });
    if (!sensor || sensor.userId !== userId) {
        throw notFound(ErrorCodes.E_SENSOR_NOT_FOUND, "Sensor not found");
    }
    return prisma.sensorReading.create({
        data: { sensorId, ...data },
    });
}
