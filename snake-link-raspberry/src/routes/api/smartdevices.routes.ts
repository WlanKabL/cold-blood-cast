import { Router, Request, Response, NextFunction } from "express";
import { servicesStore } from "../../stores/servicesStore.js";
import { TapoCloudService } from "../../services/tapoCloud.service.js";

const router = Router();

/**
 * @openapi
 * /api/smartdevices:
 *   get:
 *     tags:
 *       - Smart Devices
 *     summary: List all TP-Link smart plug devices from the cache
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tapoService = servicesStore.get<TapoCloudService>("tapoCloudService");
        const devices = tapoService.getCachedDevices();
        res.status(200).json({ devices });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/smartdevices/fetch:
 *   post:
 *     tags:
 *       - Smart Devices
 *     summary: Fetch all devices from Tapo Cloud and update cache
 */
router.post("/fetch", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tapoService = servicesStore.get<TapoCloudService>("tapoCloudService");
        const devices = await tapoService.fetchDevices();

        res.status(200).json({ devices });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/smartdevices/:deviceId/state:
 *   post:
 *     tags:
 *       - Smart Devices
 *     summary: Turn a Tapo device on or off
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               on:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: State change success
 */
router.post("/:deviceId/state", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { deviceId } = req.params;
        const { on } = req.body;

        const tapoService = servicesStore.get<TapoCloudService>("tapoCloudService");

        if (on) {
            await tapoService.turnOn(deviceId);
        } else {
            await tapoService.turnOff(deviceId);
        }

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
