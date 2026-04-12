import pino from "pino";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { getBerlinDayInfo, hasJobRunToday, logJobRun } from "@/helpers/scheduler.js";
import { sendMail } from "@/modules/mail/mail.service.js";
import { feedingReminderTemplate } from "@/modules/mail/templates/index.js";
import { computeFeedingStatus } from "./feeding-reminders.service.js";

const logger = pino({ name: "feeding-reminders" });
const JOB_NAME = "feeding-reminders";
const RUN_HOUR = 8; // 08:00 Berlin time

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

interface CriticalPetInfo {
    petName: string;
    species: string;
    daysSinceLastFeeding: number | null;
    intervalMaxDays: number;
}

interface UserReminderGroup {
    userId: string;
    email: string;
    username: string;
    locale: string;
    pets: CriticalPetInfo[];
}

async function getUsersWithCriticalPets(): Promise<UserReminderGroup[]> {
    const users = await prisma.user.findMany({
        where: { emailVerified: true },
        select: {
            id: true,
            email: true,
            username: true,
            locale: true,
            pets: {
                where: {
                    feedingIntervalMinDays: { not: null },
                    feedingIntervalMaxDays: { not: null },
                },
                select: {
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
            },
        },
    });

    const now = new Date();
    const result: UserReminderGroup[] = [];

    for (const user of users) {
        const criticalPets: CriticalPetInfo[] = [];

        for (const pet of user.pets) {
            const lastFedAt = pet.feedings[0]?.fedAt ?? null;
            const { daysSinceLastFeeding, status } = computeFeedingStatus(
                pet.feedingIntervalMinDays,
                pet.feedingIntervalMaxDays,
                lastFedAt,
                now,
            );

            if (status === "critical") {
                criticalPets.push({
                    petName: pet.name,
                    species: pet.species,
                    daysSinceLastFeeding,
                    intervalMaxDays: pet.feedingIntervalMaxDays!,
                });
            }
        }

        if (criticalPets.length > 0) {
            result.push({
                userId: user.id,
                email: user.email,
                username: user.username,
                locale: user.locale,
                pets: criticalPets,
            });
        }
    }

    return result;
}

async function sendFeedingReminders(): Promise<number> {
    const groups = await getUsersWithCriticalPets();
    if (groups.length === 0) return 0;

    const frontendUrl = env().FRONTEND_URL;
    let sent = 0;

    for (const group of groups) {
        const html = feedingReminderTemplate({
            username: group.username,
            pets: group.pets,
            dashboardUrl: `${frontendUrl}/dashboard`,
            locale: group.locale,
        });

        const subject = group.locale === "de" ? "Fütterungserinnerung" : "Feeding Reminder";

        const ok = await sendMail({
            to: group.email,
            subject,
            html,
            log: {
                userId: group.userId,
                template: "feeding-reminder",
            },
        });

        if (ok) sent++;
    }

    return sent;
}

export function startFeedingReminderScheduler(): void {
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
            logger.info("Starting feeding reminder check (08:00 Berlin)");

            const sent = await sendFeedingReminders();

            await logJobRun(JOB_NAME, "success", startedAt, { emailsSent: sent });
            logger.info({ emailsSent: sent }, "Feeding reminder check completed");
        } catch (err) {
            await logJobRun(JOB_NAME, "error", new Date(), undefined, String(err));
            logger.error({ err }, "Feeding reminder check failed");
        } finally {
            running = false;
        }
    };

    schedulerInterval = setInterval(tick, 60_000);
    tick().catch((err) => logger.error({ err }, "Initial feeding reminder tick failed"));

    logger.info(`Feeding reminder scheduler started (daily at ${RUN_HOUR}:00 Berlin)`);
}

export function stopFeedingReminderScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
