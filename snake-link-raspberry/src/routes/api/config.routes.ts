import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { SensorConfig } from "../../types/sensor.js";
import { AppConfig } from "../../types/config.js";

const router = Router();
const store = new DataStorageService("./data");
const sensorConfigStore = store.getSensorConfigStore();
const appConfigStore = store.getAppConfigStore();

// -- Sensor config routes ------------------------------

// GET /api/config/sensors
router.get("/sensors", (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = sensorConfigStore.load();
        res.json(config.sensors);
    } catch (err) {
        next(err);
    }
});

// POST /api/config/sensors
router.post("/sensors", (req: Request, res: Response, next: NextFunction) => {
    try {
        const sensors = req.body as SensorConfig[];
        sensorConfigStore.save({ sensors });
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// GET /api/config/sensor/:id
router.get("/sensor/:id", (req: Request, res: any, next: NextFunction) => {
    try {
        const { id } = req.params;
        const config = sensorConfigStore.load();
        const sensor = config.sensors.find((s) => s.id === id);
        if (!sensor) {
            return res.status(404).json({ error: "Sensor not found" });
        }
        res.json(sensor);
    } catch (err) {
        next(err);
    }
});

// PUT /api/config/sensor/:id
router.put("/sensor/:id", (req: Request, res: any, next: NextFunction) => {
    try {
        const { id } = req.params;
        const update = req.body as Partial<SensorConfig>;
        const config = sensorConfigStore.load();
        const index = config.sensors.findIndex((s) => s.id === id);

        if (index === -1) {
            return res.status(404).json({ error: "Sensor not found" });
        }

        config.sensors[index] = { ...config.sensors[index], ...update };
        sensorConfigStore.save(config);

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// -- App config routes ---------------------------------

// GET /api/config/app
router.get("/app", (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = appConfigStore.load();
        res.json(config);
    } catch (err) {
        next(err);
    }
});

// POST /api/config/app
router.post("/app", (req: Request, res: Response, next: NextFunction) => {
    try {
        const update = req.body as Partial<AppConfig>;
        const current = appConfigStore.load();
        const merged = { ...current, ...update };
        appConfigStore.save(merged);
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
