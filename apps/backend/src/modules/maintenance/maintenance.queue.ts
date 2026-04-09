import pino from "pino";
import { env } from "@/config/env.js";
import { runMaintenance } from "./maintenance.service.js";

const logger = pino({ name: "maintenance" });
const RUN_HOUR = 3; // 03:00 Berlin time

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastRunDate: string | null = null;

/**
 * Get current Berlin date and hour (handles CET/CEST automatically).
 */
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

/**
 * Start a polling scheduler that triggers maintenance daily at 03:00 Berlin time.
 * Checks every 60 seconds. Ensures only one run per calendar day.
 */
export function startMaintenanceScheduler(): void {
    if (schedulerInterval) return;

    let running = false;

    const tick = async () => {
        if (running) return;
        running = true;

        try {
            const { dateStr, hour } = getBerlinDayInfo(new Date());

            // Only run during the target hour, and only once per day
            if (hour !== RUN_HOUR) return;
            if (lastRunDate === dateStr) return;

            lastRunDate = dateStr;
            logger.info("Starting daily maintenance (03:00 Berlin)");

            const result = await runMaintenance();

            logger.info(
                {
                    encrypted: result.encrypted,
                    orphansRemoved: result.orphansRemoved,
                    retention: result.retention,
                },
                "Daily maintenance completed",
            );
        } catch (err) {
            logger.error({ err }, "Maintenance run failed");
        } finally {
            running = false;
        }
    };

    schedulerInterval = setInterval(tick, 60_000);
    // Run initial check on startup (in case server starts at 03:xx)
    tick().catch((err) => logger.error({ err }, "Initial maintenance tick failed"));

    logger.info(`Maintenance scheduler started (daily at ${RUN_HOUR}:00 Berlin)`);
}

export function stopMaintenanceScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
