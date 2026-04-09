/**
 * Account Approved — sent when a pending registration is approved by an admin
 */

import { emailLayout, emailHeading, emailText, emailButton } from "./components.js";

export interface AccountApprovedData {
    username: string;
    loginUrl: string;
}

export function accountApprovedTemplate(data: AccountApprovedData): string {
    return emailLayout(`
        ${emailHeading("You're in! ✅")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("Your KeeperLog account has been approved. You can now log in and start using the platform.")}
        ${emailButton({ text: "Open Dashboard →", href: data.loginUrl })}
    `);
}
