import pino from "pino";
import { env } from "@/config/env.js";
import { getBerlinDayInfo, hasJobRunToday, logJobRun } from "@/helpers/scheduler.js";
import { runMaintenance } from "./maintenance.service.js";

const logger = pino({ name: "maintenance" });
const JOB_NAME = "maintenance";
const RUN_HOUR = 3; // 03:00 Berlin time

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

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
            if (await hasJobRunToday(JOB_NAME, dateStr)) return;

            const startedAt = new Date();
            logger.info("Starting daily maintenance (03:00 Berlin)");

            const result = await runMaintenance();

            await logJobRun(JOB_NAME, "success", startedAt, {
                encrypted: result.encrypted,
                orphansRemoved: result.orphansRemoved,
                retention: result.retention,
            });

            logger.info(
                {
                    encrypted: result.encrypted,
                    orphansRemoved: result.orphansRemoved,
                    retention: result.retention,
                },
                "Daily maintenance completed",
            );
        } catch (err) {
            await logJobRun(JOB_NAME, "error", new Date(), undefined, String(err));
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
