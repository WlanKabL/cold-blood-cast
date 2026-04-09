import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";
import type { EnclosureType } from "@prisma/client";

export async function listEnclosures(userId: string) {
    return prisma.enclosure.findMany({
        where: { userId },
        include: {
            _count: { select: { pets: true, sensors: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getEnclosure(id: string, userId: string) {
    const enclosure = await prisma.enclosure.findUnique({
        where: { id },
        include: {
            pets: { select: { id: true, name: true, species: true, imageUrl: true } },
            sensors: {
                select: { id: true, name: true, type: true, unit: true, active: true },
            },
        },
    });
    if (!enclosure || enclosure.userId !== userId) {
        throw notFound(ErrorCodes.E_ENCLOSURE_NOT_FOUND, "Enclosure not found");
    }
    return enclosure;
}

export async function createEnclosure(
    userId: string,
    data: {
        name: string;
        type?: EnclosureType;
        species?: string;
        description?: string;
        imageUrl?: string;
        lengthCm?: number;
        widthCm?: number;
        heightCm?: number;
    },
) {
    return prisma.enclosure.create({
        data: { ...data, userId },
    });
}

export async function updateEnclosure(
    id: string,
    userId: string,
    data: Partial<{
        name: string;
        type: EnclosureType;
        species: string;
        description: string;
        imageUrl: string;
        lengthCm: number;
        widthCm: number;
        heightCm: number;
    }>,
) {
    const existing = await prisma.enclosure.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_ENCLOSURE_NOT_FOUND, "Enclosure not found");
    }
    return prisma.enclosure.update({ where: { id }, data });
}

export async function deleteEnclosure(id: string, userId: string) {
    const existing = await prisma.enclosure.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_ENCLOSURE_NOT_FOUND, "Enclosure not found");
    }
    await prisma.enclosure.delete({ where: { id } });
}
