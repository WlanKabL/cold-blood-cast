import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, forbidden } from "@/helpers/errors.js";
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
    return prisma.pet.create({
        data: { ...data, userId },
    });
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
