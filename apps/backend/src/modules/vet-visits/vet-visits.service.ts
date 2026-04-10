import type { VetVisitType } from "@prisma/client";
import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

const VISIT_INCLUDE = {
    pet: { select: { id: true, name: true, species: true } },
    veterinarian: { select: { id: true, name: true, clinicName: true } },
    documents: { include: { upload: { select: { url: true } } } },
} as const;

// ─── Helpers ─────────────────────────────────────────────────

async function assertPetOwnership(petId: string, userId: string) {
    const pet = await prisma.pet.findUnique({
        where: { id: petId },
        select: { userId: true },
    });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
}

async function getVisitWithOwnershipCheck(visitId: string, userId: string) {
    const visit = await prisma.vetVisit.findUnique({
        where: { id: visitId },
        include: VISIT_INCLUDE,
    });
    if (!visit || visit.userId !== userId) {
        throw notFound(ErrorCodes.E_VET_VISIT_NOT_FOUND, "Vet visit not found");
    }
    return visit;
}

// ─── List Vet Visits ─────────────────────────────────────────

export async function listVetVisits(
    userId: string,
    opts?: {
        petId?: string;
        veterinarianId?: string;
        visitType?: VetVisitType;
        from?: string;
        to?: string;
    },
) {
    const where: Record<string, unknown> = { userId };

    if (opts?.petId) where.petId = opts.petId;
    if (opts?.veterinarianId) where.veterinarianId = opts.veterinarianId;
    if (opts?.visitType) where.visitType = opts.visitType;
    if (opts?.from || opts?.to) {
        where.visitDate = {
            ...(opts?.from ? { gte: new Date(opts.from) } : {}),
            ...(opts?.to ? { lte: new Date(opts.to) } : {}),
        };
    }

    return prisma.vetVisit.findMany({
        where,
        include: VISIT_INCLUDE,
        orderBy: { visitDate: "desc" },
    });
}

// ─── Get Single Visit ────────────────────────────────────────

export async function getVetVisit(visitId: string, userId: string) {
    return getVisitWithOwnershipCheck(visitId, userId);
}

// ─── Create Vet Visit ────────────────────────────────────────

export async function createVetVisit(
    userId: string,
    data: {
        petId: string;
        veterinarianId?: string;
        visitDate: string;
        visitType?: VetVisitType;
        reason?: string;
        diagnosis?: string;
        treatment?: string;
        costCents?: number;
        weightGrams?: number;
        nextAppointment?: string;
        notes?: string;
    },
) {
    await assertPetOwnership(data.petId, userId);

    // Verify vet ownership if provided
    if (data.veterinarianId) {
        const vet = await prisma.veterinarian.findUnique({
            where: { id: data.veterinarianId },
        });
        if (!vet || vet.userId !== userId) {
            throw notFound(ErrorCodes.E_VETERINARIAN_NOT_FOUND, "Veterinarian not found");
        }
    }

    const visit = await prisma.vetVisit.create({
        data: {
            userId,
            petId: data.petId,
            veterinarianId: data.veterinarianId ?? null,
            visitDate: new Date(data.visitDate),
            visitType: data.visitType ?? "OTHER",
            reason: data.reason ?? null,
            diagnosis: data.diagnosis ?? null,
            treatment: data.treatment ?? null,
            costCents: data.costCents ?? null,
            weightGrams: data.weightGrams ?? null,
            nextAppointment: data.nextAppointment ? new Date(data.nextAppointment) : null,
            notes: data.notes ?? null,
        },
        include: VISIT_INCLUDE,
    });

    // Auto-log weight if provided
    if (data.weightGrams !== undefined && data.weightGrams !== null) {
        await prisma.weightRecord.create({
            data: {
                petId: data.petId,
                measuredAt: new Date(data.visitDate),
                weightGrams: data.weightGrams,
                notes: `Vet visit weight`,
            },
        });
    }

    return visit;
}

// ─── Update Vet Visit ────────────────────────────────────────

