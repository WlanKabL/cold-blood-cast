import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { calculateSensorStatus } from "../../utils/sensorStatus.js";
import { PublicSensorResponse } from "../../types/sensor.js";

const router = Router();
const store = new DataStorageService("./data");
const liveStore = store.getLiveDataStore();
const configStore = store.getSensorConfigStore();

/**
 * @openapi
 * /api/live:
 *   get:
 *     tags:
 *       - Live
 *     summary: Get all sensors
 *     responses:
 *       200:
 *         description: List of sensors
 */
router.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = configStore.load();
        const live = liveStore.load();

        const result: PublicSensorResponse[] = config.sensors.map(
            (sensor): PublicSensorResponse => {
                const { id, name, type, unit, min, max } = sensor;
                const reading = live[sensor.id] ?? null;
                const status = calculateSensorStatus(sensor, reading);

                return {
                    id,
                    name,
                    type,
                    unit,
                    min,
                    max,
                    reading,
                    status,
                };
            },
        );

        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/live/{sensorId}:
 *   get:
 *     tags:
 *       - Live
 *     summary: Get sensor by ID
 *     parameters:
 *       - name: sensorId
 *         in: path
 *         required: true
 *         description: Sensor ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sensor details
 */
router.get("/:sensorId", (req: Request, res: any, next: NextFunction) => {
    try {
        const { sensorId } = req.params;
        const config = configStore.load();
        const live = liveStore.load();

        const sensor = config.sensors.find((s) => s.id === sensorId);
        if (!sensor) return res.status(404).json({ error: "Sensor not found" });

        delete sensor.active; // Remove the active property from the response
        delete sensor.hardware; // Remove the hardware property from the response
        delete sensor.reader; // Remove the reader property from the response
        delete sensor.private; // Remove the private property from the response

        const reading = live[sensor.id] ?? null;
        const status = calculateSensorStatus(sensor, reading);

        res.json({
            ...sensor,
            reading,
            status,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
