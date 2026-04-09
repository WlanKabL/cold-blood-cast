import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest, notFound } from "../../helpers/errors.js";
import { paramString } from "../../utils/params.js";

const router = Router();

router.use(authMiddleware);

// ─── Validation Schemas ──────────────────────────────────────

const CreateWeightSchema = z.object({
    petId: z.string().uuid(),
    measuredAt: z.coerce.date(),
    weightGrams: z.number().positive(),
    notes: z.string().max(1000).optional(),
});

const UpdateWeightSchema = CreateWeightSchema.omit({ petId: true }).partial();

const ListQuerySchema = z.object({
    petId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(50),
});

// ─── GET / ───────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = ListQuerySchema.safeParse(req.query);
        if (!query.success) return next(badRequest("Invalid query parameters"));

        const { petId, from, to, limit } = query.data;

        const records = await prisma.weightRecord.findMany({
            where: {
                pet: { userId: req.user!.id },
                ...(petId ? { petId } : {}),
                ...(from || to
                    ? { measuredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
                    : {}),
            },
            include: { pet: { select: { id: true, name: true } } },
            orderBy: { measuredAt: "desc" },
            take: limit,
        });
        res.json(records);
    } catch (err) {
        next(err);
    }
});

// ─── POST / ──────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateWeightSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid weight data"));

        const pet = await prisma.pet.findUnique({ where: { id: body.data.petId } });
        if (!pet || pet.userId !== req.user!.id) return next(notFound("Pet not found"));

        const record = await prisma.weightRecord.create({ data: body.data });
        res.status(201).json(record);
    } catch (err) {
        next(err);
    }
});

// ─── GET /:id ────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const record = await prisma.weightRecord.findUnique({
            where: { id },
            include: { pet: { select: { id: true, name: true, userId: true } } },
        });
        if (!record || record.pet.userId !== req.user!.id)
            return next(notFound("Weight record not found"));
        res.json(record);
    } catch (err) {
        next(err);
    }
});

// ─── PUT /:id ────────────────────────────────────────────────

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.weightRecord.findUnique({
            where: { id },
            include: { pet: { select: { userId: true } } },
        });
        if (!existing || existing.pet.userId !== req.user!.id)
            return next(notFound("Weight record not found"));

        const body = UpdateWeightSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid weight data"));

        const record = await prisma.weightRecord.update({ where: { id }, data: body.data });
        res.json(record);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE /:id ─────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.weightRecord.findUnique({
            where: { id },
            include: { pet: { select: { userId: true } } },
        });
        if (!existing || existing.pet.userId !== req.user!.id)
            return next(notFound("Weight record not found"));

        await prisma.weightRecord.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

export default router;
