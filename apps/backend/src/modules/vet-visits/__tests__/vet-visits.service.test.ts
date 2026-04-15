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
    getVetCostsMonthly,
    convertAppointment,
} = await import("../vet-visits.service.js");

const USER_ID = "user_123";
const PET_ID = "pet_456";
const VET_ID = "vet_789";
const VISIT_ID = "visit_abc";

const VISIT_INCLUDE = {
    pet: { select: { id: true, name: true, species: true } },
    veterinarian: { select: { id: true, name: true, clinicName: true } },
    sourceVisit: { select: { id: true, visitDate: true, visitType: true, reason: true } },
    documents: { include: { upload: { select: { id: true, url: true, originalName: true } } } },
};

const VISIT_DETAIL_INCLUDE = {
    ...VISIT_INCLUDE,
    followUps: {
        select: { id: true, visitDate: true, visitType: true, isAppointment: true, reason: true },
        orderBy: { visitDate: "asc" },
    },
};

function makeVisit(overrides = {}) {
    return {
        id: VISIT_ID,
        userId: USER_ID,
        petId: PET_ID,
        veterinarianId: VET_ID,
        sourceVisitId: null,
        visitDate: new Date("2024-06-15"),
        visitType: "CHECKUP",
        isAppointment: false,
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
        sourceVisit: null,
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

    it("filters by isAppointment", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);

        await listVetVisits(USER_ID, { isAppointment: true });

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, isAppointment: true },
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
            include: VISIT_DETAIL_INCLUDE,
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
                isAppointment: false,
                sourceVisitId: null,
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

    it("creates an appointment with isAppointment=true", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        const created = makeVisit({ isAppointment: true });
        mockPrisma.vetVisit.create.mockResolvedValue(created);

        await createVetVisit(USER_ID, {
            petId: PET_ID,
            visitDate: "2025-06-15",
            isAppointment: true,
        });

        expect(mockPrisma.vetVisit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                isAppointment: true,
            }),
            include: VISIT_INCLUDE,
        });
        // Should NOT log weight for appointments
        expect(mockPrisma.weightRecord.create).not.toHaveBeenCalled();
    });

    it("does not log weight for appointments even if weightGrams provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.vetVisit.create.mockResolvedValue(makeVisit({ isAppointment: true }));

        await createVetVisit(USER_ID, {
            petId: PET_ID,
            visitDate: "2025-06-15",
            isAppointment: true,
            weightGrams: 350,
        });

        expect(mockPrisma.weightRecord.create).not.toHaveBeenCalled();
    });

    it("stores sourceVisitId when provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.vetVisit.create.mockResolvedValue(makeVisit({ sourceVisitId: "visit_source" }));

        await createVetVisit(USER_ID, {
            petId: PET_ID,
            visitDate: "2025-06-15",
            isAppointment: true,
            sourceVisitId: "visit_source",
        });

        expect(mockPrisma.vetVisit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                sourceVisitId: "visit_source",
            }),
            include: VISIT_INCLUDE,
        });
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
                isAppointment: false,
                sourceVisitId: null,
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
            createVetVisit(USER_ID, {
                petId: PET_ID,
                visitDate: "2024-06-15",
                veterinarianId: VET_ID,
            }),
        ).rejects.toThrow("Veterinarian not found");
    });

    it("throws notFound for non-existent veterinarian", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.veterinarian.findUnique.mockResolvedValue(null);

        await expect(
            createVetVisit(USER_ID, {
                petId: PET_ID,
                visitDate: "2024-06-15",
                veterinarianId: VET_ID,
            }),
        ).rejects.toThrow("Veterinarian not found");
    });
});

// ─── updateVetVisit ────────────────────────────────────

describe("updateVetVisit", () => {
    it("updates specified fields for owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit());
        const updated = makeVisit({
            diagnosis: "Mild dehydration",
            treatment: "Soak in lukewarm water",
        });
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
        mockPrisma.vetVisit.update.mockResolvedValue(
            makeVisit({ costCents: null, nextAppointment: null }),
        );

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
        mockPrisma.veterinarian.findUnique.mockResolvedValue({
            id: "vet_new",
            userId: "other_user",
        });

        await expect(
            updateVetVisit(VISIT_ID, USER_ID, { veterinarianId: "vet_new" }),
        ).rejects.toThrow("Veterinarian not found");
    });

    it("throws notFound for non-owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit({ userId: "other_user" }));

        await expect(updateVetVisit(VISIT_ID, USER_ID, { reason: "X" })).rejects.toThrow(
            "Vet visit not found",
        );
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
    it("returns merged scheduled appointments and follow-ups sorted by date", async () => {
        const scheduled = [
            makeVisit({ id: "v1", isAppointment: true, visitDate: new Date("2025-02-01") }),
        ];
        const followUps = [
            makeVisit({ id: "v2", isAppointment: false, nextAppointment: new Date("2025-01-15") }),
        ];
        mockPrisma.vetVisit.findMany
            .mockResolvedValueOnce(scheduled)
            .mockResolvedValueOnce(followUps);

        const result = await getUpcomingAppointments(USER_ID);

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledTimes(2);
        // First call: scheduled appointments
        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ isAppointment: true }),
            }),
        );
        // Second call: follow-ups
        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ isAppointment: false }),
            }),
        );
        // Follow-up (Jan 15) should come before scheduled (Feb 1)
        expect(result[0].id).toBe("v2");
        expect(result[1].id).toBe("v1");
    });

    it("respects custom limit", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

        await getUpcomingAppointments(USER_ID, 5);

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 5 }),
        );
    });
});

