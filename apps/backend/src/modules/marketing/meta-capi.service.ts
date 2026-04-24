// ─── Meta Conversions API service ───────────────────────────
// Plan v1.7 §10.2 — isolated transport, retry-aware, env-flag toggleable.

import pino from "pino";
import { env } from "@/config/env.js";
import { getMarketingConfig } from "./marketing-config.service.js";
import type { MetaServerEventPayload } from "./meta-payload.js";

const log = pino({ name: "meta-capi" });

export interface MetaCapiResult {
    delivered: boolean;
    skipped: boolean;
    statusCode?: number;
    responseBody?: unknown;
    errorCode?: string;
    errorMessage?: string;
}

export async function dispatchMetaCapiEvent(
    payload: MetaServerEventPayload,
): Promise<MetaCapiResult> {
    const e = env();
    const cfg = await getMarketingConfig();

    if (!cfg.metaCapiEnabled) {
        log.debug({ eventId: payload.event_id }, "META_CAPI disabled — skip");
        return { delivered: false, skipped: true, errorCode: "DISABLED_BY_ENV" };
    }
    if (!cfg.metaPixelId || !cfg.metaAccessToken) {
        log.warn({ eventId: payload.event_id }, "META_CAPI enabled but credentials missing");
        return { delivered: false, skipped: true, errorCode: "MISSING_CREDENTIALS" };
    }
    if (cfg.metaCapiDryRun) {
        log.info({ eventId: payload.event_id, payload }, "META_CAPI dry-run");
        return { delivered: false, skipped: true, errorCode: "DRY_RUN" };
    }

    const url = `https://graph.facebook.com/v19.0/${cfg.metaPixelId}/events`;
    const body: Record<string, unknown> = {
        data: [payload],
        access_token: cfg.metaAccessToken,
    };
    if (cfg.metaTestEventCode) body.test_event_code = cfg.metaTestEventCode;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), e.TRACKING_DISPATCH_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        const responseBody = await response.json().catch(() => null);

        if (!response.ok) {
            log.warn(
                { eventId: payload.event_id, statusCode: response.status, responseBody },
                "META_CAPI dispatch failed",
            );
            return {
                delivered: false,
                skipped: false,
                statusCode: response.status,
                responseBody,
                errorCode: `HTTP_${response.status}`,
                errorMessage:
                    typeof responseBody === "object" && responseBody !== null
                        ? JSON.stringify(responseBody)
                        : undefined,
            };
        }

        log.info({ eventId: payload.event_id, statusCode: response.status }, "META_CAPI delivered");
        return {
            delivered: true,
            skipped: false,
            statusCode: response.status,
            responseBody,
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorCode = controller.signal.aborted ? "TIMEOUT" : "NETWORK";
        log.error({ eventId: payload.event_id, errorMessage, errorCode }, "META_CAPI error");
        return { delivered: false, skipped: false, errorCode, errorMessage };
    } finally {
        clearTimeout(timeout);
    }
}
