/**
 * Welcome Email — sent after registration (open mode, no verification required)
 */

import { emailLayout, emailHeading, emailText, emailButton, emailDivider } from "./components.js";

export interface WelcomeMailData {
    username: string;
    loginUrl: string;
}

export function welcomeTemplate(data: WelcomeMailData): string {
    return emailLayout(`
        ${emailHeading("Welcome to KeeperLog 🎉")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("Your account is ready. Set up your sensors, configure alerts, and start monitoring your terrarium — all in one place.")}
        ${emailButton({ text: "Open Dashboard →", href: data.loginUrl })}
        ${emailDivider()}
        ${emailText("Here's what you can do right away:", true)}
        ${emailText(
            `
            <span style="color:#8a9c4a;">▸</span> Add your first enclosure<br/>
            <span style="color:#8a9c4a;">▸</span> Connect temperature &amp; humidity sensors<br/>
            <span style="color:#8a9c4a;">▸</span> Set up alert rules for safe ranges<br/>
            <span style="color:#8a9c4a;">▸</span> Log feedings and shedding events
        `,
            true,
        )}
    `);
}
