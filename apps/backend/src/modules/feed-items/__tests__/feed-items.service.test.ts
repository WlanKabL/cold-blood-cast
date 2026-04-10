import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    feedItem: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    pet: {
        count: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));
vi.mock("@/config/env.js", () => ({ env: () => ({}) }));

const { listFeedItems, getFeedItem, createFeedItem, updateFeedItem, deleteFeedItem } = await import(
    "../feed-items.service.js"
);

const USER_ID = "user_123";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("listFeedItems", () => {
    it("returns all feed items for user", async () => {
        const items = [
            { id: "fi_1", name: "Mouse", userId: USER_ID, suitablePets: [], _count: { feedings: 3 } },
        ];
        mockPrisma.feedItem.findMany.mockResolvedValue(items);

        const result = await listFeedItems(USER_ID);

        expect(result).toEqual(items);
        expect(mockPrisma.feedItem.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: USER_ID } }),
        );
    });
});

describe("getFeedItem", () => {
    it("returns feed item when owned by user", async () => {
        const item = { id: "fi_1", name: "Mouse", userId: USER_ID };
        mockPrisma.feedItem.findUnique.mockResolvedValue(item);

        const result = await getFeedItem("fi_1", USER_ID);
        expect(result).toEqual(item);
    });

    it("throws when feed item not found", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue(null);
        await expect(getFeedItem("fi_x", USER_ID)).rejects.toThrow("Feed item not found");
    });

    it("throws when feed item owned by different user", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue({ id: "fi_1", userId: "other_user" });
        await expect(getFeedItem("fi_1", USER_ID)).rejects.toThrow("Feed item not found");
    });
});

describe("createFeedItem", () => {
    it("creates feed item without pets", async () => {
        const created = { id: "fi_1", name: "Fuzzy Mouse", userId: USER_ID };
        mockPrisma.feedItem.create.mockResolvedValue(created);

        const result = await createFeedItem(USER_ID, { name: "Fuzzy Mouse" });

        expect(result).toEqual(created);
        expect(mockPrisma.feedItem.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ name: "Fuzzy Mouse", userId: USER_ID }),
            }),
        );
    });

    it("creates feed item with suitable pets", async () => {
        mockPrisma.pet.count.mockResolvedValue(2);
        mockPrisma.feedItem.create.mockResolvedValue({ id: "fi_1" });

        await createFeedItem(USER_ID, {
            name: "Rat",
            suitablePetIds: ["pet_1", "pet_2"],
        });

        expect(mockPrisma.pet.count).toHaveBeenCalledWith({
            where: { id: { in: ["pet_1", "pet_2"] }, userId: USER_ID },
        });
        expect(mockPrisma.feedItem.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    suitablePets: { connect: [{ id: "pet_1" }, { id: "pet_2" }] },
                }),
            }),
        );
    });

    it("throws when pet not owned by user", async () => {
        mockPrisma.pet.count.mockResolvedValue(0);

        await expect(
            createFeedItem(USER_ID, { name: "Rat", suitablePetIds: ["pet_x"] }),
        ).rejects.toThrow("One or more pets not found");
    });
});

describe("updateFeedItem", () => {
    it("updates feed item fields", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue({ id: "fi_1", userId: USER_ID });
        mockPrisma.feedItem.update.mockResolvedValue({ id: "fi_1", name: "Large Rat" });

        const result = await updateFeedItem("fi_1", USER_ID, { name: "Large Rat" });
        expect(result.name).toBe("Large Rat");
    });

    it("updates suitable pets with set operation", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue({ id: "fi_1", userId: USER_ID });
        mockPrisma.pet.count.mockResolvedValue(1);
        mockPrisma.feedItem.update.mockResolvedValue({ id: "fi_1" });

        await updateFeedItem("fi_1", USER_ID, { suitablePetIds: ["pet_1"] });

        expect(mockPrisma.feedItem.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    suitablePets: { set: [{ id: "pet_1" }] },
                }),
            }),
        );
    });

    it("throws when feed item not found", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue(null);
        await expect(updateFeedItem("fi_x", USER_ID, { name: "X" })).rejects.toThrow("Feed item not found");
    });

    it("throws when feed item owned by different user", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue({ id: "fi_1", userId: "other" });
        await expect(updateFeedItem("fi_1", USER_ID, { name: "X" })).rejects.toThrow("Feed item not found");
    });
});

describe("deleteFeedItem", () => {
    it("deletes feed item owned by user", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue({ id: "fi_1", userId: USER_ID });
        mockPrisma.feedItem.delete.mockResolvedValue({});

        await deleteFeedItem("fi_1", USER_ID);
        expect(mockPrisma.feedItem.delete).toHaveBeenCalledWith({ where: { id: "fi_1" } });
    });

    it("throws when feed item not found", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue(null);
        await expect(deleteFeedItem("fi_x", USER_ID)).rejects.toThrow("Feed item not found");
    });

    it("throws when feed item owned by different user", async () => {
        mockPrisma.feedItem.findUnique.mockResolvedValue({ id: "fi_1", userId: "other" });
        await expect(deleteFeedItem("fi_1", USER_ID)).rejects.toThrow("Feed item not found");
    });
});
