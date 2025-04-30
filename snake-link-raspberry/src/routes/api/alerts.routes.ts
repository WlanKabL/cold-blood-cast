/**
 * @file Express route to trigger Telegram alerts.
 */

import { Router, Request } from "express";
import { broadcastAlert } from "../../services/alert.service.js";
import { SensorConfig } from "../../types/sensor.js";
import { DataStorageService } from "../../storage/dataStorageService.js";

const router = Router();

router.post("/", async (req: Request, res: any) => {
    const { sensorId, status } = req.body;
    if (!sensorId || !status) {
        return res.status(400).json({ error: "sensorId and status are required" });
    }

    // Load sensor configuration
    const store = new DataStorageService("./data");
    const configStore = store.getSensorConfigStore();

    const config = configStore.load();

    const sensor = config.sensors.find(sensor => sensor.id === sensorId);

    if (!sensor) {
        return res.status(404).json({ error: "Sensor not found" });
    }

    try {
        await broadcastAlert(sensor, status);
        return res.status(200).json({ message: "Alert sent" });
    } catch (err) {
        console.error("Telegram send error:", err);
        return res.status(500).json({ error: "Failed to send alert" });
    }
});

export default router;
