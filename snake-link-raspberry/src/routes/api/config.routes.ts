import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { isValidPartialSensorConfig, SensorConfig } from "../../types/sensor.js";
import { isValidPartialAppConfig } from "../../types/config.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { hasPermission, isAdmin } from "../../utils/permissions.js";
import { servicesStore } from "../../stores/servicesStore.js";
import { SensorPollingService } from "../../services/sensorPolling.js";
import { SensorLoggingService } from "../../services/sensorLogging.js";

const router = Router();
const store = new DataStorageService("./data");
const sensorConfigStore = store.getSensorConfigStore();
const appConfigStore = store.getAppConfigStore();

// -- Sensor config routes ------------------------------

/**
 * @openapi
 * /api/config/sensors:
 *   get:
 *     tags:
 *       - Config
 *     summary: Get all sensor configurations
 *     description: Retrieve a list of all configured sensors.
 *     responses:
 *       200:
 *         description: A list of sensors.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorConfig'
 *       500:
 *         description: Internal server error.
 */
router.get("/sensors", authMiddleware, (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = sensorConfigStore.load();
        res.json(config.sensors);
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/config/sensors:
 *   post:
 *     tags:
 *       - Config
 *     summary: Save sensor configurations
 *     description: Save a list of sensor configurations.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/SensorConfig'
 *     responses:
 *       200:
 *         description: Success message.
 *       500:
 *         description: Internal server error.
 */
router.post("/sensors", authMiddleware, (req: Request, res: any, next: NextFunction) => {
    try {
        const user = req.user!;
        const allowed = isAdmin(user);

        if (!allowed) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const sensors = req.body as SensorConfig[];

        sensorConfigStore.save({ sensors });

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/config/sensor/{id}:
 *   get:
 *     tags:
 *       - Config
 *     summary: Get a specific sensor configuration
 *     description: Retrieve the configuration of a specific sensor by its ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the sensor to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The sensor configuration.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorConfig'
 *       404:
 *         description: Sensor not found.
 */
router.get("/sensor/:id", authMiddleware, (req: Request, res: any, next: NextFunction) => {
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

/**
 * @openapi
 * /api/config/sensor/{id}:
 *   put:
 *     tags:
 *       - Config
 *     summary: Update a sensor configuration
 *     description: Update the configuration of a specific sensor.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the sensor to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SensorConfig'
 *     responses:
 *       200:
 *         description: Success message.
 *       404:
 *         description: Sensor not found.
 */
router.put("/sensor/:id", authMiddleware, (req: Request, res: any, next: NextFunction) => {
    try {
        const user = req.user!;
        const allowed = hasPermission(user, "manageSensors", req.params.id);

        if (!allowed) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { id } = req.params;
        const update = req.body;

        if (!isValidPartialSensorConfig(update)) {
            return res.status(400).json({ error: "Invalid SensorConfig structure" });
        }

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

/**
 * @openapi
 * /api/config/app:
 *   get:
 *     tags:
 *       - Config
 *     summary: Get app configuration
 *     description: Retrieve the application configuration.
 *     responses:
 *       200:
 *         description: The application configuration.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppConfig'
 */
router.get("/app", authMiddleware, (req: Request, res: any, next: NextFunction) => {
    try {
        const user = req.user!;
        const allowed = hasPermission(user, "manageAppConfig");

        if (!allowed) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const config = appConfigStore.load();
        res.json(config);
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/config/app:
 *   post:
 *     tags:
 *       - Config
 *     summary: Save app configuration
 *     description: Save the application configuration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppConfig'
 *     responses:
 *       200:
 *         description: Success message.
 */
router.post("/app", authMiddleware, (req: Request, res: any, next: NextFunction) => {
    try {
        const user = req.user!;
        const allowed = hasPermission(user, "manageAppConfig");

        if (!allowed) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const update = req.body;

        if (!isValidPartialAppConfig(update)) {
            return res.status(400).json({ error: "Invalid AppConfig structure" });
        }

        const current = appConfigStore.load();

        const merged = { ...current, ...update };
        appConfigStore.save(merged);

        const pollingService = servicesStore.get<SensorPollingService>("sensorPollingService");
        const loggingService = servicesStore.get<SensorLoggingService>("sensorLoggingService");

        pollingService.restart();
        loggingService.restart();

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
