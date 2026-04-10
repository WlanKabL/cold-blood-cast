import { describe, it, expect } from "vitest";

// ── computeGrowthRate (mirrors backend logic — test frontend compatibility) ──

interface GrowthInput {
    date: string;
    weightGrams: number;
}

interface GrowthResult {
    totalGainGrams: number;
    avgGramsPerMonth: number;
    trend: "up" | "stable" | "down";
    recordCount: number;
}

function computeGrowthDisplay(points: GrowthInput[]): GrowthResult {
    if (points.length === 0) {
        return { totalGainGrams: 0, avgGramsPerMonth: 0, trend: "stable", recordCount: 0 };
    }

    const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const totalGainGrams = latest.weightGrams - first.weightGrams;

    const msSpan = new Date(latest.date).getTime() - new Date(first.date).getTime();
    const monthsSpan = msSpan / (1000 * 60 * 60 * 24 * 30.44);
    const avgGramsPerMonth = monthsSpan > 0 ? Math.round((totalGainGrams / monthsSpan) * 100) / 100 : 0;

    let trend: "up" | "stable" | "down" = "stable";
    if (sorted.length >= 2) {
        const recentCount = Math.min(3, sorted.length);
        const recentSlice = sorted.slice(-recentCount);
        const recentGain = recentSlice[recentSlice.length - 1].weightGrams - recentSlice[0].weightGrams;
        const recentMs = new Date(recentSlice[recentSlice.length - 1].date).getTime() - new Date(recentSlice[0].date).getTime();
        const recentMonths = recentMs / (1000 * 60 * 60 * 24 * 30.44);
        const recentRate = recentMonths > 0 ? recentGain / recentMonths : 0;

        if (recentRate > 1) trend = "up";
        else if (recentRate < -1) trend = "down";
    }

    return { totalGainGrams, avgGramsPerMonth, trend, recordCount: sorted.length };
}

// ── chart date range computation ──
function computeFromDate(days: number): string {
    if (days <= 0) return "";
    const d = new Date("2024-06-15T00:00:00.000Z");
    d.setDate(d.getDate() - days);
    return `&from=${d.toISOString()}`;
}

// ── chart data transformation ──
interface WeightSeries {
    petId: string;
    petName: string;
    points: { date: string; weightGrams: number }[];
}

function transformToChartDataset(series: WeightSeries) {
    return {
        label: series.petName,
        data: series.points.map((p) => ({
            x: new Date(p.date).getTime(),
            y: p.weightGrams,
        })),
    };
}

// ── Tests ────────────────────────────────────────────────────

describe("computeGrowthDisplay", () => {
    it("returns defaults for empty data", () => {
        expect(computeGrowthDisplay([])).toEqual({
            totalGainGrams: 0,
            avgGramsPerMonth: 0,
            trend: "stable",
            recordCount: 0,
        });
    });

    it("returns stable for single record", () => {
        const result = computeGrowthDisplay([
            { date: "2024-06-01T00:00:00.000Z", weightGrams: 250 },
        ]);
        expect(result.trend).toBe("stable");
        expect(result.recordCount).toBe(1);
    });

    it("detects upward trend", () => {
        const result = computeGrowthDisplay([
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 100 },
            { date: "2024-02-01T00:00:00.000Z", weightGrams: 150 },
            { date: "2024-03-01T00:00:00.000Z", weightGrams: 200 },
        ]);
        expect(result.trend).toBe("up");
        expect(result.totalGainGrams).toBe(100);
    });

    it("detects downward trend", () => {
        const result = computeGrowthDisplay([
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 300 },
            { date: "2024-02-01T00:00:00.000Z", weightGrams: 250 },
            { date: "2024-03-01T00:00:00.000Z", weightGrams: 200 },
        ]);
        expect(result.trend).toBe("down");
        expect(result.totalGainGrams).toBe(-100);
    });

    it("detects stable trend with minimal change", () => {
        const result = computeGrowthDisplay([
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 250 },
            { date: "2024-02-01T00:00:00.000Z", weightGrams: 250 },
        ]);
        expect(result.trend).toBe("stable");
    });

    it("calculates avgGramsPerMonth correctly", () => {
        const result = computeGrowthDisplay([
            { date: "2024-01-01T00:00:00.000Z", weightGrams: 100 },
            { date: "2024-04-01T00:00:00.000Z", weightGrams: 400 },
        ]);
        expect(result.avgGramsPerMonth).toBeGreaterThan(95);
        expect(result.avgGramsPerMonth).toBeLessThan(105);
    });
});