// ─── convertAppointment ───────────────────────────────

describe("convertAppointment", () => {
    it("converts a scheduled appointment to a completed visit", async () => {
        const appointment = makeVisit({ isAppointment: true });
        mockPrisma.vetVisit.findUnique.mockResolvedValue(appointment);
        const converted = makeVisit({ isAppointment: false, diagnosis: "All clear" });
        mockPrisma.vetVisit.update.mockResolvedValue(converted);

        const result = await convertAppointment(VISIT_ID, USER_ID, {
            visitDate: "2024-06-15",
            diagnosis: "All clear",
        });

        expect(mockPrisma.vetVisit.update).toHaveBeenCalledWith({
            where: { id: VISIT_ID },
            data: expect.objectContaining({
                isAppointment: false,
                diagnosis: "All clear",
            }),
            include: VISIT_INCLUDE,
        });
        expect(result).toEqual(converted);
    });

    it("auto-logs weight when converting with weightGrams", async () => {
        const appointment = makeVisit({ isAppointment: true });
        mockPrisma.vetVisit.findUnique.mockResolvedValue(appointment);
        mockPrisma.vetVisit.update.mockResolvedValue(makeVisit({ isAppointment: false }));
        mockPrisma.weightRecord.create.mockResolvedValue({});

        await convertAppointment(VISIT_ID, USER_ID, {
            visitDate: "2024-06-15",
            weightGrams: 400,
        });

        expect(mockPrisma.weightRecord.create).toHaveBeenCalledWith({
            data: {
                petId: PET_ID,
                measuredAt: expect.any(Date),
                weightGrams: 400,
                notes: "Vet visit weight",
            },
        });
    });

    it("throws when visit is not an appointment", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit({ isAppointment: false }));

        await expect(convertAppointment(VISIT_ID, USER_ID, {})).rejects.toThrow(
            "Visit is not an appointment",
        );
    });

    it("throws notFound for non-owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(makeVisit({ userId: "other_user" }));

        await expect(convertAppointment(VISIT_ID, USER_ID, {})).rejects.toThrow(
            "Vet visit not found",
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
            perPet: [{ petId: PET_ID, petName: "Monty", totalCents: 15000, visitCount: 3 }],
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

// ─── getVetCostsMonthly ────────────────────────────────

describe("getVetCostsMonthly", () => {
    it("returns monthly breakdown grouped by pet", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([
            { petId: PET_ID, costCents: 3000, visitDate: new Date("2024-03-10") },
            { petId: PET_ID, costCents: 2000, visitDate: new Date("2024-03-20") },
            { petId: "pet_other", costCents: 5000, visitDate: new Date("2024-03-15") },
            { petId: PET_ID, costCents: 1000, visitDate: new Date("2024-06-01") },
        ]);
        mockPrisma.pet.findMany.mockResolvedValue([
            { id: PET_ID, name: "Monty" },
            { id: "pet_other", name: "Slinky" },
        ]);

        const result = await getVetCostsMonthly(USER_ID, { year: 2024 });

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith({
            where: {
                userId: USER_ID,
                costCents: { not: null },
                visitDate: { gte: new Date("2024-01-01"), lt: new Date("2025-01-01") },
            },
            select: { petId: true, costCents: true, visitDate: true },
            orderBy: { visitDate: "asc" },
        });

        expect(result).toEqual([
            { month: "2024-03", petId: PET_ID, petName: "Monty", totalCents: 5000, visitCount: 2 },
            {
                month: "2024-03",
                petId: "pet_other",
                petName: "Slinky",
                totalCents: 5000,
                visitCount: 1,
            },
            { month: "2024-06", petId: PET_ID, petName: "Monty", totalCents: 1000, visitCount: 1 },
        ]);
    });

    it("filters by petId", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);
        mockPrisma.pet.findMany.mockResolvedValue([]);

        await getVetCostsMonthly(USER_ID, { petId: PET_ID, year: 2024 });

        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ petId: PET_ID }),
            }),
        );
    });

    it("defaults to current year when no year provided", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);
        mockPrisma.pet.findMany.mockResolvedValue([]);

        await getVetCostsMonthly(USER_ID);

        const currentYear = new Date().getFullYear();
        expect(mockPrisma.vetVisit.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    visitDate: {
                        gte: new Date(`${currentYear}-01-01`),
                        lt: new Date(`${currentYear + 1}-01-01`),
                    },
                }),
            }),
        );
    });

    it("returns empty array when no visits have costs", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([]);
        mockPrisma.pet.findMany.mockResolvedValue([]);

        const result = await getVetCostsMonthly(USER_ID, { year: 2024 });

        expect(result).toEqual([]);
    });

    it("uses 'Unknown' for missing pet names", async () => {
        mockPrisma.vetVisit.findMany.mockResolvedValue([
            { petId: "deleted_pet", costCents: 1000, visitDate: new Date("2024-01-15") },
        ]);
        mockPrisma.pet.findMany.mockResolvedValue([]);

        const result = await getVetCostsMonthly(USER_ID, { year: 2024 });

        expect(result).toEqual([
            {
                month: "2024-01",
                petId: "deleted_pet",
                petName: "Unknown",
                totalCents: 1000,
                visitCount: 1,
            },
        ]);
    });
});
