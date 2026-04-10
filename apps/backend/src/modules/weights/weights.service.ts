import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

interface GrowthRateResult {
    petId: string;
    petName: string;
    firstRecord: { date: string; weightGrams: number } | null;
    latestRecord: { date: string; weightGrams: number } | null;
    totalGainGrams: number;
    avgGramsPerMonth: number;
    trend: "up" | "stable" | "down";
    recordCount: number;
}

export async function getWeightChartData(
    userId: string,
    options: { petIds: string[]; from?: Date; to?: Date },
) {
    const records = await prisma.weightRecord.findMany({
        where: {
            pet: { userId },
            petId: { in: options.petIds },
            ...(options.from || options.to
                ? {
                      measuredAt: {
                          ...(options.from ? { gte: options.from } : {}),
                          ...(options.to ? { lte: options.to } : {}),
                      },
                  }
                : {}),
        },
        include: { pet: { select: { id: true, name: true } } },
        orderBy: { measuredAt: "asc" },
    });

    const grouped: Record<string, { petName: string; points: { date: string; weightGrams: number }[] }> = {};
    for (const r of records) {
        if (!grouped[r.petId]) {
            grouped[r.petId] = { petName: r.pet.name, points: [] };
        }
        grouped[r.petId].points.push({
            date: r.measuredAt.toISOString(),
            weightGrams: r.weightGrams,
        });
    }

    return Object.entries(grouped).map(([petId, data]) => ({
        petId,
        petName: data.petName,
        points: data.points,
    }));
}

export function computeGrowthRate(
    points: { date: string; weightGrams: number }[],
    petId: string,
    petName: string,
): GrowthRateResult {
    if (points.length === 0) {
        return {
            petId,
            petName,
            firstRecord: null,
            latestRecord: null,
            totalGainGrams: 0,
            avgGramsPerMonth: 0,
            trend: "stable",
            recordCount: 0,
        };
    }

    const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const totalGainGrams = latest.weightGrams - first.weightGrams;

    const msSpan = new Date(latest.date).getTime() - new Date(first.date).getTime();
    const monthsSpan = msSpan / (1000 * 60 * 60 * 24 * 30.44);
    const avgGramsPerMonth = monthsSpan > 0 ? Math.round((totalGainGrams / monthsSpan) * 100) / 100 : 0;

    let trend: "up" | "stable" | "down" = "stable";
    if (sorted.length >= 2) {
        const recentCount = Math.min(3, sorted.length);
        const recentSlice = sorted.slice(-recentCount);
        const recentGain = recentSlice[recentSlice.length - 1].weightGrams - recentSlice[0].weightGrams;
        const recentMs = new Date(recentSlice[recentSlice.length - 1].date).getTime() - new Date(recentSlice[0].date).getTime();
        const recentMonths = recentMs / (1000 * 60 * 60 * 24 * 30.44);
        const recentRate = recentMonths > 0 ? recentGain / recentMonths : 0;

        if (recentRate > 1) trend = "up";
        else if (recentRate < -1) trend = "down";
    }

    return {
        petId,
        petName,
        firstRecord: { date: first.date, weightGrams: first.weightGrams },
        latestRecord: { date: latest.date, weightGrams: latest.weightGrams },
        totalGainGrams,
        avgGramsPerMonth,
        trend,
        recordCount: sorted.length,
    };
}

export async function getGrowthRates(userId: string, petIds?: string[]): Promise<GrowthRateResult[]> {
    const where = petIds?.length
        ? { pet: { userId }, petId: { in: petIds } }
        : { pet: { userId } };

    const records = await prisma.weightRecord.findMany({
        where,
        include: { pet: { select: { id: true, name: true } } },
        orderBy: { measuredAt: "asc" },
    });

    const grouped: Record<string, { petName: string; points: { date: string; weightGrams: number }[] }> = {};
    for (const r of records) {
        if (!grouped[r.petId]) {
            grouped[r.petId] = { petName: r.pet.name, points: [] };
        }
        grouped[r.petId].points.push({
            date: r.measuredAt.toISOString(),
            weightGrams: r.weightGrams,
        });
    }

    return Object.entries(grouped).map(([petId, data]) =>
        computeGrowthRate(data.points, petId, data.petName),
    );
}

export async function listWeightRecords(
    userId: string,
    options: { petId?: string; from?: Date; to?: Date; limit: number },
) {
    return prisma.weightRecord.findMany({
        where: {
            pet: { userId },
            ...(options.petId ? { petId: options.petId } : {}),
            ...(options.from || options.to
                ? {
                      measuredAt: {
                          ...(options.from ? { gte: options.from } : {}),
                          ...(options.to ? { lte: options.to } : {}),
                      },
                  }
                : {}),
        },
        include: { pet: { select: { id: true, name: true } } },
        orderBy: { measuredAt: "desc" },
        take: options.limit,
    });
}

export async function getWeightRecord(id: string, userId: string) {
    const record = await prisma.weightRecord.findUnique({
        where: { id },
        include: { pet: { select: { id: true, name: true, userId: true } } },
    });
    if (!record || record.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_WEIGHT_RECORD_NOT_FOUND, "Weight record not found");
    }
    return record;
}

export async function createWeightRecord(
    userId: string,
    data: {
        petId: string;
        measuredAt: Date;
        weightGrams: number;
        notes?: string;
    },
) {
    const pet = await prisma.pet.findUnique({ where: { id: data.petId } });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
    return prisma.weightRecord.create({ data });
}

export async function updateWeightRecord(
    id: string,
    userId: string,
    data: Partial<{
        measuredAt: Date;
        weightGrams: number;
        notes: string;
    }>,
) {
    const existing = await prisma.weightRecord.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_WEIGHT_RECORD_NOT_FOUND, "Weight record not found");
    }
    return prisma.weightRecord.update({ where: { id }, data });
}

export async function deleteWeightRecord(id: string, userId: string) {
    const existing = await prisma.weightRecord.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_WEIGHT_RECORD_NOT_FOUND, "Weight record not found");
    }
    await prisma.weightRecord.delete({ where: { id } });
}
