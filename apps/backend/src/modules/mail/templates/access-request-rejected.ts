/**
 * Access Request Rejected — sent when an admin rejects an access request
 */

import { emailLayout, emailHeading, emailText, emailDivider } from "./components.js";

export interface AccessRequestRejectedData {
    email: string;
    supportEmail?: string;
}

export function accessRequestRejectedTemplate(data: AccessRequestRejectedData): string {
    const supportLine = data.supportEmail
        ? emailText(
              `If you believe this is a mistake, feel free to reach out at <a href="mailto:${data.supportEmail}" style="color:#8a9c4a;text-decoration:none;">${data.supportEmail}</a>.`,
          )
        : "";

    return emailLayout(`
        ${emailHeading("Access request declined")}
        ${emailText("Unfortunately, your request to join KeeperLog has been declined at this time.")}
        ${emailText("This could be due to limited capacity or other reasons.")}
        ${emailDivider()}
        ${supportLine}
        ${emailText("Thank you for your interest in KeeperLog.")}
    `);
}
