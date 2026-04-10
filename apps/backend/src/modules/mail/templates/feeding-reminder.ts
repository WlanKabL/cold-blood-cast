/**
 * Feeding Reminder — sent when one or more pets are critically overdue for feeding
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailButton,
    emailDivider,
    emailInfoBox,
} from "./components.js";

export interface FeedingReminderPet {
    petName: string;
    species: string;
    daysSinceLastFeeding: number | null;
    intervalMaxDays: number;
}

export interface FeedingReminderData {
    username: string;
    pets: FeedingReminderPet[];
    dashboardUrl: string;
    locale: string;
}

function petRow(pet: FeedingReminderPet, locale: string): string {
    const daysText =
        pet.daysSinceLastFeeding !== null
            ? locale === "de"
                ? `Letzte Fütterung vor ${pet.daysSinceLastFeeding} Tagen (max. ${pet.intervalMaxDays})`
                : `Last fed ${pet.daysSinceLastFeeding} days ago (max. ${pet.intervalMaxDays})`
            : locale === "de"
              ? "Noch nie gefüttert"
              : "Never fed";

    return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #2a2a1c;">
        <strong style="color:#e8e6dd;font-size:14px;">${pet.petName}</strong>
        <span style="color:#a3a08e;font-size:12px;margin-left:8px;">${pet.species}</span>
        <br />
        <span style="color:#c45e23;font-size:13px;font-weight:600;">${daysText}</span>
    </td>
</tr>`;
}

export function feedingReminderTemplate(data: FeedingReminderData): string {
    const isDE = data.locale === "de";
    const petRows = data.pets.map((p) => petRow(p, data.locale)).join("");

    return emailLayout(`
        ${emailHeading(isDE ? "Fütterungserinnerung" : "Feeding Reminder")}
        ${emailText(
            isDE
                ? `Hallo <strong style="color:#e5e5e5;">${data.username}</strong>,`
                : `Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`,
        )}
        ${emailText(
            isDE
                ? `${data.pets.length > 1 ? "Einige deiner Tiere sind" : "Eines deiner Tiere ist"} überfällig für eine Fütterung:`
                : `${data.pets.length > 1 ? "Some of your pets are" : "One of your pets is"} overdue for feeding:`,
        )}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
            ${petRows}
        </table>
        ${emailDivider()}
        ${emailButton({
            text: isDE ? "Dashboard öffnen →" : "Open Dashboard →",
            href: data.dashboardUrl,
        })}
        ${emailInfoBox({
            text: isDE
                ? "Du kannst die Fütterungsintervalle in den Tier-Einstellungen anpassen."
                : "You can adjust feeding intervals in your pet settings.",
        })}
    `);
}
