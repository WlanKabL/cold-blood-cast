import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { hasPermission } from "../../utils/permissions.js";
import { detectI2CSensors } from "../../services/sensorDetection.js";
import { forbidden, notFound } from "../../helpers/errors.js";

const router = Router();
const store = new DataStorageService("./data");
const configStore = store.getSensorConfigStore();

/**
 * @openapi
 * /api/sensors/{id}/activated:
 *   patch:
 *     tags:
 *       - Sensors
 *     summary: Update sensor active status to true
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Sensor ID
 *         schema:
 *           type: string
 */
router.patch("/:id/activate", authMiddleware, (req: Request, res: any, next: NextFunction) => {
    try {
        const sensorId = req.params.id;
        const config = configStore.load();
        const sensorIndex = config.sensors.findIndex((s) => s.id === sensorId);

        if (sensorIndex === -1) {
            return next(notFound("Sensor not found"));
        }

        config.sensors[sensorIndex].active = true;
        configStore.save(config);
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/sensors/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Sensors
 *     summary: Update sensor active status to false
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Sensor ID
 *         schema:
 *           type: string
 */
router.patch("/:id/deactivate", authMiddleware, (req: Request, res: any, next: NextFunction) => {
    try {
        const sensorId = req.params.id;
        const config = configStore.load();
        const sensorIndex = config.sensors.findIndex((s) => s.id === sensorId);

        if (sensorIndex === -1) {
            return next(notFound("Sensor not found"));
        }

        config.sensors[sensorIndex].active = false;
        configStore.save(config);
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/sensors:
 *   get:
 *     tags:
 *       - Sensors
 *     summary: Get all sensor readings
 */
router.get("/scan", authMiddleware, async (req: Request, res: any, next: NextFunction) => {
    const user = req.user!;

    if (!hasPermission(user, "detectNewSensors")) {
        return next(forbidden());
    }

    const found = await detectI2CSensors();
    res.json({ i2c: found });
});

export default router;
