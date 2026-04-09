/**
 * Payment Failed Email
 * Sent when a subscription renewal payment fails
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailButton,
    emailDivider,
    emailInfoBox,
} from "./components.js";

export interface PaymentFailedData {
    username: string;
}

export function paymentFailedTemplate(data: PaymentFailedData): string {
    return emailLayout(`
        ${emailHeading("Payment Failed ⚠️")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("We were unable to process your subscription payment. Your premium features may be interrupted if this isn't resolved.")}
        ${emailInfoBox({ text: "Stripe will retry the payment automatically over the next few days. To avoid losing access, please update your payment method.", type: "warning" })}
        ${emailButton({ text: "Update Payment Method →", href: "https://cold-blood-cast.app/settings" })}
        ${emailDivider()}
        ${emailText("If you believe this is an error or need help, just reply to this email.", true)}
    `);
}
