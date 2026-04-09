/**
 * Custom Mail — freeform content wrapped in standard KeeperLog layout
 * Used for admin-initiated manual emails.
 */

import { emailLayout, emailHeading, emailText } from "./components.js";

export interface CustomMailData {
    heading?: string;
    body: string;
}

export function customMailTemplate(data: CustomMailData): string {
    const headingBlock = data.heading ? emailHeading(data.heading) : "";

    // Split body by double newlines into paragraphs
    const paragraphs = data.body
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => emailText(p.replace(/\n/g, "<br/>")))
        .join("");

    return emailLayout(`
        ${headingBlock}
        ${paragraphs}
    `);
}
