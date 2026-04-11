import type { MultipartFile } from "@fastify/multipart";
import type { FastifyBaseLogger } from "fastify";
import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, badRequest } from "@/helpers/errors.js";
import { uploadFile, deleteUpload } from "@/modules/uploads/uploads.service.js";

const SUGGESTED_TAGS = ["portrait", "shedding", "feeding", "enclosure", "vet"] as const;

const PHOTO_UPLOAD_SELECT = { select: { url: true, originalName: true } } as const;

export function getSuggestedTags(): readonly string[] {
    return SUGGESTED_TAGS;
}

// ─── List Photos ─────────────────────────────────────────────

export async function listPetPhotos(
    petId: string,
    userId: string,
    opts?: { tag?: string; sort?: "date" | "order" },
) {
    await assertPetOwnership(petId, userId);

    const where: { petId: string; tags?: { has: string } } = { petId };
    if (opts?.tag) {
        where.tags = { has: opts.tag };
    }

    return prisma.petPhoto.findMany({
        where,
        include: {
            pet: { select: { userId: true } },
            upload: PHOTO_UPLOAD_SELECT,
        },
        orderBy: opts?.sort === "order" ? { sortOrder: "asc" } : { takenAt: "desc" },
    });
}

// ─── Get Single Photo ────────────────────────────────────────

export async function getPetPhoto(photoId: string, userId: string) {
    return getPhotoWithOwnershipCheck(photoId, userId);
}

// ─── Add Photo ───────────────────────────────────────────────

export async function addPetPhoto(
    petId: string,
    userId: string,
    file: MultipartFile,
    opts: { caption?: string; tags?: string[]; isProfilePicture?: boolean; takenAt?: string },
    log?: FastifyBaseLogger,
) {
    await assertPetOwnership(petId, userId);

    const upload = await uploadFile(userId, file, { caption: opts.caption }, log);

    if (opts.isProfilePicture) {
        await prisma.petPhoto.updateMany({
            where: { petId, isProfilePicture: true },
            data: { isProfilePicture: false },
        });
    }

    const maxSort = await prisma.petPhoto.aggregate({
        where: { petId },
        _max: { sortOrder: true },
    });

    const photo = await prisma.petPhoto.create({
        data: {
            petId,
            uploadId: upload.id,
            caption: opts.caption ?? null,
            tags: opts.tags ?? [],
            isProfilePicture: opts.isProfilePicture ?? false,
            sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
            takenAt: opts.takenAt ? new Date(opts.takenAt) : new Date(),
        },
        include: { upload: PHOTO_UPLOAD_SELECT },
    });

    return photo;
}

// ─── Update Photo ────────────────────────────────────────────

export async function updatePetPhoto(
    photoId: string,
    userId: string,
    data: { caption?: string; tags?: string[]; takenAt?: string },
) {
    const photo = await getPhotoWithOwnershipCheck(photoId, userId);

    return prisma.petPhoto.update({
        where: { id: photo.id },
        data: {
            ...(data.caption !== undefined ? { caption: data.caption } : {}),
            ...(data.tags !== undefined ? { tags: data.tags } : {}),
            ...(data.takenAt !== undefined ? { takenAt: new Date(data.takenAt) } : {}),
        },
        include: { upload: PHOTO_UPLOAD_SELECT },
    });
}

// ─── Set Profile Picture ─────────────────────────────────────

export async function setProfilePicture(photoId: string, userId: string) {
    const photo = await getPhotoWithOwnershipCheck(photoId, userId);

    await prisma.$transaction([
        prisma.petPhoto.updateMany({
            where: { petId: photo.petId, isProfilePicture: true },
            data: { isProfilePicture: false },
        }),
        prisma.petPhoto.update({
            where: { id: photo.id },
            data: { isProfilePicture: true },
        }),
    ]);

    return prisma.petPhoto.findUnique({
        where: { id: photo.id },
        include: { upload: PHOTO_UPLOAD_SELECT },
    });
}

// ─── Delete Photo ────────────────────────────────────────────

export async function deletePetPhoto(photoId: string, userId: string) {
    const photo = await getPhotoWithOwnershipCheck(photoId, userId);

    // Delete PetPhoto first to remove the FK reference, then delete the Upload.
    // Reversing this order causes a 500: the Upload's onDelete: Cascade would
    // cascade-delete the PetPhoto, making the subsequent petPhoto.delete() fail.
    await prisma.petPhoto.delete({ where: { id: photo.id } });
    await deleteUpload(userId, photo.uploadId);
}

// ─── Get Profile Picture for Pet ─────────────────────────────

export async function getProfilePicture(petId: string, userId: string) {
    await assertPetOwnership(petId, userId);

    return prisma.petPhoto.findFirst({
        where: { petId, isProfilePicture: true },
        include: { upload: PHOTO_UPLOAD_SELECT },
    });
}

// ─── Helpers ─────────────────────────────────────────────────

async function assertPetOwnership(petId: string, userId: string) {
    const pet = await prisma.pet.findUnique({
        where: { id: petId },
        select: { userId: true },
    });

    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
}

async function getPhotoWithOwnershipCheck(photoId: string, userId: string) {
    const photo = await prisma.petPhoto.findUnique({
        where: { id: photoId },
        include: {
            pet: { select: { userId: true } },
            upload: PHOTO_UPLOAD_SELECT,
        },
    });

    if (!photo || photo.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_PHOTO_NOT_FOUND, "Photo not found");
    }

    return photo;
}
