import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest, notFound, forbidden } from "../../helpers/errors.js";
import { prisma } from "../../db/client.js";
import {
    requestDataExport,
    listUserDataExports,
    generateDataExport,
    getDataExportByToken,
    requestAccountDeletion,
    confirmAccountDeletion,
} from "../../services/dataExport.service.js";
import { auditLog } from "../../services/audit.service.js";

const router = Router();

// ─── Cookie Consent ──────────────────────────────────────────

const CookieConsentSchema = z.object({
    analytics: z.boolean(),
    version: z.number().int(),
});

router.post(
    "/cookie-consent",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = CookieConsentSchema.safeParse(req.body);
            if (!body.success) return next(badRequest("Invalid payload"));

            const consent = await prisma.cookieConsent.create({
                data: {
                    userId: req.user!.id,
                    analytics: body.data.analytics,
                    version: body.data.version,
                },
            });
            res.status(201).json(consent);
        } catch (err) {
            next(err);
        }
    },
);

router.get(
    "/cookie-consent",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const consents = await prisma.cookieConsent.findMany({
                where: { userId: req.user!.id },
                orderBy: { createdAt: "desc" },
                take: 1,
            });
            res.json(consents[0] ?? null);
        } catch (err) {
            next(err);
        }
    },
);

// ─── Data Export (GDPR) ──────────────────────────────────────

router.post(
    "/data-export",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const exportRecord = await requestDataExport(req.user!.id);
            await generateDataExport(exportRecord.id);
            await auditLog(
                req.user!.id,
                "user.data-export.request",
                "DataExport",
                exportRecord.id,
                undefined,
                req.ip,
            );
            res.status(201).json({
                ok: true,
                exportId: exportRecord.id,
                token: exportRecord.token,
            });
        } catch (err) {
            next(err);
        }
    },
);

router.get(
    "/data-export",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const exports = await listUserDataExports(req.user!.id);
            res.json(exports);
        } catch (err) {
            next(err);
        }
    },
);

router.get(
    "/data-export/download/:token",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.params.token as string;
            if (!token) return next(badRequest("Token required"));

            const exportRecord = await getDataExportByToken(token);
            if (exportRecord.status !== "COMPLETED" || !exportRecord.filePath) {
                return next(notFound("Export not ready or failed"));
            }

            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", "attachment; filename=my-data-export.json");
            res.send(exportRecord.filePath);
        } catch (err) {
            next(err);
        }
    },
);

// ─── Account Deletion (GDPR) ────────────────────────────────

router.post(
    "/delete-account",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const deleteToken = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await requestAccountDeletion(req.user!.id, deleteToken, expiresAt);
            await auditLog(
                req.user!.id,
                "user.delete-account.request",
                "User",
                req.user!.id,
                undefined,
                req.ip,
            );
            res.json({
                ok: true,
                message: "Account deletion requested. Confirm with the provided token.",
                deleteToken,
            });
        } catch (err) {
            next(err);
        }
    },
);

const ConfirmDeleteSchema = z.object({ deleteToken: z.string().uuid() });

router.post(
    "/delete-account/confirm",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = ConfirmDeleteSchema.safeParse(req.body);
            if (!body.success) return next(badRequest("Invalid payload"));

            const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
            if (!user) return next(notFound("User not found"));
            if (user.deleteToken !== body.data.deleteToken)
                return next(forbidden("Invalid delete token"));
            if (user.deleteTokenExpiresAt && user.deleteTokenExpiresAt < new Date()) {
                return next(forbidden("Delete token expired"));
            }

            await auditLog(
                req.user!.id,
                "user.delete-account.confirm",
                "User",
                req.user!.id,
                undefined,
                req.ip,
            );
            await confirmAccountDeletion(req.user!.id);
            res.json({ ok: true, message: "Account deleted" });
        } catch (err) {
            next(err);
        }
    },
);

// ─── Login Sessions ──────────────────────────────────────────

router.get("/sessions", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessions = await prisma.loginSession.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: "desc" },
        });
        res.json(sessions);
    } catch (err) {
        next(err);
    }
});

export default router;
