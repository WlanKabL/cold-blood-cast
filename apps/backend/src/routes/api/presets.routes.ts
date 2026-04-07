import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { notFound, badRequest } from "../../helpers/errors.js";

const router = Router();
const dataStore = new DataStorageService("./data");
const configStore = dataStore.getSensorConfigStore();
const presetsStore = dataStore.getPresetsStore();

// GET /api/presets
/**
 * @openapi
 * /api/presets:
 *   get:
 *     tags:
 *       - Presets
 *     summary: Get all presets
 *     responses:
 *       200:
 *         description: A list of presets.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 */
router.get("/", (req: Request, res: any, next: NextFunction) => {
    try {
        const allPresets = presetsStore.load();

        if (!allPresets) {
            return next(notFound("No presets found"));
        }

        const list = Object.entries(allPresets).map(([id, preset]) => ({
            id,
            name: preset.name ?? id,
        }));
        res.json(list);
    } catch (err) {
        next(err);
    }
});

// GET /api/presets/:id
/**
 * @openapi
 * /api/presets/{id}:
 *   get:
 *     tags:
 *       - Presets
 *     summary: Get preset by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Preset ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Preset details
 */
router.get("/:id", (req: Request, res: any, next: NextFunction) => {
    try {
        const allPresets = presetsStore.load();

        if (!allPresets) {
            return next(notFound("No presets found"));
        }

        const preset = allPresets[req.params.id as string];
        if (!preset) {
            return next(notFound("Preset not found"));
        }
        res.json(preset);
    } catch (err) {
        next(err);
    }
});

// POST /api/presets/apply/:id
/**
 * @openapi
 * /api/presets/apply/{id}:
 *   post:
 *     tags:
 *       - Presets
 *     summary: Apply a preset by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Preset ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Preset applied successfully
 */
router.post("/apply/:id", (req: Request, res: any, next: NextFunction) => {
    try {
        const allPresets = presetsStore.load();

        if (!allPresets) {
            return next(notFound("No presets found"));
        }

        const preset = allPresets[req.params.id as string];
        if (!preset || !Array.isArray(preset.sensors)) {
            return next(badRequest("Invalid preset format"));
        }

        configStore.save({ sensors: preset.sensors });
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
