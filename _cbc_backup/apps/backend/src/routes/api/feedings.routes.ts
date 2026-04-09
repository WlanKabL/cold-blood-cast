import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest, notFound } from "../../helpers/errors.js";
import { paramString } from "../../utils/params.js";

const router = Router();

router.use(authMiddleware);

// ─── Validation Schemas ──────────────────────────────────────

const CreateFeedingSchema = z.object({
    petId: z.string().uuid(),
    fedAt: z.coerce.date(),
    foodType: z.string().min(1).max(100),
    foodSize: z.string().max(50).optional(),
    quantity: z.number().int().min(1).default(1),
    accepted: z.boolean().default(true),
    notes: z.string().max(1000).optional(),
});

const UpdateFeedingSchema = CreateFeedingSchema.omit({ petId: true }).partial();

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

        const feedings = await prisma.feeding.findMany({
            where: {
                pet: { userId: req.user!.id },
                ...(petId ? { petId } : {}),
                ...(from || to
                    ? { fedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
                    : {}),
            },
            include: { pet: { select: { id: true, name: true } } },
            orderBy: { fedAt: "desc" },
            take: limit,
        });
        res.json(feedings);
    } catch (err) {
        next(err);
    }
});

// ─── POST / ──────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateFeedingSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid feeding data"));

        const pet = await prisma.pet.findUnique({ where: { id: body.data.petId } });
        if (!pet || pet.userId !== req.user!.id) return next(notFound("Pet not found"));

        const feeding = await prisma.feeding.create({ data: body.data });
        res.status(201).json(feeding);
    } catch (err) {
        next(err);
    }
});

// ─── GET /:id ────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const feeding = await prisma.feeding.findUnique({
            where: { id },
            include: { pet: { select: { id: true, name: true, userId: true } } },
        });
        if (!feeding || feeding.pet.userId !== req.user!.id)
            return next(notFound("Feeding not found"));
        res.json(feeding);
    } catch (err) {
        next(err);
    }
});

// ─── PUT /:id ────────────────────────────────────────────────

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.feeding.findUnique({
            where: { id },
            include: { pet: { select: { userId: true } } },
        });
        if (!existing || existing.pet.userId !== req.user!.id)
            return next(notFound("Feeding not found"));

        const body = UpdateFeedingSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid feeding data"));

        const feeding = await prisma.feeding.update({ where: { id }, data: body.data });
        res.json(feeding);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE /:id ─────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.feeding.findUnique({
            where: { id },
            include: { pet: { select: { userId: true } } },
        });
        if (!existing || existing.pet.userId !== req.user!.id)
            return next(notFound("Feeding not found"));

        await prisma.feeding.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

export default router;
