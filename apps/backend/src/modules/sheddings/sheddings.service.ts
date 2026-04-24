import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";
import { recordActivationEvent } from "@/modules/marketing/index.js";

export async function listSheddings(
    userId: string,
    options: { petId?: string; from?: Date; to?: Date; limit: number; cursor?: string },
) {
    const items = await prisma.shedding.findMany({
        where: {
            pet: { userId },
            ...(options.petId ? { petId: options.petId } : {}),
            ...(options.from || options.to
                ? {
                      startedAt: {
                          ...(options.from ? { gte: options.from } : {}),
                          ...(options.to ? { lte: options.to } : {}),
                      },
                  }
                : {}),
        },
        include: { pet: { select: { id: true, name: true } } },
        orderBy: { startedAt: "desc" },
        take: options.limit + 1,
        ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > options.limit;
    if (hasMore) items.pop();

    return {
        items,
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    };
}

export async function getShedding(id: string, userId: string) {
    const shedding = await prisma.shedding.findUnique({
        where: { id },
        include: { pet: { select: { id: true, name: true, userId: true } } },
    });
    if (!shedding || shedding.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_SHEDDING_NOT_FOUND, "Shedding not found");
    }
    return shedding;
}

export async function createShedding(
    userId: string,
    data: {
        petId: string;
        startedAt: Date;
        completedAt?: Date;
        complete?: boolean;
        quality?: string;
        notes?: string;
    },
) {
    const pet = await prisma.pet.findUnique({ where: { id: data.petId } });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
    const shedding = await prisma.shedding.create({ data });
    void recordActivationEvent(userId, "FirstCareEntryCreated", {
        kind: "shedding",
        sheddingId: shedding.id,
    });
    return shedding;
}

export async function updateShedding(
    id: string,
    userId: string,
    data: Partial<{
        startedAt: Date;
        completedAt: Date;
        complete: boolean;
        quality: string;
        notes: string;
    }>,
) {
    const existing = await prisma.shedding.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_SHEDDING_NOT_FOUND, "Shedding not found");
    }
    return prisma.shedding.update({ where: { id }, data });
}

export async function deleteShedding(id: string, userId: string) {
    const existing = await prisma.shedding.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_SHEDDING_NOT_FOUND, "Shedding not found");
    }
    await prisma.shedding.delete({ where: { id } });
}
