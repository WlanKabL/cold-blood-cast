// src/services/alert.service.ts
import type { SensorConfig, SensorReading, SensorStatus } from "../types/sensor.js";
import { subscriberService } from "./subscriber.service.js";
import { DataStorageService } from "../storage/dataStorageService.js";
import { isNight } from "../utils/date.js";
import { validateEnv } from "../config.js";
import { enqueueAlert } from "../alerts/notificationQueue.js";
import { Markup } from "telegraf";
import { escapeHtml } from "../utils/html.js";

export async function broadcastStartup() {
    const env = validateEnv(process.env);
    const chatIds = subscriberService.getSubscribers();
    if (!chatIds.length) return;

    // reload up-to-date config
    const appConfig = new DataStorageService(env.DATA_DIR).getAppConfigStore().load();

    // assemble HTML message
    const html = `
<b>🚀 Snake Link started</b>
<i>(${appConfig.general.name})</i>
<b></b>
<b>Time:</b> <code>${new Date().toLocaleString("de-DE", {
        timeZone: appConfig.general.timezone,
        hour: "2-digit",
        minute: "2-digit",
    })}</code>
<b></b>
<b>Timezone:</b> <code>${appConfig.general.timezone}</code>
<b></b>
<b>Node:</b> <code>${process.version}</code>
<b></b>
<b>OS:</b> <code>${process.platform}</code>
<b></b>
<b>Arch:</b> <code>${process.arch}</code>
<b></b>
<b>CPU:</b> <code>${process.cpuUsage().user / 1e6} %</code>
<b></b>
<b>Memory:</b> <code>${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</code>
<b></b>
<b>Uptime:</b> <code>${Math.round(process.uptime())} s</code>
`.trim();

    // enqueue each chat
    chatIds.forEach((chatId) => enqueueAlert(chatId, html));
}
/**
 * Send a formatted alert message to all registered Telegram chats,
 * using HTML parse mode.
 */
export async function broadcastAlert(
    sensor: SensorConfig,
    status: SensorStatus,
    reading?: SensorReading | null,
): Promise<void> {
    const env = validateEnv(process.env);
    const chatIds = subscriberService.getSubscribers();
    if (!chatIds.length) return;

    // reload up-to-date config
    const appConfig = new DataStorageService(env.DATA_DIR).getAppConfigStore().load();

    // escape dynamic pieces
    const safeName = escapeHtml(sensor.name);
    const safeId = escapeHtml(sensor.id);
    const safeType = escapeHtml(sensor.type);
    const safeStatus = escapeHtml(status.toUpperCase());

    // current value
    const valueText =
        reading?.value != null
            ? `<code>${escapeHtml(String(reading.value))}${escapeHtml(sensor.unit)}</code>`
            : `<code>n/a</code>`;

    // build limits description
    let limitsHtml: string;
    if (sensor.limitsType === "general") {
        const { min, max } = sensor.readingLimits as { min?: number; max?: number };
        const lo = min != null ? `${min}${sensor.unit}` : "–∞";
        const hi = max != null ? `${max}${sensor.unit}` : "+∞";
        limitsHtml = `<b>General:</b> <i>${escapeHtml(lo)} – ${escapeHtml(hi)}</i>`;
    } else {
        const tbl = sensor.readingLimits as {
            day: { min?: number; max?: number };
            night: { min?: number; max?: number };
        };
        const nowNight = isNight(appConfig);
        const dayLabel = nowNight ? "Day (past)" : "Day (current)";
        const nightLabel = nowNight ? "Night (current)" : "Night (upcoming)";

        const dLo = tbl.day.min != null ? `${tbl.day.min}${sensor.unit}` : "–∞";
        const dHi = tbl.day.max != null ? `${tbl.day.max}${sensor.unit}` : "+∞";
        const nLo = tbl.night.min != null ? `${tbl.night.min}${sensor.unit}` : "–∞";
        const nHi = tbl.night.max != null ? `${tbl.night.max}${sensor.unit}` : "+∞";

        limitsHtml = `
<b>${escapeHtml(dayLabel)}:</b> <i>${escapeHtml(dLo)} – ${escapeHtml(dHi)}</i>
<b>${escapeHtml(nightLabel)}:</b> <i>${escapeHtml(nLo)} – ${escapeHtml(nHi)}</i>
`.trim();
    }

    // timestamp
    const ts = reading?.timestamp
        ? new Date(reading.timestamp).toLocaleString("de-DE", {
              timeZone: appConfig.general.timezone,
              hour: "2-digit",
              minute: "2-digit",
          })
        : "n/a";
    const safeTs = escapeHtml(ts);

    // assemble HTML message
    const html = `
🚨 <b>Alert:</b> <i>${safeName}</i>
<b>Status:</b> <code>${safeStatus}</code>
<b>Value:</b> ${valueText}
<b></b>
<b>Limits:</b>
${limitsHtml}
<b></b>
<b>Time:</b> <code>${safeTs}</code>

<code>ID:</code> ${safeId}
<code>Type:</code> ${safeType}
`.trim();

    // enqueue each chat
    chatIds.forEach((chatId) => enqueueAlert(chatId, html));
}

/**
 * Send a simple test message to all subscribed Telegram chats.
 */
export async function broadcastTestMessage(): Promise<void> {
    const env = validateEnv(process.env);
    const chatIds = subscriberService.getSubscribers();
    if (!chatIds.length) return;

    // reload config for timezone etc.
    const appConfig = new DataStorageService(env.DATA_DIR).getAppConfigStore().load();

    const now = new Date().toLocaleString("de-DE", {
        timeZone: appConfig.general.timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const html = `
📢 <b>Test Alert</b>
<b>Time:</b> <code>${now}</code>
<b>Project:</b> <i>${escapeHtml(appConfig.general.name)}</i>

<code>This is a test notification.</code>
`.trim();

    chatIds.forEach((chatId) => enqueueAlert(chatId, html));
}
