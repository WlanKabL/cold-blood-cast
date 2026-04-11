import { prisma } from "@/config/database.js";
import { computeFeedingStatus } from "@/modules/feeding-reminders/feeding-reminders.service.js";
import { computeSheddingCycle } from "@/modules/sheddings/shedding-analysis.service.js";

// ── Types ────────────────────────────────────────────────

export type PlannerEventType = "feeding" | "vet_visit" | "shedding" | "maintenance";

export interface PlannerEvent {
    id: string;
    type: PlannerEventType;
    date: string;
    title: string;
    detail: string | null;
    petName: string | null;
    enclosureName: string | null;
    meta: Record<string, unknown>;
}

export interface PlannerDay {
    date: string;
    events: PlannerEvent[];
}

// ── Public API ───────────────────────────────────────────

export async function getWeekEvents(
    userId: string,
    weekStart: Date,
): Promise<PlannerDay[]> {
    const days: PlannerDay[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        days.push({ date: toDateStr(d), events: [] });
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [feedingEvents, vetEvents, sheddingEvents, maintenanceEvents] = await Promise.all([
        collectFeedingEvents(userId, weekStart, weekEnd),
        collectVetEvents(userId, weekStart, weekEnd),
        collectSheddingEvents(userId, weekStart, weekEnd),
        collectMaintenanceEvents(userId, weekStart, weekEnd),
    ]);

    const allEvents = [...feedingEvents, ...vetEvents, ...sheddingEvents, ...maintenanceEvents];

    for (const event of allEvents) {
        const day = days.find((d) => d.date === event.date);
        if (day) {
            day.events.push(event);
        }
    }

    for (const day of days) {
        day.events.sort((a, b) => a.type.localeCompare(b.type));
    }

    return days;
}

export async function getWeekEventsForEmail(
    userId: string,
    weekStart: Date,
): Promise<{ days: PlannerDay[]; username: string; email: string; locale: string } | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            username: true,
            email: true,
            locale: true,
            emailVerified: true,
            weeklyReportEnabled: true,
        },
    });

    if (!user || !user.emailVerified || !user.weeklyReportEnabled) return null;

    const days = await getWeekEvents(userId, weekStart);
    const hasEvents = days.some((d) => d.events.length > 0);

    if (!hasEvents) return null;

    return {
        days,
        username: user.username,
        email: user.email,
        locale: user.locale,
    };
}

export async function getOptedInUsers(): Promise<
    { id: string; email: string; username: string; locale: string }[]
> {
    return prisma.user.findMany({
        where: {
            emailVerified: true,
            weeklyReportEnabled: true,
        },
        select: { id: true, email: true, username: true, locale: true },
    });
}

// ── Collectors ───────────────────────────────────────────

async function collectFeedingEvents(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
): Promise<PlannerEvent[]> {
    const pets = await prisma.pet.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            species: true,
            feedingIntervalMinDays: true,
            feedingIntervalMaxDays: true,
            feedings: {
                orderBy: { fedAt: "desc" },
                take: 1,
                select: { fedAt: true },
            },
        },
    });

    const events: PlannerEvent[] = [];

    for (const pet of pets) {
        if (!pet.feedingIntervalMinDays || !pet.feedingIntervalMaxDays) continue;

        const lastFedAt = pet.feedings[0]?.fedAt ?? null;
        const { status } = computeFeedingStatus(
            pet.feedingIntervalMinDays,
            pet.feedingIntervalMaxDays,
            lastFedAt,
        );

        if (status === "no_schedule") continue;

        // Calculate the next due window
        let dueDateMin: Date;
        if (lastFedAt) {
            dueDateMin = new Date(lastFedAt);
            dueDateMin.setDate(dueDateMin.getDate() + pet.feedingIntervalMinDays);
        } else {
            dueDateMin = new Date(); // Due now if never fed
        }

        // Show if the due date falls within the week OR is already overdue
        if (dueDateMin < weekEnd) {
            const eventDate = dueDateMin < weekStart ? weekStart : dueDateMin;

            events.push({
                id: `feeding-${pet.id}`,
                type: "feeding",
                date: toDateStr(eventDate),
                title: pet.name,
                detail: `${pet.feedingIntervalMinDays}–${pet.feedingIntervalMaxDays}d`,
                petName: pet.name,
                enclosureName: null,
                meta: {
                    petId: pet.id,
                    status,
                    intervalMin: pet.feedingIntervalMinDays,
                    intervalMax: pet.feedingIntervalMaxDays,
                },
            });
        }
    }

    return events;
}

