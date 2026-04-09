import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest, forbidden, notFound } from "../../helpers/errors.js";
import { paramString } from "../../utils/params.js";

const router = Router();

router.use(authMiddleware);

// ─── Validation Schemas ──────────────────────────────────────

const CreatePetSchema = z.object({
    enclosureId: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    species: z.string().min(1).max(100),
    morph: z.string().max(100).optional(),
    gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
    birthDate: z.coerce.date().optional(),
    acquisitionDate: z.coerce.date().optional(),
    notes: z.string().max(2000).optional(),
    imageUrl: z.string().url().optional(),
});

const UpdatePetSchema = CreatePetSchema.partial();

// ─── GET / ───────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pets = await prisma.pet.findMany({
            where: { userId: req.user!.id },
            include: {
                enclosure: { select: { id: true, name: true } },
                _count: { select: { feedings: true, sheddings: true, weightRecords: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(pets);
    } catch (err) {
        next(err);
    }
});

// ─── POST / ──────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreatePetSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid pet data"));

        // Verify enclosure ownership if provided
        if (body.data.enclosureId) {
            const enclosure = await prisma.enclosure.findUnique({
                where: { id: body.data.enclosureId },
            });
            if (!enclosure || enclosure.userId !== req.user!.id)
                return next(forbidden("Enclosure not found or not yours"));
        }

        const pet = await prisma.pet.create({
            data: { ...body.data, userId: req.user!.id },
        });
        res.status(201).json(pet);
    } catch (err) {
        next(err);
    }
});

// ─── GET /:id ────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const pet = await prisma.pet.findUnique({
            where: { id },
            include: {
                enclosure: { select: { id: true, name: true } },
                _count: { select: { feedings: true, sheddings: true, weightRecords: true } },
            },
        });
        if (!pet || pet.userId !== req.user!.id) return next(notFound("Pet not found"));
        res.json(pet);
    } catch (err) {
        next(err);
    }
});

// ─── PUT /:id ────────────────────────────────────────────────

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.pet.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user!.id) return next(notFound("Pet not found"));

        const body = UpdatePetSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid pet data"));

        // Verify enclosure ownership if changing
        if (body.data.enclosureId) {
            const enclosure = await prisma.enclosure.findUnique({
                where: { id: body.data.enclosureId },
            });
            if (!enclosure || enclosure.userId !== req.user!.id)
                return next(forbidden("Enclosure not found or not yours"));
        }

        const pet = await prisma.pet.update({
            where: { id },
            data: body.data,
        });
        res.json(pet);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE /:id ─────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.pet.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user!.id) return next(notFound("Pet not found"));

        await prisma.pet.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

export default router;
