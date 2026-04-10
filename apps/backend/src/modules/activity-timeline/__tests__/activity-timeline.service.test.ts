import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: {
        findUnique: vi.fn(),
    },
    feeding: {
        findMany: vi.fn(),
    },
    shedding: {
        findMany: vi.fn(),
    },
    weightRecord: {
        findMany: vi.fn(),
    },
    vetVisit: {
        findMany: vi.fn(),
    },
    petPhoto: {
        findMany: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const { normalizeEvents, getTimeline } = await import("../activity-timeline.service.js");

const USER_ID = "user_123";
const PET_ID = "pet_001";

beforeEach(() => {
    vi.clearAllMocks();
});

// ── normalizeEvents (pure function) ──────────────────────

describe("normalizeEvents", () => {
    it("returns empty array when all inputs are empty", () => {
        const events = normalizeEvents([], [], [], [], []);
        expect(events).toEqual([]);
    });

    it("converts feedings to timeline events", () => {
        const feedings = [
            {
                id: "f1",
                fedAt: new Date("2024-06-15T10:00:00.000Z"),
                foodType: "Mouse",
                foodSize: "Small",
                quantity: 1,
                accepted: true,
                notes: null,
            },
        ];
        const events = normalizeEvents(feedings, [], [], [], []);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            id: "f1",
            type: "feeding",
            title: "Mouse (Small)",
            icon: "lucide:utensils",
            meta: { quantity: 1, accepted: true, foodSize: "Small" },
        });
    });

    it("converts sheddings to timeline events", () => {
        const sheddings = [
            {
                id: "s1",
                startedAt: new Date("2024-06-10T00:00:00.000Z"),
                completedAt: new Date("2024-06-12T00:00:00.000Z"),
                complete: true,
                quality: "good",
                notes: "Clean shed",
            },
        ];
        const events = normalizeEvents([], sheddings, [], [], []);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            id: "s1",
            type: "shedding",
            title: "Shedding (complete — good)",
            detail: "Clean shed",
            icon: "lucide:sparkles",
        });
    });

    it("converts weight records to timeline events", () => {
        const weights = [
            {
                id: "w1",
                measuredAt: new Date("2024-06-05T12:00:00.000Z"),
                weightGrams: 350,
                notes: null,
            },
        ];
        const events = normalizeEvents([], [], weights, [], []);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            id: "w1",
            type: "weight",
            title: "350g",
            icon: "lucide:scale",
            meta: { weightGrams: 350 },
        });
    });

    it("converts vet visits to timeline events", () => {
        const vet = [
            {
                id: "v1",
                visitDate: new Date("2024-06-01T09:00:00.000Z"),
                visitType: "CHECKUP",
                reason: "Annual checkup",
                diagnosis: "Healthy",
                treatment: null,
                costCents: 5000,
                notes: null,
                veterinarian: { name: "Dr. Schmidt", clinicName: "Reptile Klinik" },
            },
        ];
        const events = normalizeEvents([], [], [], vet, []);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            id: "v1",
            type: "vet_visit",
            title: "Annual checkup",
            detail: "Healthy",
            icon: "lucide:stethoscope",
            meta: { costCents: 5000, vetName: "Dr. Schmidt" },
        });
    });

    it("converts photos to timeline events", () => {
        const photos = [
            {
                id: "p1",
                takenAt: new Date("2024-06-20T14:00:00.000Z"),
                caption: "Basking",
                tags: ["portrait", "enclosure"],
                upload: { url: "/uploads/abc.jpg" },
            },
        ];
        const events = normalizeEvents([], [], [], [], photos);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            id: "p1",
            type: "photo",
            title: "Basking",
            detail: "portrait, enclosure",
            icon: "lucide:camera",
            meta: { tags: ["portrait", "enclosure"], url: "/uploads/abc.jpg" },
        });
    });

    it("sorts all events by date descending", () => {
        const feedings = [
            { id: "f1", fedAt: new Date("2024-06-15T10:00:00.000Z"), foodType: "Mouse", foodSize: null, quantity: 1, accepted: true, notes: null },
        ];
        const weights = [
            { id: "w1", measuredAt: new Date("2024-06-20T12:00:00.000Z"), weightGrams: 350, notes: null },
        ];
        const sheddings = [
            { id: "s1", startedAt: new Date("2024-06-01T00:00:00.000Z"), completedAt: null, complete: false, quality: null, notes: null },
        ];

        const events = normalizeEvents(feedings, sheddings, weights, [], []);

        expect(events.map((e) => e.id)).toEqual(["w1", "f1", "s1"]);
    });

    it("merges events from all sources", () => {
        const feedings = [
            { id: "f1", fedAt: new Date("2024-06-15T10:00:00.000Z"), foodType: "Mouse", foodSize: null, quantity: 1, accepted: true, notes: null },
        ];
        const sheddings = [
            { id: "s1", startedAt: new Date("2024-06-10T00:00:00.000Z"), completedAt: null, complete: false, quality: null, notes: null },
        ];
        const weights = [
            { id: "w1", measuredAt: new Date("2024-06-05T12:00:00.000Z"), weightGrams: 350, notes: null },
        ];
        const vet = [
            { id: "v1", visitDate: new Date("2024-06-01T09:00:00.000Z"), visitType: "CHECKUP", reason: null, diagnosis: null, treatment: null, costCents: null, notes: null, veterinarian: null },
        ];
        const photos = [
            { id: "p1", takenAt: new Date("2024-06-20T14:00:00.000Z"), caption: null, tags: [], upload: { url: "/img.jpg" } },
        ];

        const events = normalizeEvents(feedings, sheddings, weights, vet, photos);
        expect(events).toHaveLength(5);
        expect(events.map((e) => e.type)).toEqual(["photo", "feeding", "shedding", "weight", "vet_visit"]);
    });

    it("handles feeding without foodSize", () => {
        const feedings = [
            { id: "f1", fedAt: new Date("2024-06-15T10:00:00.000Z"), foodType: "Cricket", foodSize: null, quantity: 3, accepted: true, notes: null },
        ];
        const events = normalizeEvents(feedings, [], [], [], []);
        expect(events[0].title).toBe("Cricket");
    });

    it("handles vet visit without reason (uses visitType)", () => {
        const vet = [
            { id: "v1", visitDate: new Date("2024-06-01T09:00:00.000Z"), visitType: "EMERGENCY", reason: null, diagnosis: null, treatment: null, costCents: null, notes: "urgent", veterinarian: null },
        ];
        const events = normalizeEvents([], [], [], vet, []);
        expect(events[0].title).toBe("EMERGENCY");
        expect(events[0].detail).toBe("urgent");
    });

    it("handles photo without caption", () => {
        const photos = [
            { id: "p1", takenAt: new Date("2024-06-20T14:00:00.000Z"), caption: null, tags: [], upload: { url: "/img.jpg" } },
        ];
        const events = normalizeEvents([], [], [], [], photos);
        expect(events[0].title).toBe("Photo");
        expect(events[0].detail).toBeNull();
    });

    it("handles shedding in progress", () => {
        const sheddings = [
            { id: "s1", startedAt: new Date("2024-06-10T00:00:00.000Z"), completedAt: null, complete: false, quality: null, notes: null },
        ];
        const events = normalizeEvents([], sheddings, [], [], []);
        expect(events[0].title).toBe("Shedding (in progress)");
    });
});

