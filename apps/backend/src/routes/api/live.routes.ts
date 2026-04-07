import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { calculateSensorStatus } from "../../utils/sensorStatus.js";
import type { PublicSensorResponse } from "@cold-blood-cast/shared";
import { notFound } from "../../helpers/errors.js";

const router = Router();
const store = new DataStorageService("./data");
const liveStore = store.getLiveDataStore();
const configStore = store.getSensorConfigStore();
const appConfigStore = store.getAppConfigStore();

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
                const { id, name, type, unit, readingLimits, limitsType } = sensor;
                const reading = live[sensor.id] ?? null;
                const status = calculateSensorStatus(
                    sensor,
                    reading,
                    appConfigStore.load().general,
                );

                return {
                    id,
                    name,
                    type,
                    unit,
                    limitsType,
                    readingLimits,
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
        if (!sensor) return next(notFound("Sensor not found"));

        const { active, hardware, reader, private: isPrivate, ...publicSensor } = sensor;

        const reading = live[sensor.id] ?? null;
        const status = calculateSensorStatus(sensor, reading, appConfigStore.load().general);

        res.json({
            ...publicSensor,
            reading,
            status,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
