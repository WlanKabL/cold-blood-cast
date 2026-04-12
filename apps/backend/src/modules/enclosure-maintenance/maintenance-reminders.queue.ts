import pino from "pino";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { getBerlinDayInfo, hasJobRunToday, logJobRun } from "@/helpers/scheduler.js";
import { sendMail } from "@/modules/mail/mail.service.js";
import {
    maintenanceReminderTemplate,
    type MaintenanceReminderData,
} from "@/modules/mail/templates/maintenance-reminder.js";
import type { MaintenanceReminderTask } from "@/modules/mail/templates/maintenance-reminder.js";

const logger = pino({ name: "maintenance-reminders" });
const JOB_NAME = "maintenance-reminders";
const RUN_HOUR = 8; // 08:00 Berlin time

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

interface UserMaintenanceGroup {
    userId: string;
    email: string;
    username: string;
    locale: string;
    tasks: MaintenanceReminderTask[];
}

async function getUsersWithOverdueTasks(): Promise<UserMaintenanceGroup[]> {
    const now = new Date();

    const overdueTasks = await prisma.maintenanceTask.findMany({
        where: {
            nextDueAt: { lt: now },
            completedAt: null,
        },
        include: {
            enclosure: { select: { name: true } },
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

    const grouped = new Map<string, UserMaintenanceGroup>();

    for (const task of overdueTasks) {
        if (!task.user.emailVerified) continue;
        if (!task.nextDueAt) continue;

        const daysOverdue = Math.floor(
            (now.getTime() - task.nextDueAt.getTime()) / (1000 * 60 * 60 * 24),
        );

        const reminderTask: MaintenanceReminderTask = {
            enclosureName: task.enclosure.name,
            type: task.type,
            description: task.description,
            dueDate: task.nextDueAt.toLocaleDateString(
                task.user.locale === "de" ? "de-DE" : "en-US",
                {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                },
            ),
            daysOverdue,
        };

        const existing = grouped.get(task.userId);
        if (existing) {
            existing.tasks.push(reminderTask);
        } else {
            grouped.set(task.userId, {
                userId: task.user.id,
                email: task.user.email,
                username: task.user.username,
                locale: task.user.locale,
                tasks: [reminderTask],
            });
        }
    }

    return [...grouped.values()];
}

async function sendMaintenanceReminders(): Promise<number> {
    const groups = await getUsersWithOverdueTasks();
    if (groups.length === 0) return 0;

    const frontendUrl = env().FRONTEND_URL;
    let sent = 0;

    for (const group of groups) {
        const data: MaintenanceReminderData = {
            username: group.username,
            tasks: group.tasks,
            dashboardUrl: `${frontendUrl}/enclosures`,
            locale: group.locale,
        };

        const html = maintenanceReminderTemplate(data);

        const subject = group.locale === "de" ? "Wartungs-Erinnerung" : "Maintenance Reminder";

        const ok = await sendMail({
            to: group.email,
            subject,
            html,
            log: {
                userId: group.userId,
                template: "maintenance-reminder",
            },
        });

        if (ok) sent++;
    }

    return sent;
}

export function startMaintenanceReminderScheduler(): void {
    if (schedulerInterval) return;

    let running = false;

    const tick = async () => {
        if (running) return;
        running = true;

        try {
            const { dateStr, hour } = getBerlinDayInfo(new Date());

            if (hour !== RUN_HOUR) return;
            if (await hasJobRunToday(JOB_NAME, dateStr)) return;

            const startedAt = new Date();
            logger.info("Starting maintenance reminder check (08:00 Berlin)");

            const sent = await sendMaintenanceReminders();

            await logJobRun(JOB_NAME, "success", startedAt, { emailsSent: sent });
            logger.info({ emailsSent: sent }, "Maintenance reminder check completed");
        } catch (err) {
            await logJobRun(JOB_NAME, "error", new Date(), undefined, String(err));
            logger.error({ err }, "Maintenance reminder check failed");
        } finally {
            running = false;
        }
    };

    schedulerInterval = setInterval(tick, 60_000);
    tick().catch((err) => logger.error({ err }, "Initial maintenance reminder tick failed"));

    logger.info(`Maintenance reminder scheduler started (daily at ${RUN_HOUR}:00 Berlin)`);
}

export function stopMaintenanceReminderScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        logger.info("Maintenance reminder scheduler stopped");
    }
}
