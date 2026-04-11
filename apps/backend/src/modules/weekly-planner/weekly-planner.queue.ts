import pino from "pino";
import { env } from "@/config/env.js";
import { sendMail } from "@/modules/mail/mail.service.js";
import { weeklyCareDigestTemplate } from "@/modules/mail/templates/index.js";
import { getOptedInUsers, getWeekEvents } from "./weekly-planner.service.js";

const logger = pino({ name: "weekly-planner" });
const RUN_DAY = 0; // Sunday
const RUN_HOUR = 18; // 18:00 Berlin time

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastRunDate: string | null = null;

function getBerlinDayInfo(now: Date): { dateStr: string; hour: number; dayOfWeek: number } {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
        weekday: "short",
    });

    const parts = formatter.formatToParts(now);
    const year = parts.find((p) => p.type === "year")!.value;
    const month = parts.find((p) => p.type === "month")!.value;
    const day = parts.find((p) => p.type === "day")!.value;
    const hour = Number(parts.find((p) => p.type === "hour")!.value);
    const weekday = parts.find((p) => p.type === "weekday")!.value;

    const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };

    return { dateStr: `${year}-${month}-${day}`, hour, dayOfWeek: dayMap[weekday] ?? -1 };
}

function getNextMonday(now: Date): Date {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay();
    const diff = day === 0 ? 1 : 8 - day; // If Sunday → tomorrow. Otherwise → next Monday
    d.setUTCDate(d.getUTCDate() + diff);
    return d;
}

function formatWeekLabel(weekStart: Date, locale: string): string {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const loc = locale === "de" ? "de-DE" : "en-US";

    return `${weekStart.toLocaleDateString(loc, opts)} – ${weekEnd.toLocaleDateString(loc, opts)}`;
}

async function sendWeeklyDigests(): Promise<number> {
    const users = await getOptedInUsers();
    if (users.length === 0) return 0;

    const nextMonday = getNextMonday(new Date());
    const frontendUrl = env().FRONTEND_URL;
    let sent = 0;

    for (const user of users) {
        const days = await getWeekEvents(user.id, nextMonday);
        const hasEvents = days.some((d) => d.events.length > 0);
        if (!hasEvents) continue;

        const weekLabel = formatWeekLabel(nextMonday, user.locale);

        const html = weeklyCareDigestTemplate({
            username: user.username,
            days,
            weekLabel,
            plannerUrl: `${frontendUrl}/planner`,
            locale: user.locale,
        });

        const subject =
            user.locale === "de"
                ? `Dein Wochenüberblick: ${weekLabel}`
                : `Your Weekly Overview: ${weekLabel}`;

        const ok = await sendMail({
            to: user.email,
            subject,
            html,
            log: {
                userId: user.id,
                template: "weekly-care-digest",
            },
        });

        if (ok) sent++;
    }

    return sent;
}

export function startWeeklyPlannerScheduler(): void {
    if (schedulerInterval) return;

    let running = false;

    const tick = async () => {
        if (running) return;
        running = true;

        try {
            const { dateStr, hour, dayOfWeek } = getBerlinDayInfo(new Date());

            if (dayOfWeek !== RUN_DAY || hour !== RUN_HOUR) return;
            if (lastRunDate === dateStr) return;

            lastRunDate = dateStr;
            logger.info("Starting weekly care digest (Sunday 18:00 Berlin)");

            const sent = await sendWeeklyDigests();
            logger.info({ emailsSent: sent }, "Weekly care digest completed");
        } catch (err) {
            logger.error({ err }, "Weekly care digest failed");
        } finally {
            running = false;
        }
    };

    schedulerInterval = setInterval(tick, 60_000);
    tick().catch((err) => logger.error({ err }, "Initial weekly planner tick failed"));

    logger.info(`Weekly planner scheduler started (Sunday at ${RUN_HOUR}:00 Berlin)`);
}

export function stopWeeklyPlannerScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        logger.info("Weekly planner scheduler stopped");
    }
}
