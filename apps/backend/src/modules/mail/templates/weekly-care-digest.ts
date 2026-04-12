/**
 * Weekly Care Digest — sent Sunday 18:00 with the upcoming week's events
 *
 * Uses the shared dark theme from components.ts (olive/copper brand).
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailButton,
    emailDivider,
    emailInfoBox,
} from "./components.js";
import type { PlannerDay, PlannerEvent } from "@/modules/weekly-planner/weekly-planner.service.js";

export interface WeeklyCareDigestData {
    username: string;
    days: PlannerDay[];
    weekLabel: string;
    plannerUrl: string;
    locale: string;
}

// ── Constants (matching BRAND palette from components.ts) ────

const COLOR = {
    text: "#e8e6dd",
    muted: "#a3a08e",
    faint: "#6b6b5a",
    bg: "#121208",
    cardBorder: "#2a2a1c",
    accent: "#8a9c4a",
    danger: "#c45e23",
} as const;

const EVENT_TYPE_LABELS: Record<string, { en: string; de: string }> = {
    feeding: { en: "Feeding", de: "Fütterung" },
    vet_visit: { en: "Vet Appointment", de: "Tierarzttermin" },
    shedding: { en: "Predicted Shedding", de: "Vorhergesagte Häutung" },
    maintenance: { en: "Maintenance", de: "Wartung" },
};

const EVENT_TYPE_COLORS: Record<string, string> = {
    feeding: "#d4a040",
    vet_visit: "#5aafa8",
    shedding: "#9b7fd4",
    maintenance: "#5c9ae6",
};

const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_DE = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
];

// ── Helpers ──────────────────────────────────────────────────

function dayName(dateStr: string, locale: string): string {
    const d = new Date(dateStr + "T00:00:00.000Z");
    const dow = d.getUTCDay();
    return locale === "de" ? (DAY_NAMES_DE[dow] ?? "") : (DAY_NAMES_EN[dow] ?? "");
}

function formatDate(dateStr: string, locale: string): string {
    const d = new Date(dateStr + "T00:00:00.000Z");
    return d.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
        month: "short",
        day: "numeric",
    });
}

// ── Event Row ────────────────────────────────────────────────

function eventRow(event: PlannerEvent, locale: string): string {
    const isDE = locale === "de";
    const typeLabel = EVENT_TYPE_LABELS[event.type]?.[isDE ? "de" : "en"] ?? event.type;
    const color = EVENT_TYPE_COLORS[event.type] ?? COLOR.muted;
    const isOverdue = event.meta?.isOverdue === true;

    const overdueBadge = isOverdue
        ? ` <span style="background:${COLOR.danger};color:#fff;font-size:10px;padding:2px 8px;border-radius:4px;margin-left:6px;font-weight:600;">${isDE ? "Überfällig" : "Overdue"}</span>`
        : "";

    const petInfo = event.petName
        ? `<span style="color:${COLOR.faint};font-size:12px;margin-left:8px;">· ${event.petName}</span>`
        : "";

    return `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid ${COLOR.cardBorder};">
        <div style="margin-bottom:4px;">
            <span style="display:inline-block;background:${color}22;color:${color};font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;">${typeLabel}</span>${overdueBadge}${petInfo}
        </div>
        <div style="font-size:14px;color:${COLOR.text};font-weight:500;line-height:1.4;">${event.title}</div>
        ${event.detail ? `<div style="font-size:12px;color:${COLOR.muted};margin-top:3px;line-height:1.4;">${event.detail}</div>` : ""}
    </td>
</tr>`;
}

// ── Day Section ──────────────────────────────────────────────

function daySection(day: PlannerDay, locale: string): string {
    const name = dayName(day.date, locale);
    const formatted = formatDate(day.date, locale);
    const isDE = locale === "de";
    const eventCount = day.events.length;
    const countLabel =
        eventCount > 0
            ? `<span style="color:${COLOR.faint};font-size:11px;font-weight:400;margin-left:8px;">(${eventCount})</span>`
            : "";

    const header = `<div style="font-size:13px;font-weight:700;color:${COLOR.text};padding:10px 12px;text-transform:uppercase;letter-spacing:0.5px;">${name}, ${formatted}${countLabel}</div>`;

    if (eventCount === 0) {
        return `<div style="margin-bottom:16px;background:${COLOR.bg};border:1px solid ${COLOR.cardBorder};border-radius:10px;overflow:hidden;">
    ${header}
    <div style="padding:8px 12px 12px;color:${COLOR.faint};font-size:13px;font-style:italic;">${isDE ? "Keine Aufgaben" : "No tasks"}</div>
</div>`;
    }

    return `<div style="margin-bottom:16px;background:${COLOR.bg};border:1px solid ${COLOR.cardBorder};border-radius:10px;overflow:hidden;">
    ${header}
    <table role="presentation" style="width:100%;border-collapse:collapse;">
        ${day.events.map((e) => eventRow(e, locale)).join("")}
    </table>
</div>`;
}

// ── Summary Stats Row ────────────────────────────────────────

function summaryStats(days: PlannerDay[], locale: string): string {
    const isDE = locale === "de";
    const total = days.reduce((s, d) => s + d.events.length, 0);
    const overdue = days.reduce(
        (s, d) => s + d.events.filter((e) => e.meta?.isOverdue === true).length,
        0,
    );

    const typeCounts: Record<string, number> = {};
    for (const day of days) {
        for (const event of day.events) {
            typeCounts[event.type] = (typeCounts[event.type] ?? 0) + 1;
        }
    }

    const typeBreakdown = Object.entries(typeCounts)
        .map(([type, count]) => {
            const color = EVENT_TYPE_COLORS[type] ?? COLOR.muted;
            const label = EVENT_TYPE_LABELS[type]?.[isDE ? "de" : "en"] ?? type;
            return `<span style="display:inline-block;margin-right:12px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;vertical-align:middle;"></span><span style="color:${COLOR.muted};font-size:12px;">${label}: <strong style="color:${COLOR.text};">${count}</strong></span></span>`;
        })
        .join("");

    const overdueHtml =
        overdue > 0
            ? `<div style="margin-top:8px;"><span style="color:${COLOR.danger};font-size:12px;font-weight:600;">⚠ ${overdue} ${isDE ? "überfällig" : "overdue"}</span></div>`
            : "";

    return `<div style="background:${COLOR.bg};border:1px solid ${COLOR.cardBorder};border-radius:10px;padding:16px;margin-bottom:20px;">
    <div style="font-size:28px;font-weight:700;color:${COLOR.text};line-height:1;">${total}</div>
    <div style="font-size:12px;color:${COLOR.muted};margin-top:2px;margin-bottom:10px;">${isDE ? "Aufgaben diese Woche" : "tasks this week"}</div>
    <div>${typeBreakdown}</div>
    ${overdueHtml}
</div>`;
}

// ── Main Template ────────────────────────────────────────────

export function weeklyCareDigestTemplate(data: WeeklyCareDigestData): string {
    const isDE = data.locale === "de";

    const heading = isDE ? `Dein Wochenplan 📋` : `Your Weekly Plan 📋`;

    const intro = isDE
        ? `Hey <strong style="color:${COLOR.text};">${data.username}</strong>, hier ist dein Pflegeplan für die Woche <strong style="color:${COLOR.text};">${data.weekLabel}</strong>.`
        : `Hey <strong style="color:${COLOR.text};">${data.username}</strong>, here's your care schedule for the week of <strong style="color:${COLOR.text};">${data.weekLabel}</strong>.`;

    const content = `
        ${emailHeading(heading)}
        ${emailText(intro)}
        ${summaryStats(data.days, data.locale)}
        ${data.days.map((d) => daySection(d, data.locale)).join("")}
        ${emailDivider()}
        ${emailButton({ text: isDE ? "Planer öffnen →" : "Open Planner →", href: data.plannerUrl })}
        ${emailInfoBox({ text: isDE ? "Du erhältst diese Mail, weil du den wöchentlichen Bericht aktiviert hast. Deaktiviere ihn jederzeit in deinen Einstellungen." : "You receive this email because you enabled the weekly digest. Disable it anytime in your settings." })}
    `;

    return emailLayout(content);
}
