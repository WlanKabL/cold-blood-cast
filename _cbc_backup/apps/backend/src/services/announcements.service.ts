import { prisma } from "../db/client.js";
import { notFound } from "../helpers/errors.js";

export async function listAnnouncements(options?: { activeOnly?: boolean }) {
    const where = options?.activeOnly
        ? {
              active: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          }
        : {};

    return prisma.announcement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { readBy: true } } },
    });
}

export async function getAnnouncement(id: string) {
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw notFound("Announcement not found");
    return announcement;
}

export async function createAnnouncement(data: {
    title: string;
    content: string;
    type: string;
    createdBy: string;
    expiresAt?: Date;
}) {
    return prisma.announcement.create({
        data: {
            title: data.title,
            content: data.content,
            type: data.type,
            createdBy: data.createdBy,
            expiresAt: data.expiresAt,
        },
    });
}

export async function updateAnnouncement(
    id: string,
    data: {
        title?: string;
        content?: string;
        type?: string;
        active?: boolean;
        expiresAt?: Date | null;
    },
) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw notFound("Announcement not found");
    return prisma.announcement.update({ where: { id }, data });
}

export async function deleteAnnouncement(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw notFound("Announcement not found");
    await prisma.announcement.delete({ where: { id } });
}

export async function markAnnouncementRead(announcementId: string, userId: string) {
    const existing = await prisma.announcementRead.findUnique({
        where: { announcementId_userId: { userId, announcementId } },
    });
    if (existing) return existing;
    return prisma.announcementRead.create({ data: { userId, announcementId } });
}

export async function getUnreadAnnouncements(userId: string) {
    return prisma.announcement.findMany({
        where: {
            active: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            readBy: { none: { userId } },
        },
        orderBy: { createdAt: "desc" },
    });
}
