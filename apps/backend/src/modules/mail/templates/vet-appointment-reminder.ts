/**
 * Vet Appointment Reminder — sent when a pet has an upcoming vet appointment (today or tomorrow)
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailButton,
    emailDivider,
    emailInfoBox,
} from "./components.js";

export interface VetReminderAppointment {
    petName: string;
    species: string;
    vetName: string | null;
    clinicName: string | null;
    appointmentDate: string;
    isToday: boolean;
}

export interface VetAppointmentReminderData {
    username: string;
    appointments: VetReminderAppointment[];
    dashboardUrl: string;
    locale: string;
}

function appointmentRow(appointment: VetReminderAppointment, locale: string): string {
    const isDE = locale === "de";
    const when = appointment.isToday ? (isDE ? "Heute" : "Today") : isDE ? "Morgen" : "Tomorrow";

    const vetInfo = appointment.vetName
        ? `${appointment.vetName}${appointment.clinicName ? ` (${appointment.clinicName})` : ""}`
        : isDE
          ? "Kein Tierarzt zugewiesen"
          : "No vet assigned";

    return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #2a2a1c;">
        <strong style="color:#e8e6dd;font-size:14px;">${appointment.petName}</strong>
        <span style="color:#a3a08e;font-size:12px;margin-left:8px;">${appointment.species}</span>
        <br />
        <span style="color:#8a9c4a;font-size:13px;font-weight:600;">${when} — ${appointment.appointmentDate}</span>
        <br />
        <span style="color:#a3a08e;font-size:12px;">${vetInfo}</span>
    </td>
</tr>`;
}

export function vetAppointmentReminderTemplate(data: VetAppointmentReminderData): string {
    const isDE = data.locale === "de";
    const rows = data.appointments.map((a) => appointmentRow(a, data.locale)).join("");

    return emailLayout(`
        ${emailHeading(isDE ? "Tierarzt-Erinnerung" : "Vet Appointment Reminder")}
        ${emailText(
            isDE
                ? `Hallo <strong style="color:#e5e5e5;">${data.username}</strong>,`
                : `Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`,
        )}
        ${emailText(
            isDE
                ? `${data.appointments.length > 1 ? "Du hast bevorstehende Tierarzttermine" : "Du hast einen bevorstehenden Tierarzttermin"}:`
                : `${data.appointments.length > 1 ? "You have upcoming vet appointments" : "You have an upcoming vet appointment"}:`,
        )}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
            ${rows}
        </table>
        ${emailDivider()}
        ${emailButton({
            text: isDE ? "Termine anzeigen →" : "View Appointments →",
            href: data.dashboardUrl,
        })}
        ${emailInfoBox({
            text: isDE
                ? "Du kannst Folgetermine direkt in einem Tierarztbesuch-Eintrag verwalten."
                : "You can manage follow-up appointments directly from a vet visit entry.",
        })}
    `);
}
