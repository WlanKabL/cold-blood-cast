import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, badRequest } from "@/helpers/errors.js";
import { resolveUserLimits } from "@/modules/admin/feature-flags.service.js";
import type { EnclosureType } from "@prisma/client";

interface ListEnclosuresOptions {
    search?: string;
    active?: boolean;
}

export async function listEnclosures(userId: string, options: ListEnclosuresOptions = {}) {
    const { search, active } = options;

    const where: Record<string, unknown> = { userId };
    if (active !== undefined) {
        where.active = active;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { species: { contains: search, mode: "insensitive" } },
            { room: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    return prisma.enclosure.findMany({
        where,
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
            pets: {
                select: {
                    id: true,
                    name: true,
                    species: true,
                    morph: true,
                    gender: true,
                    imageUrl: true,
                },
            },
            sensors: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    unit: true,
                    active: true,
                },
            },
            _count: { select: { pets: true, sensors: true } },
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
        room?: string;
    },
) {
    const limits = await resolveUserLimits(userId);
    const maxEnclosures = limits.max_enclosures ?? -1;
    if (maxEnclosures !== -1) {
        const currentCount = await prisma.enclosure.count({ where: { userId } });
        if (currentCount >= maxEnclosures) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                `Enclosure limit reached (${maxEnclosures}). Upgrade your plan to create more.`,
            );
        }
    }

    return prisma.enclosure.create({
        data: { ...data, userId },
        include: {
            _count: { select: { pets: true, sensors: true } },
        },
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
        room: string;
        active: boolean;
    }>,
) {
    const existing = await prisma.enclosure.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_ENCLOSURE_NOT_FOUND, "Enclosure not found");
    }
    return prisma.enclosure.update({
        where: { id },
        data,
        include: {
            _count: { select: { pets: true, sensors: true } },
        },
    });
}

export async function deleteEnclosure(id: string, userId: string) {
    const existing = await prisma.enclosure.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_ENCLOSURE_NOT_FOUND, "Enclosure not found");
    }
    await prisma.enclosure.delete({ where: { id } });
}
