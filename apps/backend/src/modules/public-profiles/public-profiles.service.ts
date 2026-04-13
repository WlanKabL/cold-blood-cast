import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, badRequest, forbidden } from "@/helpers/errors.js";
import { resolveUserFeatures } from "@/modules/admin/feature-flags.service.js";

// ─── Slug Generation ─────────────────────────────────────────

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
}

function randomSuffix(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

async function generateUniqueSlug(userId: string, petName: string): Promise<string> {
    const base = slugify(petName) || "pet";

    // Try base slug first (unique within user)
    const exists = await prisma.publicProfile.findUnique({
        where: { userId_slug: { userId, slug: base } },
    });
    if (!exists) return base;

    // Append random suffix until unique
    for (let i = 0; i < 10; i++) {
        const candidate = `${base}-${randomSuffix()}`;
        const taken = await prisma.publicProfile.findUnique({
            where: { userId_slug: { userId, slug: candidate } },
        });
        if (!taken) return candidate;
    }

    // Fallback: timestamp-based
    return `${base}-${Date.now().toString(36)}`;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const SLUG_MIN_LENGTH = 3;
const SLUG_MAX_LENGTH = 60;

function validateSlug(slug: string): string | null {
    if (slug.length < SLUG_MIN_LENGTH) return `Slug must be at least ${SLUG_MIN_LENGTH} characters`;
    if (slug.length > SLUG_MAX_LENGTH) return `Slug must be at most ${SLUG_MAX_LENGTH} characters`;
    if (!SLUG_PATTERN.test(slug))
        return "Slug must contain only lowercase letters, numbers, and hyphens";
    if (slug.includes("--")) return "Slug must not contain consecutive hyphens";
    return null;
}

// ─── CRUD Operations ─────────────────────────────────────────

export async function getProfileByPetId(petId: string, userId: string) {
    const profile = await prisma.publicProfile.findUnique({
        where: { petId },
    });

    if (!profile) {
        throw notFound(ErrorCodes.E_PUBLIC_PROFILE_NOT_FOUND, "Public profile not found");
    }

    if (profile.userId !== userId) {
        throw forbidden(ErrorCodes.E_FORBIDDEN, "Not your profile");
    }

    return profile;
}

interface CreateProfileInput {
    petId: string;
    bio?: string;
    customSlug?: string;
}

export async function createProfile(userId: string, input: CreateProfileInput) {
    // Verify pet ownership
    const pet = await prisma.pet.findUnique({ where: { id: input.petId } });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }

    // Check if profile already exists
    const existing = await prisma.publicProfile.findUnique({ where: { petId: input.petId } });
    if (existing) {
        throw badRequest(
            ErrorCodes.E_PUBLIC_PROFILE_ALREADY_EXISTS,
            "This pet already has a public profile",
        );
    }

    // Handle slug (unique per user)
    let slug: string;
    if (input.customSlug) {
        const error = validateSlug(input.customSlug);
        if (error) throw badRequest(ErrorCodes.E_VALIDATION_ERROR, error);

        const slugTaken = await prisma.publicProfile.findUnique({
            where: { userId_slug: { userId, slug: input.customSlug } },
        });
        if (slugTaken)
            throw badRequest(ErrorCodes.E_PUBLIC_PROFILE_SLUG_TAKEN, "This slug is already taken");

        slug = input.customSlug;
    } else {
        slug = await generateUniqueSlug(userId, pet.name);
    }

    return prisma.publicProfile.create({
        data: {
            petId: input.petId,
            userId,
            slug,
            bio: input.bio,
        },
    });
}

interface UpdateProfileInput {
    slug?: string;
    active?: boolean;
    bio?: string | null;
    showPhotos?: boolean;
    showWeight?: boolean;
    showAge?: boolean;
    showFeedings?: boolean;
    showSheddings?: boolean;
    showSpecies?: boolean;
    showMorph?: boolean;
}

export async function updateProfile(petId: string, userId: string, input: UpdateProfileInput) {
    const profile = await prisma.publicProfile.findUnique({ where: { petId } });
    if (!profile || profile.userId !== userId) {
        throw notFound(ErrorCodes.E_PUBLIC_PROFILE_NOT_FOUND, "Public profile not found");
    }

    // Validate custom slug if changing (unique per user)
    if (input.slug !== undefined && input.slug !== profile.slug) {
        const error = validateSlug(input.slug);
        if (error) throw badRequest(ErrorCodes.E_VALIDATION_ERROR, error);

        const slugTaken = await prisma.publicProfile.findUnique({
            where: { userId_slug: { userId, slug: input.slug } },
        });
        if (slugTaken)
            throw badRequest(ErrorCodes.E_PUBLIC_PROFILE_SLUG_TAKEN, "This slug is already taken");
    }

    return prisma.publicProfile.update({
        where: { petId },
        data: input,
    });
}

export async function deleteProfile(petId: string, userId: string) {
    const profile = await prisma.publicProfile.findUnique({ where: { petId } });
    if (!profile || profile.userId !== userId) {
        throw notFound(ErrorCodes.E_PUBLIC_PROFILE_NOT_FOUND, "Public profile not found");
    }

    await prisma.publicProfile.delete({ where: { petId } });
}

export async function checkSlugAvailability(slug: string, userId: string) {
    const error = validateSlug(slug);
    if (error) return { available: false, reason: error };

    const existing = await prisma.publicProfile.findUnique({
        where: { userId_slug: { userId, slug } },
    });
    return { available: !existing };
}

// ─── Public Data Access ──────────────────────────────────────

export async function getPublicPetDataByUserSlug(userId: string, petSlug: string) {
    const profile = await prisma.publicProfile.findUnique({
        where: { userId_slug: { userId, slug: petSlug } },
        include: {
            pet: {
                include: {
                    photos: {
                        include: {
                            upload: { select: { id: true, url: true, originalName: true } },
                        },
                        orderBy: [
                            { isProfilePicture: "desc" },
                            { sortOrder: "asc" },
                            { createdAt: "desc" },
                        ],
                    },
                    feedings: {
                        orderBy: { fedAt: "desc" },
                        take: 20,
                        include: {
                            feedItem: { select: { name: true } },
                        },
                    },
                    sheddings: {
                        orderBy: { startedAt: "desc" },
                        take: 20,
                    },
                    weightRecords: {
                        orderBy: { measuredAt: "desc" },
                        take: 50,
                    },
                },
            },
        },
    });

    if (!profile || !profile.active) {
        throw notFound(ErrorCodes.E_PUBLIC_PROFILE_NOT_FOUND, "Profile not found");
    }

    // Check if profile owner has public_profiles feature enabled
    const features = await resolveUserFeatures(userId);
    if (!features["public_profiles"]) {
        throw notFound(ErrorCodes.E_PUBLIC_PROFILE_NOT_FOUND, "Profile not found");
    }

    // Increment views (fire and forget)
    prisma.publicProfile
        .update({
            where: { id: profile.id },
            data: { views: { increment: 1 } },
        })
        .catch(() => {
            /* ignore view counter errors */
        });

    // Assemble public data based on visibility toggles
    const { pet } = profile;

    const profilePhoto = pet.photos.find((p) => p.isProfilePicture) ?? pet.photos[0];

    return {
        name: pet.name,
        bio: profile.bio,
        species: profile.showSpecies ? pet.species : null,
        morph: profile.showMorph ? pet.morph : null,
        gender: pet.gender,
        birthDate: profile.showAge ? pet.birthDate : null,
        acquisitionDate: profile.showAge ? pet.acquisitionDate : null,
        profilePhotoId: profilePhoto?.id ?? null,
        photos: profile.showPhotos
            ? pet.photos.map((p) => ({
                  id: p.id,
                  caption: p.caption,
                  tags: p.tags,
                  isProfilePicture: p.isProfilePicture,
                  takenAt: p.takenAt,
              }))
            : [],
        feedings: profile.showFeedings
            ? pet.feedings.map((f) => ({
                  feedItem: f.feedItem?.name ?? null,
                  foodType: f.foodType,
                  foodSize: f.foodSize,
                  quantity: f.quantity,
                  accepted: f.accepted,
                  fedAt: f.fedAt,
                  notes: f.notes,
              }))
            : [],
        sheddings: profile.showSheddings
            ? pet.sheddings.map((s) => ({
                  startedAt: s.startedAt,
                  completedAt: s.completedAt,
                  complete: s.complete,
                  quality: s.quality,
                  notes: s.notes,
              }))
            : [],
        weightRecords: profile.showWeight
            ? pet.weightRecords.map((w) => ({
                  weightGrams: w.weightGrams,
                  measuredAt: w.measuredAt,
              }))
            : [],
        views: profile.views,
        slug: profile.slug,
        createdAt: profile.createdAt,
    };
}

export async function getPublicPhoto(userId: string, petSlug: string, photoId: string) {
    const profile = await prisma.publicProfile.findUnique({
        where: { userId_slug: { userId, slug: petSlug } },
        select: { active: true, showPhotos: true, petId: true },
    });

    if (!profile || !profile.active || !profile.showPhotos) {
        throw notFound(ErrorCodes.E_PUBLIC_PROFILE_NOT_FOUND, "Profile not found");
    }

    // Check if profile owner has public_profiles feature enabled
    const ownerFeatures = await resolveUserFeatures(userId);
    if (!ownerFeatures["public_profiles"]) {
        throw notFound(ErrorCodes.E_PUBLIC_PROFILE_NOT_FOUND, "Profile not found");
    }

    const photo = await prisma.petPhoto.findFirst({
        where: { id: photoId, petId: profile.petId },
        include: { upload: true },
    });

    if (!photo) {
        throw notFound(ErrorCodes.E_PET_PHOTO_NOT_FOUND, "Photo not found");
    }

    return photo.upload;
}
