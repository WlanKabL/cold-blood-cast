import { prisma } from "@/config/database.js";

// ─── Badge Definitions ───────────────────────────────────────

interface BadgeDef {
    key: string;
    nameKey: string;
    descKey: string;
    icon: string;
    category: string;
    threshold?: number;
    check: (userId: string) => Promise<boolean>;
}

const BADGE_DEFINITIONS: BadgeDef[] = [
    {
        key: "first_pet",
        nameKey: "badges.first_pet",
        descKey: "badges.first_pet_desc",
        icon: "i-heroicons-heart",
        category: "pets",
        threshold: 1,
        check: async (userId) => {
            const count = await prisma.pet.count({ where: { userId } });
            return count >= 1;
        },
    },
    {
        key: "pet_collector",
        nameKey: "badges.pet_collector",
        descKey: "badges.pet_collector_desc",
        icon: "i-heroicons-heart-solid",
        category: "pets",
        threshold: 5,
        check: async (userId) => {
            const count = await prisma.pet.count({ where: { userId } });
            return count >= 5;
        },
    },
    {
        key: "first_photo",
        nameKey: "badges.first_photo",
        descKey: "badges.first_photo_desc",
        icon: "i-heroicons-camera",
        category: "photos",
        threshold: 1,
        check: async (userId) => {
            const count = await prisma.petPhoto.count({ where: { pet: { userId } } });
            return count >= 1;
        },
    },
    {
        key: "photographer",
        nameKey: "badges.photographer",
        descKey: "badges.photographer_desc",
        icon: "i-heroicons-camera-solid",
        category: "photos",
        threshold: 50,
        check: async (userId) => {
            const count = await prisma.petPhoto.count({ where: { pet: { userId } } });
            return count >= 50;
        },
    },
    {
        key: "dedicated_keeper",
        nameKey: "badges.dedicated_keeper",
        descKey: "badges.dedicated_keeper_desc",
        icon: "i-heroicons-fire",
        category: "care",
        threshold: 100,
        check: async (userId) => {
            const count = await prisma.feeding.count({ where: { pet: { userId } } });
            return count >= 100;
        },
    },
    {
        key: "scale_watcher",
        nameKey: "badges.scale_watcher",
        descKey: "badges.scale_watcher_desc",
        icon: "i-heroicons-scale",
        category: "care",
        threshold: 20,
        check: async (userId) => {
            const count = await prisma.weightRecord.count({ where: { pet: { userId } } });
            return count >= 20;
        },
    },
    {
        key: "public_keeper",
        nameKey: "badges.public_keeper",
        descKey: "badges.public_keeper_desc",
        icon: "i-heroicons-globe-alt",
        category: "community",
        check: async (userId) => {
            const profile = await prisma.userPublicProfile.findUnique({
                where: { userId },
                select: { active: true },
            });
            return !!profile?.active;
        },
    },
    {
        key: "vet_tracker",
        nameKey: "badges.vet_tracker",
        descKey: "badges.vet_tracker_desc",
        icon: "i-heroicons-clipboard-document-check",
        category: "care",
        threshold: 5,
        check: async (userId) => {
            const count = await prisma.vetVisit.count({ where: { pet: { userId } } });
            return count >= 5;
        },
    },
];

// ─── Badge Sync ──────────────────────────────────────────────

/**
 * Ensure all badge definitions exist in the DB.
 * Called on startup or first badge check.
 */
export async function syncBadgeDefinitions() {
    for (const def of BADGE_DEFINITIONS) {
        await prisma.badge.upsert({
            where: { key: def.key },
            update: {
                nameKey: def.nameKey,
                descKey: def.descKey,
                icon: def.icon,
                category: def.category,
                threshold: def.threshold ?? null,
            },
            create: {
                key: def.key,
                nameKey: def.nameKey,
                descKey: def.descKey,
                icon: def.icon,
                category: def.category,
                threshold: def.threshold ?? null,
            },
        });
    }
}

// ─── Badge Check ─────────────────────────────────────────────

/**
 * Check all badge definitions for a user and award any newly earned badges.
 * Returns a list of newly earned badge keys.
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
    await syncBadgeDefinitions();

    const existingBadges = await prisma.userBadge.findMany({
        where: { userId },
        select: { badge: { select: { key: true } } },
    });
    const earnedKeys = new Set(existingBadges.map((ub) => ub.badge.key));

    const newBadges: string[] = [];

    for (const def of BADGE_DEFINITIONS) {
        if (earnedKeys.has(def.key)) continue;

        const earned = await def.check(userId);
        if (!earned) continue;

        const badge = await prisma.badge.findUnique({ where: { key: def.key } });
        if (!badge) continue;

        await prisma.userBadge.create({
            data: { userId, badgeId: badge.id },
        });

        newBadges.push(def.key);
    }

    return newBadges;
}

// ─── Badge Queries ───────────────────────────────────────────

export async function getUserBadges(userId: string) {
    return prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
    });
}

export async function getAllBadgeDefinitions() {
    await syncBadgeDefinitions();
    return prisma.badge.findMany({ orderBy: { sortOrder: "asc" } });
}
