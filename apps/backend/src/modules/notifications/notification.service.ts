/**
 * Notification Service
 *
 * Sends messages to Telegram and/or Discord based on:
 *   - env variables (credentials must be present)
 *   - system settings (channel/event toggles, stored in DB)
 *
 * All methods are fire-and-forget — errors are logged but never thrown
 * so they never break the main request flow.
 */

import { env } from "@/config/env.js";
import { getSystemSetting } from "@/modules/admin/settings.service.js";
import { sendMail } from "@/modules/mail/mail.service.js";
import { emailLayout, emailHeading, emailText } from "@/modules/mail/templates/components.js";

// ─── Types ───────────────────────────────────────────────────

export type NotificationEvent =
    | "register"
    | "login"
    | "first_login"
    | "pending"
    | "breach"
    | "server_error"
    | "sensor_alert"
    | "new_comment"
    | "new_report";

interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

interface NotificationPayload {
    title: string;
    description?: string;
    fields?: EmbedField[];
    color: number; // Discord embed color as integer (0xRRGGBB)
}

// ─── Event accent colors ──────────────────────────────────────

const EVENT_COLOR: Record<NotificationEvent, number> = {
    register: 0x6366f1, // indigo
    first_login: 0x22c55e, // green
    login: 0x3b82f6, // blue
    pending: 0xf59e0b, // amber
    breach: 0xef4444, // red
    server_error: 0x8b5cf6, // purple
    sensor_alert: 0xf97316, // orange
    new_comment: 0x06b6d4, // cyan
    new_report: 0xdc2626, // red-600
};

// ─── Internal senders ────────────────────────────────────────

async function sendTelegram(payload: NotificationPayload): Promise<void> {
    const e = env();
    if (!e.TELEGRAM_BOT_TOKEN || !e.TELEGRAM_CHAT_ID) return;

    const lines: string[] = [];
    lines.push(`🔔 <b>KeeperLog</b>  ·  <b>${payload.title}</b>`);
    if (payload.description) lines.push(`\n${payload.description}`);
    if (payload.fields?.length) {
        lines.push("");
        for (const f of payload.fields) {
            lines.push(`<b>${f.name}:</b>  ${f.value}`);
        }
    }
    lines.push(`\n<i>${new Date().toUTCString()}</i>`);

    const url = `https://api.telegram.org/bot${e.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: e.TELEGRAM_CHAT_ID,
            text: lines.join("\n"),
            parse_mode: "HTML",
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[Notifications] Telegram error ${res.status}: ${body}`);
    }
}

