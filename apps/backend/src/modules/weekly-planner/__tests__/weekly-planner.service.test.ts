import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: { findMany: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    vetVisit: { findMany: vi.fn() },
    shedding: { findMany: vi.fn() },
    maintenanceTask: { findMany: vi.fn() },
    feeding: { findMany: vi.fn() },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

vi.mock("@/modules/feeding-reminders/feeding-reminders.service.js", () => ({
    computeFeedingStatus: vi.fn(),
}));

vi.mock("@/modules/sheddings/shedding-analysis.service.js", () => ({
    computeSheddingCycle: vi.fn(),
}));

const { computeFeedingStatus } =
    await import("@/modules/feeding-reminders/feeding-reminders.service.js");
const { computeSheddingCycle } = await import("@/modules/sheddings/shedding-analysis.service.js");

const { getWeekEvents, getWeekEventsForEmail, getOptedInUsers } =
    await import("../weekly-planner.service.js");

const USER_ID = "user_123";
const MONDAY = new Date("2026-04-13T00:00:00.000Z"); // A Monday

beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.pet.findMany.mockResolvedValue([]);
    mockPrisma.vetVisit.findMany.mockResolvedValue([]);
    mockPrisma.shedding.findMany.mockResolvedValue([]);
    mockPrisma.maintenanceTask.findMany.mockResolvedValue([]);
    mockPrisma.feeding.findMany.mockResolvedValue([]);

    vi.mocked(computeFeedingStatus).mockReturnValue({ status: "due", daysSinceLastFeeding: 7 });
    vi.mocked(computeSheddingCycle).mockReturnValue({
        petId: "pet_1",
        petName: "Noodle",
        sheddingCount: 3,
        averageIntervalDays: 28,
        trend: "stable",
        predictedNextDate: "2026-04-15",
        lastShedDate: "2026-03-18",
        intervals: [],
        isAnomaly: false,
        anomalyMessage: null,
    });
});

