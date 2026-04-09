import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest, notFound } from "../../helpers/errors.js";
import { paramString } from "../../utils/params.js";

const router = Router();

router.use(authMiddleware);

// ─── Validation Schemas ──────────────────────────────────────

const CreateSheddingSchema = z.object({
    petId: z.string().uuid(),
    startedAt: z.coerce.date(),
    completedAt: z.coerce.date().optional(),
    complete: z.boolean().default(false),
    quality: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
});

const UpdateSheddingSchema = CreateSheddingSchema.omit({ petId: true }).partial();

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

        const sheddings = await prisma.shedding.findMany({
            where: {
                pet: { userId: req.user!.id },
                ...(petId ? { petId } : {}),
                ...(from || to
                    ? { startedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
                    : {}),
            },
            include: { pet: { select: { id: true, name: true } } },
            orderBy: { startedAt: "desc" },
            take: limit,
        });
        res.json(sheddings);
    } catch (err) {
        next(err);
    }
});

// ─── POST / ──────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateSheddingSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid shedding data"));

        const pet = await prisma.pet.findUnique({ where: { id: body.data.petId } });
        if (!pet || pet.userId !== req.user!.id) return next(notFound("Pet not found"));

        const shedding = await prisma.shedding.create({ data: body.data });
        res.status(201).json(shedding);
    } catch (err) {
        next(err);
    }
});

// ─── GET /:id ────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const shedding = await prisma.shedding.findUnique({
            where: { id },
            include: { pet: { select: { id: true, name: true, userId: true } } },
        });
        if (!shedding || shedding.pet.userId !== req.user!.id)
            return next(notFound("Shedding not found"));
        res.json(shedding);
    } catch (err) {
        next(err);
    }
});

// ─── PUT /:id ────────────────────────────────────────────────

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.shedding.findUnique({
            where: { id },
            include: { pet: { select: { userId: true } } },
        });
        if (!existing || existing.pet.userId !== req.user!.id)
            return next(notFound("Shedding not found"));

        const body = UpdateSheddingSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid shedding data"));

        const shedding = await prisma.shedding.update({ where: { id }, data: body.data });
        res.json(shedding);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE /:id ─────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.shedding.findUnique({
            where: { id },
            include: { pet: { select: { userId: true } } },
        });
        if (!existing || existing.pet.userId !== req.user!.id)
            return next(notFound("Shedding not found"));

        await prisma.shedding.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

export default router;
