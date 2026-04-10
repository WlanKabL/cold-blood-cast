import { describe, it, expect, vi } from "vitest";
import { toISODateString, formatDuration, num, useFormatters } from "../useFormatters";

// ─── Mock Nuxt auto-imports ──────────────────────────────────

const mockLocale = ref("en");
const mockT = vi.fn((key: string, params?: Record<string, unknown>) => {
    if (params?.count !== undefined) return `${key}:${params.count}`;
    return key;
});

vi.stubGlobal("useI18n", () => ({
    locale: mockLocale,
    t: mockT,
}));

// ─── Pure utility tests ──────────────────────────────────────

describe("toISODateString", () => {
    it("formats date as YYYY-MM-DD", () => {
        expect(toISODateString(new Date(2025, 0, 5))).toBe("2025-01-05");
    });

    it("pads single-digit month and day", () => {
        expect(toISODateString(new Date(2025, 2, 3))).toBe("2025-03-03");
    });

    it("handles December correctly", () => {
        expect(toISODateString(new Date(2025, 11, 25))).toBe("2025-12-25");
    });
});

describe("formatDuration", () => {
    it("returns dash for null/undefined/0", () => {
        expect(formatDuration(null)).toBe("—");
        expect(formatDuration(undefined)).toBe("—");
        expect(formatDuration(0)).toBe("—");
    });

    it("formats minutes only", () => {
        expect(formatDuration(300)).toBe("5m");
        expect(formatDuration(59 * 60)).toBe("59m");
    });

    it("formats hours and minutes", () => {
        expect(formatDuration(3600)).toBe("1h 0m");
        expect(formatDuration(3600 + 15 * 60)).toBe("1h 15m");
        expect(formatDuration(24 * 3600)).toBe("24h 0m");
    });

    it("formats days and hours for >24h", () => {
        expect(formatDuration(25 * 3600)).toBe("1d 1h");
        expect(formatDuration(50 * 3600)).toBe("2d 2h");
    });
});

describe("num", () => {
    it("returns number for valid values", () => {
        expect(num(42)).toBe(42);
        expect(num(0)).toBe(0);
        expect(num(-5)).toBe(-5);
    });

    it("returns undefined for null/undefined/NaN", () => {
        expect(num(null)).toBeUndefined();
        expect(num(undefined)).toBeUndefined();
        expect(num(NaN)).toBeUndefined();
    });
});

// ─── Composable tests ────────────────────────────────────────

describe("useFormatters — date formatting", () => {
    it("formatDateShort returns dash for falsy input", () => {
        const { formatDateShort } = useFormatters();
        expect(formatDateShort(null)).toBe("—");
        expect(formatDateShort(undefined)).toBe("—");
        expect(formatDateShort("")).toBe("—");
    });

    it("formatDateShort returns formatted string for valid ISO", () => {
        const { formatDateShort } = useFormatters();
        const result = formatDateShort("2025-01-05T10:30:00Z");
        expect(typeof result).toBe("string");
        expect(result).not.toBe("—");
    });

    it("formatDateFull returns dash for falsy input", () => {
        const { formatDateFull } = useFormatters();
        expect(formatDateFull(null)).toBe("—");
    });

    it("formatDateLong handles Date object and string", () => {
        const { formatDateLong } = useFormatters();
        const fromDate = formatDateLong(new Date(2025, 0, 5));
        const fromStr = formatDateLong("2025-01-05T00:00:00Z");
        expect(typeof fromDate).toBe("string");
        expect(typeof fromStr).toBe("string");
    });

    it("formatDateOnly returns dash for falsy input", () => {
        const { formatDateOnly } = useFormatters();
        expect(formatDateOnly(null)).toBe("–");
        expect(formatDateOnly(undefined)).toBe("–");
    });

    it("formatDateTime returns dash for falsy input", () => {
        const { formatDateTime } = useFormatters();
        expect(formatDateTime(null)).toBe("—");
    });

    it("respects locale switch", () => {
        mockLocale.value = "de";
        const { formatDateOnly } = useFormatters();
        const de = formatDateOnly("2025-01-05T00:00:00Z");

        mockLocale.value = "en";
        const en = formatDateOnly("2025-01-05T00:00:00Z");

        // Different locales should produce different formats
        expect(de).not.toBe(en);
    });
});

describe("useFormatters — number formatting", () => {
    it("formatCurrency formats with currency symbol", () => {
        mockLocale.value = "en";
        const { formatCurrency } = useFormatters();
        const result = formatCurrency(12.5, "USD");
        expect(result).toContain("12.50");
    });

    it("formatCurrency respects decimal parameter", () => {
        mockLocale.value = "en";
        const { formatCurrency } = useFormatters();
        const result = formatCurrency(12.5, "USD", 0);
        expect(result).toContain("13"); // rounded
    });

    it("formatPnl adds + prefix for positive values", () => {
        mockLocale.value = "en";
        const { formatPnl } = useFormatters();
        const result = formatPnl(12.5, "USD");
        expect(result.startsWith("+")).toBe(true);
    });

    it("formatPnl shows negative values without extra symbol", () => {
        mockLocale.value = "en";
        const { formatPnl } = useFormatters();
        const result = formatPnl(-3.2, "USD");
        expect(result.startsWith("+")).toBe(false);
    });

    it("formatNumber formats with locale", () => {
        mockLocale.value = "en";
        const { formatNumber } = useFormatters();
        expect(formatNumber(1234.5)).toBe("1,234.50");
    });
});

describe("useFormatters — formatRelativeTime", () => {
    it("returns dash for falsy input", () => {
        const { formatRelativeTime } = useFormatters();
        expect(formatRelativeTime(null)).toBe("—");
        expect(formatRelativeTime(undefined)).toBe("—");
    });

    it("returns justNow for < 1 minute ago", () => {
        const { formatRelativeTime } = useFormatters();
        const now = new Date().toISOString();
        expect(formatRelativeTime(now)).toBe("common.justNow");
    });

    it("returns minutesAgo for < 1 hour ago", () => {
        const { formatRelativeTime } = useFormatters();
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        expect(formatRelativeTime(fiveMinAgo)).toBe("common.minutesAgo:5");
    });

    it("returns hoursAgo for < 24 hours ago", () => {
        const { formatRelativeTime } = useFormatters();
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        expect(formatRelativeTime(twoHoursAgo)).toBe("common.hoursAgo:2");
    });

    it("returns daysAgo for >= 24 hours ago", () => {
        const { formatRelativeTime } = useFormatters();
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        expect(formatRelativeTime(threeDaysAgo)).toBe("common.daysAgo:3");
    });
});
