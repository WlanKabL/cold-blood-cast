/**
 * Access Request — notification sent to admins when someone requests an invite
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailInfoBox,
    emailDivider,
    emailButton,
} from "./components.js";

export interface AccessRequestData {
    email: string;
    reason?: string;
    adminUrl: string;
}

export function accessRequestTemplate(data: AccessRequestData): string {
    const reasonBlock = data.reason
        ? emailInfoBox({ text: `Reason: <em>${data.reason}</em>`, type: "info" })
        : "";

    return emailLayout(`
        ${emailHeading("New access request 📩")}
        ${emailText(`Someone wants to join KeeperLog:`)}
        ${emailText(`<strong style="color:#e5e5e5;">${data.email}</strong>`)}
        ${reasonBlock}
        ${emailDivider()}
        ${emailButton({ text: "Review in Admin Panel →", href: data.adminUrl })}
    `);
}
