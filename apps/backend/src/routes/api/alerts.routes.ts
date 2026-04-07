/**
 * @file Express route to trigger Telegram alerts.
 */

import { Router, Request, NextFunction } from "express";
import { broadcastAlert } from "../../services/alert.service.js";
import type { SensorConfig } from "@cold-blood-cast/shared";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { calculateSensorStatus } from "../../utils/sensorStatus.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, async (req: Request, res: any, next: NextFunction) => {
    const store = new DataStorageService("./data");
    const configStore = store.getSensorConfigStore();
    const appConfigStore = store.getAppConfigStore();
    const liveStore = store.getLiveDataStore();
    const live = liveStore.load();

    const config = configStore.load();

    try {
        for (const sensor of config.sensors) {
            const sensorReading = live[sensor.id] ?? null;
            await broadcastAlert(
                sensor,
                calculateSensorStatus(sensor, sensorReading, appConfigStore.load().general),
            );
        }

        return res.status(200).json({ message: "Alert sent" });
    } catch (err) {
        next(err);
    }
});

export default router;
