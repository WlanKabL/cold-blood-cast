import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

export async function listFeedItems(userId: string) {
    return prisma.feedItem.findMany({
        where: { userId },
        include: {
            suitablePets: { select: { id: true, name: true } },
            _count: { select: { feedings: true } },
        },
        orderBy: { name: "asc" },
    });
}

export async function getFeedItem(id: string, userId: string) {
    const item = await prisma.feedItem.findUnique({
        where: { id },
        include: {
            suitablePets: { select: { id: true, name: true } },
            _count: { select: { feedings: true } },
        },
    });
    if (!item || item.userId !== userId) {
        throw notFound(ErrorCodes.E_FEED_ITEM_NOT_FOUND, "Feed item not found");
    }
    return item;
}

export async function createFeedItem(
    userId: string,
    data: {
        name: string;
        size?: string;
        weightGrams?: number;
        notes?: string;
        suitablePetIds?: string[];
    },
) {
    const { suitablePetIds, ...rest } = data;

    if (suitablePetIds?.length) {
        const ownedPets = await prisma.pet.count({
            where: { id: { in: suitablePetIds }, userId },
        });
        if (ownedPets !== suitablePetIds.length) {
            throw notFound(ErrorCodes.E_PET_NOT_FOUND, "One or more pets not found");
        }
    }

    return prisma.feedItem.create({
        data: {
            ...rest,
            userId,
            ...(suitablePetIds?.length
                ? { suitablePets: { connect: suitablePetIds.map((id) => ({ id })) } }
                : {}),
        },
        include: {
            suitablePets: { select: { id: true, name: true } },
            _count: { select: { feedings: true } },
        },
    });
}

export async function updateFeedItem(
    id: string,
    userId: string,
    data: {
        name?: string;
        size?: string;
        weightGrams?: number;
        notes?: string;
        suitablePetIds?: string[];
    },
) {
    const existing = await prisma.feedItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_FEED_ITEM_NOT_FOUND, "Feed item not found");
    }

    const { suitablePetIds, ...rest } = data;

    if (suitablePetIds !== undefined) {
        if (suitablePetIds.length) {
            const ownedPets = await prisma.pet.count({
                where: { id: { in: suitablePetIds }, userId },
            });
            if (ownedPets !== suitablePetIds.length) {
                throw notFound(ErrorCodes.E_PET_NOT_FOUND, "One or more pets not found");
            }
        }
    }

    return prisma.feedItem.update({
        where: { id },
        data: {
            ...rest,
            ...(suitablePetIds !== undefined
                ? { suitablePets: { set: suitablePetIds.map((id) => ({ id })) } }
                : {}),
        },
        include: {
            suitablePets: { select: { id: true, name: true } },
            _count: { select: { feedings: true } },
        },
    });
}

export async function deleteFeedItem(id: string, userId: string) {
    const existing = await prisma.feedItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_FEED_ITEM_NOT_FOUND, "Feed item not found");
    }
    await prisma.feedItem.delete({ where: { id } });
}
