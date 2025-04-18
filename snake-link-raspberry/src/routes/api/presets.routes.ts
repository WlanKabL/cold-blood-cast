import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";

const router = Router();
const dataStore = new DataStorageService("./data");
const configStore = dataStore.getSensorConfigStore();
const presetsStore = dataStore.getPresetsStore();

// GET /api/presets
router.get("/", (req: Request, res: any, next: NextFunction) => {
    try {
        const allPresets = presetsStore.load();

        if (!allPresets) {
            return res.status(404).json({ error: "No presets found" });
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
router.get("/:id", (req: Request, res: any, next: NextFunction) => {
    try {
        const allPresets = presetsStore.load();

        if (!allPresets) {
            return res.status(404).json({ error: "No presets found" });
        }

        const preset = allPresets[req.params.id];
        if (!preset) {
            return res.status(404).json({ error: "Preset not found" });
        }
        res.json(preset);
    } catch (err) {
        next(err);
    }
});

// POST /api/presets/apply/:id
router.post("/apply/:id", (req: Request, res: any, next: NextFunction) => {
    try {
        const allPresets = presetsStore.load();

        if (!allPresets) {
            return res.status(404).json({ error: "No presets found" });
        }

        const preset = allPresets[req.params.id];
        if (!preset || !Array.isArray(preset.sensors)) {
            return res.status(400).json({ error: "Invalid preset format" });
        }

        configStore.save({ sensors: preset.sensors });
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
