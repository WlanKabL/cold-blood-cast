import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    enclosure: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/modules/admin/feature-flags.service.js", () => ({
    resolveUserLimits: vi.fn().mockResolvedValue({ max_enclosures: -1 }),
}));

vi.mock("@/helpers/errors.js", async () => {
    const actual = await vi.importActual("@/helpers/errors.js");
    return actual;
});

// ─── Import SUT ──────────────────────────────────────────────

const { listEnclosures, getEnclosure, createEnclosure, updateEnclosure, deleteEnclosure } =
    await import("../enclosures.service.js");

const { resolveUserLimits } = await import("@/modules/admin/feature-flags.service.js");

// ─── Helpers ─────────────────────────────────────────────────

const USER_ID = "user_123";
const OTHER_USER_ID = "user_other";
const ENC_ID = "enc_456";

function makeEnclosure(overrides = {}) {
    return {
        id: ENC_ID,
        userId: USER_ID,
        name: "Main Terrarium",
        type: "TERRARIUM",
        species: "Corn Snake",
        description: "My primary terrarium",
        imageUrl: null,
        lengthCm: 120,
        widthCm: 60,
        heightCm: 80,
        room: "Living Room",
        active: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listEnclosures ──────────────────────────────────────────

describe("listEnclosures", () => {
    it("returns all enclosures for user", async () => {
        const enclosures = [makeEnclosure(), makeEnclosure({ id: "enc_789", name: "Rack" })];
        mockPrisma.enclosure.findMany.mockResolvedValue(enclosures);

        const result = await listEnclosures(USER_ID);

        expect(result).toHaveLength(2);
        expect(mockPrisma.enclosure.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: USER_ID },
                orderBy: { createdAt: "desc" },
            }),
        );
    });

    it("filters by active status", async () => {
        mockPrisma.enclosure.findMany.mockResolvedValue([]);

        await listEnclosures(USER_ID, { active: true });

        expect(mockPrisma.enclosure.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: USER_ID, active: true },
            }),
        );
    });

    it("filters by search term across name, species, room, description", async () => {
        mockPrisma.enclosure.findMany.mockResolvedValue([]);

        await listEnclosures(USER_ID, { search: "corn" });

        const call = mockPrisma.enclosure.findMany.mock.calls[0][0];
        expect(call.where.OR).toEqual([
            { name: { contains: "corn", mode: "insensitive" } },
            { species: { contains: "corn", mode: "insensitive" } },
            { room: { contains: "corn", mode: "insensitive" } },
            { description: { contains: "corn", mode: "insensitive" } },
        ]);
    });

    it("combines search and active filters", async () => {
        mockPrisma.enclosure.findMany.mockResolvedValue([]);

        await listEnclosures(USER_ID, { search: "rack", active: false });

        const call = mockPrisma.enclosure.findMany.mock.calls[0][0];
        expect(call.where.userId).toBe(USER_ID);
        expect(call.where.active).toBe(false);
        expect(call.where.OR).toBeDefined();
    });

    it("includes pet and sensor counts", async () => {
        mockPrisma.enclosure.findMany.mockResolvedValue([]);

        await listEnclosures(USER_ID);

        expect(mockPrisma.enclosure.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                include: { _count: { select: { pets: true, sensors: true } } },
            }),
        );
    });
});

// ─── getEnclosure ────────────────────────────────────────────

describe("getEnclosure", () => {
    it("returns enclosure with pets and sensors", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(makeEnclosure());

        const result = await getEnclosure(ENC_ID, USER_ID);

        expect(result.id).toBe(ENC_ID);
        expect(mockPrisma.enclosure.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: ENC_ID },
                include: expect.objectContaining({
                    pets: expect.any(Object),
                    sensors: expect.any(Object),
                }),
            }),
        );
    });

    it("throws not found when enclosure does not exist", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(null);

        await expect(getEnclosure("nonexistent", USER_ID)).rejects.toThrow("Enclosure not found");
    });

    it("throws not found when enclosure belongs to another user", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(makeEnclosure({ userId: OTHER_USER_ID }));

        await expect(getEnclosure(ENC_ID, USER_ID)).rejects.toThrow("Enclosure not found");
    });
});

// ─── createEnclosure ─────────────────────────────────────────

