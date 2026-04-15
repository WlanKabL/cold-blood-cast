import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

export async function listHusbandryNotes(
    userId: string,
    options: { petId?: string; from?: Date; to?: Date; limit: number },
) {
    return prisma.husbandryNote.findMany({
        where: {
            pet: { userId },
            ...(options.petId ? { petId: options.petId } : {}),
            ...(options.from || options.to
                ? {
                      occurredAt: {
                          ...(options.from ? { gte: options.from } : {}),
                          ...(options.to ? { lte: options.to } : {}),
                      },
                  }
                : {}),
        },
        include: { pet: { select: { id: true, name: true } } },
        orderBy: { occurredAt: "desc" },
        take: options.limit,
    });
}

export async function getHusbandryNote(id: string, userId: string) {
    const note = await prisma.husbandryNote.findUnique({
        where: { id },
        include: { pet: { select: { id: true, name: true, userId: true } } },
    });
    if (!note || note.pet?.userId !== userId) {
        throw notFound(ErrorCodes.E_HUSBANDRY_NOTE_NOT_FOUND, "Husbandry note not found");
    }
    return note;
}

export async function createHusbandryNote(
    userId: string,
    data: {
        petId: string;
        type: string;
        title: string;
        content?: string;
        occurredAt: Date;
    },
) {
    const pet = await prisma.pet.findUnique({ where: { id: data.petId } });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
    return prisma.husbandryNote.create({ data });
}

export async function updateHusbandryNote(
    id: string,
    userId: string,
    data: Partial<{
        type: string;
        title: string;
        content: string;
        occurredAt: Date;
    }>,
) {
    const existing = await prisma.husbandryNote.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet?.userId !== userId) {
        throw notFound(ErrorCodes.E_HUSBANDRY_NOTE_NOT_FOUND, "Husbandry note not found");
    }
    return prisma.husbandryNote.update({ where: { id }, data });
}

export async function deleteHusbandryNote(id: string, userId: string) {
    const existing = await prisma.husbandryNote.findUnique({
        where: { id },
        include: { pet: { select: { userId: true } } },
    });
    if (!existing || existing.pet?.userId !== userId) {
        throw notFound(ErrorCodes.E_HUSBANDRY_NOTE_NOT_FOUND, "Husbandry note not found");
    }
    await prisma.husbandryNote.delete({ where: { id } });
}
