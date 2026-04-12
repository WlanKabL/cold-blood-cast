import { prisma } from "@/config/database.js";

/**
 * Get current Berlin date info using Intl (handles CET/CEST automatically).
 */
export function getBerlinDayInfo(now: Date): { dateStr: string; hour: number; dayOfWeek: number } {
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
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";

    const dayMap: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };

    return { dateStr: `${year}-${month}-${day}`, hour, dayOfWeek: dayMap[weekday] ?? -1 };
}

/**
 * Check if a scheduler job has already run today by looking at CronJobLog.
 */
export async function hasJobRunToday(jobName: string, dateStr: string): Promise<boolean> {
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const existing = await prisma.cronJobLog.findFirst({
        where: {
            jobName,
            startedAt: { gte: dayStart, lte: dayEnd },
        },
    });

    return !!existing;
}

/**
 * Log a scheduler job run to CronJobLog.
 */
export async function logJobRun(
    jobName: string,
    status: "success" | "error",
    startedAt: Date,
    details?: Record<string, unknown>,
    error?: string,
): Promise<void> {
    await prisma.cronJobLog.create({
        data: {
            jobName,
            status,
            startedAt,
            endedAt: new Date(),
            details: details ?? undefined,
            error: error ?? undefined,
        },
    });
}
