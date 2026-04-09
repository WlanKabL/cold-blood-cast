import { type FastifyInstance } from "fastify";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { auditLog } from "@/modules/audit/audit.service.js";
import {
    getUserAnnouncements,
    markAnnouncementRead,
    listAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from "./announcements.service.js";

export async function announcementRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // ── User routes ──────────────────────────────

    app.get("/", async (request) => {
        const announcements = await getUserAnnouncements(request.userId);
        return { success: true, data: announcements };
    });

    app.post("/:announcementId/read", async (request) => {
        const { announcementId } = request.params as { announcementId: string };
        await markAnnouncementRead(request.userId, announcementId);
        return { success: true };
    });

    // ── Admin routes ─────────────────────────────

    app.get("/admin/all", { preHandler: [adminGuard] }, async () => {
        const announcements = await listAllAnnouncements();
        return { success: true, data: announcements };
    });

    app.post("/admin", { preHandler: [adminGuard] }, async (request) => {
        const body = request.body as {
            title: string;
            content: string;
            type?: string;
            global?: boolean;
            targetUserId?: string;
            startsAt?: string;
            expiresAt?: string;
        };
        const ann = await createAnnouncement(request.userId, body);
        await auditLog(
            request.userId,
            "announcement.create",
            "Announcement",
            ann.id,
            body,
            request.ip,
        );
        return { success: true, data: ann };
    });

    app.patch("/admin/:announcementId", { preHandler: [adminGuard] }, async (request) => {
        const { announcementId } = request.params as { announcementId: string };
        const body = request.body as Partial<{
            title: string;
            content: string;
            type: string;
            active: boolean;
            startsAt: string | null;
            expiresAt: string | null;
        }>;
        const ann = await updateAnnouncement(announcementId, body);
        await auditLog(
            request.userId,
            "announcement.update",
            "Announcement",
            announcementId,
            body,
            request.ip,
        );
        return { success: true, data: ann };
    });

    app.delete("/admin/:announcementId", { preHandler: [adminGuard] }, async (request) => {
        const { announcementId } = request.params as { announcementId: string };
        await deleteAnnouncement(announcementId);
        await auditLog(
            request.userId,
            "announcement.delete",
            "Announcement",
            announcementId,
            null,
            request.ip,
        );
        return { success: true };
    });
}
