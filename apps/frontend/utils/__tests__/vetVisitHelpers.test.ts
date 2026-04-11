import { describe, it, expect } from "vitest";

// ─── visitTypeBadgeClass (matches vet-visits/index.vue) ──────

function visitTypeBadgeClass(type: string): string {
    switch (type) {
        case "EMERGENCY":
            return "bg-red-500/10 text-red-400";
        case "SURGERY":
            return "bg-orange-500/10 text-orange-400";
        case "VACCINATION":
            return "bg-blue-500/10 text-blue-400";
        case "CHECKUP":
            return "bg-green-500/10 text-green-400";
        case "DEWORMING":
        case "FECAL_TEST":
            return "bg-purple-500/10 text-purple-400";
        default:
            return "bg-white/5 text-fg-faint";
    }
}

// ─── formatCost (cents → EUR, matches vet-visits/index.vue) ──

function formatCost(cents: number): string {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
        cents / 100,
    );
}

// ─── Tests ───────────────────────────────────────────────────

describe("visitTypeBadgeClass", () => {
    it("returns red for EMERGENCY", () => {
        expect(visitTypeBadgeClass("EMERGENCY")).toContain("red");
    });

    it("returns orange for SURGERY", () => {
        expect(visitTypeBadgeClass("SURGERY")).toContain("orange");
    });

    it("returns blue for VACCINATION", () => {
        expect(visitTypeBadgeClass("VACCINATION")).toContain("blue");
    });

    it("returns green for CHECKUP", () => {
        expect(visitTypeBadgeClass("CHECKUP")).toContain("green");
    });

    it("returns purple for DEWORMING and FECAL_TEST", () => {
        expect(visitTypeBadgeClass("DEWORMING")).toContain("purple");
        expect(visitTypeBadgeClass("FECAL_TEST")).toContain("purple");
    });

    it("returns faint for OTHER/CONSULTATION/FOLLOW_UP/unknown", () => {
        expect(visitTypeBadgeClass("OTHER")).toContain("fg-faint");
        expect(visitTypeBadgeClass("CONSULTATION")).toContain("fg-faint");
        expect(visitTypeBadgeClass("FOLLOW_UP")).toContain("fg-faint");
        expect(visitTypeBadgeClass("UNKNOWN")).toContain("fg-faint");
    });
});

describe("formatCost", () => {
    it("formats cents as EUR with comma separator", () => {
        const result = formatCost(5000);
        expect(result).toContain("50");
        expect(result).toContain("€");
    });

    it("formats zero cents", () => {
        const result = formatCost(0);
        expect(result).toContain("0");
        expect(result).toContain("€");
    });

    it("formats fractional EUR correctly", () => {
        const result = formatCost(1299);
        expect(result).toContain("12");
        expect(result).toContain("99");
    });

    it("formats large amounts", () => {
        const result = formatCost(150000);
        expect(result).toContain("1.500");
    });
});
