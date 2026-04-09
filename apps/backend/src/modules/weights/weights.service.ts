import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

export async function listWeightRecords(
    userId: string,
    options: { petId?: string; from?: Date; to?: Date; limit: number },
) {
    return prisma.weightRecord.findMany({
        where: {
            pet: { userId },
            ...(options.petId ? { petId: options.petId } : {}),
            ...(options.from || options.to
                ? {
                      measuredAt: {
                          ...(options.from ? { gte: options.from } : {}),
                          ...(options.to ? { lte: options.to } : {}),
                      },
                  }
                : {}),
        },
        include: { pet: { select: { id: true, name: true } } },
        orderBy: { measuredAt: "desc" },
        take: options.limit,
    });
}

export async function getWeightRecord(id: string, userId: string) {
    const record = await prisma.weightRecord.findUnique({
        where: { id },
        include: { pet: { select: { id: true, name: true, userId: true } } },
    });
    if (!record || record.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_WEIGHT_RECORD_NOT_FOUND, "Weight record not found");
    }
    return record;
}

export async function createWeightRecord(
    userId: string,
    data: {
        petId: string;
        measuredAt: Date;
        weightGrams: number;
        notes?: string;
    },
) {
    const pet = await prisma.pet.findUnique({ where: { id: data.petId } });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
    return prisma.weightRecord.create({ data });
}

export async function updateWeightRecord(
    id: string,
    userId: string,
    data: Partial<{
        measuredAt: Date;
        weightGrams: number;
        notes: string;
    }>,
) {
    const existing = await prisma.weightRecord.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_WEIGHT_RECORD_NOT_FOUND, "Weight record not found");
    }
    return prisma.weightRecord.update({ where: { id }, data });
}

export async function deleteWeightRecord(id: string, userId: string) {
    const existing = await prisma.weightRecord.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_WEIGHT_RECORD_NOT_FOUND, "Weight record not found");
    }
    await prisma.weightRecord.delete({ where: { id } });
}
