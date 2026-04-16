/**
 * Shared badge / styling helpers for KeeperLog.
 * Auto-imported by Nuxt from utils/.
 *
 * Design tokens (dark-mode first):
 *   bg  → /10 opacity (subtle), /15 for emphasis
 *   text → 400 shade
 */

// ── Enclosure Type ───────────────────────────────────────────

const ENCLOSURE_TYPE_BADGE: Record<string, string> = {
    TERRARIUM: "bg-emerald-500/10 text-emerald-400",
    VIVARIUM: "bg-primary-500/10 text-primary-400",
    AQUARIUM: "bg-blue-500/10 text-blue-400",
    PALUDARIUM: "bg-cyan-500/10 text-cyan-400",
    RACK: "bg-amber-500/10 text-amber-400",
    OTHER: "bg-zinc-500/10 text-zinc-400",
};

export function enclosureTypeBadge(type: string): string {
    return ENCLOSURE_TYPE_BADGE[type] ?? "bg-zinc-500/10 text-zinc-400";
}

// ── Sensor Type ──────────────────────────────────────────────

const SENSOR_TYPE_BADGE: Record<string, string> = {
    TEMPERATURE: "bg-red-500/10 text-red-400",
    HUMIDITY: "bg-cyan-500/10 text-cyan-400",
    PRESSURE: "bg-purple-500/10 text-purple-400",
    WATER: "bg-blue-500/10 text-blue-400",
    LIGHT: "bg-amber-500/10 text-amber-400",
};

export function sensorTypeBadge(type: string): string {
    return SENSOR_TYPE_BADGE[type] ?? "bg-zinc-500/10 text-zinc-400";
}

// ── Gender ───────────────────────────────────────────────────

const GENDER_BADGE: Record<string, string> = {
    MALE: "bg-blue-500/10 text-blue-400",
    FEMALE: "bg-pink-500/10 text-pink-400",
    UNKNOWN: "bg-zinc-500/10 text-zinc-400",
};

export function genderBadge(gender: string): string {
    return GENDER_BADGE[gender] ?? "bg-zinc-500/10 text-zinc-400";
}

// ── Alert Condition ──────────────────────────────────────────

const ALERT_CONDITION_BADGE: Record<string, string> = {
    ABOVE: "bg-red-500/10 text-red-400",
    BELOW: "bg-blue-500/10 text-blue-400",
    OUTSIDE_RANGE: "bg-emerald-500/10 text-emerald-400",
};

export function alertConditionBadge(condition: string): string {
    return ALERT_CONDITION_BADGE[condition] ?? "bg-zinc-500/10 text-zinc-400";
}

// ── General Status ───────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400",
    OK: "bg-emerald-500/10 text-emerald-400",
    WARNING: "bg-amber-500/10 text-amber-400",
    CRITICAL: "bg-red-500/10 text-red-400",
    ERROR: "bg-red-500/10 text-red-400",
    OFFLINE: "bg-zinc-500/10 text-zinc-400",
};

export function statusBadge(status: string): string {
    return STATUS_BADGE[status] ?? "bg-zinc-500/10 text-zinc-400";
}

// ── Status Dots (animated pulse for active/error) ────────────

const STATUS_DOT: Record<string, string> = {
    ACTIVE: "bg-emerald-400 animate-pulse",
    OK: "bg-emerald-400 animate-pulse",
    WARNING: "bg-amber-400 animate-pulse",
    CRITICAL: "bg-red-400 animate-pulse",
    ERROR: "bg-red-400 animate-pulse",
    OFFLINE: "bg-zinc-400",
};

export function statusDot(status: string): string {
    return STATUS_DOT[status] ?? "bg-zinc-400";
}

// ── Job Status Color ─────────────────────────────────────────

export function jobStatusColor(status: string): string {
    switch (status) {
        case "COMPLETED":
            return "text-emerald-400";
        case "FAILED":
            return "text-red-400";
        case "WARNING":
            return "text-amber-400";
        case "QUEUED":
        case "RUNNING":
            return "text-primary-400";
        default:
            return "text-fg-faint";
    }
}
