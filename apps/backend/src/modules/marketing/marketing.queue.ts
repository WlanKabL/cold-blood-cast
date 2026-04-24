// ─── BullMQ queue + worker for marketing event dispatch ─────
// Plan v1.7 §10.3.

import { Queue, Worker, type Job } from "bullmq";
import pino from "pino";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { getRedis } from "@/config/redis.js";
import { dispatchMetaCapiEvent } from "./meta-capi.service.js";
import type { MetaServerEventPayload } from "./meta-payload.js";

const log = pino({ name: "marketing-queue" });

export const MARKETING_QUEUE_NAME = "marketing-events";

interface MarketingJobData {
    marketingEventId: string;
}

let queueInstance: Queue<MarketingJobData> | null = null;
let workerInstance: Worker<MarketingJobData> | null = null;

export function getMarketingQueue(): Queue<MarketingJobData> {
    if (!queueInstance) {
        const e = env();
        queueInstance = new Queue<MarketingJobData>(MARKETING_QUEUE_NAME, {
            connection: getRedis(),
            defaultJobOptions: {
                attempts: e.TRACKING_MAX_RETRY_COUNT,
                backoff: { type: "exponential", delay: e.TRACKING_RETRY_BASE_DELAY_MS },
                removeOnComplete: { age: 60 * 60 * 24 }, // 24h
                removeOnFail: { age: 60 * 60 * 24 * 7 }, // 7d
            },
        });
    }
    return queueInstance;
}

export async function enqueueMarketingEventDispatch(marketingEventId: string): Promise<void> {
    await getMarketingQueue().add("dispatch", { marketingEventId }, { jobId: marketingEventId });
}

// ─── Worker ─────────────────────────────────────────────────

async function processJob(job: Job<MarketingJobData>): Promise<void> {
    const { marketingEventId } = job.data;
    const event = await prisma.marketingEvent.findUnique({ where: { id: marketingEventId } });
    if (!event) {
        log.warn({ marketingEventId }, "marketing event not found — drop job");
        return;
    }
    if (event.status === "sent" || event.status === "skipped") {
        log.debug({ marketingEventId, status: event.status }, "already finalized — drop");
        return;
    }
    if (event.eventSource !== "server") {
        log.debug({ marketingEventId, source: event.eventSource }, "not a server event — drop");
        return;
    }
    if (!event.payload) {
        await prisma.marketingEvent.update({
            where: { id: marketingEventId },
            data: { status: "failed", failureReason: "missing_payload" },
        });
        return;
    }

    await prisma.marketingEvent.update({
        where: { id: marketingEventId },
        data: {
            status: "processing",
            processingStartedAt: new Date(),
            attemptCount: { increment: 1 },
        },
    });

    const result = await dispatchMetaCapiEvent(event.payload as unknown as MetaServerEventPayload);

    if (result.delivered) {
        await prisma.marketingEvent.update({
            where: { id: marketingEventId },
            data: {
                status: "sent",
                sentAt: new Date(),
                providerResponseCode: result.statusCode,
                lastErrorCode: null,
                failureReason: null,
            },
        });
        return;
    }

    if (result.skipped) {
        await prisma.marketingEvent.update({
            where: { id: marketingEventId },
            data: {
                status: "skipped",
                providerResponseCode: result.statusCode,
                lastErrorCode: result.errorCode,
                failureReason: result.errorCode,
            },
        });
        return;
    }

    // hard failure — let BullMQ retry per job options
    await prisma.marketingEvent.update({
        where: { id: marketingEventId },
        data: {
            status: "pending",
            providerResponseCode: result.statusCode,
            lastErrorCode: result.errorCode,
            failureReason: result.errorMessage ?? result.errorCode,
        },
    });
    throw new Error(`Meta CAPI dispatch failed: ${result.errorCode}`);
}

export function startMarketingWorker(): Worker<MarketingJobData> {
    if (workerInstance) return workerInstance;
    workerInstance = new Worker<MarketingJobData>(MARKETING_QUEUE_NAME, processJob, {
        connection: getRedis(),
        concurrency: 4,
    });
    workerInstance.on("failed", (job, err) => {
        log.warn(
            { jobId: job?.id, attemptsMade: job?.attemptsMade, err: err.message },
            "marketing job failed",
        );
    });
    workerInstance.on("completed", (job) => {
        log.debug({ jobId: job.id }, "marketing job completed");
    });
    log.info("marketing worker started");
    return workerInstance;
}

export async function stopMarketingWorker(): Promise<void> {
    if (workerInstance) {
        await workerInstance.close();
        workerInstance = null;
    }
    if (queueInstance) {
        await queueInstance.close();
        queueInstance = null;
    }
}

// ─── Stuck-pending recovery ────────────────────────────────
// If Redis was unreachable when `recordRegistrationEvent` /
// `recordHighValueEvent` enqueued, the row is persisted with
// status=`pending` but no BullMQ job exists. Re-enqueueing with
// `jobId = marketingEvent.id` is idempotent — BullMQ silently
// ignores duplicate jobIds, so this is safe to call repeatedly.

export interface RescuePendingResult {
    scanned: number;
    reEnqueued: number;
    skipped: number;
}

export async function rescueStuckPendingEvents(opts?: {
    olderThanSeconds?: number;
    limit?: number;
}): Promise<RescuePendingResult> {
    const e = env();
    const olderThan = opts?.olderThanSeconds ?? e.TRACKING_PENDING_RESCUE_AFTER_SECONDS;
    const limit = opts?.limit ?? 500;
    const cutoff = new Date(Date.now() - olderThan * 1000);

    const candidates = await prisma.marketingEvent.findMany({
        where: {
            status: "pending",
            eventSource: "server",
            createdAt: { lt: cutoff },
        },
        select: { id: true, attemptCount: true },
        take: limit,
        orderBy: { createdAt: "asc" },
    });

    if (candidates.length === 0) {
        return { scanned: 0, reEnqueued: 0, skipped: 0 };
    }

    const queue = getMarketingQueue();
    let reEnqueued = 0;
    let skipped = 0;
    for (const row of candidates) {
        // Drop dead/stale BullMQ job (if any) so we can re-add with the same jobId.
        await queue.remove(row.id).catch(() => undefined);
        try {
            await queue.add("dispatch", { marketingEventId: row.id }, { jobId: row.id });
            reEnqueued += 1;
        } catch (err) {
            skipped += 1;
            log.warn({ marketingEventId: row.id, err: (err as Error).message }, "rescue enqueue failed");
        }
    }
    log.info(
        { scanned: candidates.length, reEnqueued, skipped, olderThanSeconds: olderThan },
        "stuck pending events rescued",
    );
    return { scanned: candidates.length, reEnqueued, skipped };
}
