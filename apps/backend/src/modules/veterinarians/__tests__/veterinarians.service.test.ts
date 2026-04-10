import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    veterinarian: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const {
    listVeterinarians,
    getVeterinarian,
    createVeterinarian,
    updateVeterinarian,
    deleteVeterinarian,
} = await import("../veterinarians.service.js");

const USER_ID = "user_123";
const VET_ID = "vet_456";

function makeVet(overrides = {}) {
    return {
        id: VET_ID,
        userId: USER_ID,
        name: "Dr. Schmidt",
        clinicName: "Reptile Clinic Berlin",
        address: "Musterstr. 1, Berlin",
        phone: "+49 30 12345",
        email: "schmidt@reptile-clinic.de",
        notes: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        _count: { vetVisits: 3 },
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listVeterinarians ─────────────────────────────────

describe("listVeterinarians", () => {
    it("returns all veterinarians for user ordered by name", async () => {
        const vets = [makeVet(), makeVet({ id: "vet_789", name: "Dr. Weber" })];
        mockPrisma.veterinarian.findMany.mockResolvedValue(vets);

        const result = await listVeterinarians(USER_ID);

        expect(mockPrisma.veterinarian.findMany).toHaveBeenCalledWith({
            where: { userId: USER_ID },
            include: { _count: { select: { vetVisits: true } } },
            orderBy: { name: "asc" },
        });
        expect(result).toEqual(vets);
    });

    it("returns empty array when user has no vets", async () => {
        mockPrisma.veterinarian.findMany.mockResolvedValue([]);

        const result = await listVeterinarians(USER_ID);

        expect(result).toEqual([]);
    });
});

// ─── getVeterinarian ───────────────────────────────────

describe("getVeterinarian", () => {
    it("returns a vet with visit count for the owner", async () => {
        const vet = makeVet();
        mockPrisma.veterinarian.findUnique.mockResolvedValue(vet);

        const result = await getVeterinarian(VET_ID, USER_ID);

        expect(mockPrisma.veterinarian.findUnique).toHaveBeenCalledWith({
            where: { id: VET_ID },
            include: { _count: { select: { vetVisits: true } } },
        });
        expect(result).toEqual(vet);
    });

    it("throws notFound for non-existent vet", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(null);

        await expect(getVeterinarian(VET_ID, USER_ID)).rejects.toThrow("Veterinarian not found");
    });

    it("throws notFound for vet owned by another user", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(makeVet({ userId: "other_user" }));

        await expect(getVeterinarian(VET_ID, USER_ID)).rejects.toThrow("Veterinarian not found");
    });
});

// ─── createVeterinarian ────────────────────────────────

describe("createVeterinarian", () => {
    it("creates a vet with all fields", async () => {
        const data = {
            name: "Dr. Schmidt",
            clinicName: "Reptile Clinic Berlin",
            address: "Musterstr. 1",
            phone: "+49 30 12345",
            email: "schmidt@rc.de",
            notes: "Specializes in corn snakes",
        };
        const created = makeVet(data);
        mockPrisma.veterinarian.create.mockResolvedValue(created);

        const result = await createVeterinarian(USER_ID, data);

        expect(mockPrisma.veterinarian.create).toHaveBeenCalledWith({
            data: {
                userId: USER_ID,
                name: "Dr. Schmidt",
                clinicName: "Reptile Clinic Berlin",
                address: "Musterstr. 1",
                phone: "+49 30 12345",
                email: "schmidt@rc.de",
                notes: "Specializes in corn snakes",
            },
        });
        expect(result).toEqual(created);
    });

    it("creates a vet with only name (optional fields null)", async () => {
        const data = { name: "Dr. Müller" };
        mockPrisma.veterinarian.create.mockResolvedValue(makeVet({ name: "Dr. Müller" }));

        await createVeterinarian(USER_ID, data);

        expect(mockPrisma.veterinarian.create).toHaveBeenCalledWith({
            data: {
                userId: USER_ID,
                name: "Dr. Müller",
                clinicName: null,
                address: null,
                phone: null,
                email: null,
                notes: null,
            },
        });
    });
});

// ─── updateVeterinarian ────────────────────────────────

describe("updateVeterinarian", () => {
    it("updates specified fields for owned vet", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(makeVet());
        const updated = makeVet({ name: "Dr. Schmidt-Weber", phone: "+49 30 99999" });
        mockPrisma.veterinarian.update.mockResolvedValue(updated);

        const result = await updateVeterinarian(VET_ID, USER_ID, {
            name: "Dr. Schmidt-Weber",
            phone: "+49 30 99999",
        });

        expect(mockPrisma.veterinarian.update).toHaveBeenCalledWith({
            where: { id: VET_ID },
            data: {
                name: "Dr. Schmidt-Weber",
                phone: "+49 30 99999",
            },
        });
        expect(result).toEqual(updated);
    });

    it("only includes provided fields in the update", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(makeVet());
        mockPrisma.veterinarian.update.mockResolvedValue(makeVet());

        await updateVeterinarian(VET_ID, USER_ID, { notes: "Updated notes" });

        expect(mockPrisma.veterinarian.update).toHaveBeenCalledWith({
            where: { id: VET_ID },
            data: { notes: "Updated notes" },
        });
    });

    it("throws notFound for non-existent vet", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(null);

        await expect(
            updateVeterinarian(VET_ID, USER_ID, { name: "X" }),
        ).rejects.toThrow("Veterinarian not found");
    });

    it("throws notFound for vet owned by another user", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(makeVet({ userId: "other_user" }));

        await expect(
            updateVeterinarian(VET_ID, USER_ID, { name: "X" }),
        ).rejects.toThrow("Veterinarian not found");
    });
});

// ─── deleteVeterinarian ────────────────────────────────

describe("deleteVeterinarian", () => {
    it("deletes an owned vet", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(makeVet());
        mockPrisma.veterinarian.delete.mockResolvedValue(makeVet());

        await deleteVeterinarian(VET_ID, USER_ID);

        expect(mockPrisma.veterinarian.delete).toHaveBeenCalledWith({
            where: { id: VET_ID },
        });
    });

    it("throws notFound for non-existent vet", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(null);

        await expect(deleteVeterinarian(VET_ID, USER_ID)).rejects.toThrow("Veterinarian not found");
    });

    it("throws notFound for vet owned by another user", async () => {
        mockPrisma.veterinarian.findUnique.mockResolvedValue(makeVet({ userId: "other_user" }));

        await expect(deleteVeterinarian(VET_ID, USER_ID)).rejects.toThrow("Veterinarian not found");
    });
});
