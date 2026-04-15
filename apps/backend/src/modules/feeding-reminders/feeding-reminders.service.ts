import { prisma } from "@/config/database.js";

export type FeedingStatus = "ok" | "due" | "overdue" | "critical" | "no_schedule" | "paused";

export interface PetFeedingStatus {
    petId: string;
    petName: string;
    species: string;
    intervalMinDays: number | null;
    intervalMaxDays: number | null;
    lastFedAt: Date | null;
    daysSinceLastFeeding: number | null;
    status: FeedingStatus;
    pausedReason?: string;
}

function daysBetween(a: Date, b: Date): number {
    const ms = b.getTime() - a.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function computeFeedingStatus(
    intervalMin: number | null,
    intervalMax: number | null,
    lastFedAt: Date | null,
    now: Date = new Date(),
): { daysSinceLastFeeding: number | null; status: FeedingStatus } {
    if (!intervalMin || !intervalMax) {
        return {
            daysSinceLastFeeding: lastFedAt ? daysBetween(lastFedAt, now) : null,
            status: "no_schedule",
        };
    }

    if (!lastFedAt) {
        return { daysSinceLastFeeding: null, status: "due" };
    }

    const days = daysBetween(lastFedAt, now);

    if (days > intervalMax) {
        return { daysSinceLastFeeding: days, status: "critical" };
    }
    if (days >= intervalMin) {
        return { daysSinceLastFeeding: days, status: "due" };
    }
    return { daysSinceLastFeeding: days, status: "ok" };
}

export async function getFeedingStatuses(userId: string): Promise<PetFeedingStatus[]> {
    const pets = await prisma.pet.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            species: true,
            feedingIntervalMinDays: true,
            feedingIntervalMaxDays: true,
            pauseFeedingDuringShed: true,
            feedings: {
                orderBy: { fedAt: "desc" },
                take: 1,
                select: { fedAt: true },
            },
            sheddings: {
                where: { complete: false },
                take: 1,
                select: { id: true },
            },
        },
        orderBy: { name: "asc" },
    });

    const now = new Date();

    return pets.map((pet) => {
        const lastFedAt = pet.feedings[0]?.fedAt ?? null;
        const hasActiveShedding = pet.sheddings.length > 0;
        const isPaused = pet.pauseFeedingDuringShed && hasActiveShedding;

        const { daysSinceLastFeeding, status: computedStatus } = computeFeedingStatus(
            pet.feedingIntervalMinDays,
            pet.feedingIntervalMaxDays,
            lastFedAt,
            now,
        );

        return {
            petId: pet.id,
            petName: pet.name,
            species: pet.species,
            intervalMinDays: pet.feedingIntervalMinDays,
            intervalMaxDays: pet.feedingIntervalMaxDays,
            lastFedAt,
            daysSinceLastFeeding,
            status: isPaused ? "paused" : computedStatus,
            ...(isPaused ? { pausedReason: "shedding" } : {}),
        };
    });
}

export async function getPetsNeedingReminder(): Promise<PetFeedingStatus[]> {
    const users = await prisma.user.findMany({
        where: { emailVerified: true },
        select: { id: true },
    });

    const allStatuses: PetFeedingStatus[] = [];

    for (const user of users) {
        const statuses = await getFeedingStatuses(user.id);
        allStatuses.push(...statuses.filter((s) => s.status === "critical"));
    }

    return allStatuses;
}
