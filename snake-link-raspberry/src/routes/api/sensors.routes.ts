import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { SensorReading } from "../../types/sensor.js";
import { calculateSensorStatus } from "../../utils/sensorStatus.js";

const router = Router();
const store = new DataStorageService("./data");
const configStore = store.getSensorConfigStore();
const liveStore = store.getLiveDataStore();

// GET /api/sensors
router.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = configStore.load();
        const live = liveStore.load();

        const result = config.sensors.map((sensor) => {
            const reading = live[sensor.id];
            const status = calculateSensorStatus(sensor, reading);

            return {
                ...sensor,
                reading: reading ?? null,
                status,
            };
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// GET /api/sensors/:id
router.get("/:id", (req: Request, res: any, next: NextFunction) => {
    try {
        const config = configStore.load();
        const live = liveStore.load();
        const sensor = config.sensors.find((s) => s.id === req.params.id);

        if (!sensor) {
            return res.status(404).json({ error: "Sensor not found" });
        }

        const reading = live[sensor.id];
        const status = calculateSensorStatus(sensor, reading);

        res.json({
            ...sensor,
            reading: reading ?? null,
            status,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/sensors/:id
router.post("/:id", (req: Request, res: any, next: NextFunction) => {
    try {
        const sensorId = req.params.id;
        const config = configStore.load();
        const sensor = config.sensors.find((s) => s.id === sensorId);

        if (!sensor) {
            return res.status(404).json({ error: "Sensor not found" });
        }

        const reading = req.body as SensorReading;
        const current = liveStore.load();
        current[sensorId] = {
            ...reading,
            timestamp: Date.now(),
        };

        liveStore.save(current);
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/sensors/:id/active
router.patch("/:id/active", (req: Request, res: any, next: NextFunction) => {
    try {
        const sensorId = req.params.id;
        const config = configStore.load();
        const sensorIndex = config.sensors.findIndex((s) => s.id === sensorId);

        if (sensorIndex === -1) {
            return res.status(404).json({ error: "Sensor not found" });
        }

        config.sensors[sensorIndex].active = !!req.body.active;
        configStore.save(config);
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
