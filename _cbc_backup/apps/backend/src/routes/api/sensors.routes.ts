import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest, forbidden, notFound } from "../../helpers/errors.js";
import { paramString } from "../../utils/params.js";
import type { Prisma } from "../../generated/prisma/client.js";

const router = Router();

router.use(authMiddleware);

// ─── Validation Schemas ──────────────────────────────────────

const CreateSensorSchema = z.object({
    enclosureId: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    type: z.enum(["TEMPERATURE", "HUMIDITY", "PRESSURE", "WATER"]),
    unit: z.string().min(1).max(20),
    homeAssistantEntityId: z.string().optional(),
    limitsJson: z.unknown().optional(),
    active: z.boolean().optional(),
});

const UpdateSensorSchema = CreateSensorSchema.partial();

// ─── GET / ───────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sensors = await prisma.sensor.findMany({
            where: { userId: req.user!.id },
            include: { enclosure: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json(sensors);
    } catch (err) {
        next(err);
    }
});

// ─── POST / ──────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateSensorSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid sensor data"));

        const { enclosureId, name, type, unit, homeAssistantEntityId, limitsJson, active } =
            body.data;

        if (enclosureId) {
            const enclosure = await prisma.enclosure.findUnique({ where: { id: enclosureId } });
            if (!enclosure || enclosure.userId !== req.user!.id)
                return next(forbidden("Enclosure not found or not yours"));
        }

        const sensor = await prisma.sensor.create({
            data: {
                userId: req.user!.id,
                enclosureId: enclosureId ?? null,
                name,
                type,
                unit,
                homeAssistantEntityId: homeAssistantEntityId ?? null,
                limitsJson:
                    limitsJson !== undefined ? (limitsJson as Prisma.InputJsonValue) : undefined,
                active: active ?? true,
            },
        });
        res.status(201).json(sensor);
    } catch (err) {
        next(err);
    }
});

// ─── GET /:id ────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const sensor = await prisma.sensor.findUnique({ where: { id } });
        if (!sensor || sensor.userId !== req.user!.id) return next(notFound("Sensor not found"));
        res.json(sensor);
    } catch (err) {
        next(err);
    }
});

// ─── PUT /:id ────────────────────────────────────────────────

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.sensor.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user!.id)
            return next(notFound("Sensor not found"));

        const body = UpdateSensorSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid sensor data"));

        if (body.data.enclosureId) {
            const enclosure = await prisma.enclosure.findUnique({
                where: { id: body.data.enclosureId },
            });
            if (!enclosure || enclosure.userId !== req.user!.id)
                return next(forbidden("Enclosure not found or not yours"));
        }

        const updateData: Prisma.SensorUncheckedUpdateInput = {};
        if (body.data.name !== undefined) updateData.name = body.data.name;
        if (body.data.type !== undefined) updateData.type = body.data.type;
        if (body.data.unit !== undefined) updateData.unit = body.data.unit;
        if (body.data.enclosureId !== undefined) updateData.enclosureId = body.data.enclosureId;
        if (body.data.homeAssistantEntityId !== undefined)
            updateData.homeAssistantEntityId = body.data.homeAssistantEntityId;
        if (body.data.limitsJson !== undefined)
            updateData.limitsJson = body.data.limitsJson as Prisma.InputJsonValue;
        if (body.data.active !== undefined) updateData.active = body.data.active;

        const sensor = await prisma.sensor.update({ where: { id }, data: updateData });
        res.json(sensor);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE /:id ─────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const existing = await prisma.sensor.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user!.id)
            return next(notFound("Sensor not found"));

        await prisma.sensor.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── GET /:id/readings ──────────────────────────────────────

const ReadingsQuerySchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(10000).default(100),
});

router.get("/:id/readings", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const sensor = await prisma.sensor.findUnique({ where: { id } });
        if (!sensor || sensor.userId !== req.user!.id) return next(notFound("Sensor not found"));

        const query = ReadingsQuerySchema.safeParse(req.query);
        if (!query.success) return next(badRequest("Invalid query parameters"));

        const { from, to, limit } = query.data;

        const readings = await prisma.sensorReading.findMany({
            where: {
                sensorId: id,
                ...(from || to
                    ? { recordedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
                    : {}),
            },
            orderBy: { recordedAt: "desc" },
            take: limit,
        });
        res.json(readings);
    } catch (err) {
        next(err);
    }
});

// ─── POST /:id/readings ─────────────────────────────────────

const CreateReadingSchema = z.object({
    value: z.number().nullable(),
    recordedAt: z.coerce.date(),
});

router.post("/:id/readings", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const sensor = await prisma.sensor.findUnique({ where: { id } });
        if (!sensor || sensor.userId !== req.user!.id) return next(notFound("Sensor not found"));

        const body = CreateReadingSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid reading data"));

        const reading = await prisma.sensorReading.create({
            data: { sensorId: id, ...body.data },
        });
        res.status(201).json(reading);
    } catch (err) {
        next(err);
    }
});

export default router;
