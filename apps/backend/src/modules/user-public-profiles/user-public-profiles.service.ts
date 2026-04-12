import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, badRequest, forbidden } from "@/helpers/errors.js";
import type { ThemePreset, SocialPlatform } from "@cold-blood-cast/shared";

// ─── Slug Helpers ────────────────────────────────────────────

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const SLUG_MIN = 3;
const SLUG_MAX = 60;

export const THEME_PRESETS: ThemePreset[] = [
    "default",
    "ocean",
    "forest",
    "sunset",
    "midnight",
    "desert",
    "arctic",
];

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
    "instagram",
    "youtube",
    "tiktok",
    "twitter",
    "facebook",
    "website",
    "discord",
    "custom",
];

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

async function generateUniqueSlug(username: string): Promise<string> {
    const base = slugify(username) || "keeper";

    const exists = await prisma.userPublicProfile.findUnique({ where: { slug: base } });
    if (!exists) return base;

    for (let i = 0; i < 10; i++) {
        const candidate = `${base}-${randomSuffix()}`;
        const taken = await prisma.userPublicProfile.findUnique({ where: { slug: candidate } });
        if (!taken) return candidate;
    }

    return `${base}-${Date.now().toString(36)}`;
}

export function validateSlug(slug: string): string | null {
    if (slug.length < SLUG_MIN) return `Slug must be at least ${SLUG_MIN} characters`;
    if (slug.length > SLUG_MAX) return `Slug must be at most ${SLUG_MAX} characters`;
    if (!SLUG_PATTERN.test(slug)) return "Slug must contain only lowercase letters, numbers, and hyphens";
    if (slug.includes("--")) return "Slug must not contain consecutive hyphens";
    return null;
}

// ─── CRUD ────────────────────────────────────────────────────

export async function getOwnProfile(userId: string) {
    const profile = await prisma.userPublicProfile.findUnique({
        where: { userId },
        include: {
            socialLinks: { orderBy: { sortOrder: "asc" } },
            petOrder: {
                orderBy: { sortOrder: "asc" },
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true,
                            publicProfile: { select: { id: true } },
                        },
                    },
                },
            },
        },
    });

    if (!profile) return null;

    return {
        ...profile,
        hasAvatar: !!profile.avatarUploadId,
        petOrder: profile.petOrder.map((po) => ({
            petId: po.petId,
            petName: po.pet.name,
            hasPublicProfile: !!po.pet.publicProfile,
            sortOrder: po.sortOrder,
        })),
    };
}

interface CreateProfileInput {
    slug?: string;
}

export async function createProfile(userId: string, username: string, input: CreateProfileInput) {
    const existing = await prisma.userPublicProfile.findUnique({ where: { userId } });
    if (existing) {
        throw badRequest(ErrorCodes.E_USER_PROFILE_ALREADY_EXISTS, "You already have a public profile");
    }

    let slug: string;
    if (input.slug) {
        const error = validateSlug(input.slug);
        if (error) throw badRequest(ErrorCodes.E_VALIDATION_ERROR, error);

        const taken = await prisma.userPublicProfile.findUnique({ where: { slug: input.slug } });
        if (taken) throw badRequest(ErrorCodes.E_USER_PROFILE_SLUG_TAKEN, "This slug is already taken");

        slug = input.slug;
    } else {
        slug = await generateUniqueSlug(username);
    }

    return prisma.userPublicProfile.create({
        data: { userId, slug },
    });
}

interface UpdateProfileInput {
    slug?: string;
    active?: boolean;
    bio?: string | null;
    tagline?: string | null;
    location?: string | null;
    keeperSince?: string | null;
    showStats?: boolean;
    showPets?: boolean;
    showSocialLinks?: boolean;
    showLocation?: boolean;
    showKeeperSince?: boolean;
    showBadges?: boolean;
    themePreset?: ThemePreset;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
    const profile = await prisma.userPublicProfile.findUnique({ where: { userId } });
    if (!profile) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Public profile not found");
    }

    if (input.slug !== undefined && input.slug !== profile.slug) {
        const error = validateSlug(input.slug);
        if (error) throw badRequest(ErrorCodes.E_VALIDATION_ERROR, error);

        const taken = await prisma.userPublicProfile.findUnique({ where: { slug: input.slug } });
        if (taken) throw badRequest(ErrorCodes.E_USER_PROFILE_SLUG_TAKEN, "This slug is already taken");
    }

    const { keeperSince, ...rest } = input;

    const keeperSinceData: { keeperSince?: Date | null } = {};
    if (keeperSince !== undefined) {
        if (keeperSince) {
            const parsed = new Date(`${keeperSince}T00:00:00.000Z`);
            if (isNaN(parsed.getTime()) || parsed.getFullYear() < 1900 || parsed.getFullYear() > 2100) {
                throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid keeperSince date");
            }
            keeperSinceData.keeperSince = parsed;
        } else {
            keeperSinceData.keeperSince = null;
        }
    }

    return prisma.userPublicProfile.update({
        where: { userId },
        data: {
            ...rest,
            ...keeperSinceData,
        },
    });
}

