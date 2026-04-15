import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    tag: {
        findMany: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const { listPets, getPet, updatePetTags } = await import("../pets.service.js");

const USER_ID = "user_123";
const PET_ID = "pet_1";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("listPets", () => {
    it("returns pets for the given userId", async () => {
        const mockPets = [{ id: PET_ID, name: "Noodle", species: "Corn Snake", tags: [] }];
        mockPrisma.pet.findMany.mockResolvedValue(mockPets);

        const result = await listPets(USER_ID);

        expect(result).toEqual(mockPets);
        expect(mockPrisma.pet.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: USER_ID } }),
        );
    });
});

describe("getPet", () => {
    it("returns pet when it belongs to user", async () => {
        const mockPet = { id: PET_ID, userId: USER_ID, name: "Noodle" };
        mockPrisma.pet.findUnique.mockResolvedValue(mockPet);

        const result = await getPet(PET_ID, USER_ID);

        expect(result).toEqual(mockPet);
    });

    it("throws not found when pet does not exist", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);

        await expect(getPet("nonexistent", USER_ID)).rejects.toThrow(/not found/i);
    });

    it("throws forbidden when pet belongs to another user", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: PET_ID, userId: "other_user" });

        await expect(getPet(PET_ID, USER_ID)).rejects.toThrow();
    });
});

describe("updatePetTags", () => {
    it("sets tags on the pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: PET_ID, userId: USER_ID });
        mockPrisma.tag.findMany.mockResolvedValue([
            { id: "tag_1", name: "Aggressive" },
            { id: "tag_2", name: "Healthy" },
        ]);
        mockPrisma.pet.update.mockResolvedValue({
            id: PET_ID,
            tags: [
                { id: "tag_1", name: "Aggressive", color: "#ff0000", category: "care" },
                { id: "tag_2", name: "Healthy", color: "#00ff00", category: "monitoring" },
            ],
        });

        const result = await updatePetTags(PET_ID, USER_ID, ["tag_1", "tag_2"]);

        expect(result.tags).toHaveLength(2);
        expect(mockPrisma.pet.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: PET_ID },
                data: {
                    tags: { set: [{ id: "tag_1" }, { id: "tag_2" }] },
                },
            }),
        );
    });

    it("clears all tags when empty array is provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: PET_ID, userId: USER_ID });
        mockPrisma.pet.update.mockResolvedValue({ id: PET_ID, tags: [] });

        const result = await updatePetTags(PET_ID, USER_ID, []);

        expect(result.tags).toEqual([]);
        expect(mockPrisma.pet.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { tags: { set: [] } },
            }),
        );
    });

    it("throws not found when pet does not exist", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);

        await expect(updatePetTags("nonexistent", USER_ID, ["tag_1"])).rejects.toThrow(
            /not found/i,
        );
    });

    it("throws not found when pet belongs to another user", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: PET_ID, userId: "other_user" });

        await expect(updatePetTags(PET_ID, USER_ID, ["tag_1"])).rejects.toThrow(/not found/i);
    });

    it("throws when a tag does not belong to user or is not global", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: PET_ID, userId: USER_ID });
        mockPrisma.tag.findMany.mockResolvedValue([{ id: "tag_1" }]); // Only 1 found but 2 requested

        await expect(updatePetTags(PET_ID, USER_ID, ["tag_1", "tag_unknown"])).rejects.toThrow(
            /not found/i,
        );
    });
});
