/**
 * Account Deletion — sent when a user requests to delete their account
 */

import { emailLayout, emailHeading, emailText, emailButton, emailInfoBox } from "./components.js";

export interface AccountDeletionData {
    username: string;
    confirmUrl: string;
    expiresInMinutes: number;
}

export function accountDeletionTemplate(data: AccountDeletionData): string {
    return emailLayout(`
        ${emailHeading("Delete your account")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText('We received a request to permanently delete your KeeperLog account. This action is <strong style="color:#ef4444;">irreversible</strong> — all your data including enclosures, sensor logs, care records, and settings will be removed.')}
        ${emailText("To confirm the deletion, click the button below and enter your password.")}
        ${emailButton({ text: "Confirm Deletion →", href: data.confirmUrl, color: "#ef4444" })}
        ${emailText(`Or copy this link:<br><a href="${data.confirmUrl}" style="color:#a78bfa;word-break:break-all;">${data.confirmUrl}</a>`, true)}
        ${emailInfoBox({ text: `This link expires in <strong>${data.expiresInMinutes} minutes</strong>. If you didn't request this, you can safely ignore this email — your account won't be deleted.` })}
    `);
}
