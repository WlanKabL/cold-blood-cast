import { describe, it, expect } from "vitest";

// Inline the pure functions to avoid Nuxt auto-import deps
function toISODateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDuration(seconds: number | null | undefined): string {
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

describe("useFormatters — pure utilities", () => {
    describe("toISODateString", () => {
        it("formats a date as YYYY-MM-DD", () => {
            expect(toISODateString(new Date(2025, 0, 5))).toBe("2025-01-05");
        });

        it("pads single-digit month and day", () => {
            expect(toISODateString(new Date(2024, 2, 9))).toBe("2024-03-09");
        });

        it("handles December correctly", () => {
            expect(toISODateString(new Date(2024, 11, 31))).toBe("2024-12-31");
        });
    });

    describe("formatDuration", () => {
        it("returns dash for null", () => {
            expect(formatDuration(null)).toBe("—");
        });

        it("returns dash for undefined", () => {
            expect(formatDuration(undefined)).toBe("—");
        });

        it("returns dash for 0", () => {
            expect(formatDuration(0)).toBe("—");
        });

        it("formats minutes only", () => {
            expect(formatDuration(300)).toBe("5m");
        });

        it("formats hours and minutes", () => {
            expect(formatDuration(3660)).toBe("1h 1m");
        });

        it("formats days and hours for > 24h", () => {
            expect(formatDuration(90000)).toBe("1d 1h");
        });

        it("formats multiple days", () => {
            // 3 days = 259200 seconds
            expect(formatDuration(259200)).toBe("3d 0h");
        });
    });
});
