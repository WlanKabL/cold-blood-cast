import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

export interface SheddingInterval {
    fromDate: string;
    toDate: string;
    days: number;
}

export interface SheddingAnalysisResult {
    petId: string;
    petName: string;
    sheddingCount: number;
    averageIntervalDays: number;
    trend: "shortening" | "stable" | "lengthening";
    predictedNextDate: string | null;
    lastShedDate: string | null;
    intervals: SheddingInterval[];
    isAnomaly: boolean;
    anomalyMessage: string | null;
}

export interface UpcomingSheddingItem {
    petId: string;
    petName: string;
    predictedDate: string;
    daysUntil: number;
    averageIntervalDays: number;
}

export function computeSheddingCycle(
    sheddings: { startedAt: string | Date }[],
    petId: string,
    petName: string,
): SheddingAnalysisResult {
    if (sheddings.length === 0) {
        return {
            petId,
            petName,
            sheddingCount: 0,
            averageIntervalDays: 0,
            trend: "stable",
            predictedNextDate: null,
            lastShedDate: null,
            intervals: [],
            isAnomaly: false,
            anomalyMessage: null,
        };
    }

    const sorted = [...sheddings].sort(
        (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

    const lastShedDate = new Date(sorted[sorted.length - 1].startedAt).toISOString();

    if (sorted.length < 2) {
        return {
            petId,
            petName,
            sheddingCount: 1,
            averageIntervalDays: 0,
            trend: "stable",
            predictedNextDate: null,
            lastShedDate,
            intervals: [],
            isAnomaly: false,
            anomalyMessage: null,
        };
    }

    const intervals: SheddingInterval[] = [];
    for (let i = 1; i < sorted.length; i++) {
        const from = new Date(sorted[i - 1].startedAt);
        const to = new Date(sorted[i].startedAt);
        const days = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        intervals.push({
            fromDate: from.toISOString(),
            toDate: to.toISOString(),
            days,
        });
    }

    const totalDays = intervals.reduce((sum, iv) => sum + iv.days, 0);
    const averageIntervalDays = Math.round(totalDays / intervals.length);

    // Trend: compare recent intervals vs overall average
    let trend: "shortening" | "stable" | "lengthening" = "stable";
    if (intervals.length >= 3) {
        const recentCount = Math.min(3, intervals.length);
        const recentSlice = intervals.slice(-recentCount);
        const recentAvg = recentSlice.reduce((s, iv) => s + iv.days, 0) / recentSlice.length;
        const diff = recentAvg - averageIntervalDays;
        const threshold = averageIntervalDays * 0.15;

        if (diff < -threshold) trend = "shortening";
        else if (diff > threshold) trend = "lengthening";
    }

    // Predicted next date
    const lastDate = new Date(sorted[sorted.length - 1].startedAt);
    const predicted = new Date(lastDate.getTime() + averageIntervalDays * 24 * 60 * 60 * 1000);
    const predictedNextDate = predicted.toISOString();

    // Anomaly detection: if current gap is >30% longer than average
    const daysSinceLastShed = Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const anomalyThreshold = averageIntervalDays * 1.3;
    const isAnomaly = daysSinceLastShed > anomalyThreshold;
    const anomalyMessage = isAnomaly
        ? `Current gap (${daysSinceLastShed}d) exceeds average (${averageIntervalDays}d) by more than 30%`
        : null;

    return {
        petId,
        petName,
        sheddingCount: sorted.length,
        averageIntervalDays,
        trend,
        predictedNextDate,
        lastShedDate,
        intervals,
        isAnomaly,
        anomalyMessage,
    };
}

export async function getSheddingAnalysis(
    userId: string,
    petId: string,
): Promise<SheddingAnalysisResult> {
    const pet = await prisma.pet.findUnique({
        where: { id: petId },
        select: { id: true, name: true, userId: true },
    });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }

    const sheddings = await prisma.shedding.findMany({
        where: { petId },
        select: { startedAt: true },
        orderBy: { startedAt: "asc" },
    });

    return computeSheddingCycle(
        sheddings.map((s) => ({ startedAt: s.startedAt.toISOString() })),
        pet.id,
        pet.name,
    );
}

export async function getUpcomingSheddings(
    userId: string,
    withinDays: number = 7,
): Promise<UpcomingSheddingItem[]> {
    const pets = await prisma.pet.findMany({
        where: { userId },
        select: { id: true, name: true },
    });

    const results: UpcomingSheddingItem[] = [];

    for (const pet of pets) {
        const sheddings = await prisma.shedding.findMany({
            where: { petId: pet.id },
            select: { startedAt: true },
            orderBy: { startedAt: "asc" },
        });

        if (sheddings.length < 2) continue;

        const analysis = computeSheddingCycle(
            sheddings.map((s) => ({ startedAt: s.startedAt.toISOString() })),
            pet.id,
            pet.name,
        );

        if (!analysis.predictedNextDate) continue;

        const predictedDate = new Date(analysis.predictedNextDate);
        const daysUntil = Math.round(
            (predictedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntil <= withinDays) {
            results.push({
                petId: pet.id,
                petName: pet.name,
                predictedDate: analysis.predictedNextDate,
                daysUntil,
                averageIntervalDays: analysis.averageIntervalDays,
            });
        }
    }

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
}
