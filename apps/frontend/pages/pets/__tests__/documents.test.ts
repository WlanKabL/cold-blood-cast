import { describe, it, expect } from "vitest";

// ── Category helper functions (mirrors page logic) ───────

type PetDocumentCategory =
    | "PURCHASE_RECEIPT"
    | "CITES"
    | "ORIGIN_CERTIFICATE"
    | "VET_REPORT"
    | "INSURANCE"
    | "OTHER";

interface PetDocument {
    id: string;
    category: string;
    label: string | null;
    notes: string | null;
    documentDate: string | null;
    createdAt: string;
}

function categoryIcon(category: string): string {
    switch (category) {
        case "PURCHASE_RECEIPT":
            return "lucide:receipt";
        case "CITES":
            return "lucide:shield-check";
        case "ORIGIN_CERTIFICATE":
            return "lucide:award";
        case "VET_REPORT":
            return "lucide:stethoscope";
        case "INSURANCE":
            return "lucide:shield";
        default:
            return "lucide:file-text";
    }
}

function categoryIconBg(category: string): string {
    switch (category) {
        case "PURCHASE_RECEIPT":
            return "bg-green-500/10";
        case "CITES":
            return "bg-blue-500/10";
        case "ORIGIN_CERTIFICATE":
            return "bg-purple-500/10";
        case "VET_REPORT":
            return "bg-teal-500/10";
        case "INSURANCE":
            return "bg-amber-500/10";
        default:
            return "bg-white/5";
    }
}

function categoryIconColor(category: string): string {
    switch (category) {
        case "PURCHASE_RECEIPT":
            return "text-green-400";
        case "CITES":
            return "text-blue-400";
        case "ORIGIN_CERTIFICATE":
            return "text-purple-400";
        case "VET_REPORT":
            return "text-teal-400";
        case "INSURANCE":
            return "text-amber-400";
        default:
            return "text-fg-faint";
    }
}

function filterByCategory(documents: PetDocument[], category: string): PetDocument[] {
    if (!category) return documents;
    return documents.filter((d) => d.category === category);
}

// ── Tests ────────────────────────────────────────────────

describe("categoryIcon", () => {
    it("returns receipt icon for PURCHASE_RECEIPT", () => {
        expect(categoryIcon("PURCHASE_RECEIPT")).toBe("lucide:receipt");
    });
    it("returns shield-check for CITES", () => {
        expect(categoryIcon("CITES")).toBe("lucide:shield-check");
    });
    it("returns award for ORIGIN_CERTIFICATE", () => {
        expect(categoryIcon("ORIGIN_CERTIFICATE")).toBe("lucide:award");
    });
    it("returns stethoscope for VET_REPORT", () => {
        expect(categoryIcon("VET_REPORT")).toBe("lucide:stethoscope");
    });
    it("returns shield for INSURANCE", () => {
        expect(categoryIcon("INSURANCE")).toBe("lucide:shield");
    });
    it("returns file-text for OTHER", () => {
        expect(categoryIcon("OTHER")).toBe("lucide:file-text");
    });
    it("returns file-text for unknown category", () => {
        expect(categoryIcon("UNKNOWN")).toBe("lucide:file-text");
    });
});

describe("categoryIconBg", () => {
    it("returns green for PURCHASE_RECEIPT", () => {
        expect(categoryIconBg("PURCHASE_RECEIPT")).toContain("green");
    });
    it("returns blue for CITES", () => {
        expect(categoryIconBg("CITES")).toContain("blue");
    });
    it("returns purple for ORIGIN_CERTIFICATE", () => {
        expect(categoryIconBg("ORIGIN_CERTIFICATE")).toContain("purple");
    });
    it("returns teal for VET_REPORT", () => {
        expect(categoryIconBg("VET_REPORT")).toContain("teal");
    });
    it("returns amber for INSURANCE", () => {
        expect(categoryIconBg("INSURANCE")).toContain("amber");
    });
    it("returns neutral for OTHER", () => {
        expect(categoryIconBg("OTHER")).toContain("white");
    });
});

describe("categoryIconColor", () => {
    it("returns green for PURCHASE_RECEIPT", () => {
        expect(categoryIconColor("PURCHASE_RECEIPT")).toContain("green");
    });
    it("returns blue for CITES", () => {
        expect(categoryIconColor("CITES")).toContain("blue");
    });
    it("returns purple for ORIGIN_CERTIFICATE", () => {
        expect(categoryIconColor("ORIGIN_CERTIFICATE")).toContain("purple");
    });
    it("returns teal for VET_REPORT", () => {
        expect(categoryIconColor("VET_REPORT")).toContain("teal");
    });
    it("returns amber for INSURANCE", () => {
        expect(categoryIconColor("INSURANCE")).toContain("amber");
    });
    it("returns faint for OTHER", () => {
        expect(categoryIconColor("OTHER")).toContain("fg-faint");
    });
});

describe("filterByCategory", () => {
    const documents: PetDocument[] = [
        {
            id: "1",
            category: "CITES",
            label: "CITES Cert",
            notes: null,
            documentDate: null,
            createdAt: "2025-01-01T00:00:00Z",
        },
        {
            id: "2",
            category: "VET_REPORT",
            label: "Checkup",
            notes: "Good health",
            documentDate: "2025-02-01T00:00:00Z",
            createdAt: "2025-02-01T00:00:00Z",
        },
        {
            id: "3",
            category: "CITES",
            label: "CITES Update",
            notes: null,
            documentDate: null,
            createdAt: "2025-03-01T00:00:00Z",
        },
        {
            id: "4",
            category: "PURCHASE_RECEIPT",
            label: null,
            notes: null,
            documentDate: null,
            createdAt: "2025-04-01T00:00:00Z",
        },
        {
            id: "5",
            category: "OTHER",
            label: "Misc",
            notes: null,
            documentDate: null,
            createdAt: "2025-05-01T00:00:00Z",
        },
    ];

    it("returns all documents when no category filter", () => {
        expect(filterByCategory(documents, "")).toHaveLength(5);
    });

    it("filters to single category", () => {
        const result = filterByCategory(documents, "CITES");
        expect(result).toHaveLength(2);
        expect(result.every((d) => d.category === "CITES")).toBe(true);
    });

    it("filters VET_REPORT correctly", () => {
        const result = filterByCategory(documents, "VET_REPORT");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("2");
    });

    it("returns empty for category with no documents", () => {
        expect(filterByCategory(documents, "INSURANCE")).toHaveLength(0);
    });

    it("returns empty for empty document list", () => {
        expect(filterByCategory([], "CITES")).toHaveLength(0);
    });

    it("returns empty for empty doc list with no category", () => {
        expect(filterByCategory([], "")).toHaveLength(0);
    });
});
