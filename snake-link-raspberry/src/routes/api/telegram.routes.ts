/**
 * @file Express route to trigger Telegram alerts.
 */

import { Router, Request } from "express";
import crypto from "crypto";
import { broadcastTestMessage } from "../../services/alert.service.js";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { hasPermission } from "../../utils/permissions.js";

const registrationStore = new DataStorageService("./data").getTelegramRegistrationKeysStore();

const router = Router();

/**
 * @openapi
 * /api/telegram/test:
 *   post:
 *     tags:
 *       - Telegram
 *     summary: Test alert sending
 *     description: Send a test alert to all registered Telegram users.
 *     responses:
 *       200:
 *         description: Alert sent successfully.
 *       500:
 *         description: Failed to send alert.
 */
router.post("/test", async (req: Request, res: any) => {
    try {
        await broadcastTestMessage();

        return res.status(200).json({ message: "Alert sent" });
    } catch (err) {
        console.error("Telegram send error:", err);
        return res.status(500).json({ error: "Failed to send alert" });
    }
});

/**
 * @openapi
 * /api/telegram/generate:
 *   post:
 *     tags:
 *       - Telegram
 *     summary: Generate a new registration token
 *     description: Generate a new registration token for Telegram bot.
 *     responses:
 *       201:
 *         description: Token created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The generated registration token.
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       409:
 *         description: Token already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.post("/generate", authMiddleware, (req: Request, res: any) => {
    const user = req.user!;

    if (!hasPermission(user, "isAdmin")) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const current = registrationStore.load();
    const newToken = crypto.randomBytes(6).toString("hex"); // z. B. 12-stellig

    if (current.includes(newToken)) {
        return res.status(409).json({ error: "Token already exists" });
    }

    current.push(newToken);
    registrationStore.save(current);
    res.status(201).json({ token: newToken });
});

/**
 * @openapi
 * /api/telegram:
 *   get:
 *     tags:
 *       - Telegram
 *     summary: Get all registration tokens
 *     description: Retrieve a list of all registration tokens.
 *     responses:
 *       200:
 *         description: A list of registration tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Registration token
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get("/", authMiddleware, (req: Request, res: any) => {
    const user = req.user!;

    if (!hasPermission(user, "isAdmin")) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const current = registrationStore.load();
    res.json({ tokens: current });
});


/**
 * @openapi
 * /api/telegram/{code}:
 *   delete:
 *     tags:
 *       - Telegram
 *     summary: Delete a registration token
 *     description: Delete a registration token.
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         description: Registration token to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token deleted successfully.
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.delete("/:code", authMiddleware, (req: Request, res: any) => {
    const user = req.user!;

    if (!hasPermission(user, "isAdmin")) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const token = req.params.code;
    const current = registrationStore.load();

    if (!current.includes(token)) {
        return res.status(404).json({ error: "Token not found" });
    }

    const filtered = current.filter((t) => t !== token);
    registrationStore.save(filtered);

    res.status(200).json({ message: "Token deleted" });
});

export default router;
