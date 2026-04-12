import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();
const update = vi.fn();
const deleteFn = vi.fn();

const readFindUnique = vi.fn();
const readCreate = vi.fn();

vi.mock("../../db/client.js", () => ({
    prisma: {
        announcement: {
            findMany,
            findUnique,
            create,
            update,
            delete: deleteFn,
        },
        announcementRead: {
            findUnique: readFindUnique,
            create: readCreate,
        },
    },
}));

vi.mock("../../helpers/errors.js", () => ({
    notFound: (msg: string) => Object.assign(new Error(msg), { statusCode: 404 }),
}));

const {
    listAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAnnouncementRead,
} = await import("../announcements.service.js");

describe("announcements.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("listAnnouncements", () => {
        it("returns all announcements when no filter", async () => {
            const mockData = [
                { id: "1", title: "Test", active: true },
                { id: "2", title: "Old", active: false },
            ];
            findMany.mockResolvedValueOnce(mockData);

            const result = await listAnnouncements();

            expect(result).toEqual(mockData);
            expect(findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { createdAt: "desc" },
                include: { _count: { select: { readBy: true } } },
            });
        });

        it("filters to active only when requested", async () => {
            findMany.mockResolvedValueOnce([]);

            await listAnnouncements({ activeOnly: true });

            const callArgs = findMany.mock.calls[0][0];
            expect(callArgs.where.active).toBe(true);
            expect(callArgs.where.OR).toBeDefined();
        });
    });

    describe("getAnnouncement", () => {
        it("returns existing announcement", async () => {
            const mock = { id: "1", title: "Test", content: "Hello" };
            findUnique.mockResolvedValueOnce(mock);

            const result = await getAnnouncement("1");

            expect(result).toEqual(mock);
            expect(findUnique).toHaveBeenCalledWith({ where: { id: "1" } });
        });

        it("throws notFound for missing announcement", async () => {
            findUnique.mockResolvedValueOnce(null);

            await expect(getAnnouncement("missing")).rejects.toThrow("Announcement not found");
        });
    });

    describe("createAnnouncement", () => {
        it("creates announcement with all required fields", async () => {
            const created = { id: "1", title: "New", content: "Content", type: "info" };
            create.mockResolvedValueOnce(created);

            const result = await createAnnouncement({
                title: "New",
                content: "Content",
                type: "info",
                createdBy: "admin1",
            });

            expect(result).toEqual(created);
            expect(create).toHaveBeenCalledWith({
                data: {
                    title: "New",
                    content: "Content",
                    type: "info",
                    createdBy: "admin1",
                    expiresAt: undefined,
                },
            });
        });

        it("creates with optional expiresAt", async () => {
            const expiresAt = new Date("2025-12-31");
            create.mockResolvedValueOnce({ id: "1" });

            await createAnnouncement({
                title: "Expiring",
                content: "Will expire",
                type: "warning",
                createdBy: "admin1",
                expiresAt,
            });

            expect(create).toHaveBeenCalledWith({
                data: expect.objectContaining({ expiresAt }),
            });
        });
    });

    describe("updateAnnouncement", () => {
        it("updates an existing announcement", async () => {
            findUnique.mockResolvedValueOnce({ id: "1", title: "Old" });
            update.mockResolvedValueOnce({ id: "1", title: "Updated" });

            const result = await updateAnnouncement("1", { title: "Updated" });

            expect(result.title).toBe("Updated");
            expect(update).toHaveBeenCalledWith({
                where: { id: "1" },
                data: { title: "Updated" },
            });
        });

        it("can toggle active status", async () => {
            findUnique.mockResolvedValueOnce({ id: "1", active: true });
            update.mockResolvedValueOnce({ id: "1", active: false });

            const result = await updateAnnouncement("1", { active: false });

            expect(result.active).toBe(false);
        });

        it("throws notFound for missing announcement", async () => {
            findUnique.mockResolvedValueOnce(null);

            await expect(updateAnnouncement("missing", { title: "X" })).rejects.toThrow(
                "Announcement not found",
            );
        });
    });

    describe("deleteAnnouncement", () => {
        it("deletes an existing announcement", async () => {
            findUnique.mockResolvedValueOnce({ id: "1" });
            deleteFn.mockResolvedValueOnce({});

            await deleteAnnouncement("1");

            expect(deleteFn).toHaveBeenCalledWith({ where: { id: "1" } });
        });

        it("throws notFound for missing announcement", async () => {
            findUnique.mockResolvedValueOnce(null);

            await expect(deleteAnnouncement("missing")).rejects.toThrow("Announcement not found");
        });
    });

    describe("markAnnouncementRead", () => {
        it("creates read record when not already read", async () => {
            readFindUnique.mockResolvedValueOnce(null);
            readCreate.mockResolvedValueOnce({ announcementId: "a1", userId: "u1" });

            await markAnnouncementRead("a1", "u1");

            expect(readCreate).toHaveBeenCalledWith({
                data: { announcementId: "a1", userId: "u1" },
            });
        });

        it("does nothing when already read", async () => {
            readFindUnique.mockResolvedValueOnce({ announcementId: "a1", userId: "u1" });

            await markAnnouncementRead("a1", "u1");

            expect(readCreate).not.toHaveBeenCalled();
        });
    });
});
