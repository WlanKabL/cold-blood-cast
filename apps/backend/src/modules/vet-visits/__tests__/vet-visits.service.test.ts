import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    veterinarian: {
        findUnique: vi.fn(),
    },
    vetVisit: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
    },
    weightRecord: {
        create: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const {
    listVetVisits,
    getVetVisit,
    createVetVisit,
    updateVetVisit,
    deleteVetVisit,
    getUpcomingAppointments,
    getVetCosts,
} = await import("../vet-visits.service.js");

const USER_ID = "user_123";
const PET_ID = "pet_456";
const VET_ID = "vet_789";
const VISIT_ID = "visit_abc";

const VISIT_INCLUDE = {
    pet: { select: { id: true, name: true, species: true } },
    veterinarian: { select: { id: true, name: true, clinicName: true } },
    documents: { include: { upload: { select: { url: true } } } },
};

function makeVisit(overrides = {}) {
    return {
        id: VISIT_ID,
        userId: USER_ID,
        petId: PET_ID,
        veterinarianId: VET_ID,
        visitDate: new Date("2024-06-15"),
        visitType: "CHECKUP",
        reason: "Annual checkup",
        diagnosis: "Healthy",
        treatment: null,
        costCents: 5000,
        weightGrams: 350,
        nextAppointment: new Date("2025-06-15"),
        notes: null,
        createdAt: new Date("2024-06-15"),
        updatedAt: new Date("2024-06-15"),
        pet: { id: PET_ID, name: "Monty", species: "corn_snake" },
        veterinarian: { id: VET_ID, name: "Dr. Schmidt", clinicName: "Reptile Clinic" },
        documents: [],
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listVetVisits ─────────────────────────────────────

describe("listVetVisits", () => {
    it("returns all visits for user ordered by date desc", async () => {
        const visits = [makeVisit(), makeVisit({ id: "visit_2" })];
        mockPrisma.vetVisit.findMany.mockResolvedValue(visits);

        const result = await listVetVisits(USER_ID);

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: { userId: USER_ID },
            include: VISIT_INCLUDE,
            orderBy: { visitDate: "desc" },
        });
        expect(result).toEqual(visits);
    });

    it("filters by petId", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);

        await listVetVisits(USER_ID, { petId: PET_ID });

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, petId: PET_ID },
            include: VISIT_INCLUDE,
            orderBy: { visitDate: "desc" },
        });
    });

    it("filters by veterinarianId", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);

        await listVetVisits(USER_ID, { veterinarianId: VET_ID });

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, veterinarianId: VET_ID },
            include: VISIT_INCLUDE,
            orderBy: { visitDate: "desc" },
        });
    });

    it("filters by visitType", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);

        await listVetVisits(USER_ID, { visitType: "EMERGENCY" });

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, visitType: "EMERGENCY" },
            include: VISIT_INCLUDE,
            orderBy: { visitDate: "desc" },
        });
    });

    it("filters by date range", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);

        await listVetVisits(USER_ID, { from: "2024-01-01", to: "2024-12-31" });

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: {
                userId: USER_ID,
                visitDate: {
                    gte: expect.any(Date),
                    lte: expect.any(Date),
                },
            },
            include: VISIT_INCLUDE,
            orderBy: { visitDate: "desc" },
        });
    });

    it("combines multiple filters", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);

        await listVetVisits(USER_ID, { petId: PET_ID, visitType: "VACCINATION" });

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, petId: PET_ID, visitType: "VACCINATION" },
            include: VISIT_INCLUDE,
            orderBy: { visitDate: "desc" },
        });
    });
});

// ─── getVetVisit ───────────────────────────────────────

describe("getVetVisit", () => {
    it("returns a visit with includes for the owner", async () => {
        const visit = makeVisit();
        mockPrisma.vetVisit.findUnique.mockResolvedValue(visit);

        const result = await getVetVisit(VISIT_ID, USER_ID);

        expect(mockPrisma.vetVisit.findUnique).toHaveBeenCalledWith({
            where: { id: VISIT_ID },
            include: VISIT_INCLUDE,
        });
        expect(result).toEqual(visit);
    });

    it("throws notFound for non-existent visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(null);

        await expect(getVetVisit(VISIT_ID, USER_ID)).rejects.toThrow("Vet visit not found");
    });

    it("throws notFound for visit owned by another user", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit({ userId: "other_user" }));

        await expect(getVetVisit(VISIT_ID, USER_ID)).rejects.toThrow("Vet visit not found");
    });
});

// ─── createVetVisit ────────────────────────────────────

