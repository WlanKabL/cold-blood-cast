import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    announcement: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    announcementRead: {
        upsert: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/helpers/errors.js", async () => {
    const actual = await vi.importActual("@/helpers/errors.js");
    return actual;
});

// ─── Import SUT ──────────────────────────────────────────────

const {
    getUserAnnouncements,
    markAnnouncementRead,
    listAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} = await import("../announcements.service.js");

// ─── Helpers ─────────────────────────────────────────────────

const USER_ID = "user_123";
const ANN_ID = "ann_456";

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── getUserAnnouncements ────────────────────────────────────

describe("getUserAnnouncements", () => {
    it("returns announcements with read status", async () => {
        mockPrisma.announcement.findMany.mockResolvedValue([
            {
                id: ANN_ID,
                title: "Welcome",
                content: "Hello!",
                type: "info",
                global: true,
                createdAt: new Date("2024-01-01"),
                readBy: [],
            },
        ]);

        const result = await getUserAnnouncements(USER_ID);

        expect(result).toHaveLength(1);
        expect(result[0].isRead).toBe(false);
        expect(result[0].readAt).toBeNull();
    });

    it("marks announcement as read when readBy exists", async () => {
        const readAt = new Date("2024-02-15");
        mockPrisma.announcement.findMany.mockResolvedValue([
            {
                id: ANN_ID,
                title: "Notice",
                content: "Update!",
                type: "warning",
                global: true,
                createdAt: new Date("2024-01-01"),
                readBy: [{ readAt }],
            },
        ]);

        const result = await getUserAnnouncements(USER_ID);

        expect(result[0].isRead).toBe(true);
        expect(result[0].readAt).toEqual(readAt);
    });
});

// ─── markAnnouncementRead ────────────────────────────────────

describe("markAnnouncementRead", () => {
    it("upserts read status", async () => {
        mockPrisma.announcementRead.upsert.mockResolvedValue({});

        await markAnnouncementRead(USER_ID, ANN_ID);

        expect(mockPrisma.announcementRead.upsert).toHaveBeenCalledWith({
            where: {
                announcementId_userId: { announcementId: ANN_ID, userId: USER_ID },
            },
            update: {},
            create: { announcementId: ANN_ID, userId: USER_ID },
        });
    });
});

// ─── listAllAnnouncements ────────────────────────────────────

describe("listAllAnnouncements", () => {
    it("returns all announcements with readBy count", async () => {
        const announcements = [{ id: ANN_ID, _count: { readBy: 5 } }];
        mockPrisma.announcement.findMany.mockResolvedValue(announcements);

        const result = await listAllAnnouncements();

        expect(result).toEqual(announcements);
    });
});

// ─── createAnnouncement ──────────────────────────────────────

describe("createAnnouncement", () => {
    it("creates a global announcement", async () => {
        mockPrisma.announcement.create.mockResolvedValue({ id: "new", global: true });

        await createAnnouncement(USER_ID, {
            title: "Maintenance",
            content: "Scheduled downtime",
        });

        expect(mockPrisma.announcement.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                title: "Maintenance",
                content: "Scheduled downtime",
                type: "info",
                global: true,
                targetUserId: null,
                createdBy: USER_ID,
                active: true,
            }),
        });
    });

    it("creates a targeted announcement (non-global)", async () => {
        mockPrisma.announcement.create.mockResolvedValue({ id: "new", global: false });

        await createAnnouncement(USER_ID, {
            title: "Warning",
            content: "Your account...",
            targetUserId: "target_user",
        });

        expect(mockPrisma.announcement.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                global: false,
                targetUserId: "target_user",
            }),
        });
    });

    it("handles date strings for startsAt and expiresAt", async () => {
        mockPrisma.announcement.create.mockResolvedValue({ id: "new" });

        await createAnnouncement(USER_ID, {
            title: "Limited",
            content: "Time-limited notice",
            startsAt: "2024-01-01",
            expiresAt: "2024-12-31",
        });

        expect(mockPrisma.announcement.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                startsAt: new Date("2024-01-01"),
                expiresAt: new Date("2024-12-31"),
            }),
        });
    });
});

// ─── updateAnnouncement ──────────────────────────────────────

describe("updateAnnouncement", () => {
    it("updates an existing announcement", async () => {
        mockPrisma.announcement.findUnique.mockResolvedValue({ id: ANN_ID });
        mockPrisma.announcement.update.mockResolvedValue({ id: ANN_ID, title: "Updated" });

        const result = await updateAnnouncement(ANN_ID, { title: "Updated" });

        expect(result.title).toBe("Updated");
    });

    it("handles startsAt date conversion", async () => {
        mockPrisma.announcement.findUnique.mockResolvedValue({ id: ANN_ID });
        mockPrisma.announcement.update.mockResolvedValue({ id: ANN_ID });

        await updateAnnouncement(ANN_ID, { startsAt: "2024-06-01" });

        expect(mockPrisma.announcement.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    startsAt: new Date("2024-06-01"),
                }),
            }),
        );
    });

    it("handles null for startsAt (clear date)", async () => {
        mockPrisma.announcement.findUnique.mockResolvedValue({ id: ANN_ID });
        mockPrisma.announcement.update.mockResolvedValue({ id: ANN_ID });

        await updateAnnouncement(ANN_ID, { startsAt: null });

        expect(mockPrisma.announcement.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    startsAt: null,
                }),
            }),
        );
    });

    it("throws when announcement not found", async () => {
        mockPrisma.announcement.findUnique.mockResolvedValue(null);

        await expect(updateAnnouncement("none", { title: "X" })).rejects.toThrow(
            "Announcement not found",
        );
    });
});

// ─── deleteAnnouncement ──────────────────────────────────────

describe("deleteAnnouncement", () => {
    it("deletes an existing announcement", async () => {
        mockPrisma.announcement.findUnique.mockResolvedValue({ id: ANN_ID });
        mockPrisma.announcement.delete.mockResolvedValue({ id: ANN_ID });

        await deleteAnnouncement(ANN_ID);

        expect(mockPrisma.announcement.delete).toHaveBeenCalledWith({ where: { id: ANN_ID } });
    });

    it("throws when announcement not found", async () => {
        mockPrisma.announcement.findUnique.mockResolvedValue(null);

        await expect(deleteAnnouncement("none")).rejects.toThrow("Announcement not found");
    });
});
