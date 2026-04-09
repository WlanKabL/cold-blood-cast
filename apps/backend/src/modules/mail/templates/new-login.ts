/**
 * New Login Email — sent when a login from an unrecognized device/IP is detected
 */

import { emailLayout, emailHeading, emailText, emailInfoBox, emailDivider } from "./components.js";
import { escapeHtml } from "@/helpers/html-escape.js";

export interface NewLoginData {
    username: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
}

export function newLoginTemplate(data: NewLoginData): string {
    return emailLayout(`
        ${emailHeading("New Login Detected 🔐")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${escapeHtml(data.username)}</strong>,`)}
        ${emailText("We noticed a login to your KeeperLog account from a new device or location.")}
        ${emailInfoBox({
            text: `
                <strong>IP Address:</strong> ${escapeHtml(data.ipAddress)}<br/>
                <strong>Device:</strong> ${escapeHtml(data.userAgent)}<br/>
                <strong>Time:</strong> ${escapeHtml(data.timestamp)}
            `,
        })}
        ${emailDivider()}
        ${emailText("If this was you, you can safely ignore this email.")}
        ${emailInfoBox({
            text: "If you didn't log in, change your password immediately and contact support.",
            type: "warning",
        })}
    `);
}
