import type { VetVisitType } from "@prisma/client";
import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";
import { recordActivationEvent } from "@/modules/marketing/index.js";

const VISIT_INCLUDE = {
    pet: { select: { id: true, name: true, species: true } },
    veterinarian: { select: { id: true, name: true, clinicName: true } },
    sourceVisit: { select: { id: true, visitDate: true, visitType: true, reason: true } },
    documents: { include: { upload: { select: { id: true, url: true, originalName: true } } } },
} as const;

const VISIT_DETAIL_INCLUDE = {
    ...VISIT_INCLUDE,
    followUps: {
        select: { id: true, visitDate: true, visitType: true, isAppointment: true, reason: true },
        orderBy: { visitDate: "asc" as const },
    },
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
        isAppointment?: boolean;
        from?: string;
        to?: string;
    },
) {
    const where: Record<string, unknown> = { userId };

    if (opts?.petId) where.petId = opts.petId;
    if (opts?.veterinarianId) where.veterinarianId = opts.veterinarianId;
    if (opts?.visitType) where.visitType = opts.visitType;
    if (opts?.isAppointment !== undefined) where.isAppointment = opts.isAppointment;
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
    const visit = await prisma.vetVisit.findUnique({
        where: { id: visitId },
        include: VISIT_DETAIL_INCLUDE,
    });
    if (!visit || visit.userId !== userId) {
        throw notFound(ErrorCodes.E_VET_VISIT_NOT_FOUND, "Vet visit not found");
    }
    return visit;
}

// ─── Create Vet Visit ────────────────────────────────────────

export async function createVetVisit(
    userId: string,
    data: {
        petId: string;
        veterinarianId?: string;
        visitDate: string;
        visitType?: VetVisitType;
        isAppointment?: boolean;
        sourceVisitId?: string;
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
            isAppointment: data.isAppointment ?? false,
            sourceVisitId: data.sourceVisitId ?? null,
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

    // Auto-log weight if provided (only for completed visits)
    if (!data.isAppointment && data.weightGrams !== undefined && data.weightGrams !== null) {
        await prisma.weightRecord.create({
            data: {
                petId: data.petId,
                measuredAt: new Date(data.visitDate),
                weightGrams: data.weightGrams,
                notes: `Vet visit weight`,
            },
        });
    }

    // Best-effort activation tracking — only for completed visits, not future appointments.
    if (!data.isAppointment) {
        void recordActivationEvent(userId, "FirstCareEntryCreated", {
            kind: "vet_visit",
            visitId: visit.id,
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

// ─── Convert Appointment to Completed Visit ──────────────────

export async function convertAppointment(
    visitId: string,
    userId: string,
    data: {
        visitDate?: string;
        diagnosis?: string;
        treatment?: string;
        costCents?: number;
        weightGrams?: number;
        nextAppointment?: string;
        notes?: string;
    },
) {
    const visit = await getVisitWithOwnershipCheck(visitId, userId);

    if (!visit.isAppointment) {
        throw notFound(ErrorCodes.E_VET_VISIT_NOT_FOUND, "Visit is not an appointment");
    }

    const updated = await prisma.vetVisit.update({
        where: { id: visitId },
        data: {
            isAppointment: false,
            visitDate: data.visitDate ? new Date(data.visitDate) : visit.visitDate,
            diagnosis: data.diagnosis ?? null,
            treatment: data.treatment ?? null,
            costCents: data.costCents ?? null,
            weightGrams: data.weightGrams ?? null,
            nextAppointment: data.nextAppointment ? new Date(data.nextAppointment) : null,
            notes: data.notes ?? visit.notes,
        },
        include: VISIT_INCLUDE,
    });

    // Auto-log weight if provided
    if (data.weightGrams !== undefined && data.weightGrams !== null) {
        const actualDate = data.visitDate ? new Date(data.visitDate) : visit.visitDate;
        await prisma.weightRecord.create({
            data: {
                petId: visit.petId,
                measuredAt: actualDate,
                weightGrams: data.weightGrams,
                notes: `Vet visit weight`,
            },
        });
    }

    return updated;
}

// ─── Delete Vet Visit ────────────────────────────────────────

export async function deleteVetVisit(visitId: string, userId: string) {
    await getVisitWithOwnershipCheck(visitId, userId);
    await prisma.vetVisit.delete({ where: { id: visitId } });
}

// ─── Upcoming Appointments ───────────────────────────────────

export async function getUpcomingAppointments(userId: string, limit = 10) {
    const now = new Date();

    // Include both: scheduled appointments (visitDate >= now) and completed visits with upcoming next appointments
    const [scheduled, followUps] = await Promise.all([
        prisma.vetVisit.findMany({
            where: {
                userId,
                isAppointment: true,
                visitDate: { gte: now },
            },
            include: VISIT_INCLUDE,
            orderBy: { visitDate: "asc" },
            take: limit,
        }),
        prisma.vetVisit.findMany({
            where: {
                userId,
                isAppointment: false,
                nextAppointment: { gte: now },
            },
            include: VISIT_INCLUDE,
            orderBy: { nextAppointment: "asc" },
            take: limit,
        }),
    ]);

    // Merge and sort by the relevant date
    const merged = [
        ...scheduled.map((v) => ({ ...v, _sortDate: v.visitDate })),
        ...followUps.map((v) => ({ ...v, _sortDate: v.nextAppointment! })),
    ].sort((a, b) => a._sortDate.getTime() - b._sortDate.getTime());

    return merged.slice(0, limit);
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

// ─── Monthly Cost Breakdown ──────────────────────────────────

export async function getVetCostsMonthly(userId: string, opts?: { petId?: string; year?: number }) {
    const year = opts?.year ?? new Date().getFullYear();
    const where: Record<string, unknown> = {
        userId,
        costCents: { not: null },
        visitDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
        },
    };
    if (opts?.petId) where.petId = opts.petId;

    const visits = await prisma.vetVisit.findMany({
        where,
        select: {
            petId: true,
            costCents: true,
            visitDate: true,
        },
        orderBy: { visitDate: "asc" },
    });

    // Enrich pet names
    const petIds = [...new Set(visits.map((v) => v.petId))];
    const pets = await prisma.pet.findMany({
        where: { id: { in: petIds } },
        select: { id: true, name: true },
    });
    const petMap = new Map(pets.map((p) => [p.id, p.name]));

    // Group by month + pet
    const byMonthPet = new Map<string, { totalCents: number; visitCount: number }>();
    for (const v of visits) {
        const month = v.visitDate.toISOString().slice(0, 7); // "2025-04"
        const key = `${month}|${v.petId}`;
        const entry = byMonthPet.get(key) ?? { totalCents: 0, visitCount: 0 };
        entry.totalCents += v.costCents ?? 0;
        entry.visitCount += 1;
        byMonthPet.set(key, entry);
    }

    const result: {
        month: string;
        petId: string;
        petName: string;
        totalCents: number;
        visitCount: number;
    }[] = [];

    for (const [key, data] of byMonthPet) {
        const [month, petId] = key.split("|");
        result.push({
            month,
            petId,
            petName: petMap.get(petId) ?? "Unknown",
            ...data,
        });
    }

    return result.sort((a, b) => a.month.localeCompare(b.month));
}
