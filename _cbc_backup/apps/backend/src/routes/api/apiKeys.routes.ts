import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest } from "../../helpers/errors.js";
import { paramString } from "../../utils/params.js";
import { auditLog } from "../../services/audit.service.js";
import {
    listApiKeys,
    createApiKey,
    revokeApiKey,
    deleteApiKey,
} from "../../services/apiKeys.service.js";

const router = Router();
router.use(authMiddleware);

// ─── GET /api/api-keys ──────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const keys = await listApiKeys(req.user!.id);
        res.json(keys);
    } catch (err) {
        next(err);
    }
});

// ─── POST /api/api-keys ─────────────────────────────────────

const CreateApiKeySchema = z.object({
    name: z.string().min(1).max(64),
    scopes: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional(),
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateApiKeySchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const key = await createApiKey(req.user!.id, {
            name: body.data.name,
            scopes: body.data.scopes,
            expiresAt: body.data.expiresAt ? new Date(body.data.expiresAt) : undefined,
        });

        await auditLog(req.user!.id, "apikey.create", "ApiKey", key.id, undefined, req.ip);
        res.status(201).json(key);
    } catch (err) {
        next(err);
    }
});

// ─── POST /api/api-keys/:id/revoke ──────────────────────────

router.post("/:id/revoke", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        await revokeApiKey(req.user!.id, id);
        await auditLog(req.user!.id, "apikey.revoke", "ApiKey", id, undefined, req.ip);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── DELETE /api/api-keys/:id ───────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        await deleteApiKey(req.user!.id, id);
        await auditLog(req.user!.id, "apikey.delete", "ApiKey", id, undefined, req.ip);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

export default router;
