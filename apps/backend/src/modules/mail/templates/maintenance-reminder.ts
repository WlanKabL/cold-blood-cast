/**
 * Maintenance Reminder — sent when maintenance tasks are overdue
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailButton,
    emailDivider,
    emailInfoBox,
} from "./components.js";

export interface MaintenanceReminderTask {
    enclosureName: string;
    type: string;
    description: string | null;
    dueDate: string;
    daysOverdue: number;
}

export interface MaintenanceReminderData {
    username: string;
    tasks: MaintenanceReminderTask[];
    dashboardUrl: string;
    locale: string;
}

const MAINTENANCE_TYPE_LABELS: Record<string, { en: string; de: string }> = {
    CLEANING: { en: "Cleaning", de: "Reinigung" },
    SUBSTRATE_CHANGE: { en: "Substrate Change", de: "Substratwechsel" },
    LAMP_REPLACEMENT: { en: "Lamp Replacement", de: "Lampenwechsel" },
    WATER_CHANGE: { en: "Water Change", de: "Wasserwechsel" },
    FILTER_CHANGE: { en: "Filter Change", de: "Filterwechsel" },
    DISINFECTION: { en: "Disinfection", de: "Desinfektion" },
    OTHER: { en: "Other", de: "Sonstiges" },
};

function taskRow(task: MaintenanceReminderTask, locale: string): string {
    const isDE = locale === "de";
    const labels = MAINTENANCE_TYPE_LABELS[task.type] ?? MAINTENANCE_TYPE_LABELS.OTHER;
    const typeLabel = isDE ? labels.de : labels.en;

    const overdueLabel =
        task.daysOverdue === 0
            ? isDE
                ? "Heute fällig"
                : "Due today"
            : isDE
              ? `${task.daysOverdue} Tag${task.daysOverdue > 1 ? "e" : ""} überfällig`
              : `${task.daysOverdue} day${task.daysOverdue > 1 ? "s" : ""} overdue`;

    return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #2a2a1c;">
        <strong style="color:#e8e6dd;font-size:14px;">${task.enclosureName}</strong>
        <span style="color:#a3a08e;font-size:12px;margin-left:8px;">${typeLabel}</span>
        <br />
        <span style="color:#e07a5f;font-size:13px;font-weight:600;">${overdueLabel}</span>
        ${task.description ? `<br /><span style="color:#a3a08e;font-size:12px;">${task.description}</span>` : ""}
    </td>
</tr>`;
}

export function maintenanceReminderTemplate(data: MaintenanceReminderData): string {
    const isDE = data.locale === "de";
    const rows = data.tasks.map((t) => taskRow(t, data.locale)).join("");

    return emailLayout(`
        ${emailHeading(isDE ? "Wartungs-Erinnerung" : "Maintenance Reminder")}
        ${emailText(
            isDE
                ? `Hallo <strong style="color:#e5e5e5;">${data.username}</strong>,`
                : `Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`,
        )}
        ${emailText(
            isDE
                ? `${data.tasks.length > 1 ? "Du hast überfällige Wartungsaufgaben" : "Du hast eine überfällige Wartungsaufgabe"}:`
                : `${data.tasks.length > 1 ? "You have overdue maintenance tasks" : "You have an overdue maintenance task"}:`,
        )}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
            ${rows}
        </table>
        ${emailDivider()}
        ${emailButton({
            text: isDE ? "Wartungsaufgaben anzeigen →" : "View Maintenance Tasks →",
            href: data.dashboardUrl,
        })}
        ${emailInfoBox({
            text: isDE
                ? "Wiederkehrende Aufgaben werden nach Erledigung automatisch neu geplant."
                : "Recurring tasks are automatically rescheduled after completion.",
        })}
    `);
}
