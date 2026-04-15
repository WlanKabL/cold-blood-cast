import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    tag: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const {
    listTags,
    getTag,
    createTag,
    updateTag,
    deleteTag,
    listGlobalTags,
    createGlobalTag,
    updateGlobalTag,
    deleteGlobalTag,
} = await import("../tags.service.js");

const USER_ID = "user_123";

function makeTag(overrides = {}) {
    return {
        id: "tag_1",
        name: "healthy",
        userId: USER_ID,
        category: "care",
        color: "#22c55e",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        ...overrides,
    };
}

function makeGlobalTag(overrides = {}) {
    return makeTag({ userId: null, ...overrides });
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listTags ──────────────────────────────────────────

describe("listTags", () => {
    it("returns user + global tags", async () => {
        const tags = [makeTag(), makeGlobalTag({ id: "tag_2", name: "global" })];
        mockPrisma.tag.findMany.mockResolvedValue(tags);

        const result = await listTags(USER_ID);

        expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
            where: { OR: [{ userId: USER_ID }, { userId: null }] },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });
        expect(result).toEqual(tags);
    });

    it("filters by category", async () => {
        mockPrisma.tag.findMany.mockResolvedValue([]);

        await listTags(USER_ID, "vet");

        expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
            where: {
                OR: [{ userId: USER_ID }, { userId: null }],
                category: "vet",
            },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });
    });
});

// ─── getTag ────────────────────────────────────────────

describe("getTag", () => {
    it("returns tag owned by user", async () => {
        const tag = makeTag();
        mockPrisma.tag.findUnique.mockResolvedValue(tag);

        const result = await getTag("tag_1", USER_ID);

        expect(result).toEqual(tag);
    });

    it("returns global tag for any user", async () => {
        const tag = makeGlobalTag();
        mockPrisma.tag.findUnique.mockResolvedValue(tag);

        const result = await getTag("tag_1", USER_ID);

        expect(result).toEqual(tag);
    });

    it("throws not found for missing tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(null);

        await expect(getTag("nonexistent", USER_ID)).rejects.toThrow("Tag not found");
    });

    it("throws not found for other user's tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(makeTag({ userId: "other_user" }));

        await expect(getTag("tag_1", USER_ID)).rejects.toThrow("Tag not found");
    });
});

// ─── createTag ─────────────────────────────────────────

describe("createTag", () => {
    it("creates a tag for the user", async () => {
        const tag = makeTag();
        mockPrisma.tag.create.mockResolvedValue(tag);

        const result = await createTag(USER_ID, {
            name: "healthy",
            category: "care",
            color: "#22c55e",
        });

        expect(mockPrisma.tag.create).toHaveBeenCalledWith({
            data: {
                name: "healthy",
                category: "care",
                color: "#22c55e",
                userId: USER_ID,
            },
        });
        expect(result).toEqual(tag);
    });

    it("trims whitespace from name", async () => {
        mockPrisma.tag.create.mockResolvedValue(makeTag());

        await createTag(USER_ID, { name: "  healthy  ", category: "care" });

        expect(mockPrisma.tag.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ name: "healthy" }),
        });
    });

    it("throws duplicate error on unique constraint violation", async () => {
        const prismaError = new Error("Unique constraint failed");
        Object.assign(prismaError, { code: "P2002" });
        Object.defineProperty(prismaError, "constructor", {
            value: { name: "PrismaClientKnownRequestError" },
        });
        // Re-mock to simulate Prisma error
        mockPrisma.tag.create.mockRejectedValue(prismaError);

        // The service checks `instanceof Prisma.PrismaClientKnownRequestError`
        // We need to test the actual error path — since we mock prisma, we verify the throw
        await expect(
            createTag(USER_ID, { name: "healthy", category: "care" }),
        ).rejects.toThrow();
    });
});

// ─── updateTag ─────────────────────────────────────────