export async function deleteProfile(userId: string) {
    const profile = await prisma.userPublicProfile.findUnique({ where: { userId } });
    if (!profile) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Public profile not found");
    }

    await prisma.userPublicProfile.delete({ where: { userId } });
}

// ─── Avatar ──────────────────────────────────────────────────

export async function setAvatar(userId: string, uploadId: string) {
    const profile = await prisma.userPublicProfile.findUnique({ where: { userId } });
    if (!profile) throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Public profile not found");

    return prisma.userPublicProfile.update({
        where: { userId },
        data: { avatarUploadId: uploadId },
    });
}

export async function removeAvatar(userId: string) {
    const profile = await prisma.userPublicProfile.findUnique({ where: { userId } });
    if (!profile) throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Public profile not found");

    return prisma.userPublicProfile.update({
        where: { userId },
        data: { avatarUploadId: null },
    });
}

// ─── Social Links ────────────────────────────────────────────

interface SocialLinkInput {
    platform: SocialPlatform;
    url: string;
    label?: string;
}

export async function setSocialLinks(userId: string, links: SocialLinkInput[]) {
    const profile = await prisma.userPublicProfile.findUnique({ where: { userId } });
    if (!profile) throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Public profile not found");

    await prisma.userSocialLink.deleteMany({ where: { profileId: profile.id } });

    if (links.length === 0) return [];

    const data = links.map((link, i) => ({
        profileId: profile.id,
        platform: link.platform,
        url: link.url,
        label: link.label ?? null,
        sortOrder: i,
    }));

    await prisma.userSocialLink.createMany({ data });

    return prisma.userSocialLink.findMany({
        where: { profileId: profile.id },
        orderBy: { sortOrder: "asc" },
    });
}

// ─── Pet Order ───────────────────────────────────────────────

interface PetOrderInput {
    petId: string;
    sortOrder: number;
}

export async function setPetOrder(userId: string, order: PetOrderInput[]) {
    const profile = await prisma.userPublicProfile.findUnique({ where: { userId } });
    if (!profile) throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Public profile not found");

    // Verify all pets belong to user
    const petIds = order.map((o) => o.petId);
    const pets = await prisma.pet.findMany({
        where: { id: { in: petIds }, userId },
        select: { id: true },
    });
    const validIds = new Set(pets.map((p) => p.id));
    const invalid = petIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, `Invalid pet IDs: ${invalid.join(", ")}`);
    }

    await prisma.userPetOrder.deleteMany({ where: { profileId: profile.id } });

    if (order.length === 0) return [];

    const data = order.map((o) => ({
        profileId: profile.id,
        petId: o.petId,
        sortOrder: o.sortOrder,
    }));

    await prisma.userPetOrder.createMany({ data });

    return prisma.userPetOrder.findMany({
        where: { profileId: profile.id },
        orderBy: { sortOrder: "asc" },
    });
}

// ─── Slug Check ──────────────────────────────────────────────

export async function checkSlugAvailability(slug: string) {
    const error = validateSlug(slug);
    if (error) return { available: false, reason: error };

    const existing = await prisma.userPublicProfile.findUnique({ where: { slug } });
    return { available: !existing };
}

// ─── Public Data ─────────────────────────────────────────────