describe("getWeekEvents", () => {
    it("returns 7 days starting from weekStart", async () => {
        const days = await getWeekEvents(USER_ID, MONDAY);

        expect(days).toHaveLength(7);
        expect(days[0].date).toBe("2026-04-13");
        expect(days[6].date).toBe("2026-04-19");
    });

    it("returns empty events for all days when no data", async () => {
        const days = await getWeekEvents(USER_ID, MONDAY);

        for (const day of days) {
            expect(day.events).toEqual([]);
        }
    });

    it("places feeding events on the correct day", async () => {
        const lastFed = new Date("2026-04-06T12:00:00Z"); // 7 days before Monday
        mockPrisma.pet.findMany.mockResolvedValueOnce([
            {
                id: "pet_1",
                name: "Noodle",
                species: "Corn Snake",
                feedingIntervalMinDays: 7,
                feedingIntervalMaxDays: 10,
                pauseFeedingDuringShed: false,
                feedings: [{ fedAt: lastFed, accepted: true }],
                sheddings: [],
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const monday = days[0];

        expect(monday.events).toHaveLength(1);
        expect(monday.events[0].type).toBe("feeding");
        expect(monday.events[0].petName).toBe("Noodle");
    });

    it("places vet visits on the correct day", async () => {
        const visitDate = new Date("2026-04-15T10:00:00Z"); // Wednesday
        mockPrisma.vetVisit.findMany
            .mockResolvedValueOnce([
                {
                    id: "vet_1",
                    visitDate,
                    isAppointment: true,
                    reason: "Checkup",
                    pet: { name: "Noodle" },
                    veterinarian: { name: "Dr. Reptile", clinicName: "Reptile Clinic" },
                },
            ])
            .mockResolvedValueOnce([]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const wednesday = days[2];

        expect(wednesday.events).toHaveLength(1);
        expect(wednesday.events[0].type).toBe("vet_visit");
        expect(wednesday.events[0].title).toBe("Noodle");
        expect(wednesday.events[0].detail).toBe("Checkup");
    });

    it("places vet follow-up visits on the correct day", async () => {
        const nextAppointment = new Date("2026-04-16T10:00:00Z"); // Thursday
        mockPrisma.vetVisit.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
            {
                id: "vet_2",
                nextAppointment,
                isAppointment: false,
                reason: "Follow-up",
                pet: { name: "Scales" },
                veterinarian: { name: "Dr. Herp", clinicName: null },
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const thursday = days[3];

        expect(thursday.events).toHaveLength(1);
        expect(thursday.events[0].type).toBe("vet_visit");
        expect(thursday.events[0].meta.isFollowUp).toBe(true);
    });

    it("places shedding predictions on the correct day", async () => {
        mockPrisma.pet.findMany
            // First call: feeding collector (no feeding config)
            .mockResolvedValueOnce([])
            // Second call: shedding collector
            .mockResolvedValueOnce([{ id: "pet_1", name: "Noodle" }]);

        mockPrisma.shedding.findMany.mockResolvedValueOnce([
            { startedAt: new Date("2026-03-18") },
            { startedAt: new Date("2026-02-18") },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const wednesday = days[2]; // 2026-04-15

        expect(wednesday.events).toHaveLength(1);
        expect(wednesday.events[0].type).toBe("shedding");
        expect(wednesday.events[0].petName).toBe("Noodle");
    });

    it("places maintenance tasks on the correct day", async () => {
        mockPrisma.maintenanceTask.findMany.mockResolvedValueOnce([
            {
                id: "task_1",
                type: "SUBSTRATE_CHANGE",
                description: "Change substrate",
                nextDueAt: new Date("2026-04-17"),
                completedAt: null,
                recurring: true,
                enclosure: { name: "Main Terrarium" },
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const friday = days[4]; // 2026-04-17

        expect(friday.events).toHaveLength(1);
        expect(friday.events[0].type).toBe("maintenance");
        expect(friday.events[0].enclosureName).toBe("Main Terrarium");
    });

    it("shows overdue maintenance on the first day of the week", async () => {
        mockPrisma.maintenanceTask.findMany.mockResolvedValueOnce([
            {
                id: "task_overdue",
                type: "WATER_CHANGE",
                description: "Change water",
                nextDueAt: new Date("2026-04-10"), // Before Monday
                completedAt: null,
                recurring: false,
                enclosure: { name: "Quarantine" },
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const monday = days[0];

        expect(monday.events).toHaveLength(1);
        expect(monday.events[0].type).toBe("maintenance");
        expect(monday.events[0].meta.isOverdue).toBe(true);
    });

    it("marks mid-week tasks as overdue when they are past today", async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // yesterday

        mockPrisma.maintenanceTask.findMany.mockResolvedValueOnce([
            {
                id: "task_midweek",
                type: "WATER_CHANGE",
                description: "Change water",
                nextDueAt: pastDate,
                completedAt: null,
                recurring: true,
                enclosure: { name: "Main" },
            },
        ]);

        // Use a weekStart that is before pastDate so the task falls "within" the week
        const weekStart = new Date(pastDate);
        weekStart.setDate(weekStart.getDate() - 2);
        weekStart.setUTCHours(0, 0, 0, 0);

        const days = await getWeekEvents(USER_ID, weekStart);
        const allEvents = days.flatMap((d) => d.events);
        const maintenanceEvents = allEvents.filter((e) => e.type === "maintenance");

        expect(maintenanceEvents).toHaveLength(1);
        expect(maintenanceEvents[0].meta.isOverdue).toBe(true);
    });

    it("sorts events by type within a day", async () => {
        mockPrisma.maintenanceTask.findMany.mockResolvedValueOnce([
            {
                id: "task_1",
                type: "SUBSTRATE_CHANGE",
                description: "Change substrate",
                nextDueAt: MONDAY,
                completedAt: null,
                recurring: true,
                enclosure: { name: "Main" },
            },
        ]);

        const lastFed = new Date("2026-04-06T12:00:00Z");
        mockPrisma.pet.findMany.mockResolvedValueOnce([
            {
                id: "pet_1",
                name: "Noodle",
                species: "Corn Snake",
                feedingIntervalMinDays: 7,
                feedingIntervalMaxDays: 10,
                pauseFeedingDuringShed: false,
                feedings: [{ fedAt: lastFed, accepted: true }],
                sheddings: [],
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const monday = days[0];

        expect(monday.events.length).toBeGreaterThanOrEqual(2);
        // "feeding" comes before "maintenance" alphabetically
        const types = monday.events.map((e) => e.type);
        expect(types).toEqual([...types].sort());
    });

    it("skips pets without feeding schedule", async () => {
        mockPrisma.pet.findMany.mockResolvedValueOnce([
            {
                id: "pet_2",
                name: "Scales",
                species: "Ball Python",
                feedingIntervalMinDays: null,
                feedingIntervalMaxDays: null,
                pauseFeedingDuringShed: false,
                feedings: [],
                sheddings: [],
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const allEvents = days.flatMap((d) => d.events);

        expect(allEvents.filter((e) => e.type === "feeding")).toHaveLength(0);
    });

    it("marks feeding as paused when pet is shedding and pauseFeedingDuringShed is enabled", async () => {
        const lastFed = new Date("2026-04-06T12:00:00Z");
        mockPrisma.pet.findMany.mockResolvedValueOnce([
            {
                id: "pet_1",
                name: "Noodle",
                species: "Corn Snake",
                feedingIntervalMinDays: 7,
                feedingIntervalMaxDays: 10,
                pauseFeedingDuringShed: true,
                feedings: [{ fedAt: lastFed, accepted: true }],
                sheddings: [{ id: "shed_1" }],
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const allEvents = days.flatMap((d) => d.events);
        const feedingEvents = allEvents.filter((e) => e.type === "feeding");

        expect(feedingEvents).toHaveLength(1);
        expect(feedingEvents[0].meta.isPaused).toBe(true);
        expect(feedingEvents[0].meta.status).toBe("paused");
        expect(feedingEvents[0].detail).toBe("Paused (Shedding)");
    });

    it("does not pause feeding when pauseFeedingDuringShed is disabled even if shedding", async () => {
        const lastFed = new Date("2026-04-06T12:00:00Z");
        mockPrisma.pet.findMany.mockResolvedValueOnce([
            {
                id: "pet_1",
                name: "Noodle",
                species: "Corn Snake",
                feedingIntervalMinDays: 7,
                feedingIntervalMaxDays: 10,
                pauseFeedingDuringShed: false,
                feedings: [{ fedAt: lastFed, accepted: true }],
                sheddings: [{ id: "shed_1" }],
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const allEvents = days.flatMap((d) => d.events);
        const feedingEvents = allEvents.filter((e) => e.type === "feeding");

        expect(feedingEvents).toHaveLength(1);
        expect(feedingEvents[0].meta.isPaused).toBe(false);
    });

    it("places feeding_retry events from refused feedings with retryAt in week", async () => {
        const retryDate = new Date("2026-04-15T10:00:00Z"); // Wednesday
        mockPrisma.feeding.findMany.mockResolvedValueOnce([
            {
                id: "feed_1",
                retryAt: retryDate,
                foodType: "Fuzzy Mouse",
                pet: { id: "pet_1", name: "Noodle" },
            },
        ]);

        const days = await getWeekEvents(USER_ID, MONDAY);
        const wednesday = days[2];

        expect(wednesday.events).toHaveLength(1);
        expect(wednesday.events[0].type).toBe("feeding_retry");
        expect(wednesday.events[0].petName).toBe("Noodle");
        expect(wednesday.events[0].detail).toBe("Fuzzy Mouse");
        expect(wednesday.events[0].meta.foodType).toBe("Fuzzy Mouse");
    });
});

describe("getWeekEventsForEmail", () => {
    it("returns null if user is not opted in", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            username: "testuser",
            email: "test@example.com",
            locale: "en",
            emailVerified: true,
            weeklyReportEnabled: false,
        });

        const result = await getWeekEventsForEmail(USER_ID, MONDAY);

        expect(result).toBeNull();
    });

    it("returns null if email is not verified", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            username: "testuser",
            email: "test@example.com",
            locale: "en",
            emailVerified: false,
            weeklyReportEnabled: true,
        });

        const result = await getWeekEventsForEmail(USER_ID, MONDAY);

        expect(result).toBeNull();
    });

    it("returns null if user does not exist", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await getWeekEventsForEmail(USER_ID, MONDAY);

        expect(result).toBeNull();
    });

    it("returns null if no events in the week", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            username: "testuser",
            email: "test@example.com",
            locale: "de",
            emailVerified: true,
            weeklyReportEnabled: true,
        });

        const result = await getWeekEventsForEmail(USER_ID, MONDAY);

        expect(result).toBeNull();
    });

    it("returns data when opted in and events exist", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            username: "testuser",
            email: "test@example.com",
            locale: "de",
            emailVerified: true,
            weeklyReportEnabled: true,
        });

        mockPrisma.maintenanceTask.findMany.mockResolvedValueOnce([
            {
                id: "task_1",
                type: "WATER_CHANGE",
                description: "Change water",
                nextDueAt: new Date("2026-04-14"),
                completedAt: null,
                recurring: true,
                enclosure: { name: "Main" },
            },
        ]);

        const result = await getWeekEventsForEmail(USER_ID, MONDAY);

        expect(result).not.toBeNull();
        expect(result!.username).toBe("testuser");
        expect(result!.email).toBe("test@example.com");
        expect(result!.locale).toBe("de");
        expect(result!.days).toHaveLength(7);
    });
});

describe("getOptedInUsers", () => {
    it("returns only verified, opted-in users", async () => {
        mockPrisma.user.findMany.mockResolvedValue([
            { id: "user_1", email: "a@b.com", username: "a", locale: "en" },
        ]);

        const result = await getOptedInUsers();

        expect(result).toHaveLength(1);
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
            where: {
                emailVerified: true,
                weeklyReportEnabled: true,
            },
            select: { id: true, email: true, username: true, locale: true },
        });
    });
});
