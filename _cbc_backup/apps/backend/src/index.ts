/**
 * @file index.ts
 * @description Entry point for the Cold Blood Cast API.
 *              Sets up Express app, WebSocket server, routes, and graceful shutdown.
 */

import "dotenv/config";
import express, { type Application, Router } from "express";
import { createServer as createHttpServer, type Server as HttpServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import chalk from "chalk";
import { WebSocketServer, type WebSocket } from "ws";
import { prisma } from "./db/client.js";
import { broadcast } from "./utils/broadcast.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { loadEnv } from "./config.js";
import { swaggerDocsHandler, swaggerSpec, swaggerUiHandler } from "./docs/swagger.js";

import authRoutes from "./routes/api/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import sensorRoutes from "./routes/api/sensors.routes.js";
import enclosureRoutes from "./routes/api/enclosures.routes.js";
import petRoutes from "./routes/api/pets.routes.js";
import feedingRoutes from "./routes/api/feedings.routes.js";
import sheddingRoutes from "./routes/api/sheddings.routes.js";
import weightRoutes from "./routes/api/weights.routes.js";
import adminRoutes from "./routes/api/admin.routes.js";
import legalRoutes from "./routes/api/legal.routes.js";
import announcementRoutes from "./routes/api/announcements.routes.js";
import gdprRoutes from "./routes/api/gdpr.routes.js";
import accessRequestRoutes from "./routes/api/accessRequests.routes.js";
import apiKeyRoutes from "./routes/api/apiKeys.routes.js";
import uploadRoutes from "./routes/api/uploads.routes.js";

/**
 * Bootstraps the application:
 * - Validates environment variables
 * - Configures Express with security + parsing middleware
 * - Registers routes and error handler
 * - Starts HTTP + WebSocket servers
 * - Handles graceful shutdown
 */
async function bootstrap(): Promise<void> {
    const env = loadEnv();
    const port = env.PORT;

    // Create Express app with security middleware
    const app: Application = express();
    app.use(helmet());
    app.use(
        cors({
            origin: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        }),
    );
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mount API routes
    const apiRouter = Router();
    apiRouter.use("/auth", authRoutes);
    apiRouter.use("/sensors", sensorRoutes);
    apiRouter.use("/enclosures", enclosureRoutes);
    apiRouter.use("/pets", petRoutes);
    apiRouter.use("/feedings", feedingRoutes);
    apiRouter.use("/sheddings", sheddingRoutes);
    apiRouter.use("/weights", weightRoutes);
    apiRouter.use("/admin", adminRoutes);
    apiRouter.use("/legal", legalRoutes);
    apiRouter.use("/announcements", announcementRoutes);
    apiRouter.use("/gdpr", gdprRoutes);
    apiRouter.use("/access-requests", accessRequestRoutes);
    apiRouter.use("/api-keys", apiKeyRoutes);
    apiRouter.use("/uploads", uploadRoutes);
    apiRouter.use("/docs", swaggerUiHandler, swaggerDocsHandler);

    app.get("/api/docs.json", (_req, res) => {
        res.json(swaggerSpec);
    });

    app.use("/api", apiRouter);
    app.use("/health", healthRoutes);

    // Global error handler (must be last)
    app.use(errorMiddleware);

    // Create HTTP + WebSocket servers
    const httpServer: HttpServer = createHttpServer(app);
    const wss = new WebSocketServer({ server: httpServer });
    broadcast.setServer(wss);

    wss.on("connection", (_ws: WebSocket) => {
        console.warn(chalk.blue("[WS] New client connected"));
    });

    // Start listening
    httpServer.listen(port, () => {
        console.warn(chalk.green(`🌿 Cold Blood Cast API listening on port ${port}`));
    });

    // Graceful shutdown
    const shutdown = (): void => {
        console.warn(chalk.yellow("Shutting down..."));
        wss.close();
        prisma.$disconnect().finally(() => {
            httpServer.close(() => {
                console.warn(chalk.yellow("Shutdown complete."));
                process.exit(0);
            });
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("unhandledRejection", (reason) => {
        console.error(chalk.red("Unhandled Rejection:"), reason);
    });
    process.on("uncaughtException", (err) => {
        console.error(chalk.red("Uncaught Exception:"), err);
        shutdown();
    });
}

bootstrap().catch((err) => {
    console.error(chalk.red("Failed to bootstrap application:"), err);
    process.exit(1);
});
