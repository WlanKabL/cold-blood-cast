import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, forbidden } from "@/helpers/errors.js";
import { recordActivationEvent } from "@/modules/marketing/index.js";
import type { Gender } from "@prisma/client";

export async function listPets(userId: string) {
    return prisma.pet.findMany({
        where: { userId },
        include: {
            enclosure: { select: { id: true, name: true } },
            photos: {
                orderBy: [{ isProfilePicture: "desc" }, { createdAt: "desc" }],
                take: 1,
                select: { id: true, uploadId: true, upload: { select: { url: true } } },
            },
            tags: { select: { id: true, name: true, color: true, category: true } },
            _count: {
                select: {
                    feedings: true,
                    sheddings: true,
                    weightRecords: true,
                    photos: true,
                    documents: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getPet(id: string, userId: string) {
    const pet = await prisma.pet.findUnique({
        where: { id },
        include: {
            enclosure: { select: { id: true, name: true } },
            photos: {
                orderBy: [{ isProfilePicture: "desc" }, { createdAt: "desc" }],
                take: 1,
                select: { id: true, uploadId: true, upload: { select: { url: true } } },
            },
            tags: { select: { id: true, name: true, color: true, category: true } },
            _count: {
                select: {
                    feedings: true,
                    sheddings: true,
                    weightRecords: true,
                    photos: true,
                    documents: true,
                },
            },
        },
    });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
    return pet;
}

export async function createPet(
    userId: string,
    data: {
        enclosureId?: string;
        name: string;
        species: string;
        morph?: string;
        gender?: Gender;
        birthDate?: Date;
        acquisitionDate?: Date;
        notes?: string;
        imageUrl?: string;
        feedingIntervalMinDays?: number;
        feedingIntervalMaxDays?: number;
        pauseFeedingDuringShed?: boolean;
    },
) {
    if (data.enclosureId) {
        const enclosure = await prisma.enclosure.findUnique({
            where: { id: data.enclosureId },
        });
        if (!enclosure || enclosure.userId !== userId) {
            throw forbidden(ErrorCodes.E_FORBIDDEN, "Enclosure not found or not yours");
        }
    }
    const pet = await prisma.pet.create({
        data: { ...data, userId },
    });
    // Best-effort activation tracking — never block pet creation.
    void recordActivationEvent(userId, "AnimalProfileCreated", { petId: pet.id });
    return pet;
}

export async function updatePet(
    id: string,
    userId: string,
    data: Partial<{
        enclosureId: string;
        name: string;
        species: string;
        morph: string;
        gender: Gender;
        birthDate: Date;
        acquisitionDate: Date;
        notes: string;
        imageUrl: string;
        feedingIntervalMinDays: number;
        feedingIntervalMaxDays: number;
        pauseFeedingDuringShed: boolean;
    }>,
) {
    const existing = await prisma.pet.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
    if (data.enclosureId) {
        const enclosure = await prisma.enclosure.findUnique({
            where: { id: data.enclosureId },
        });
        if (!enclosure || enclosure.userId !== userId) {
            throw forbidden(ErrorCodes.E_FORBIDDEN, "Enclosure not found or not yours");
        }
    }
    return prisma.pet.update({ where: { id }, data });
}

export async function deletePet(id: string, userId: string) {
    const existing = await prisma.pet.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
    await prisma.pet.delete({ where: { id } });
}

export async function updatePetTags(id: string, userId: string, tagIds: string[]) {
    const existing = await prisma.pet.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }

    // Verify all tags belong to the user or are global
    if (tagIds.length > 0) {
        const tags = await prisma.tag.findMany({
            where: {
                id: { in: tagIds },
                OR: [{ userId }, { userId: null }],
            },
        });
        if (tags.length !== tagIds.length) {
            throw notFound(ErrorCodes.E_TAG_NOT_FOUND, "One or more tags not found");
        }
    }

    return prisma.pet.update({
        where: { id },
        data: {
            tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
        },
        include: {
            tags: { select: { id: true, name: true, color: true, category: true } },
        },
    });
}
