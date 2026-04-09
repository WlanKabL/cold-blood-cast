import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

// ─── Public: Get announcements for a user ────────────────────

export async function getUserAnnouncements(userId: string) {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
        where: {
            active: true,
            OR: [{ global: true, targetUserId: null }, { targetUserId: userId }],
            AND: [
                { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: {
            readBy: {
                where: { userId },
                select: { readAt: true },
            },
        },
    });

    return announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type,
        global: a.global,
        createdAt: a.createdAt,
        isRead: a.readBy.length > 0,
        readAt: a.readBy[0]?.readAt ?? null,
    }));
}

export async function markAnnouncementRead(userId: string, announcementId: string) {
    return prisma.announcementRead.upsert({
        where: { announcementId_userId: { announcementId, userId } },
        update: {},
        create: { announcementId, userId },
    });
}

// ─── Admin: CRUD ─────────────────────────────────────────────

export async function listAllAnnouncements() {
    return prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { readBy: true } },
        },
    });
}

export async function createAnnouncement(
    createdBy: string,
    data: {
        title: string;
        content: string;
        type?: string;
        global?: boolean;
        targetUserId?: string;
        startsAt?: string;
        expiresAt?: string;
    },
) {
    return prisma.announcement.create({
        data: {
            title: data.title,
            content: data.content,
            type: data.type ?? "info",
            global: data.targetUserId ? false : (data.global ?? true),
            targetUserId: data.targetUserId ?? null,
            startsAt: data.startsAt ? new Date(data.startsAt) : null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            createdBy,
            active: true,
        },
    });
}

export async function updateAnnouncement(
    announcementId: string,
    data: Partial<{
        title: string;
        content: string;
        type: string;
        active: boolean;
        startsAt: string | null;
        expiresAt: string | null;
    }>,
) {
    const ann = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!ann) throw notFound(ErrorCodes.E_ANNOUNCEMENT_NOT_FOUND, "Announcement not found");

    return prisma.announcement.update({
        where: { id: announcementId },
        data: {
            ...data,
            startsAt:
                data.startsAt !== undefined
                    ? data.startsAt
                        ? new Date(data.startsAt)
                        : null
                    : undefined,
            expiresAt:
                data.expiresAt !== undefined
                    ? data.expiresAt
                        ? new Date(data.expiresAt)
                        : null
                    : undefined,
        },
    });
}

export async function deleteAnnouncement(announcementId: string) {
    const ann = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!ann) throw notFound(ErrorCodes.E_ANNOUNCEMENT_NOT_FOUND, "Announcement not found");

    return prisma.announcement.delete({ where: { id: announcementId } });
}
