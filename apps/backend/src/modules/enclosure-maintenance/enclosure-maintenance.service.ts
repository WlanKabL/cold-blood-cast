import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";
import type { MaintenanceType } from "@prisma/client";

// ─── List Tasks ──────────────────────────────────────────────

export async function listMaintenanceTasks(
    userId: string,
    options: { enclosureId?: string; overdue?: boolean },
) {
    const now = new Date();

    return prisma.maintenanceTask.findMany({
        where: {
            userId,
            ...(options.enclosureId ? { enclosureId: options.enclosureId } : {}),
            ...(options.overdue
                ? { nextDueAt: { lt: now }, completedAt: null }
                : {}),
        },
        include: {
            enclosure: { select: { id: true, name: true } },
        },
        orderBy: { nextDueAt: "asc" },
    });
}

// ─── Get Task ────────────────────────────────────────────────

export async function getMaintenanceTask(id: string, userId: string) {
    const task = await prisma.maintenanceTask.findUnique({
        where: { id },
        include: {
            enclosure: { select: { id: true, name: true } },
        },
    });
    if (!task || task.userId !== userId) {
        throw notFound(ErrorCodes.E_MAINTENANCE_TASK_NOT_FOUND, "Maintenance task not found");
    }
    return task;
}

// ─── Create Task ─────────────────────────────────────────────

export async function createMaintenanceTask(
    userId: string,
    data: {
        enclosureId: string;
        type: MaintenanceType;
        description?: string;
        nextDueAt?: Date;
        intervalDays?: number;
        recurring?: boolean;
        notes?: string;
    },
) {
    const enclosure = await prisma.enclosure.findUnique({
        where: { id: data.enclosureId },
        select: { userId: true },
    });
    if (!enclosure || enclosure.userId !== userId) {
        throw notFound(ErrorCodes.E_ENCLOSURE_NOT_FOUND, "Enclosure not found");
    }

    return prisma.maintenanceTask.create({
        data: {
            userId,
            enclosureId: data.enclosureId,
            type: data.type,
            description: data.description,
            nextDueAt: data.nextDueAt,
            intervalDays: data.intervalDays,
            recurring: data.recurring ?? false,
            notes: data.notes,
        },
        include: {
            enclosure: { select: { id: true, name: true } },
        },
    });
}

// ─── Update Task ─────────────────────────────────────────────

export async function updateMaintenanceTask(
    id: string,
    userId: string,
    data: Partial<{
        type: MaintenanceType;
        description: string;
        nextDueAt: Date;
        intervalDays: number;
        recurring: boolean;
        notes: string;
    }>,
) {
    const existing = await prisma.maintenanceTask.findUnique({
        where: { id },
        select: { userId: true },
    });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_MAINTENANCE_TASK_NOT_FOUND, "Maintenance task not found");
    }

    return prisma.maintenanceTask.update({
        where: { id },
        data,
        include: {
            enclosure: { select: { id: true, name: true } },
        },
    });
}

// ─── Complete Task ───────────────────────────────────────────

export async function completeMaintenanceTask(id: string, userId: string) {
    const task = await prisma.maintenanceTask.findUnique({
        where: { id },
        select: { userId: true, recurring: true, intervalDays: true },
    });
    if (!task || task.userId !== userId) {
        throw notFound(ErrorCodes.E_MAINTENANCE_TASK_NOT_FOUND, "Maintenance task not found");
    }

    const now = new Date();
    const nextDueAt =
        task.recurring && task.intervalDays
            ? new Date(now.getTime() + task.intervalDays * 24 * 60 * 60 * 1000)
            : null;

    return prisma.maintenanceTask.update({
        where: { id },
        data: {
            completedAt: now,
            ...(nextDueAt ? { nextDueAt } : {}),
        },
        include: {
            enclosure: { select: { id: true, name: true } },
        },
    });
}

// ─── Delete Task ─────────────────────────────────────────────

export async function deleteMaintenanceTask(id: string, userId: string) {
    const existing = await prisma.maintenanceTask.findUnique({
        where: { id },
        select: { userId: true },
    });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_MAINTENANCE_TASK_NOT_FOUND, "Maintenance task not found");
    }
    await prisma.maintenanceTask.delete({ where: { id } });
}

// ─── Overdue Tasks (for dashboard / scheduler) ──────────────

export async function getOverdueTasksForUser(userId: string) {
    const now = new Date();
    return prisma.maintenanceTask.findMany({
        where: {
            userId,
            nextDueAt: { lt: now },
            completedAt: null,
        },
        include: {
            enclosure: { select: { id: true, name: true } },
        },
        orderBy: { nextDueAt: "asc" },
    });
}

export async function getOverdueTasksGroupedByUser() {
    const now = new Date();
    const tasks = await prisma.maintenanceTask.findMany({
        where: {
            nextDueAt: { lt: now },
            completedAt: null,
        },
        include: {
            enclosure: { select: { id: true, name: true } },
            user: {
                select: {
                    id: true,
                    email: true,
                    username: true,
                    locale: true,
                    emailVerified: true,
                },
            },
        },
        orderBy: { nextDueAt: "asc" },
    });

    const grouped = new Map<
        string,
        {
            userId: string;
            email: string;
            username: string;
            locale: string;
            tasks: typeof tasks;
        }
    >();

    for (const task of tasks) {
        if (!task.user.emailVerified) continue;

        const existing = grouped.get(task.userId);
        if (existing) {
            existing.tasks.push(task);
        } else {
            grouped.set(task.userId, {
                userId: task.user.id,
                email: task.user.email,
                username: task.user.username,
                locale: task.user.locale,
                tasks: [task],
            });
        }
    }

    return [...grouped.values()];
}
