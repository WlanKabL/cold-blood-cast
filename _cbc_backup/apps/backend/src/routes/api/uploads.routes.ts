import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest } from "../../helpers/errors.js";
import { paramString } from "../../utils/params.js";
import { auditLog } from "../../services/audit.service.js";
import { loadEnv } from "../../config.js";
import {
    uploadFile,
    deleteUpload,
    listUploads,
    getUploadBuffer,
} from "../../services/uploads.service.js";

const router = Router();
router.use(authMiddleware);

// Use memory storage so we control file writing ourselves (with optional encryption)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: loadEnv().MAX_FILE_SIZE },
});

// ─── POST /api/uploads ──────────────────────────────────────

const UploadQuerySchema = z.object({
    entityType: z.enum(["enclosure", "pet", "sensor"]).optional(),
    entityId: z.string().uuid().optional(),
    caption: z.string().max(200).optional(),
});

router.post("/", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) return next(badRequest("No file provided"));

        const query = UploadQuerySchema.safeParse(req.body);
        if (!query.success) return next(badRequest("Invalid payload"));

        const result = await uploadFile(req.user!.id, req.file, {
            entityType: query.data.entityType,
            entityId: query.data.entityId,
            caption: query.data.caption,
        });

        await auditLog(req.user!.id, "upload.create", "Upload", result.id, undefined, req.ip);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/uploads ───────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const entityType = req.query.entityType as string | undefined;
        const entityId = req.query.entityId as string | undefined;
        const uploads = await listUploads(req.user!.id, { entityType, entityId });
        res.json(uploads);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/uploads/:id/file ──────────────────────────────

router.get("/:id/file", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const { buffer, mimetype, filename } = await getUploadBuffer(req.user!.id, id);
        res.setHeader("Content-Type", mimetype);
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        res.send(buffer);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE /api/uploads/:id ────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        await deleteUpload(req.user!.id, id);
        await auditLog(req.user!.id, "upload.delete", "Upload", id, undefined, req.ip);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

export default router;
