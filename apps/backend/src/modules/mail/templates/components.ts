/**
 * Email Template Components
 *
 * Reusable building blocks for all KeeperLog emails.
 * Pure functions returning HTML strings with inline styles.
 *
 * Design: Dark earthy theme matching the olive/copper brand.
 *   - Background:  #121208 (warm near-black)
 *   - Card:        #1a1a0f (olive-tinted dark)
 *   - Border:      #2a2a1c
 *   - Text:        #e8e6dd (warm cream), #a3a08e (warm muted)
 *   - Accent:      #8a9c4a (olive) → #d87533 (copper)
 */

import { env } from "@/config/env.js";

// ── Brand Constants ──────────────────────────────────────────

function getBaseUrl(): string {
    try {
        return env().FRONTEND_URL.replace(/\/$/, "");
    } catch {
        return "http://localhost:3000";
    }
}

const BRAND = {
    name: "KeeperLog",
    get url() {
        return getBaseUrl();
    },
    get logo() {
        return `${getBaseUrl()}/cbc.png`;
    },
    color: {
        bg: "#121208",
        card: "#1a1a0f",
        cardBorder: "#2a2a1c",
        text: "#e8e6dd",
        muted: "#a3a08e",
        faint: "#6b6b5a",
        accent: "#8a9c4a",
        accentHover: "#6f7e38",
        success: "#6f7e38",
        danger: "#c45e23",
        warning: "#d87533",
    },
} as const;

// ── Layout ───────────────────────────────────────────────────

export function emailLayout(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.color.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.color.bg};">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
                    ${emailHeader()}
                    <tr>
                        <td style="background-color:${BRAND.color.card};border:1px solid ${BRAND.color.cardBorder};border-radius:16px;padding:40px 32px;">
                            ${content}
                        </td>
                    </tr>
                    ${emailFooter()}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// ── Header ───────────────────────────────────────────────────

export function emailHeader(): string {
    return `<tr>
    <td align="center" style="padding-bottom:32px;">
        <a href="${BRAND.url}" style="text-decoration:none;display:inline-flex;align-items:center;">
            <img src="${BRAND.logo}" alt="${BRAND.name}" width="36" height="36" style="border-radius:10px;margin-right:12px;" />
            <span style="font-size:22px;font-weight:700;color:${BRAND.color.text};letter-spacing:-0.5px;">${BRAND.name}</span>
        </a>
    </td>
</tr>`;
}

// ── Footer ───────────────────────────────────────────────────

export function emailFooter(): string {
    return `<tr>
    <td align="center" style="padding-top:32px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
                <td style="padding-bottom:16px;">
                    <div style="width:48px;height:1px;background:linear-gradient(90deg,transparent,${BRAND.color.accent},transparent);margin:0 auto;"></div>
                </td>
            </tr>
            <tr>
                <td align="center" style="color:${BRAND.color.faint};font-size:12px;line-height:1.6;">
                    <a href="${BRAND.url}" style="color:${BRAND.color.faint};text-decoration:none;">${BRAND.name}</a>
                    &nbsp;·&nbsp; Terrarium Monitoring &amp; Alerts
                    <br />
                    <span style="color:${BRAND.color.faint};font-size:11px;">
                        You received this email because you have an account at ${BRAND.url}
                    </span>
                </td>
            </tr>
        </table>
    </td>
</tr>`;
}

// ── Button ───────────────────────────────────────────────────

interface ButtonOptions {
    text: string;
    href: string;
    color?: string;
}

export function emailButton(options: ButtonOptions): string {
    const bg = options.color ?? BRAND.color.accent;
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
        <td align="center" style="background-color:${bg};border-radius:12px;">
            <a href="${options.href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
                ${options.text}
            </a>
        </td>
    </tr>
</table>`;
}

// ── Heading ──────────────────────────────────────────────────

export function emailHeading(text: string): string {
    return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.color.text};line-height:1.3;">${text}</h1>`;
}

// ── Paragraph ────────────────────────────────────────────────

export function emailText(text: string, muted = false): string {
    const color = muted ? BRAND.color.muted : BRAND.color.text;
    return `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${color};">${text}</p>`;
}

// ── Code / Token Block ───────────────────────────────────────

export function emailCode(code: string): string {
    return `<div style="margin:24px 0;padding:16px 24px;background-color:${BRAND.color.bg};border:1px dashed ${BRAND.color.cardBorder};border-radius:12px;text-align:center;">
    <span style="font-family:'SF Mono',Monaco,Consolas,'Courier New',monospace;font-size:28px;font-weight:700;letter-spacing:4px;color:${BRAND.color.accent};">${code}</span>
</div>`;
}

// ── Divider ──────────────────────────────────────────────────

export function emailDivider(): string {
    return `<div style="margin:24px 0;height:1px;background-color:${BRAND.color.cardBorder};"></div>`;
}

// ── Info Box ─────────────────────────────────────────────────

interface InfoBoxOptions {
    text: string;
    type?: "info" | "warning" | "danger";
}

export function emailInfoBox(options: InfoBoxOptions): string {
    const borderColor =
        options.type === "danger"
            ? BRAND.color.danger
            : options.type === "warning"
              ? BRAND.color.warning
              : BRAND.color.accent;
    return `<div style="margin:20px 0;padding:14px 18px;background-color:${BRAND.color.bg};border-left:3px solid ${borderColor};border-radius:0 8px 8px 0;">
    <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.color.muted};">${options.text}</p>
</div>`;
}