export async function getPublicUserData(userSlug: string) {
    const profile = await prisma.userPublicProfile.findUnique({
        where: { slug: userSlug },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                },
            },
            socialLinks: { orderBy: { sortOrder: "asc" } },
            petOrder: {
                orderBy: { sortOrder: "asc" },
                include: {
                    pet: {
                        include: {
                            publicProfile: { select: { slug: true, bio: true, active: true } },
                            photos: {
                                where: { isProfilePicture: true },
                                take: 1,
                                select: { id: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!profile || !profile.active) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Profile not found");
    }

    // Increment views fire-and-forget
    prisma.userPublicProfile
        .update({ where: { slug: userSlug }, data: { views: { increment: 1 } } })
        .catch(() => {});

    const userId = profile.user.id;

    // Gather stats if visible
    let stats = null;
    if (profile.showStats) {
        const [petCount, totalPhotos, totalFeedings, totalWeightRecords] = await Promise.all([
            prisma.pet.count({ where: { userId } }),
            prisma.petPhoto.count({ where: { pet: { userId } } }),
            prisma.feeding.count({ where: { pet: { userId } } }),
            prisma.weightRecord.count({ where: { pet: { userId } } }),
        ]);
        stats = { petCount, totalPhotos, totalFeedings, totalWeightRecords };
    }

    // Gather badges if visible
    let badges: Array<{ key: string; nameKey: string; icon: string; earnedAt: Date }> = [];
    if (profile.showBadges) {
        const userBadges = await prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true },
            orderBy: { earnedAt: "desc" },
        });
        badges = userBadges.map((ub) => ({
            key: ub.badge.key,
            nameKey: ub.badge.nameKey,
            icon: ub.badge.icon,
            earnedAt: ub.earnedAt,
        }));
    }

    // Build pet list — use petOrder or fall back to all user pets
    let petsForDisplay: Array<{
        id: string;
        name: string;
        species: string;
        morph: string | null;
        profilePhotoId: string | null;
        petSlug: string | null;
        bio: string | null;
    }>;

    if (profile.showPets) {
        if (profile.petOrder.length > 0) {
            petsForDisplay = profile.petOrder
                .filter((po) => po.pet.publicProfile?.active)
                .map((po) => ({
                    id: po.pet.id,
                    name: po.pet.name,
                    species: po.pet.species,
                    morph: po.pet.morph,
                    profilePhotoId: po.pet.photos[0]?.id ?? null,
                    petSlug: po.pet.publicProfile?.slug ?? null,
                    bio: po.pet.publicProfile?.bio ?? null,
                }));
        } else {
            const pets = await prisma.pet.findMany({
                where: { userId },
                include: {
                    publicProfile: { select: { slug: true, bio: true, active: true } },
                    photos: {
                        where: { isProfilePicture: true },
                        take: 1,
                        select: { id: true },
                    },
                },
                orderBy: { createdAt: "asc" },
            });
            petsForDisplay = pets
                .filter((p) => p.publicProfile?.active)
                .map((p) => ({
                    id: p.id,
                    name: p.name,
                    species: p.species,
                    morph: p.morph,
                    profilePhotoId: p.photos[0]?.id ?? null,
                    petSlug: p.publicProfile?.slug ?? null,
                    bio: p.publicProfile?.bio ?? null,
                }));
        }
    } else {
        petsForDisplay = [];
    }

    return {
        slug: profile.slug,
        displayName: profile.user.displayName,
        username: profile.user.username,
        bio: profile.bio,
        tagline: profile.tagline,
        location: profile.showLocation ? profile.location : null,
        keeperSince: profile.showKeeperSince && profile.keeperSince
            ? profile.keeperSince.toISOString()
            : null,
        hasAvatar: !!profile.avatarUploadId,
        themePreset: profile.themePreset as string,
        views: profile.views,
        createdAt: profile.createdAt.toISOString(),
        socialLinks: profile.showSocialLinks
            ? profile.socialLinks.map((sl) => ({
                  platform: sl.platform,
                  url: sl.url,
                  label: sl.label,
              }))
            : [],
        stats,
        badges: badges.map((b) => ({
            key: b.key,
            nameKey: b.nameKey,
            icon: b.icon,
            earnedAt: b.earnedAt.toISOString(),
        })),
        pets: petsForDisplay,
    };
}

export async function getPublicUserAvatar(userSlug: string) {
    const profile = await prisma.userPublicProfile.findUnique({
        where: { slug: userSlug },
        select: { active: true, avatarUploadId: true },
    });

    if (!profile || !profile.active || !profile.avatarUploadId) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Avatar not found");
    }

    const upload = await prisma.upload.findUnique({
        where: { id: profile.avatarUploadId },
    });

    if (!upload) {
        throw notFound(ErrorCodes.E_NOT_FOUND, "Avatar file not found");
    }

    return upload;
}

/**
 * Resolve pet profile by userSlug + petSlug.
 * Works even if the user has no active UserPublicProfile.
 */
export async function resolveUserForPetProfile(userSlug: string) {
    const user = await prisma.user.findUnique({
        where: { username: userSlug },
        select: { id: true, username: true },
    });

    if (!user) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "User not found");
    }

    return user;
}
