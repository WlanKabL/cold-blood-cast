import { Router } from "express";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Get health status of the server
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/", (req, res) => {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;

    const uptimeHR = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    res.status(200).json({
        ok: true,
        uptime: process.uptime(), // Sekunden seit Start
        timestamp: Date.now(),
        uptimeHR,
        memoryUsage: process.memoryUsage(),
        platform: process.platform,
        arch: process.arch,
        version: process.env.npm_package_version || "dev",
    });
});

export default router;