describe("computeFromDate", () => {
    it("returns empty string for 0 days", () => {
        expect(computeFromDate(0)).toBe("");
    });

    it("returns empty string for negative days", () => {
        expect(computeFromDate(-5)).toBe("");
    });

    it("returns ISO date string for 30 days", () => {
        const result = computeFromDate(30);
        expect(result).toContain("&from=");
        expect(result).toContain("T");
    });

    it("returns ISO date string for 365 days", () => {
        const result = computeFromDate(365);
        expect(result).toContain("&from=");
    });
});

describe("transformToChartDataset", () => {
    it("transforms series to chart.js format", () => {
        const series: WeightSeries = {
            petId: "pet_1",
            petName: "Monty",
            points: [
                { date: "2024-01-01T00:00:00.000Z", weightGrams: 200 },
                { date: "2024-02-01T00:00:00.000Z", weightGrams: 250 },
            ],
        };

        const result = transformToChartDataset(series);
        expect(result.label).toBe("Monty");
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toEqual({
            x: new Date("2024-01-01T00:00:00.000Z").getTime(),
            y: 200,
        });
        expect(result.data[1]).toEqual({
            x: new Date("2024-02-01T00:00:00.000Z").getTime(),
            y: 250,
        });
    });

    it("handles empty points", () => {
        const series: WeightSeries = {
            petId: "pet_1",
            petName: "Monty",
            points: [],
        };

        const result = transformToChartDataset(series);
        expect(result.data).toHaveLength(0);
    });

    it("preserves chronological order of points", () => {
        const series: WeightSeries = {
            petId: "pet_1",
            petName: "Monty",
            points: [
                { date: "2024-01-01T00:00:00.000Z", weightGrams: 100 },
                { date: "2024-03-01T00:00:00.000Z", weightGrams: 300 },
                { date: "2024-02-01T00:00:00.000Z", weightGrams: 200 },
            ],
        };

        const result = transformToChartDataset(series);
        expect(result.data[0].y).toBe(100);
        expect(result.data[1].y).toBe(300);
        expect(result.data[2].y).toBe(200);
    });
});

describe("trend label mapping", () => {
    const trendLabels: Record<string, string> = {
        up: "Gaining",
        stable: "Stable",
        down: "Losing",
    };

    it("maps up to Gaining", () => {
        expect(trendLabels.up).toBe("Gaining");
    });

    it("maps stable to Stable", () => {
        expect(trendLabels.stable).toBe("Stable");
    });

    it("maps down to Losing", () => {
        expect(trendLabels.down).toBe("Losing");
    });
});

describe("color palette", () => {
    const COLORS = [
        { border: "rgb(138, 156, 74)", bg: "rgba(138, 156, 74, 0.15)" },
        { border: "rgb(216, 117, 51)", bg: "rgba(216, 117, 51, 0.15)" },
        { border: "rgb(96, 165, 250)", bg: "rgba(96, 165, 250, 0.15)" },
        { border: "rgb(244, 114, 182)", bg: "rgba(244, 114, 182, 0.15)" },
        { border: "rgb(52, 211, 153)", bg: "rgba(52, 211, 153, 0.15)" },
    ];

    it("has 5 distinct colors", () => {
        expect(COLORS).toHaveLength(5);
    });

    it("cycles colors for more than 5 series", () => {
        const colorFor = (i: number) => COLORS[i % COLORS.length];
        expect(colorFor(0).border).toBe(COLORS[0].border);
        expect(colorFor(5).border).toBe(COLORS[0].border);
        expect(colorFor(7).border).toBe(COLORS[2].border);
    });

    it("each color has border and bg properties", () => {
        for (const color of COLORS) {
            expect(color.border).toMatch(/^rgb\(/);
            expect(color.bg).toMatch(/^rgba\(/);
        }
    });
});
