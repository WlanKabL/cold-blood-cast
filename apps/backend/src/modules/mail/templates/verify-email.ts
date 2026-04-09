/**
 * Email Verification — sent after registration when email verification is required
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailButton,
    emailCode,
    emailInfoBox,
} from "./components.js";

export interface VerifyEmailData {
    username: string;
    verifyUrl: string;
    code?: string;
    expiresInMinutes: number;
}

export function verifyEmailTemplate(data: VerifyEmailData): string {
    const codeBlock = data.code ? emailCode(data.code) : "";

    return emailLayout(`
        ${emailHeading("Verify your email")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("Thanks for signing up! Please verify your email address to activate your account.")}
        ${emailButton({ text: "Verify Email →", href: data.verifyUrl })}
        ${codeBlock ? `${emailText("Or enter this code manually:", true)}${codeBlock}` : ""}
        ${emailInfoBox({ text: `This link expires in <strong>${data.expiresInMinutes} minutes</strong>. If you didn't create an account, you can safely ignore this email.` })}
    `);
}
