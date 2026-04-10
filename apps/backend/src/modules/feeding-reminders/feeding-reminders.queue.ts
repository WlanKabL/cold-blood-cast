import pino from "pino";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { sendMail } from "@/modules/mail/mail.service.js";
import { feedingReminderTemplate } from "@/modules/mail/templates/index.js";
import { computeFeedingStatus } from "./feeding-reminders.service.js";

const logger = pino({ name: "feeding-reminders" });
const RUN_HOUR = 8; // 08:00 Berlin time

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastRunDate: string | null = null;

function getBerlinDayInfo(now: Date): { dateStr: string; hour: number } {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const year = parts.find((p) => p.type === "year")!.value;
    const month = parts.find((p) => p.type === "month")!.value;
    const day = parts.find((p) => p.type === "day")!.value;
    const hour = Number(parts.find((p) => p.type === "hour")!.value);

    return { dateStr: `${year}-${month}-${day}`, hour };
}

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
            if (lastRunDate === dateStr) return;

            lastRunDate = dateStr;
            logger.info("Starting feeding reminder check (08:00 Berlin)");

            const sent = await sendFeedingReminders();

            logger.info({ emailsSent: sent }, "Feeding reminder check completed");
        } catch (err) {
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
