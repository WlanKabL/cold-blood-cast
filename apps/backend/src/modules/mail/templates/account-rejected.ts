/**
 * Account Rejected — sent when an admin rejects a pending registration
 */

import { emailLayout, emailHeading, emailText, emailDivider } from "./components.js";

export interface AccountRejectedData {
    username: string;
    supportEmail?: string;
}

export function accountRejectedTemplate(data: AccountRejectedData): string {
    const supportLine = data.supportEmail
        ? emailText(
              `If you believe this is a mistake, feel free to reach out at <a href="mailto:${data.supportEmail}" style="color:#8a9c4a;text-decoration:none;">${data.supportEmail}</a>.`,
          )
        : "";

    return emailLayout(`
        ${emailHeading("Registration declined")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("Unfortunately, your KeeperLog registration has been declined. Your account will not be activated.")}
        ${emailDivider()}
        ${supportLine}
    `);
}
