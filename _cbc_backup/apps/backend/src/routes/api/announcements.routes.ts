import { Router, type Request, type Response, type NextFunction } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
    getUnreadAnnouncements,
    markAnnouncementRead,
} from "../../services/announcements.service.js";
import { paramString } from "../../utils/params.js";

const router = Router();

router.get("/unread", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const announcements = await getUnreadAnnouncements(req.user!.id);
        res.json(announcements);
    } catch (err) {
        next(err);
    }
});

router.post(
    "/:id/read",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = paramString(req, "id");
            await markAnnouncementRead(id, req.user!.id);
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
