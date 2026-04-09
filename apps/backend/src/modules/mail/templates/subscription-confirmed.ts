/**
 * Subscription Confirmed Email
 * Sent after successful Stripe checkout
 */

import { emailLayout, emailHeading, emailText, emailButton, emailDivider } from "./components.js";

export interface SubscriptionConfirmedData {
    username: string;
    plan: string;
}

const PLAN_LABELS: Record<string, string> = {
    premium_monthly: "Premium (Monthly)",
    premium_yearly: "Premium (Yearly)",
    pro_monthly: "Pro (Monthly)",
    pro_yearly: "Pro (Yearly)",
    pro_lifetime: "Pro (Lifetime)",
};

export function subscriptionConfirmedTemplate(data: SubscriptionConfirmedData): string {
    const planLabel = PLAN_LABELS[data.plan] ?? data.plan;

    return emailLayout(`
        ${emailHeading("Subscription Confirmed 🎉")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText(`Your <strong style="color:#8b5cf6;">${planLabel}</strong> subscription is now active. Thanks for supporting KeeperLog!`)}
        ${emailButton({ text: "Open Dashboard →", href: "https://cold-blood-cast.app/dashboard" })}
        ${emailDivider()}
        ${emailText("Here's what's now unlocked for you:", true)}
        ${emailText(
            data.plan.startsWith("pro_")
                ? `
            <span style="color:#f59e0b;">▸</span> Unlimited enclosures, sensors &amp; alert rules<br/>
            <span style="color:#f59e0b;">▸</span> Advanced monitoring &amp; care analytics<br/>
            <span style="color:#f59e0b;">▸</span> API access &amp; integrations<br/>
            <span style="color:#f59e0b;">▸</span> Priority support &amp; future features
        `
                : `
            <span style="color:#8b5cf6;">▸</span> 10 enclosures, 30 pets<br/>
            <span style="color:#8b5cf6;">▸</span> Up to 10 sensors per enclosure<br/>
            <span style="color:#8b5cf6;">▸</span> 50 alert rules &amp; complete care log<br/>
            <span style="color:#8b5cf6;">▸</span> Tags &amp; full sensor history
        `,
            true,
        )}
        ${emailDivider()}
        ${emailText("Manage your subscription anytime in Settings → Subscription.", true)}
    `);
}