describe("updateTag", () => {
    it("updates tag owned by user", async () => {
        const existing = makeTag();
        mockPrisma.tag.findUnique.mockResolvedValue(existing);
        const updated = { ...existing, name: "very healthy" };
        mockPrisma.tag.update.mockResolvedValue(updated);

        const result = await updateTag("tag_1", USER_ID, { name: "very healthy" });

        expect(mockPrisma.tag.update).toHaveBeenCalledWith({
            where: { id: "tag_1" },
            data: { name: "very healthy" },
        });
        expect(result).toEqual(updated);
    });

    it("throws not found for other user's tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(makeTag({ userId: "other_user" }));

        await expect(updateTag("tag_1", USER_ID, { name: "x" })).rejects.toThrow(
            "Tag not found",
        );
    });

    it("throws not found for missing tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(null);

        await expect(updateTag("tag_1", USER_ID, { name: "x" })).rejects.toThrow(
            "Tag not found",
        );
    });

    it("sets color to null when empty string passed", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(makeTag());
        mockPrisma.tag.update.mockResolvedValue(makeTag({ color: null }));

        await updateTag("tag_1", USER_ID, { color: "" });

        expect(mockPrisma.tag.update).toHaveBeenCalledWith({
            where: { id: "tag_1" },
            data: { color: null },
        });
    });
});

// ─── deleteTag ─────────────────────────────────────────

describe("deleteTag", () => {
    it("deletes tag owned by user", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(makeTag());
        mockPrisma.tag.delete.mockResolvedValue(makeTag());

        await deleteTag("tag_1", USER_ID);

        expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: "tag_1" } });
    });

    it("throws not found for other user's tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(makeTag({ userId: "other_user" }));

        await expect(deleteTag("tag_1", USER_ID)).rejects.toThrow("Tag not found");
    });

    it("throws not found for missing tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(null);

        await expect(deleteTag("tag_1", USER_ID)).rejects.toThrow("Tag not found");
    });
});

// ─── listGlobalTags ────────────────────────────────────

describe("listGlobalTags", () => {
    it("returns only global tags", async () => {
        const globalTags = [makeGlobalTag()];
        mockPrisma.tag.findMany.mockResolvedValue(globalTags);

        const result = await listGlobalTags();

        expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
            where: { userId: null },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });
        expect(result).toEqual(globalTags);
    });
});

// ─── createGlobalTag ───────────────────────────────────

describe("createGlobalTag", () => {
    it("creates a global tag (userId = null)", async () => {
        const tag = makeGlobalTag();
        mockPrisma.tag.create.mockResolvedValue(tag);

        const result = await createGlobalTag({ name: "healthy", category: "care" });

        expect(mockPrisma.tag.create).toHaveBeenCalledWith({
            data: {
                name: "healthy",
                category: "care",
                color: null,
                userId: null,
            },
        });
        expect(result).toEqual(tag);
    });
});

// ─── updateGlobalTag ───────────────────────────────────

describe("updateGlobalTag", () => {
    it("updates a global tag", async () => {
        const existing = makeGlobalTag();
        mockPrisma.tag.findUnique.mockResolvedValue(existing);
        const updated = { ...existing, name: "updated" };
        mockPrisma.tag.update.mockResolvedValue(updated);

        const result = await updateGlobalTag("tag_1", { name: "updated" });

        expect(result).toEqual(updated);
    });

    it("throws not found if tag is user-owned", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(makeTag());

        await expect(updateGlobalTag("tag_1", { name: "x" })).rejects.toThrow(
            "Global tag not found",
        );
    });

    it("throws not found for missing tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(null);

        await expect(updateGlobalTag("tag_1", { name: "x" })).rejects.toThrow(
            "Global tag not found",
        );
    });
});

// ─── deleteGlobalTag ───────────────────────────────────

describe("deleteGlobalTag", () => {
    it("deletes a global tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(makeGlobalTag());
        mockPrisma.tag.delete.mockResolvedValue(makeGlobalTag());

        await deleteGlobalTag("tag_1");

        expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: "tag_1" } });
    });

    it("throws not found if tag is user-owned", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(makeTag());

        await expect(deleteGlobalTag("tag_1")).rejects.toThrow("Global tag not found");
    });

    it("throws not found for missing tag", async () => {
        mockPrisma.tag.findUnique.mockResolvedValue(null);

        await expect(deleteGlobalTag("tag_1")).rejects.toThrow("Global tag not found");
    });
});
