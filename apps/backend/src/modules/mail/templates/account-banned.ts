/**
 * Account Banned — sent when an admin bans a user
 */

import { emailLayout, emailHeading, emailText, emailInfoBox, emailDivider } from "./components.js";

export interface AccountBannedData {
    username: string;
    reason?: string;
    supportEmail?: string;
}

export function accountBannedTemplate(data: AccountBannedData): string {
    const reasonBlock = data.reason
        ? emailInfoBox({ text: `Reason: <strong>${data.reason}</strong>`, type: "danger" })
        : "";

    const supportLine = data.supportEmail
        ? emailText(
              `If you believe this is a mistake, contact us at <a href="mailto:${data.supportEmail}" style="color:#8a9c4a;text-decoration:none;">${data.supportEmail}</a>.`,
          )
        : "";

    return emailLayout(`
        ${emailHeading("Account Suspended")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("Your KeeperLog account has been suspended. You will no longer be able to log in.")}
        ${reasonBlock}
        ${emailDivider()}
        ${supportLine}
    `);
}
