import { env } from "../config.js";

type NotificationEvent =
    | "register"
    | "login"
    | "first_login"
    | "pending"
    | "breach"
    | "server_error"
    | "approval";

interface NotificationPayload {
    event: NotificationEvent;
    title: string;
    message: string;
}

export async function sendTelegram(payload: NotificationPayload): Promise<void> {
    const config = env();
    if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_CHAT_ID) return;

    const text = `*${payload.title}*\n${payload.message}`;

    try {
        await fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: config.TELEGRAM_CHAT_ID,
                text,
                parse_mode: "Markdown",
            }),
        });
    } catch {
        // fire-and-forget
    }
}

const DISCORD_COLORS: Record<NotificationEvent, number> = {
    register: 0x22c55e,
    login: 0x3b82f6,
    first_login: 0x8b5cf6,
    pending: 0xf59e0b,
    breach: 0xef4444,
    server_error: 0xef4444,
    approval: 0x22c55e,
};

export async function sendDiscord(payload: NotificationPayload): Promise<void> {
    const config = env();
    if (!config.DISCORD_WEBHOOK_URL) return;

    try {
        await fetch(config.DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [
                    {
                        title: payload.title,
                        description: payload.message,
                        color: DISCORD_COLORS[payload.event] ?? 0x6b7280,
                        timestamp: new Date().toISOString(),
                    },
                ],
            }),
        });
    } catch {
        // fire-and-forget
    }
}

function notify(payload: NotificationPayload): void {
    void sendTelegram(payload);
    void sendDiscord(payload);
}

export function notifyNewUser(username: string, email: string): void {
    notify({
        event: "register",
        title: "New Registration",
        message: `User **${username}** (${email}) has registered.`,
    });
}

export function notifyLogin(username: string, ip?: string): void {
    notify({
        event: "login",
        title: "User Login",
        message: `**${username}** logged in${ip ? ` from ${ip}` : ""}.`,
    });
}

export function notifyFirstLogin(username: string): void {
    notify({
        event: "first_login",
        title: "First Login",
        message: `**${username}** logged in for the first time.`,
    });
}

export function notifyPendingApproval(username: string, email: string): void {
    notify({
        event: "pending",
        title: "Pending Approval",
        message: `**${username}** (${email}) is waiting for account approval.`,
    });
}

export function notifyBreach(details: string): void {
    notify({
        event: "breach",
        title: "Security Alert",
        message: details,
    });
}

export function notifyServerError(error: string): void {
    notify({
        event: "server_error",
        title: "Server Error",
        message: error,
    });
}

export function notifyApproval(username: string): void {
    notify({
        event: "approval",
        title: "User Approved",
        message: `**${username}** has been approved.`,
    });
}