describe("createEnclosure", () => {
    it("creates enclosure with all fields", async () => {
        const data = {
            name: "New Terrarium",
            type: "TERRARIUM" as const,
            species: "Ball Python",
            description: "Brand new setup",
            lengthCm: 100,
            widthCm: 50,
            heightCm: 60,
            room: "Bedroom",
        };
        mockPrisma.enclosure.create.mockResolvedValue(makeEnclosure(data));

        const result = await createEnclosure(USER_ID, data);

        expect(result.name).toBe("New Terrarium");
        expect(mockPrisma.enclosure.create).toHaveBeenCalledWith({
            data: { ...data, userId: USER_ID },
            include: { _count: { select: { pets: true, sensors: true } } },
        });
    });

    it("creates enclosure with minimal fields", async () => {
        const data = { name: "Simple Rack" };
        mockPrisma.enclosure.create.mockResolvedValue(makeEnclosure(data));

        await createEnclosure(USER_ID, data);

        expect(mockPrisma.enclosure.create).toHaveBeenCalledWith({
            data: { name: "Simple Rack", userId: USER_ID },
            include: { _count: { select: { pets: true, sensors: true } } },
        });
    });

    it("enforces enclosure limit", async () => {
        vi.mocked(resolveUserLimits).mockResolvedValue({
            max_enclosures: 2,
        } as Awaited<ReturnType<typeof resolveUserLimits>>);
        mockPrisma.enclosure.count.mockResolvedValue(2);

        await expect(createEnclosure(USER_ID, { name: "Third" })).rejects.toThrow(
            "Enclosure limit reached",
        );
    });

    it("allows creation when under limit", async () => {
        vi.mocked(resolveUserLimits).mockResolvedValue({
            max_enclosures: 5,
        } as Awaited<ReturnType<typeof resolveUserLimits>>);
        mockPrisma.enclosure.count.mockResolvedValue(2);
        mockPrisma.enclosure.create.mockResolvedValue(makeEnclosure());

        await expect(createEnclosure(USER_ID, { name: "Another" })).resolves.toBeDefined();
    });

    it("skips limit check when unlimited (-1)", async () => {
        vi.mocked(resolveUserLimits).mockResolvedValue({
            max_enclosures: -1,
        } as Awaited<ReturnType<typeof resolveUserLimits>>);
        mockPrisma.enclosure.create.mockResolvedValue(makeEnclosure());

        await createEnclosure(USER_ID, { name: "Unlimited" });

        expect(mockPrisma.enclosure.count).not.toHaveBeenCalled();
    });
});

// ─── updateEnclosure ─────────────────────────────────────────

describe("updateEnclosure", () => {
    it("updates enclosure fields", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(makeEnclosure());
        mockPrisma.enclosure.update.mockResolvedValue(
            makeEnclosure({ name: "Updated", room: "Office" }),
        );

        const result = await updateEnclosure(ENC_ID, USER_ID, {
            name: "Updated",
            room: "Office",
        });

        expect(result.name).toBe("Updated");
        expect(mockPrisma.enclosure.update).toHaveBeenCalledWith({
            where: { id: ENC_ID },
            data: { name: "Updated", room: "Office" },
            include: { _count: { select: { pets: true, sensors: true } } },
        });
    });

    it("allows toggling active status", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(makeEnclosure());
        mockPrisma.enclosure.update.mockResolvedValue(makeEnclosure({ active: false }));

        const result = await updateEnclosure(ENC_ID, USER_ID, { active: false });

        expect(result.active).toBe(false);
    });

    it("throws not found when enclosure does not exist", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(null);

        await expect(updateEnclosure("nonexistent", USER_ID, { name: "X" })).rejects.toThrow(
            "Enclosure not found",
        );
    });

    it("throws not found when enclosure belongs to another user", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(makeEnclosure({ userId: OTHER_USER_ID }));

        await expect(updateEnclosure(ENC_ID, USER_ID, { name: "X" })).rejects.toThrow(
            "Enclosure not found",
        );
    });
});

// ─── deleteEnclosure ─────────────────────────────────────────

describe("deleteEnclosure", () => {
    it("deletes owned enclosure", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(makeEnclosure());
        mockPrisma.enclosure.delete.mockResolvedValue(makeEnclosure());

        await deleteEnclosure(ENC_ID, USER_ID);

        expect(mockPrisma.enclosure.delete).toHaveBeenCalledWith({ where: { id: ENC_ID } });
    });

    it("throws not found when enclosure does not exist", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(null);

        await expect(deleteEnclosure("nonexistent", USER_ID)).rejects.toThrow(
            "Enclosure not found",
        );
    });

    it("throws not found when enclosure belongs to another user", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(makeEnclosure({ userId: OTHER_USER_ID }));

        await expect(deleteEnclosure(ENC_ID, USER_ID)).rejects.toThrow("Enclosure not found");
    });
});
