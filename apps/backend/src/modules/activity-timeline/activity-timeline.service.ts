import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

// ─── Types ───────────────────────────────────────────────────

export type TimelineEventType = "feeding" | "shedding" | "weight" | "vet_visit" | "photo" | "husbandry_note";

export interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    date: string;
    title: string;
    detail: string | null;
    icon: string;
    meta: Record<string, unknown>;
}

export interface TimelineResult {
    events: TimelineEvent[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

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

// ─── Normalizers ─────────────────────────────────────────────

interface FeedingRow {
    id: string;
    fedAt: Date;
    foodType: string;
    foodSize: string | null;
    quantity: number;
    accepted: boolean;
    notes: string | null;
}

function feedingToEvent(f: FeedingRow): TimelineEvent {
    const sizeStr = f.foodSize ? ` (${f.foodSize})` : "";
    return {
        id: f.id,
        type: "feeding",
        date: f.fedAt.toISOString(),
        title: `${f.foodType}${sizeStr}`,
        detail: f.notes,
        icon: "lucide:utensils",
        meta: { quantity: f.quantity, accepted: f.accepted, foodSize: f.foodSize },
    };
}

interface SheddingRow {
    id: string;
    startedAt: Date;
    completedAt: Date | null;
    complete: boolean;
    quality: string | null;
    notes: string | null;
}

function sheddingToEvent(s: SheddingRow): TimelineEvent {
    const status = s.complete ? "complete" : "in progress";
    const qualityStr = s.quality ? ` — ${s.quality}` : "";
    return {
        id: s.id,
        type: "shedding",
        date: s.startedAt.toISOString(),
        title: `Shedding (${status}${qualityStr})`,
        detail: s.notes,
        icon: "lucide:sparkles",
        meta: {
            complete: s.complete,
            quality: s.quality,
            completedAt: s.completedAt?.toISOString() ?? null,
        },
    };
}

interface WeightRow {
    id: string;
    measuredAt: Date;
    weightGrams: number;
    notes: string | null;
}

function weightToEvent(w: WeightRow): TimelineEvent {
    return {
        id: w.id,
        type: "weight",
        date: w.measuredAt.toISOString(),
        title: `${w.weightGrams}g`,
        detail: w.notes,
        icon: "lucide:scale",
        meta: { weightGrams: w.weightGrams },
    };
}

interface VetVisitRow {
    id: string;
    visitDate: Date;
    visitType: string;
    reason: string | null;
    diagnosis: string | null;
    treatment: string | null;
    costCents: number | null;
    notes: string | null;
    veterinarian: { name: string; clinicName: string | null } | null;
}

function vetVisitToEvent(v: VetVisitRow): TimelineEvent {
    const title = v.reason ?? v.visitType;
    const vetName = v.veterinarian?.name ?? null;
    return {
        id: v.id,
        type: "vet_visit",
        date: v.visitDate.toISOString(),
        title,
        detail: v.diagnosis ?? v.notes,
        icon: "lucide:stethoscope",
        meta: { visitType: v.visitType, costCents: v.costCents, treatment: v.treatment, vetName },
    };
}

interface PhotoRow {
    id: string;
    takenAt: Date;
    caption: string | null;
    tags: string[];
    upload: { url: string };
}

function photoToEvent(p: PhotoRow): TimelineEvent {
    return {
        id: p.id,
        type: "photo",
        date: p.takenAt.toISOString(),
        title: p.caption ?? "Photo",
        detail: p.tags.length ? p.tags.join(", ") : null,
        icon: "lucide:camera",
        meta: { tags: p.tags, url: p.upload.url },
    };
}

interface HusbandryNoteRow {
    id: string;
    type: string;
    title: string;
    content: string | null;
    occurredAt: Date;
}

function husbandryNoteToEvent(n: HusbandryNoteRow): TimelineEvent {
    return {
        id: n.id,
        type: "husbandry_note",
        date: n.occurredAt.toISOString(),
        title: n.title,
        detail: n.content,
        icon: "lucide:clipboard-list",
        meta: { noteType: n.type },
    };
}

// ─── Main Query ──────────────────────────────────────────────

export function normalizeEvents(
    feedings: FeedingRow[],
    sheddings: SheddingRow[],
    weights: WeightRow[],
    vetVisits: VetVisitRow[],
    photos: PhotoRow[],
    husbandryNotes: HusbandryNoteRow[] = [],
): TimelineEvent[] {
    const events: TimelineEvent[] = [
        ...feedings.map(feedingToEvent),
        ...sheddings.map(sheddingToEvent),
        ...weights.map(weightToEvent),
        ...vetVisits.map(vetVisitToEvent),
        ...photos.map(photoToEvent),
        ...husbandryNotes.map(husbandryNoteToEvent),
    ];

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
}

export async function getTimeline(
    userId: string,
    petId: string,
    options: { page: number; limit: number; types: TimelineEventType[] },
): Promise<TimelineResult> {
    await assertPetOwnership(petId, userId);

    const { page, limit, types } = options;
    const typeSet = new Set(types);

    // Query all requested types in parallel
    const [feedings, sheddings, weights, vetVisits, photos, husbandryNotes] = await Promise.all([
        typeSet.has("feeding")
            ? prisma.feeding.findMany({
                  where: { petId },
                  select: {
                      id: true,
                      fedAt: true,
                      foodType: true,
                      foodSize: true,
                      quantity: true,
                      accepted: true,
                      notes: true,
                  },
                  orderBy: { fedAt: "desc" },
              })
            : Promise.resolve([]),
        typeSet.has("shedding")
            ? prisma.shedding.findMany({
                  where: { petId },
                  select: {
                      id: true,
                      startedAt: true,
                      completedAt: true,
                      complete: true,
                      quality: true,
                      notes: true,
                  },
                  orderBy: { startedAt: "desc" },
              })
            : Promise.resolve([]),
        typeSet.has("weight")
            ? prisma.weightRecord.findMany({
                  where: { petId },
                  select: { id: true, measuredAt: true, weightGrams: true, notes: true },
                  orderBy: { measuredAt: "desc" },
              })
            : Promise.resolve([]),
        typeSet.has("vet_visit")
            ? prisma.vetVisit.findMany({
                  where: { petId, userId },
                  select: {
                      id: true,
                      visitDate: true,
                      visitType: true,
                      reason: true,
                      diagnosis: true,
                      treatment: true,
                      costCents: true,
                      notes: true,
                      veterinarian: { select: { name: true, clinicName: true } },
                  },
                  orderBy: { visitDate: "desc" },
              })
            : Promise.resolve([]),
        typeSet.has("photo")
            ? prisma.petPhoto.findMany({
                  where: { petId },
                  select: {
                      id: true,
                      takenAt: true,
                      caption: true,
                      tags: true,
                      upload: { select: { url: true, originalName: true } },
                  },
                  orderBy: { takenAt: "desc" },
              })
            : Promise.resolve([]),
        typeSet.has("husbandry_note")
            ? prisma.husbandryNote.findMany({
                  where: { petId },
                  select: {
                      id: true,
                      type: true,
                      title: true,
                      content: true,
                      occurredAt: true,
                  },
                  orderBy: { occurredAt: "desc" },
              })
            : Promise.resolve([]),
    ]);

    const allEvents = normalizeEvents(feedings, sheddings, weights, vetVisits, photos, husbandryNotes);
    const total = allEvents.length;
    const start = (page - 1) * limit;
    const paged = allEvents.slice(start, start + limit);

    return {
        events: paged,
        total,
        page,
        limit,
        hasMore: start + limit < total,
    };
}
