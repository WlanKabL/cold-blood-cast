/**
 * useFormatters — Unified formatting composable for the entire frontend.
 *
 * Replaces 30+ duplicate format functions scattered across pages & components.
 * Functions that need locale/i18n are returned from the composable.
 * Pure utilities (no Vue reactivity needed) are exported as standalone functions.
 */

/* ------------------------------------------------------------------ */
/*  Pure standalone utilities (no composable context needed)          */
/* ------------------------------------------------------------------ */

/**
 * Convert a `Date` object to an ISO date string `YYYY-MM-DD`.
 * Replaces `fmtDate` in sensor logs and care records.
 */
export function toISODateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Format a duration given in seconds into a human-readable string.
 * Examples: `"3m"`, `"2h 15m"`, `"1d 4h"`.
 * Returns `"—"` for falsy values.
 */
export function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 24) {
        const d = Math.floor(h / 24);
        return `${d}d ${h % 24}h`;
    }
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

/**
 * Sanitise `v-model.number` values: `NaN` / `null` / `undefined` → `undefined`.
 * Replaces duplicate `num()` in form modals and config editors.
 */
export function num(v: number | undefined | null): number | undefined {
    return v != null && !isNaN(v) ? v : undefined;
}

/* ------------------------------------------------------------------ */
/*  Composable — locale/i18n-aware formatters                        */
/* ------------------------------------------------------------------ */

export function useFormatters() {
    const { locale, t } = useI18n();

    /** Resolve Intl locale string from current i18n locale. */
    function intlLocale(): string {
        return locale.value === "de" ? "de-DE" : "en-US";
    }

    /* ---- Date formatting ---- */

    /**
     * Short date + time: "Jan 5, 10:30 AM" / "5. Jan., 10:30".
     * Replaces scattered `formatDate` helpers across pages & components.
     */
    function formatDateShort(iso: string | null | undefined): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString(intlLocale(), {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    /**
     * Full date with weekday: "Mon, Jan 5, 2025, 10:30 AM".
     * Replaces `formatDateFull` in detail views.
     */
    function formatDateFull(iso: string | null | undefined): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString(intlLocale(), {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    /**
     * Long human date (no time): "Monday, January 5, 2025".
     * Used for page headers in dashboard and care log.
     */
    function formatDateLong(d: Date | string): string {
        const date = typeof d === "string" ? new Date(d) : d;
        return date.toLocaleDateString(intlLocale(), {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    /**
     * Date only (no time): "05.01.2025" (de) / "01/05/2025" (en).
     * Replaces `formatDate` in settings.vue.
     */
    function formatDateOnly(iso: string | null | undefined): string {
        if (!iso) return "–";
        return new Date(iso).toLocaleDateString(intlLocale(), {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    /**
     * Full locale-default date + time.
     * Replaces `formatDate` in admin/emails (was `toLocaleString()` with no options).
     */
    function formatDateTime(iso: string | null | undefined): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleString(intlLocale());
    }

    /* ---- Currency / number formatting ---- */

    /**
     * Format a monetary value with full currency symbol and 2 decimal places.
     * Replaces `formatBalance`, `formatBalanceFull`, `formatCurrency` (most variants).
     *
     * @param decimals — number of fraction digits (default: 2)
     */
    function formatCurrency(value: number, currency: string, decimals: number = 2): string {
        return new Intl.NumberFormat(intlLocale(), {
            style: "currency",
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
    }

    /**
     * Format PnL with explicit sign prefix ("+$12.50" / "-$3.20").
     * Replaces `formatPnl` in dashboard.
     */
    function formatPnl(value: number, currency: string): string {
        const sign = value >= 0 ? "+" : "";
        return `${sign}${new Intl.NumberFormat(intlLocale(), {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
        }).format(value)}`;
    }

    /**
     * Format a plain number with fixed fraction digits.
     * Replaces `fmtNum` in import/index.
     */
    function formatNumber(value: number, decimals: number = 2): string {
        return value.toLocaleString(intlLocale(), {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    /* ---- Relative time ---- */

    /**
     * Human-readable relative time from an ISO date string.
     * Uses `common.*` i18n keys with `{count}` parameter.
     * Replaces all four `formatRelativeTime` / `formatRelative` variants.
     */
    function formatRelativeTime(dateStr: string | null | undefined): string {
        if (!dateStr) return "—";
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t("common.justNow");
        if (diffMins < 60) return t("common.minutesAgo", { count: diffMins });
        if (diffHours < 24) return t("common.hoursAgo", { count: diffHours });
        return t("common.daysAgo", { count: diffDays });
    }

    return {
        formatDateShort,
        formatDateFull,
        formatDateLong,
        formatDateOnly,
        formatDateTime,
        formatCurrency,
        formatPnl,
        formatNumber,
        formatRelativeTime,
    };
}
