import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";
import { recordActivationEvent } from "@/modules/marketing/index.js";

export async function listFeedings(
    userId: string,
    options: { petId?: string; from?: Date; to?: Date; limit: number; cursor?: string },
) {
    const items = await prisma.feeding.findMany({
        where: {
            pet: { userId },
            ...(options.petId ? { petId: options.petId } : {}),
            ...(options.from || options.to
                ? {
                      fedAt: {
                          ...(options.from ? { gte: options.from } : {}),
                          ...(options.to ? { lte: options.to } : {}),
                      },
                  }
                : {}),
        },
        include: {
            pet: { select: { id: true, name: true } },
            feedItem: { select: { id: true, name: true, size: true } },
        },
        orderBy: { fedAt: "desc" },
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

export async function getFeeding(id: string, userId: string) {
    const feeding = await prisma.feeding.findUnique({
        where: { id },
        include: {
            pet: { select: { id: true, name: true, userId: true } },
            feedItem: { select: { id: true, name: true, size: true } },
        },
    });
    if (!feeding || feeding.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_FEEDING_NOT_FOUND, "Feeding not found");
    }
    return feeding;
}

export async function createFeeding(
    userId: string,
    data: {
        petId: string;
        feedItemId?: string;
        fedAt: Date;
        foodType: string;
        foodSize?: string;
        quantity?: number;
        accepted?: boolean;
        refusedReason?: string;
        retryAt?: Date;
        notes?: string;
    },
) {
    const pet = await prisma.pet.findUnique({ where: { id: data.petId } });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
    const feeding = await prisma.feeding.create({ data });
    void recordActivationEvent(userId, "FirstCareEntryCreated", { kind: "feeding", feedingId: feeding.id });
    return feeding;
}

export async function updateFeeding(
    id: string,
    userId: string,
    data: Partial<{
        feedItemId: string;
        fedAt: Date;
        foodType: string;
        foodSize: string;
        quantity: number;
        accepted: boolean;
        refusedReason: string;
        retryAt: Date;
        notes: string;
    }>,
) {
    const existing = await prisma.feeding.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_FEEDING_NOT_FOUND, "Feeding not found");
    }
    return prisma.feeding.update({ where: { id }, data });
}

export async function deleteFeeding(id: string, userId: string) {
    const existing = await prisma.feeding.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_FEEDING_NOT_FOUND, "Feeding not found");
    }
    await prisma.feeding.delete({ where: { id } });
}