// ── getTimeline ──────────────────────────────────────────

describe("getTimeline", () => {
    it("returns paginated timeline for a pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.feeding.findMany.mockResolvedValue([
            { id: "f1", fedAt: new Date("2024-06-15T10:00:00.000Z"), foodType: "Mouse", foodSize: null, quantity: 1, accepted: true, notes: null },
            { id: "f2", fedAt: new Date("2024-06-10T10:00:00.000Z"), foodType: "Rat", foodSize: "Small", quantity: 1, accepted: true, notes: null },
        ]);
        mockPrisma.shedding.findMany.mockResolvedValue([]);
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);
        mockPrisma.petPhoto.findMany.mockResolvedValue([]);

        const result = await getTimeline(USER_ID, PET_ID, {
            page: 1,
            limit: 50,
            types: ["feeding", "shedding", "weight", "vet_visit", "photo"],
        });

        expect(result.events).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.hasMore).toBe(false);
        expect(result.page).toBe(1);
    });

    it("throws when pet not found", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);

        await expect(
            getTimeline(USER_ID, PET_ID, { page: 1, limit: 50, types: ["feeding"] }),
        ).rejects.toThrow();
    });

    it("throws when user does not own pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(
            getTimeline(USER_ID, PET_ID, { page: 1, limit: 50, types: ["feeding"] }),
        ).rejects.toThrow();
    });

    it("only queries requested types", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.feeding.findMany.mockResolvedValue([
            { id: "f1", fedAt: new Date("2024-06-15T10:00:00.000Z"), foodType: "Mouse", foodSize: null, quantity: 1, accepted: true, notes: null },
        ]);

        const result = await getTimeline(USER_ID, PET_ID, {
            page: 1,
            limit: 50,
            types: ["feeding"],
        });

        expect(result.events).toHaveLength(1);
        expect(mockPrisma.shedding.findMany).not.toHaveBeenCalled();
        expect(mockPrisma.weightRecord.findMany).not.toHaveBeenCalled();
        expect(mockPrisma.vetVisit.findMany).not.toHaveBeenCalled();
        expect(mockPrisma.petPhoto.findMany).not.toHaveBeenCalled();
    });

    it("paginates correctly", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        const manyFeedings = Array.from({ length: 10 }, (_, i) => ({
            id: `f${i}`,
            fedAt: new Date(`2024-06-${String(20 - i).padStart(2, "0")}T10:00:00.000Z`),
            foodType: "Mouse",
            foodSize: null,
            quantity: 1,
            accepted: true,
            notes: null,
        }));
        mockPrisma.feeding.findMany.mockResolvedValue(manyFeedings);
        mockPrisma.shedding.findMany.mockResolvedValue([]);
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);
        mockPrisma.petPhoto.findMany.mockResolvedValue([]);

        const page1 = await getTimeline(USER_ID, PET_ID, {
            page: 1,
            limit: 3,
            types: ["feeding", "shedding", "weight", "vet_visit", "photo"],
        });

        expect(page1.events).toHaveLength(3);
        expect(page1.total).toBe(10);
        expect(page1.hasMore).toBe(true);

        const page4 = await getTimeline(USER_ID, PET_ID, {
            page: 4,
            limit: 3,
            types: ["feeding", "shedding", "weight", "vet_visit", "photo"],
        });

        expect(page4.events).toHaveLength(1);
        expect(page4.hasMore).toBe(false);
    });

    it("returns events sorted by date descending across types", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.feeding.findMany.mockResolvedValue([
            { id: "f1", fedAt: new Date("2024-06-15T10:00:00.000Z"), foodType: "Mouse", foodSize: null, quantity: 1, accepted: true, notes: null },
        ]);
        mockPrisma.shedding.findMany.mockResolvedValue([
            { id: "s1", startedAt: new Date("2024-06-20T00:00:00.000Z"), completedAt: null, complete: false, quality: null, notes: null },
        ]);
        mockPrisma.weightRecord.findMany.mockResolvedValue([
            { id: "w1", measuredAt: new Date("2024-06-10T12:00:00.000Z"), weightGrams: 350, notes: null },
        ]);
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);
        mockPrisma.petPhoto.findMany.mockResolvedValue([]);

        const result = await getTimeline(USER_ID, PET_ID, {
            page: 1,
            limit: 50,
            types: ["feeding", "shedding", "weight", "vet_visit", "photo"],
        });

        expect(result.events.map((e) => e.id)).toEqual(["s1", "f1", "w1"]);
    });

    it("returns empty when no matching events", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.feeding.findMany.mockResolvedValue([]);
        mockPrisma.shedding.findMany.mockResolvedValue([]);
        mockPrisma.weightRecord.findMany.mockResolvedValue([]);
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);
        mockPrisma.petPhoto.findMany.mockResolvedValue([]);

        const result = await getTimeline(USER_ID, PET_ID, {
            page: 1,
            limit: 50,
            types: ["feeding", "shedding", "weight", "vet_visit", "photo"],
        });

        expect(result.events).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.hasMore).toBe(false);
    });
});
