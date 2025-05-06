import { Router, Request, Response, NextFunction } from "express";
import { servicesStore } from "../../stores/servicesStore.js";
import { HomeAssistantService } from "../../services/homeAssistant.service.js";

const router = Router();

// Helper
const getService = (): HomeAssistantService =>
    servicesStore.get<HomeAssistantService>("homeAssistantService");


/**
 * @openapi
 * /api/smartdevices:
 *   get:
 *     summary: Get cached smart devices
 *     description: Retrieve a list of cached smart devices from the Home Assistant service.
 *     responses:
 *       200:
 *         description: A list of cached smart devices.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 devices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HassDevice'
 *       500:
 *         description: Internal server error.
 */
router.get("/", async (_req, res, next) => {
    try {
        const devices = await getService().getCachedDevices();
        res.status(200).json({ devices });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/smartdevices/fetch:
 *   post:
 *     summary: Fetch smart devices
 *     description: Fetch the latest list of smart devices from the Home Assistant service.
 *     responses:
 *       200:
 *         description: A list of fetched smart devices.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 devices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HassDevice'
 *       500:
 *         description: Internal server error.
 */
router.post("/fetch", async (_req, res, next) => {
    try {
        const devices = await getService().fetchDevices();
        res.status(200).json({ devices });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/smartdevices/{entityId}/on:
 *   post:
 *     summary: Turn on a smart device
 *     description: Turn on a specific smart device by its entity ID.
 *     parameters:
 *       - name: entityId
 *         in: path
 *         required: true
 *         description: The entity ID of the smart device to turn on.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The device was successfully turned on.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Internal server error.
 */
router.post("/:entityId/on", async (req, res, next) => {
    try {
        const { entityId } = req.params;

        await getService().turnOn(entityId);

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/smartdevices/{entityId}/off:
 *   post:
 *     summary: Turn off a smart device
 *     description: Turn off a specific smart device by its entity ID.
 *     parameters:
 *       - name: entityId
 *         in: path
 *         required: true
 *         description: The entity ID of the smart device to turn off.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The device was successfully turned off.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Internal server error.
 */
router.post("/:entityId/off", async (req, res, next) => {
    try {
        const { entityId } = req.params;

        await getService().turnOff(entityId);

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/smartdevices/{entityId}/status:
 *   get:
 *     summary: Get the status of a smart device
 *     description: Retrieve the full status of a specific smart device by its entity ID.
 *     parameters:
 *       - name: entityId
 *         in: path
 *         required: true
 *         description: The entity ID of the smart device to retrieve the status for.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The status of the smart device.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   $ref: '#/components/schemas/HassDevice'
 *       500:
 *         description: Internal server error.
 */
router.get("/:entityId/status", async (req, res, next) => {
    try {
        const { entityId } = req.params;
        const status = await getService().getDeviceStatus(entityId);
        res.status(200).json({ status });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/smartdevices/_meta/domains:
 *   get:
 *     summary: Get all available domains
 *     description: Retrieve a list of all available domains for smart devices.
 *     responses:
 *       200:
 *         description: A list of available domains.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 domains:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error.
 */
router.get("/_meta/domains", async (_req, res, next) => {
    try {
        const domains = await getService().getDomains();
        res.status(200).json({ domains });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/smartdevices/_meta/services:
 *   get:
 *     summary: Get all available services
 *     description: Retrieve a list of all available services for smart devices.
 *     responses:
 *       200:
 *         description: A list of available services.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error.
 */
router.get("/_meta/services", async (_req, res, next) => {
    try {
        const services = await getService().getAvailableServices();
        res.status(200).json({ services });
    } catch (err) {
        next(err);
    }
});

export default router;
