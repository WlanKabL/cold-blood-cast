import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: {
        findMany: vi.fn(),
    },
    user: {
        findMany: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const { computeFeedingStatus, getFeedingStatuses, getPetsNeedingReminder } =
    await import("../feeding-reminders.service.js");

const USER_ID = "user_123";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("computeFeedingStatus", () => {
    const now = new Date("2026-04-10T12:00:00Z");

    it("returns no_schedule when no interval configured", () => {
        const result = computeFeedingStatus(null, null, new Date("2026-04-08"), now);
        expect(result.status).toBe("no_schedule");
        expect(result.daysSinceLastFeeding).toBe(2);
    });

    it("returns no_schedule with null days when no interval and no feeding", () => {
        const result = computeFeedingStatus(null, null, null, now);
        expect(result.status).toBe("no_schedule");
        expect(result.daysSinceLastFeeding).toBeNull();
    });

    it("returns due when no last feeding exists but interval is set", () => {
        const result = computeFeedingStatus(7, 10, null, now);
        expect(result.status).toBe("due");
        expect(result.daysSinceLastFeeding).toBeNull();
    });

    it("returns ok when within min interval", () => {
        const lastFed = new Date("2026-04-07T12:00:00Z"); // 3 days ago
        const result = computeFeedingStatus(7, 10, lastFed, now);
        expect(result.status).toBe("ok");
        expect(result.daysSinceLastFeeding).toBe(3);
    });

    it("returns due at exactly min interval", () => {
        const lastFed = new Date("2026-04-03T12:00:00Z"); // 7 days ago
        const result = computeFeedingStatus(7, 10, lastFed, now);
        expect(result.status).toBe("due");
        expect(result.daysSinceLastFeeding).toBe(7);
    });

    it("returns due between min and max interval", () => {
        const lastFed = new Date("2026-04-02T12:00:00Z"); // 8 days ago
        const result = computeFeedingStatus(7, 10, lastFed, now);
        expect(result.status).toBe("due");
        expect(result.daysSinceLastFeeding).toBe(8);
    });

    it("returns due at exactly max interval", () => {
        const lastFed = new Date("2026-03-31T12:00:00Z"); // 10 days ago
        const result = computeFeedingStatus(7, 10, lastFed, now);
        expect(result.status).toBe("due");
        expect(result.daysSinceLastFeeding).toBe(10);
    });

    it("returns critical when past max interval", () => {
        const lastFed = new Date("2026-03-30T12:00:00Z"); // 11 days ago
        const result = computeFeedingStatus(7, 10, lastFed, now);
        expect(result.status).toBe("critical");
        expect(result.daysSinceLastFeeding).toBe(11);
    });

    it("returns ok when fed today", () => {
        const result = computeFeedingStatus(7, 10, now, now);
        expect(result.status).toBe("ok");
        expect(result.daysSinceLastFeeding).toBe(0);
    });
});

describe("getFeedingStatuses", () => {
    it("returns statuses for all user pets", async () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        mockPrisma.pet.findMany.mockResolvedValue([
            {
                id: "pet_1",
                name: "Noodle",
                species: "Corn Snake",
                feedingIntervalMinDays: 7,
                feedingIntervalMaxDays: 10,
                feedings: [{ fedAt: thirtyDaysAgo }],
            },
            {
                id: "pet_2",
                name: "Scales",
                species: "Ball Python",
                feedingIntervalMinDays: null,
                feedingIntervalMaxDays: null,
                feedings: [],
            },
        ]);

        const result = await getFeedingStatuses(USER_ID);

        expect(result).toHaveLength(2);
        expect(result[0].petId).toBe("pet_1");
        expect(result[0].status).toBe("critical"); // 30 days ago, max=10
        expect(result[1].petId).toBe("pet_2");
        expect(result[1].status).toBe("no_schedule");
    });

    it("filters by userId", async () => {
        mockPrisma.pet.findMany.mockResolvedValue([]);
        await getFeedingStatuses(USER_ID);

        expect(mockPrisma.pet.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: USER_ID } }),
        );
    });
});

describe("getPetsNeedingReminder", () => {
    it("returns only critical pets across all users", async () => {
        mockPrisma.user.findMany.mockResolvedValue([{ id: "user_1" }, { id: "user_2" }]);

        // First user — one critical pet
        mockPrisma.pet.findMany
            .mockResolvedValueOnce([
                {
                    id: "pet_1",
                    name: "Noodle",
                    species: "Corn Snake",
                    feedingIntervalMinDays: 7,
                    feedingIntervalMaxDays: 10,
                    feedings: [{ fedAt: new Date("2026-03-25") }], // Way overdue
                },
            ])
            // Second user — no critical pets
            .mockResolvedValueOnce([
                {
                    id: "pet_2",
                    name: "Scales",
                    species: "Ball Python",
                    feedingIntervalMinDays: 14,
                    feedingIntervalMaxDays: 21,
                    feedings: [{ fedAt: new Date() }], // Just fed
                },
            ]);

        const result = await getPetsNeedingReminder();

        expect(result).toHaveLength(1);
        expect(result[0].petId).toBe("pet_1");
        expect(result[0].status).toBe("critical");
    });
});