async function collectVetEvents(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
): Promise<PlannerEvent[]> {
    const [scheduledVisits, followUpVisits] = await Promise.all([
        prisma.vetVisit.findMany({
            where: {
                userId,
                isAppointment: true,
                visitDate: { gte: weekStart, lt: weekEnd },
            },
            include: {
                pet: { select: { name: true } },
                veterinarian: { select: { name: true, clinicName: true } },
            },
        }),
        prisma.vetVisit.findMany({
            where: {
                userId,
                isAppointment: false,
                nextAppointment: { gte: weekStart, lt: weekEnd },
            },
            include: {
                pet: { select: { name: true } },
                veterinarian: { select: { name: true, clinicName: true } },
            },
        }),
    ]);

    const events: PlannerEvent[] = [];

    for (const visit of scheduledVisits) {
        events.push({
            id: `vet-${visit.id}`,
            type: "vet_visit",
            date: toDateStr(visit.visitDate),
            title: visit.pet.name,
            detail: visit.reason ?? visit.veterinarian?.name ?? null,
            petName: visit.pet.name,
            enclosureName: null,
            meta: {
                vetVisitId: visit.id,
                vetName: visit.veterinarian?.name ?? null,
                clinicName: visit.veterinarian?.clinicName ?? null,
                reason: visit.reason,
            },
        });
    }

    for (const visit of followUpVisits) {
        events.push({
            id: `vet-followup-${visit.id}`,
            type: "vet_visit",
            date: toDateStr(visit.nextAppointment!),
            title: visit.pet.name,
            detail: visit.reason ?? visit.veterinarian?.name ?? null,
            petName: visit.pet.name,
            enclosureName: null,
            meta: {
                vetVisitId: visit.id,
                vetName: visit.veterinarian?.name ?? null,
                clinicName: visit.veterinarian?.clinicName ?? null,
                reason: visit.reason,
                isFollowUp: true,
            },
        });
    }

    return events;
}

async function collectSheddingEvents(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
): Promise<PlannerEvent[]> {
    const pets = await prisma.pet.findMany({
        where: { userId },
        select: { id: true, name: true },
    });

    const events: PlannerEvent[] = [];

    for (const pet of pets) {
        const sheddings = await prisma.shedding.findMany({
            where: { petId: pet.id },
            select: { startedAt: true },
            orderBy: { startedAt: "asc" },
        });

        if (sheddings.length < 2) continue;

        const analysis = computeSheddingCycle(
            sheddings.map((s) => ({ startedAt: s.startedAt.toISOString() })),
            pet.id,
            pet.name,
        );

        if (!analysis.predictedNextDate) continue;

        const predicted = new Date(analysis.predictedNextDate);
        if (predicted >= weekStart && predicted < weekEnd) {
            events.push({
                id: `shedding-${pet.id}`,
                type: "shedding",
                date: toDateStr(predicted),
                title: pet.name,
                detail: `~${analysis.averageIntervalDays}d`,
                petName: pet.name,
                enclosureName: null,
                meta: {
                    petId: pet.id,
                    averageInterval: analysis.averageIntervalDays,
                    trend: analysis.trend,
                },
            });
        }
    }

    return events;
}

async function collectMaintenanceEvents(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
): Promise<PlannerEvent[]> {
    const tasks = await prisma.maintenanceTask.findMany({
        where: {
            userId,
            OR: [
                // Due within this week
                { nextDueAt: { gte: weekStart, lt: weekEnd } },
                // Already overdue (show on first day of the week)
                { nextDueAt: { lt: weekStart }, completedAt: null },
            ],
        },
        include: {
            enclosure: { select: { name: true } },
        },
    });

    return tasks.map((task) => {
        const isOverdue = task.nextDueAt && task.nextDueAt < weekStart && !task.completedAt;
        const eventDate = isOverdue ? weekStart : (task.nextDueAt ?? weekStart);

        return {
            id: `maintenance-${task.id}`,
            type: "maintenance" as const,
            date: toDateStr(eventDate),
            title: task.description ?? task.type,
            detail: task.enclosure.name,
            petName: null,
            enclosureName: task.enclosure.name,
            meta: {
                taskId: task.id,
                maintenanceType: task.type,
                recurring: task.recurring,
                isOverdue: !!isOverdue,
            },
        };
    });
}

// ── Helpers ──────────────────────────────────────────────

function toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
}
