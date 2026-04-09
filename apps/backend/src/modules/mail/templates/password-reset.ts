/**
 * Password Reset — sent when a user requests a password reset
 */

import { emailLayout, emailHeading, emailText, emailButton, emailInfoBox } from "./components.js";

export interface PasswordResetData {
    username: string;
    resetUrl: string;
    expiresInMinutes: number;
}

export function passwordResetTemplate(data: PasswordResetData): string {
    return emailLayout(`
        ${emailHeading("Reset your password")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("We received a request to reset your password. Click the button below to choose a new one.")}
        ${emailButton({ text: "Reset Password →", href: data.resetUrl })}
        ${emailInfoBox({ text: `This link expires in <strong>${data.expiresInMinutes} minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.` })}
    `);
}