export async function updateVetVisit(
    visitId: string,
    userId: string,
    data: {
        veterinarianId?: string | null;
        visitDate?: string;
        visitType?: VetVisitType;
        reason?: string;
        diagnosis?: string;
        treatment?: string;
        costCents?: number | null;
        weightGrams?: number | null;
        nextAppointment?: string | null;
        notes?: string;
    },
) {
    await getVisitWithOwnershipCheck(visitId, userId);

    // Verify vet ownership if changing vet
    if (data.veterinarianId) {
        const vet = await prisma.veterinarian.findUnique({
            where: { id: data.veterinarianId },
        });
        if (!vet || vet.userId !== userId) {
            throw notFound(ErrorCodes.E_VETERINARIAN_NOT_FOUND, "Veterinarian not found");
        }
    }

    return prisma.vetVisit.update({
        where: { id: visitId },
        data: {
            ...(data.veterinarianId !== undefined ? { veterinarianId: data.veterinarianId } : {}),
            ...(data.visitDate !== undefined ? { visitDate: new Date(data.visitDate) } : {}),
            ...(data.visitType !== undefined ? { visitType: data.visitType } : {}),
            ...(data.reason !== undefined ? { reason: data.reason } : {}),
            ...(data.diagnosis !== undefined ? { diagnosis: data.diagnosis } : {}),
            ...(data.treatment !== undefined ? { treatment: data.treatment } : {}),
            ...(data.costCents !== undefined ? { costCents: data.costCents } : {}),
            ...(data.weightGrams !== undefined ? { weightGrams: data.weightGrams } : {}),
            ...(data.nextAppointment !== undefined
                ? { nextAppointment: data.nextAppointment ? new Date(data.nextAppointment) : null }
                : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        include: VISIT_INCLUDE,
    });
}

// ─── Delete Vet Visit ────────────────────────────────────────

export async function deleteVetVisit(visitId: string, userId: string) {
    await getVisitWithOwnershipCheck(visitId, userId);
    await prisma.vetVisit.delete({ where: { id: visitId } });
}

// ─── Upcoming Appointments ───────────────────────────────────

export async function getUpcomingAppointments(userId: string, limit = 10) {
    return prisma.vetVisit.findMany({
        where: {
            userId,
            nextAppointment: { gte: new Date() },
        },
        include: VISIT_INCLUDE,
        orderBy: { nextAppointment: "asc" },
        take: limit,
    });
}

// ─── Cost Aggregation ────────────────────────────────────────

export async function getVetCosts(
    userId: string,
    opts?: { petId?: string; veterinarianId?: string; year?: number },
) {
    const where: Record<string, unknown> = {
        userId,
        costCents: { not: null },
    };

    if (opts?.petId) where.petId = opts.petId;
    if (opts?.veterinarianId) where.veterinarianId = opts.veterinarianId;
    if (opts?.year) {
        where.visitDate = {
            gte: new Date(`${opts.year}-01-01`),
            lt: new Date(`${opts.year + 1}-01-01`),
        };
    }

    const aggregate = await prisma.vetVisit.aggregate({
        where,
        _sum: { costCents: true },
        _count: { id: true },
    });

    // Per-pet breakdown
    const perPet = await prisma.vetVisit.groupBy({
        by: ["petId"],
        where,
        _sum: { costCents: true },
        _count: { id: true },
    });

    // Enrich pet names
    const petIds = perPet.map((p) => p.petId);
    const pets = await prisma.pet.findMany({
        where: { id: { in: petIds } },
        select: { id: true, name: true },
    });
    const petMap = new Map(pets.map((p) => [p.id, p.name]));

    return {
        totalCents: aggregate._sum.costCents ?? 0,
        visitCount: aggregate._count.id,
        perPet: perPet.map((p) => ({
            petId: p.petId,
            petName: petMap.get(p.petId) ?? "Unknown",
            totalCents: p._sum.costCents ?? 0,
            visitCount: p._count.id,
        })),
    };
}