async function sendDiscord(payload: NotificationPayload): Promise<void> {
    const e = env();
    if (!e.DISCORD_WEBHOOK_URL) return;

    const embed = {
        title: payload.title,
        description: payload.description,
        color: payload.color,
        fields: payload.fields?.map((f) => ({
            name: f.name,
            value: f.value,
            inline: f.inline ?? true,
        })),
        footer: {
            text: "KeeperLog",
        },
        timestamp: new Date().toISOString(),
    };

    const res = await fetch(e.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[Notifications] Discord error ${res.status}: ${body}`);
    }
}

async function sendNotificationEmail(payload: NotificationPayload): Promise<void> {
    const e = env();
    const notificationEmail = await getSystemSetting<string>("notification_email", "");
    if (!notificationEmail) return;

    const fieldsHtml = payload.fields?.length
        ? payload.fields
              .map(
                  (f) =>
                      `<strong style="color:#e5e5e5;">${f.name}:</strong> ${f.value}`,
              )
              .join("<br/>")
        : "";

    const html = emailLayout(`
        ${emailHeading(`🔔 ${payload.title}`)}
        ${payload.description ? emailText(payload.description) : ""}
        ${fieldsHtml ? emailText(fieldsHtml) : ""}
        ${emailText(`<span style="color:#a3a08e;font-size:12px;">${new Date().toUTCString()}</span>`, true)}
    `);

    await sendMail({
        to: notificationEmail,
        subject: `[KeeperLog] ${payload.title}`,
        html,
    });
}

// ─── Setting key map ─────────────────────────────────────────

const EVENT_SETTING_KEY: Record<NotificationEvent, string> = {
    register: "notify_on_register",
    login: "notify_on_login",
    first_login: "notify_on_first_login",
    pending: "notify_on_pending",
    breach: "notify_on_breach",
    server_error: "notify_on_server_error",
    sensor_alert: "notify_on_sensor_alert",
    new_comment: "notify_on_new_comment",
    new_report: "notify_on_new_report",
};

// ─── Main notify function ─────────────────────────────────────

/**
 * Fire-and-forget notification dispatch.
 *
 * @param event   - The notification event type
 * @param payload - Structured embed payload (title, fields, color, …)
 */
export async function notify(
    event: NotificationEvent,
    payload: NotificationPayload,
): Promise<void> {
    try {
        const eventKey = EVENT_SETTING_KEY[event];
        const eventEnabled = await getSystemSetting<boolean>(eventKey, true);
        if (!eventEnabled) return;

        const [telegramEnabled, discordEnabled, emailEnabled] = await Promise.all([
            getSystemSetting<boolean>("telegram_enabled", false),
            getSystemSetting<boolean>("discord_enabled", false),
            getSystemSetting<boolean>("email_notifications_enabled", false),
        ]);

        const tasks: Promise<void>[] = [];
        if (telegramEnabled) tasks.push(sendTelegram(payload));
        if (discordEnabled) tasks.push(sendDiscord(payload));
        if (emailEnabled) tasks.push(sendNotificationEmail(payload));

        await Promise.allSettled(tasks);
    } catch (err) {
        console.error("[Notifications] Unexpected error:", err);
    }
}

// ─── Convenience wrappers ─────────────────────────────────────

export function notifyNewUser(username: string, email: string): void {
    void notify("register", {
        title: "👤 New User Registered",
        color: EVENT_COLOR.register,
        fields: [
            { name: "Username", value: username, inline: true },
            { name: "Email", value: email, inline: true },
        ],
    });
}

export function notifyPendingApproval(username: string, email: string): void {
    void notify("pending", {
        title: "⏳ User Awaiting Approval",
        color: EVENT_COLOR.pending,
        fields: [
            { name: "Username", value: username, inline: true },
            { name: "Email", value: email, inline: true },
        ],
    });
}

export function notifyLogin(username: string, ip?: string): void {
    const fields: EmbedField[] = [{ name: "Username", value: username, inline: true }];
    if (ip) fields.push({ name: "IP", value: ip, inline: true });

    void notify("login", {
        title: "🔐 User Logged In",
        color: EVENT_COLOR.login,
        fields,
    });
}

export function notifyFirstLogin(username: string): void {
    void notify("first_login", {
        title: "🎉 First Login!",
        description: "A new user completed their first login.",
        color: EVENT_COLOR.first_login,
        fields: [{ name: "Username", value: username, inline: true }],
    });
}

export function notifyAlertBreach(
    username: string,
    enclosureName: string,
    sensorType: string,
    value: string,
    threshold: string,
): void {
    void notify("breach", {
        title: "🚨 Sensor Alert Triggered!",
        color: EVENT_COLOR.breach,
        fields: [
            { name: "User", value: username, inline: true },
            { name: "Enclosure", value: enclosureName, inline: true },
            { name: "Sensor", value: sensorType, inline: true },
            { name: "Value", value: value, inline: true },
            { name: "Threshold", value: threshold, inline: true },
        ],
    });
}

export function notifyServerError(message: string, path?: string): void {
    const fields: EmbedField[] = [{ name: "Error", value: message, inline: false }];
    if (path) fields.unshift({ name: "Path", value: path, inline: true });

    void notify("server_error", {
        title: "💥 Server Error",
        color: EVENT_COLOR.server_error,
        fields,
    });
}

export function notifySensorAlert(
    username: string,
    enclosureName: string,
    sensorType: string,
    value: string,
    threshold: string,
): void {
    void notify("sensor_alert", {
        title: "🌡️ Sensor Out of Range",
        color: EVENT_COLOR.sensor_alert,
        fields: [
            { name: "User", value: username, inline: true },
            { name: "Enclosure", value: enclosureName, inline: true },
            { name: "Sensor", value: sensorType, inline: true },
            { name: "Current", value: value, inline: true },
            { name: "Threshold", value: threshold, inline: true },
        ],
    });
}

export function notifyNewComment(profileName: string, authorName: string, profileUrl?: string): void {
    const fields: EmbedField[] = [
        { name: "Profile", value: profileName, inline: true },
        { name: "Author", value: authorName, inline: true },
    ];
    if (profileUrl) fields.push({ name: "URL", value: profileUrl, inline: false });

    void notify("new_comment", {
        title: "💬 New Comment",
        description: "Someone left a comment on a public profile.",
        color: EVENT_COLOR.new_comment,
        fields,
    });
}

export function notifyNewReport(targetType: string, reason: string, targetUrl?: string): void {
    const fields: EmbedField[] = [
        { name: "Type", value: targetType, inline: true },
        { name: "Reason", value: reason, inline: true },
    ];
    if (targetUrl) fields.push({ name: "URL", value: targetUrl, inline: false });

    void notify("new_report", {
        title: "🚩 New Report",
        description: "Content has been reported by a user.",
        color: EVENT_COLOR.new_report,
        fields,
    });
}
