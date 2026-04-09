/**
 * Subscription Canceled Email
 * Sent when a user cancels (still active until period end)
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailButton,
    emailDivider,
    emailInfoBox,
} from "./components.js";

export interface SubscriptionCanceledData {
    username: string;
    endDate: string;
}

export function subscriptionCanceledTemplate(data: SubscriptionCanceledData): string {
    return emailLayout(`
        ${emailHeading("Subscription Canceled")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("Your subscription has been canceled. We're sorry to see you go.")}
        ${emailInfoBox({ text: `Your premium features remain active until <strong style="color:#e5e5e5;">${data.endDate}</strong>. After that, your account will automatically switch to the free plan.` })}
        ${emailDivider()}
        ${emailText("Changed your mind? You can resubscribe anytime before your access expires.")}
        ${emailButton({ text: "Resubscribe →", href: "https://cold-blood-cast.app/pricing" })}
        ${emailDivider()}
        ${emailText("If you have any feedback on how we can improve, we'd love to hear it. Just reply to this email.", true)}
    `);
}
