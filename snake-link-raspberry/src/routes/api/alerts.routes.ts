/**
 * @file Express route to trigger Telegram alerts.
 */

import { Router, Request } from "express";
import { broadcastAlert } from "../../services/alert.service.js";
import { SensorConfig } from "../../types/sensor.js";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { calculateSensorStatus } from "../../utils/sensorStatus.js";

const router = Router();

router.post("/", async (req: Request, res: any) => {
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
        console.error("Telegram send error:", err);
        return res.status(500).json({ error: "Failed to send alert" });
    }
});

export default router;
