import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { badRequest } from "../../helpers/errors.js";
import { createAccessRequest } from "../../services/accessRequests.service.js";

const router = Router();

const CreateAccessRequestSchema = z.object({
    email: z.string().email(),
    reason: z.string().max(500).optional(),
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateAccessRequestSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const result = await createAccessRequest(body.data.email, body.data.reason);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
