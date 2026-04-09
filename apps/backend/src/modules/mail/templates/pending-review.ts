/**
 * Pending Review — sent to user after registering when approval is required
 */

import { emailLayout, emailHeading, emailText, emailInfoBox, emailDivider } from "./components.js";

export interface PendingReviewData {
    username: string;
}

export function pendingReviewTemplate(data: PendingReviewData): string {
    return emailLayout(`
        ${emailHeading("Registration received ⏳")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("Thanks for signing up to KeeperLog! Your account has been created and is now pending review by our team.")}
        ${emailInfoBox({ text: "You'll receive another email once your account has been approved.", type: "info" })}
        ${emailDivider()}
        ${emailText("This usually doesn't take long — sit tight!")}
    `);
}
