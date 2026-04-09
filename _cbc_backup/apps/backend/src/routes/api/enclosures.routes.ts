import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest, notFound } from "../../helpers/errors.js";
import { paramString } from "../../utils/params.js";

const router = Router();

router.use(authMiddleware);

// ─── Validation Schemas ──────────────────────────────────────

const CreateEnclosureSchema = z.object({
    name: z.string().min(1).max(100),
    type: z
        .enum(["TERRARIUM", "VIVARIUM", "AQUARIUM", "PALUDARIUM", "RACK", "OTHER"])
        .default("TERRARIUM"),
    species: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    lengthCm: z.number().int().positive().optional(),
    widthCm: z.number().int().positive().optional(),
    heightCm: z.number().int().positive().optional(),
});

const UpdateEnclosureSchema = CreateEnclosureSchema.partial();

// ─── GET / ───────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const enclosures = await prisma.enclosure.findMany({
            where: { userId: req.user!.id },
            include: {
                _count: { select: { pets: true, sensors: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(enclosures);
    } catch (err) {
        next(err);
    }
});

// ─── POST / ──────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateEnclosureSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid enclosure data"));

        const enclosure = await prisma.enclosure.create({
            data: { ...body.data, userId: req.user!.id },
        });
        res.status(201).json(enclosure);
    } catch (err) {
        next(err);
    }
});

// ─── GET /:id ────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const enclosure = await prisma.enclosure.findUnique({
            where: { id },
            include: {
                pets: { select: { id: true, name: true, species: true, imageUrl: true } },
                sensors: { select: { id: true, name: true, type: true, unit: true, active: true } },
            },
        });
        if (!enclosure || enclosure.userId !== req.user!.id)
            return next(notFound("Enclosure not found"));
        res.json(enclosure);
    } catch (err) {
        next(err);
    }
});

// ─── PUT /:id ────────────────────────────────────────────────

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.enclosure.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user!.id)
            return next(notFound("Enclosure not found"));

        const body = UpdateEnclosureSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid enclosure data"));

        const enclosure = await prisma.enclosure.update({
            where: { id },
            data: body.data,
        });
        res.json(enclosure);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE /:id ─────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.enclosure.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user!.id)
            return next(notFound("Enclosure not found"));

        await prisma.enclosure.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

export default router;
