import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/helpers/errors.js";

const mockPrisma = {
    husbandryNote: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    pet: {
        findUnique: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

const {
    listHusbandryNotes,
    getHusbandryNote,
    createHusbandryNote,
    updateHusbandryNote,
    deleteHusbandryNote,
} = await import("../husbandry-notes.service.js");

beforeEach(() => {
    vi.clearAllMocks();
});

describe("listHusbandryNotes", () => {
    it("returns notes for the user with default options", async () => {
        const notes = [{ id: "n1", petId: "p1", type: "observation", title: "Active at night" }];
        mockPrisma.husbandryNote.findMany.mockResolvedValue(notes);

        const result = await listHusbandryNotes("user1", { limit: 50 });

        expect(result).toEqual(notes);
        expect(mockPrisma.husbandryNote.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { pet: { userId: "user1" } },
                orderBy: { occurredAt: "desc" },
                take: 50,
            }),
        );
    });

    it("filters by petId when provided", async () => {
        mockPrisma.husbandryNote.findMany.mockResolvedValue([]);

        await listHusbandryNotes("user1", { petId: "p1", limit: 10 });

        expect(mockPrisma.husbandryNote.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    pet: { userId: "user1" },
                    petId: "p1",
                }),
            }),
        );
    });

    it("filters by date range when from/to provided", async () => {
        const from = new Date("2025-01-01");
        const to = new Date("2025-06-01");
        mockPrisma.husbandryNote.findMany.mockResolvedValue([]);

        await listHusbandryNotes("user1", { from, to, limit: 50 });

        expect(mockPrisma.husbandryNote.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    occurredAt: { gte: from, lte: to },
                }),
            }),
        );
    });
});

describe("getHusbandryNote", () => {
    it("returns the note when found and owned by user", async () => {
        const note = {
            id: "n1",
            petId: "p1",
            type: "observation",
            title: "Test",
            pet: { id: "p1", name: "Slinky", userId: "user1" },
        };
        mockPrisma.husbandryNote.findUnique.mockResolvedValue(note);

        const result = await getHusbandryNote("n1", "user1");

        expect(result).toEqual(note);
    });

    it("throws not found when note does not exist", async () => {
        mockPrisma.husbandryNote.findUnique.mockResolvedValue(null);

        await expect(getHusbandryNote("n1", "user1")).rejects.toThrow(AppError);
        await expect(getHusbandryNote("n1", "user1")).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it("throws not found when note belongs to another user", async () => {
        mockPrisma.husbandryNote.findUnique.mockResolvedValue({
            id: "n1",
            pet: { id: "p1", name: "Slinky", userId: "other-user" },
        });

        await expect(getHusbandryNote("n1", "user1")).rejects.toThrow(AppError);
    });
});

describe("createHusbandryNote", () => {
    it("creates a note when pet is owned by the user", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: "p1", userId: "user1" });
        const created = { id: "n1", petId: "p1", type: "observation", title: "Active" };
        mockPrisma.husbandryNote.create.mockResolvedValue(created);

        const result = await createHusbandryNote("user1", {
            petId: "p1",
            type: "observation",
            title: "Active",
            occurredAt: new Date("2025-04-15"),
        });

        expect(result).toEqual(created);
        expect(mockPrisma.husbandryNote.create).toHaveBeenCalledWith({
            data: {
                petId: "p1",
                type: "observation",
                title: "Active",
                occurredAt: new Date("2025-04-15"),
            },
        });
    });

    it("creates a note with optional content", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: "p1", userId: "user1" });
        mockPrisma.husbandryNote.create.mockResolvedValue({ id: "n1" });

        await createHusbandryNote("user1", {
            petId: "p1",
            type: "observation",
            title: "Detailed note",
            content: "Some details about the observation",
            occurredAt: new Date("2025-04-15"),
        });

        expect(mockPrisma.husbandryNote.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                content: "Some details about the observation",
            }),
        });
    });

    it("throws not found when pet does not exist", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);

        await expect(
            createHusbandryNote("user1", {
                petId: "p1",
                type: "observation",
                title: "Active",
                occurredAt: new Date(),
            }),
        ).rejects.toThrow(AppError);
    });

    it("throws not found when pet belongs to another user", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ id: "p1", userId: "other-user" });

        await expect(
            createHusbandryNote("user1", {
                petId: "p1",
                type: "observation",
                title: "Active",
                occurredAt: new Date(),
            }),
        ).rejects.toThrow(AppError);
    });
});

describe("updateHusbandryNote", () => {
    it("updates a note when owned by user", async () => {
        mockPrisma.husbandryNote.findUnique.mockResolvedValue({
            id: "n1",
            pet: { userId: "user1" },
        });
        const updated = { id: "n1", title: "Updated" };
        mockPrisma.husbandryNote.update.mockResolvedValue(updated);

        const result = await updateHusbandryNote("n1", "user1", { title: "Updated" });

        expect(result).toEqual(updated);
        expect(mockPrisma.husbandryNote.update).toHaveBeenCalledWith({
            where: { id: "n1" },
            data: { title: "Updated" },
        });
    });

    it("throws not found when note does not exist", async () => {
        mockPrisma.husbandryNote.findUnique.mockResolvedValue(null);

        await expect(updateHusbandryNote("n1", "user1", { title: "X" })).rejects.toThrow(AppError);
    });

    it("throws not found when note belongs to another user", async () => {
        mockPrisma.husbandryNote.findUnique.mockResolvedValue({
            id: "n1",
            pet: { userId: "other-user" },
        });

        await expect(updateHusbandryNote("n1", "user1", { title: "X" })).rejects.toThrow(AppError);
    });
});

describe("deleteHusbandryNote", () => {
    it("deletes a note when owned by user", async () => {
        mockPrisma.husbandryNote.findUnique.mockResolvedValue({
            id: "n1",
            pet: { userId: "user1" },
        });
        mockPrisma.husbandryNote.delete.mockResolvedValue({});

        await deleteHusbandryNote("n1", "user1");

        expect(mockPrisma.husbandryNote.delete).toHaveBeenCalledWith({
            where: { id: "n1" },
        });
    });

    it("throws not found when note does not exist", async () => {
        mockPrisma.husbandryNote.findUnique.mockResolvedValue(null);

        await expect(deleteHusbandryNote("n1", "user1")).rejects.toThrow(AppError);
    });

    it("throws not found when note belongs to another user", async () => {
        mockPrisma.husbandryNote.findUnique.mockResolvedValue({
            id: "n1",
            pet: { userId: "other-user" },
        });

        await expect(deleteHusbandryNote("n1", "user1")).rejects.toThrow(AppError);
    });
});
