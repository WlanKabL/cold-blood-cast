import { describe, it, expect } from "vitest";

// ── Shedding interval analysis (mirrors backend logic) ──

interface SheddingInput {
    startedAt: string;
}

interface SheddingInterval {
    fromDate: string;
    toDate: string;
    days: number;
}

interface SheddingAnalysisDisplay {
    sheddingCount: number;
    averageIntervalDays: number;
    trend: "shortening" | "stable" | "lengthening";
    intervals: SheddingInterval[];
}

function computeSheddingDisplay(sheddings: SheddingInput[]): SheddingAnalysisDisplay {
    if (sheddings.length < 2) {
        return {
            sheddingCount: sheddings.length,
            averageIntervalDays: 0,
            trend: "stable",
            intervals: [],
        };
    }

    const sorted = [...sheddings].sort(
        (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

    const intervals: SheddingInterval[] = [];
    for (let i = 1; i < sorted.length; i++) {
        const from = new Date(sorted[i - 1].startedAt);
        const to = new Date(sorted[i].startedAt);
        const days = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        intervals.push({
            fromDate: from.toISOString(),
            toDate: to.toISOString(),
            days,
        });
    }

    const totalDays = intervals.reduce((sum, iv) => sum + iv.days, 0);
    const averageIntervalDays = Math.round(totalDays / intervals.length);

    let trend: "shortening" | "stable" | "lengthening" = "stable";
    if (intervals.length >= 3) {
        const recentCount = Math.min(3, intervals.length);
        const recentSlice = intervals.slice(-recentCount);
        const recentAvg = recentSlice.reduce((s, iv) => s + iv.days, 0) / recentSlice.length;
        const diff = recentAvg - averageIntervalDays;
        const threshold = averageIntervalDays * 0.15;

        if (diff < -threshold) trend = "shortening";
        else if (diff > threshold) trend = "lengthening";
    }

    return { sheddingCount: sorted.length, averageIntervalDays, trend, intervals };
}

// ── Chart bar color logic ──

function getBarColor(intervalDays: number, averageDays: number): "normal" | "anomaly" {
    if (averageDays <= 0) return "normal";
    return intervalDays > averageDays * 1.3 ? "anomaly" : "normal";
}

// ── Trend label helper ──

function trendLabel(trend: "shortening" | "stable" | "lengthening"): string {
    const map = {
        shortening: "Shortening",
        stable: "Stable",
        lengthening: "Lengthening",
    };
    return map[trend];
}

// ── Predicted date formatting ──

function formatPrediction(daysUntil: number): "overdue" | "upcoming" | "future" {
    if (daysUntil <= 0) return "overdue";
    if (daysUntil <= 7) return "upcoming";
    return "future";
}

// ── Tests ────────────────────────────────────────────────────

describe("computeSheddingDisplay", () => {
    it("returns defaults for empty data", () => {
        expect(computeSheddingDisplay([])).toEqual({
            sheddingCount: 0,
            averageIntervalDays: 0,
            trend: "stable",
            intervals: [],
        });
    });

    it("returns defaults for single shedding", () => {
        const result = computeSheddingDisplay([{ startedAt: "2024-06-01T00:00:00.000Z" }]);
        expect(result.sheddingCount).toBe(1);
        expect(result.averageIntervalDays).toBe(0);
        expect(result.intervals).toEqual([]);
    });

    it("calculates intervals for two sheddings", () => {
        const result = computeSheddingDisplay([
            { startedAt: "2024-01-01T00:00:00.000Z" },
            { startedAt: "2024-01-31T00:00:00.000Z" },
        ]);
        expect(result.sheddingCount).toBe(2);
        expect(result.averageIntervalDays).toBe(30);
        expect(result.intervals).toHaveLength(1);
        expect(result.intervals[0].days).toBe(30);
    });

    it("calculates average across multiple intervals", () => {
        const result = computeSheddingDisplay([
            { startedAt: "2024-01-01T00:00:00.000Z" },
            { startedAt: "2024-01-21T00:00:00.000Z" },
            { startedAt: "2024-02-20T00:00:00.000Z" },
        ]);
        expect(result.intervals).toHaveLength(2);
        expect(result.intervals[0].days).toBe(20);
        expect(result.intervals[1].days).toBe(30);
        expect(result.averageIntervalDays).toBe(25);
    });

    it("handles unsorted input", () => {
        const result = computeSheddingDisplay([
            { startedAt: "2024-03-01T00:00:00.000Z" },
            { startedAt: "2024-01-01T00:00:00.000Z" },
            { startedAt: "2024-02-01T00:00:00.000Z" },
        ]);
        expect(result.intervals[0].fromDate).toBe("2024-01-01T00:00:00.000Z");
    });

    it("detects shortening trend", () => {
        const result = computeSheddingDisplay([
            { startedAt: "2024-01-01T00:00:00.000Z" },
            { startedAt: "2024-03-01T00:00:00.000Z" }, // 60d
            { startedAt: "2024-04-15T00:00:00.000Z" }, // 45d
            { startedAt: "2024-05-20T00:00:00.000Z" }, // 35d
            { startedAt: "2024-06-15T00:00:00.000Z" }, // 26d
        ]);
        expect(result.trend).toBe("shortening");
    });

    it("detects lengthening trend", () => {
        const result = computeSheddingDisplay([
            { startedAt: "2024-01-01T00:00:00.000Z" },
            { startedAt: "2024-01-16T00:00:00.000Z" }, // 15d
            { startedAt: "2024-02-05T00:00:00.000Z" }, // 20d
            { startedAt: "2024-03-16T00:00:00.000Z" }, // 40d
            { startedAt: "2024-05-25T00:00:00.000Z" }, // 70d
        ]);
        expect(result.trend).toBe("lengthening");
    });

    it("detects stable trend for consistent intervals", () => {
        const result = computeSheddingDisplay([
            { startedAt: "2024-01-01T00:00:00.000Z" },
            { startedAt: "2024-01-31T00:00:00.000Z" }, // 30d
            { startedAt: "2024-03-01T00:00:00.000Z" }, // 30d
            { startedAt: "2024-03-31T00:00:00.000Z" }, // 30d
            { startedAt: "2024-04-30T00:00:00.000Z" }, // 30d
        ]);
        expect(result.trend).toBe("stable");
    });
});

describe("getBarColor", () => {
    it("returns normal for intervals within threshold", () => {
        expect(getBarColor(30, 30)).toBe("normal");
        expect(getBarColor(35, 30)).toBe("normal");
        expect(getBarColor(38, 30)).toBe("normal");
    });

    it("returns anomaly for intervals exceeding 130% of average", () => {
        expect(getBarColor(40, 30)).toBe("anomaly");
        expect(getBarColor(50, 30)).toBe("anomaly");
    });

    it("returns normal when averageDays is 0", () => {
        expect(getBarColor(10, 0)).toBe("normal");
    });
});

describe("trendLabel", () => {
    it("returns correct labels", () => {
        expect(trendLabel("shortening")).toBe("Shortening");
        expect(trendLabel("stable")).toBe("Stable");
        expect(trendLabel("lengthening")).toBe("Lengthening");
    });
});

describe("formatPrediction", () => {
    it("returns overdue for negative or zero days", () => {
        expect(formatPrediction(0)).toBe("overdue");
        expect(formatPrediction(-5)).toBe("overdue");
    });

    it("returns upcoming for 1-7 days", () => {
        expect(formatPrediction(1)).toBe("upcoming");
        expect(formatPrediction(7)).toBe("upcoming");
    });

    it("returns future for more than 7 days", () => {
        expect(formatPrediction(8)).toBe("future");
        expect(formatPrediction(30)).toBe("future");
    });
});
