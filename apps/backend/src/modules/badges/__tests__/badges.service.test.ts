import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    badge: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    userBadge: {
        findMany: vi.fn(),
        create: vi.fn(),
    },
    pet: {
        count: vi.fn(),
    },
    petPhoto: {
        count: vi.fn(),
    },
    feeding: {
        count: vi.fn(),
    },
    weightRecord: {
        count: vi.fn(),
    },
    userPublicProfile: {
        findUnique: vi.fn(),
    },
    vetVisit: {
        count: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const { checkAndAwardBadges, getUserBadges, getAllBadgeDefinitions } = await import(
    "../badges.service.js"
);

const USER_ID = "user_123";

beforeEach(() => {
    vi.clearAllMocks();
    // Default: syncBadgeDefinitions upserts succeed
    mockPrisma.badge.upsert.mockResolvedValue({});
});

// ─── checkAndAwardBadges ─────────────────────────────────────

describe("checkAndAwardBadges", () => {
    it("awards first_pet badge when user has 1+ pets", async () => {
        mockPrisma.userBadge.findMany.mockResolvedValue([]); // no existing badges
        mockPrisma.pet.count.mockResolvedValue(1);
        mockPrisma.petPhoto.count.mockResolvedValue(0);
        mockPrisma.feeding.count.mockResolvedValue(0);
        mockPrisma.weightRecord.count.mockResolvedValue(0);
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);
        mockPrisma.vetVisit.count.mockResolvedValue(0);
        mockPrisma.badge.findUnique.mockResolvedValue({ id: "badge_first_pet", key: "first_pet" });
        mockPrisma.userBadge.create.mockResolvedValue({});

        const result = await checkAndAwardBadges(USER_ID);

        expect(result).toContain("first_pet");
        expect(mockPrisma.userBadge.create).toHaveBeenCalled();
    });

    it("does not re-award already earned badges", async () => {
        mockPrisma.userBadge.findMany.mockResolvedValue([
            { badge: { key: "first_pet" } },
        ]);
        mockPrisma.pet.count.mockResolvedValue(2);
        mockPrisma.petPhoto.count.mockResolvedValue(0);
        mockPrisma.feeding.count.mockResolvedValue(0);
        mockPrisma.weightRecord.count.mockResolvedValue(0);
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);
        mockPrisma.vetVisit.count.mockResolvedValue(0);
        mockPrisma.badge.findUnique.mockResolvedValue(null);

        const result = await checkAndAwardBadges(USER_ID);

        // first_pet already earned, should not be in new badges
        expect(result).not.toContain("first_pet");
    });

    it("awards multiple badges in one check", async () => {
        mockPrisma.userBadge.findMany.mockResolvedValue([]);
        mockPrisma.pet.count.mockResolvedValue(1);
        mockPrisma.petPhoto.count.mockResolvedValue(1);
        mockPrisma.feeding.count.mockResolvedValue(0);
        mockPrisma.weightRecord.count.mockResolvedValue(0);
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);
        mockPrisma.vetVisit.count.mockResolvedValue(0);
        mockPrisma.badge.findUnique.mockResolvedValue({ id: "badge_generic", key: "generic" });
        mockPrisma.userBadge.create.mockResolvedValue({});

        const result = await checkAndAwardBadges(USER_ID);

        expect(result).toContain("first_pet");
        expect(result).toContain("first_photo");
    });

    it("awards public_keeper when user has active profile", async () => {
        mockPrisma.userBadge.findMany.mockResolvedValue([]);
        mockPrisma.pet.count.mockResolvedValue(0);
        mockPrisma.petPhoto.count.mockResolvedValue(0);
        mockPrisma.feeding.count.mockResolvedValue(0);
        mockPrisma.weightRecord.count.mockResolvedValue(0);
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({ active: true });
        mockPrisma.vetVisit.count.mockResolvedValue(0);
        mockPrisma.badge.findUnique.mockResolvedValue({ id: "badge_pk", key: "public_keeper" });
        mockPrisma.userBadge.create.mockResolvedValue({});

        const result = await checkAndAwardBadges(USER_ID);
        expect(result).toContain("public_keeper");
    });

    it("returns empty array when no new badges earned", async () => {
        mockPrisma.userBadge.findMany.mockResolvedValue([]);
        mockPrisma.pet.count.mockResolvedValue(0);
        mockPrisma.petPhoto.count.mockResolvedValue(0);
        mockPrisma.feeding.count.mockResolvedValue(0);
        mockPrisma.weightRecord.count.mockResolvedValue(0);
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);
        mockPrisma.vetVisit.count.mockResolvedValue(0);

        const result = await checkAndAwardBadges(USER_ID);
        expect(result).toEqual([]);
    });
});

// ─── getUserBadges ───────────────────────────────────────────

describe("getUserBadges", () => {
    it("returns list of badges with badge details", async () => {
        mockPrisma.userBadge.findMany.mockResolvedValue([
            {
                id: "ub_1",
                userId: USER_ID,
                badgeId: "b_1",
                earnedAt: new Date(),
                badge: { key: "first_pet", nameKey: "badges.first_pet", icon: "i-heroicons-heart" },
            },
        ]);

        const result = await getUserBadges(USER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].badge.key).toBe("first_pet");
    });
});

// ─── getAllBadgeDefinitions ──────────────────────────────────

describe("getAllBadgeDefinitions", () => {
    it("syncs definitions and returns them", async () => {
        mockPrisma.badge.findMany.mockResolvedValue([
            { key: "first_pet", nameKey: "badges.first_pet" },
        ]);

        const result = await getAllBadgeDefinitions();
        expect(mockPrisma.badge.upsert).toHaveBeenCalled();
        expect(result).toHaveLength(1);
    });
});
