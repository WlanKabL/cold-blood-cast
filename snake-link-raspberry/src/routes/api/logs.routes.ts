import { Router, Request, Response, NextFunction } from "express";
import { DataStorageService } from "../../storage/dataStorageService.js";

const router = Router();
const store = new DataStorageService("./data");
const logStore = store.getSensorLogStore();

// GET /api/logs/?from=timestamp&to=timestamp&sensor=sensorId&limit=number&offset=number
/**
 * @openapi
 * /api/logs:
 *   get:
 *     tags:
 *       - Logs
 *     summary: Get logs
 *     parameters:
 *       - name: from
 *         in: query
 *         required: false
 *         description: Start timestamp (in milliseconds)
 *         schema:
 *           type: integer
 *       - name: to
 *         in: query
 *         required: false
 *         description: End timestamp (in milliseconds)
 *         schema:
 *           type: integer
 *       - name: sensor
 *         in: query
 *         required: false
 *         description: Sensor ID to filter logs by
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of logs to return (default is 500)
 *         schema:
 *           type: integer
 *       - name: offset
 *         in: query
 *         required: false
 *         description: Offset for pagination (default is 0)
 *         schema:
 *           type: integer
 */
router.get("/", (req: Request, res: any, next: NextFunction) => {
    try {
        const allLogs = logStore.load([]);

        const now = Date.now();
        const defaultTo = now;
        const defaultFrom = now - 24 * 60 * 60 * 1000;

        const from = req.query.from ? parseInt(req.query.from as string) : defaultFrom;
        const to = req.query.to ? parseInt(req.query.to as string) : defaultTo;
        const sensorId = req.query.sensor as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 500;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        if (sensorId) {
            const config = store.getSensorConfigStore().load();
            const sensorExists = config.sensors.some((s) => s.id === sensorId);
            if (!sensorExists) {
                return res.status(404).json({
                    error: "Sensor not found",
                    sensor: sensorId,
                });
            }
        }

        const timeFiltered = allLogs.filter(
            (entry) => entry.timestamp >= from && entry.timestamp <= to,
        );

        const total = timeFiltered.length;

        const paged = timeFiltered.slice(offset, offset + limit);

        const results = paged.map((entry) => {
            if (!sensorId) return entry;
            const reading = entry.readings[sensorId];
            return {
                timestamp: entry.timestamp,
                value: reading?.value ?? null,
                unit: reading?.unit ?? null,
            };
        });

        res.json({
            total,
            from,
            to,
            limit,
            offset,
            count: results.length,
            results,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
