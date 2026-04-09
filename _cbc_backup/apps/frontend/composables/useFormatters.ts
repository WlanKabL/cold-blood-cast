/**
 * useFormatters — Unified formatting composable for the entire frontend.
 *
 * Pure utilities (no Vue reactivity needed) are exported as standalone functions.
 * Locale-aware formatters are returned from the composable.
 */

/* ------------------------------------------------------------------ */
/*  Pure standalone utilities                                         */
/* ------------------------------------------------------------------ */

export function toISODateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

/* ------------------------------------------------------------------ */
/*  Composable — locale/i18n-aware formatters                        */
/* ------------------------------------------------------------------ */

export function useFormatters() {
    const { locale, t } = useI18n();

    function intlLocale(): string {
        return locale.value === "de" ? "de-DE" : "en-US";
    }

    function formatDateShort(iso: string | null | undefined): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString(intlLocale(), {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

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

    function formatDateLong(d: Date | string): string {
        const date = typeof d === "string" ? new Date(d) : d;
        return date.toLocaleDateString(intlLocale(), {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function formatDateOnly(iso: string | null | undefined): string {
        if (!iso) return "–";
        return new Date(iso).toLocaleDateString(intlLocale(), {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    function formatDateTime(iso: string | null | undefined): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleString(intlLocale());
    }

    function formatNumber(value: number, decimals: number = 2): string {
        return value.toLocaleString(intlLocale(), {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

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
        formatNumber,
        formatRelativeTime,
    };
}
