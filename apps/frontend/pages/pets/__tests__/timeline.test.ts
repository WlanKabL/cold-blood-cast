import { describe, it, expect } from "vitest";

// ── Timeline display helpers (mirrors page logic) ────────

type EventType = "feeding" | "shedding" | "weight" | "vet_visit" | "photo";

interface TimelineEvent {
    id: string;
    type: EventType;
    date: string;
    title: string;
    detail: string | null;
    icon: string;
    meta: Record<string, unknown>;
}

function eventColorClass(type: string): string {
    switch (type) {
        case "feeding":
            return "bg-orange-500/10 text-orange-400";
        case "shedding":
            return "bg-purple-500/10 text-purple-400";
        case "weight":
            return "bg-blue-500/10 text-blue-400";
        case "vet_visit":
            return "bg-teal-500/10 text-teal-400";
        case "photo":
            return "bg-pink-500/10 text-pink-400";
        default:
            return "bg-white/5 text-fg-faint";
    }
}

function groupEventsByDate(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
    const groups: Record<string, TimelineEvent[]> = {};
    for (const event of events) {
        const dateKey = new Date(event.date).toLocaleDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(event);
    }
    return groups;
}

function filterEventsByTypes(events: TimelineEvent[], types: EventType[]): TimelineEvent[] {
    const typeSet = new Set(types);
    return events.filter((e) => typeSet.has(e.type));
}

// ── Tests ────────────────────────────────────────────────

describe("eventColorClass", () => {
    it("returns orange for feeding", () => {
        expect(eventColorClass("feeding")).toContain("orange");
    });

    it("returns purple for shedding", () => {
        expect(eventColorClass("shedding")).toContain("purple");
    });

    it("returns blue for weight", () => {
        expect(eventColorClass("weight")).toContain("blue");
    });

    it("returns teal for vet_visit", () => {
        expect(eventColorClass("vet_visit")).toContain("teal");
    });

    it("returns pink for photo", () => {
        expect(eventColorClass("photo")).toContain("pink");
    });

    it("returns default for unknown type", () => {
        expect(eventColorClass("unknown")).toContain("fg-faint");
    });
});

describe("groupEventsByDate", () => {
    const events: TimelineEvent[] = [
        {
            id: "1",
            type: "feeding",
            date: "2024-06-15T10:00:00.000Z",
            title: "Mouse",
            detail: null,
            icon: "lucide:utensils",
            meta: {},
        },
        {
            id: "2",
            type: "weight",
            date: "2024-06-15T14:00:00.000Z",
            title: "350g",
            detail: null,
            icon: "lucide:scale",
            meta: {},
        },
        {
            id: "3",
            type: "shedding",
            date: "2024-06-10T00:00:00.000Z",
            title: "Shedding",
            detail: null,
            icon: "lucide:sparkles",
            meta: {},
        },
    ];

    it("groups events by date string", () => {
        const groups = groupEventsByDate(events);
        const keys = Object.keys(groups);
        expect(keys).toHaveLength(2);
    });

    it("puts same-day events in the same group", () => {
        const groups = groupEventsByDate(events);
        const dateKey = new Date("2024-06-15T10:00:00.000Z").toLocaleDateString();
        expect(groups[dateKey]).toHaveLength(2);
    });

    it("returns empty object for empty events", () => {
        const groups = groupEventsByDate([]);
        expect(Object.keys(groups)).toHaveLength(0);
    });
});

describe("filterEventsByTypes", () => {
    const events: TimelineEvent[] = [
        {
            id: "1",
            type: "feeding",
            date: "2024-06-15T10:00:00.000Z",
            title: "Mouse",
            detail: null,
            icon: "lucide:utensils",
            meta: {},
        },
        {
            id: "2",
            type: "weight",
            date: "2024-06-15T14:00:00.000Z",
            title: "350g",
            detail: null,
            icon: "lucide:scale",
            meta: {},
        },
        {
            id: "3",
            type: "shedding",
            date: "2024-06-10T00:00:00.000Z",
            title: "Shedding",
            detail: null,
            icon: "lucide:sparkles",
            meta: {},
        },
        {
            id: "4",
            type: "vet_visit",
            date: "2024-06-01T09:00:00.000Z",
            title: "Checkup",
            detail: null,
            icon: "lucide:stethoscope",
            meta: {},
        },
        {
            id: "5",
            type: "photo",
            date: "2024-06-20T14:00:00.000Z",
            title: "Photo",
            detail: null,
            icon: "lucide:camera",
            meta: {},
        },
    ];

    it("filters to single type", () => {
        const result = filterEventsByTypes(events, ["feeding"]);
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("feeding");
    });

    it("filters to multiple types", () => {
        const result = filterEventsByTypes(events, ["feeding", "weight"]);
        expect(result).toHaveLength(2);
    });

    it("returns all when all types selected", () => {
        const result = filterEventsByTypes(events, [
            "feeding",
            "shedding",
            "weight",
            "vet_visit",
            "photo",
        ]);
        expect(result).toHaveLength(5);
    });

    it("returns empty when no types match", () => {
        const result = filterEventsByTypes(events, []);
        expect(result).toHaveLength(0);
    });
});