describe("createVetVisit", () => {
    it("creates a visit with all fields", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.veterinarian.findUnique.mockResolvedValue({ id: VET_ID, userId: USER_ID });
        const created = makeVisit();
        mockPrisma.vetVisit.create.mockResolvedValue(created);
        mockPrisma.weightRecord.create.mockResolvedValue({});

        const data = {
            petId: PET_ID,
            veterinarianId: VET_ID,
            visitDate: "2024-06-15",
            visitType: "CHECKUP" as const,
            reason: "Annual checkup",
            diagnosis: "Healthy",
            costCents: 5000,
            weightGrams: 350,
            nextAppointment: "2025-06-15",
        };

        const result = await createVetVisit(USER_ID, data);

        expect(mockPrisma.pet.findUnique).toHaveBeenCalledWith({
            where: { id: PET_ID },
            select: { userId: true },
        });
        expect(mockPrisma.veterinarian.findUnique).toHaveBeenCalledWith({
            where: { id: VET_ID },
        });
        expect(mockPrisma.vetVisit.create).toHaveBeenCalledWith({
            data: {
                userId: USER_ID,
                petId: PET_ID,
                veterinarianId: VET_ID,
                visitDate: expect.any(Date),
                visitType: "CHECKUP",
                reason: "Annual checkup",
                diagnosis: "Healthy",
                treatment: null,
                costCents: 5000,
                weightGrams: 350,
                nextAppointment: expect.any(Date),
                notes: null,
            },
            include: VISIT_INCLUDE,
        });
        expect(result).toEqual(created);
    });

    it("auto-logs weight to weightRecord when weightGrams provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.vetVisit.create.mockResolvedValue(makeVisit());
        mockPrisma.weightRecord.create.mockResolvedValue({});

        await createVetVisit(USER_ID, {
            petId: PET_ID,
            visitDate: "2024-06-15",
            weightGrams: 350,
        });

        expect(mockPrisma.weightRecord.create).toHaveBeenCalledWith({
            data: {
                petId: PET_ID,
                measuredAt: expect.any(Date),
                weightGrams: 350,
                notes: "Vet visit weight",
            },
        });
    });

    it("does not log weight when weightGrams is not provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.vetVisit.create.mockResolvedValue(makeVisit({ weightGrams: null }));

        await createVetVisit(USER_ID, {
            petId: PET_ID,
            visitDate: "2024-06-15",
        });

        expect(mockPrisma.weightRecord.create).not.toHaveBeenCalled();
    });

    it("creates with minimal fields (only petId + visitDate)", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.vetVisit.create.mockResolvedValue(makeVisit());

        await createVetVisit(USER_ID, { petId: PET_ID, visitDate: "2024-06-15" });

        expect(mockPrisma.vetVisit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: USER_ID,
                petId: PET_ID,
                veterinarianId: null,
                visitType: "OTHER",
                reason: null,
                diagnosis: null,
                treatment: null,
                costCents: null,
                weightGrams: null,
                nextAppointment: null,
                notes: null,
            }),
            include: VISIT_INCLUDE,
        });
    });

    it("throws notFound for non-owned pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(
            createVetVisit(USER_ID, { petId: PET_ID, visitDate: "2024-06-15" }),
        ).rejects.toThrow("Pet not found");
    });

    it("throws notFound for non-existent pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);

        await expect(
            createVetVisit(USER_ID, { petId: PET_ID, visitDate: "2024-06-15" }),
        ).rejects.toThrow("Pet not found");
    });

    it("throws notFound for non-owned veterinarian", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.veterinarian.findUnique.mockResolvedValue({ id: VET_ID, userId: "other_user" });

        await expect(
            createVetVisit(USER_ID, { petId: PET_ID, visitDate: "2024-06-15", veterinarianId: VET_ID }),
        ).rejects.toThrow("Veterinarian not found");
    });

    it("throws notFound for non-existent veterinarian", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.veterinarian.findUnique.mockResolvedValue(null);

        await expect(
            createVetVisit(USER_ID, { petId: PET_ID, visitDate: "2024-06-15", veterinarianId: VET_ID }),
        ).rejects.toThrow("Veterinarian not found");
    });
});

// ─── updateVetVisit ────────────────────────────────────

describe("updateVetVisit", () => {
    it("updates specified fields for owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit());
        const updated = makeVisit({ diagnosis: "Mild dehydration", treatment: "Soak in lukewarm water" });
        mockPrisma.vetVisit.update.mockResolvedValue(updated);

        const result = await updateVetVisit(VISIT_ID, USER_ID, {
            diagnosis: "Mild dehydration",
            treatment: "Soak in lukewarm water",
        });

        expect(mockPrisma.vetVisit.update).toHaveBeenCalledWith({
            where: { id: VISIT_ID },
            data: {
                diagnosis: "Mild dehydration",
                treatment: "Soak in lukewarm water",
            },
            include: VISIT_INCLUDE,
        });
        expect(result).toEqual(updated);
    });

    it("allows setting nullable fields to null", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit());
        mockPrisma.vetVisit.update.mockResolvedValue(makeVisit({ costCents: null, nextAppointment: null }));

        await updateVetVisit(VISIT_ID, USER_ID, {
            costCents: null,
            nextAppointment: null,
        });

        expect(mockPrisma.vetVisit.update).toHaveBeenCalledWith({
            where: { id: VISIT_ID },
            data: {
                costCents: null,
                nextAppointment: null,
            },
            include: VISIT_INCLUDE,
        });
    });

    it("validates vet ownership when changing veterinarianId", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit());
        mockPrisma.veterinarian.findUnique.mockResolvedValue({ id: "vet_new", userId: "other_user" });

        await expect(
            updateVetVisit(VISIT_ID, USER_ID, { veterinarianId: "vet_new" }),
        ).rejects.toThrow("Veterinarian not found");
    });

    it("throws notFound for non-owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit({ userId: "other_user" }));

        await expect(
            updateVetVisit(VISIT_ID, USER_ID, { reason: "X" }),
        ).rejects.toThrow("Vet visit not found");
    });
});

// ─── deleteVetVisit ────────────────────────────────────

describe("deleteVetVisit", () => {
    it("deletes an owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit());
        mockPrisma.vetVisit.delete.mockResolvedValue(makeVisit());

        await deleteVetVisit(VISIT_ID, USER_ID);

        expect(mockPrisma.vetVisit.delete).toHaveBeenCalledWith({
            where: { id: VISIT_ID },
        });
    });

    it("throws notFound for non-owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit({ userId: "other_user" }));

        await expect(deleteVetVisit(VISIT_ID, USER_ID)).rejects.toThrow("Vet visit not found");
    });

    it("throws notFound for non-existent visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(null);

        await expect(deleteVetVisit(VISIT_ID, USER_ID)).rejects.toThrow("Vet visit not found");
    });
});

// ─── getUpcomingAppointments ───────────────────────────

describe("getUpcomingAppointments", () => {
    it("returns upcoming appointments ordered by date asc", async () => {
        const upcoming = [
            makeVisit({ nextAppointment: new Date("2025-01-15") }),
            makeVisit({ id: "visit_2", nextAppointment: new Date("2025-03-20") }),
        ];
        mockPrisma.vetVisit.findMany.mockResolvedValue(upcoming);

        const result = await getUpcomingAppointments(USER_ID);

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: {
                userId: USER_ID,
                nextAppointment: { gte: expect.any(Date) },
            },
            include: VISIT_INCLUDE,
            orderBy: { nextAppointment: "asc" },
            take: 10,
        });
        expect(result).toEqual(upcoming);
    });

    it("respects custom limit", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);

        await getUpcomingAppointments(USER_ID, 5);

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 5 }),
        );
    });
});

// ─── getVetCosts ───────────────────────────────────────

describe("getVetCosts", () => {
    it("returns total costs and per-pet breakdown", async () => {
        mockPrisma.vetVisit.aggregate.mockResolvedValue({
            _sum: { costCents: 15000 },
            _count: { id: 3 },
        });
        mockPrisma.vetVisit.groupBy.mockResolvedValue([
            { petId: PET_ID, _sum: { costCents: 15000 }, _count: { id: 3 } },
        ]);
        mockPrisma.pet.findMany.mockResolvedValue([{ id: PET_ID, name: "Monty" }]);

        const result = await getVetCosts(USER_ID);

        expect(mockPrisma.vetVisit.aggregate).toHaveBeenCalledWith({
            where: { userId: USER_ID, costCents: { not: null } },
            _sum: { costCents: true },
            _count: { id: true },
        });
        expect(result).toEqual({
            totalCents: 15000,
            visitCount: 3,
            perPet: [
                { petId: PET_ID, petName: "Monty", totalCents: 15000, visitCount: 3 },
            ],
        });
    });

    it("filters by year", async () => {
        mockPrisma.vetVisit.aggregate.mockResolvedValue({
            _sum: { costCents: 0 },
            _count: { id: 0 },
        });
        mockPrisma.vetVisit.groupBy.mockResolvedValue([]);
        mockPrisma.pet.findMany.mockResolvedValue([]);

        await getVetCosts(USER_ID, { year: 2024 });

        const expectedWhere = {
            userId: USER_ID,
            costCents: { not: null },
            visitDate: {
                gte: new Date("2024-01-01"),
                lt: new Date("2025-01-01"),
            },
        };
        expect(mockPrisma.vetVisit.aggregate).toHaveBeenCalledWith({
            where: expectedWhere,
            _sum: { costCents: true },
            _count: { id: true },
        });
    });

    it("filters by petId", async () => {
        mockPrisma.vetVisit.aggregate.mockResolvedValue({
            _sum: { costCents: 5000 },
            _count: { id: 1 },
        });
        mockPrisma.vetVisit.groupBy.mockResolvedValue([]);
        mockPrisma.pet.findMany.mockResolvedValue([]);

        await getVetCosts(USER_ID, { petId: PET_ID });

        expect(mockPrisma.vetVisit.aggregate).toHaveBeenCalledWith({
            where: { userId: USER_ID, costCents: { not: null }, petId: PET_ID },
            _sum: { costCents: true },
            _count: { id: true },
        });
    });

    it("returns zero totals when no costs recorded", async () => {
        mockPrisma.vetVisit.aggregate.mockResolvedValue({
            _sum: { costCents: null },
            _count: { id: 0 },
        });
        mockPrisma.vetVisit.groupBy.mockResolvedValue([]);
        mockPrisma.pet.findMany.mockResolvedValue([]);

        const result = await getVetCosts(USER_ID);

        expect(result).toEqual({
            totalCents: 0,
            visitCount: 0,
            perPet: [],
        });
    });
});
