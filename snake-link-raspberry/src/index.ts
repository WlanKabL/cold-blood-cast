/**
 * @file index.ts
 * @description Entry point for the SnakeLink Raspberry backend.
 *              Sets up Express app, WebSocket server, sensor polling,
 *              logging, routes, and graceful shutdown.
 */

import "dotenv/config";
import express, { Application, Router } from "express";
import { createServer as createHttpServer, Server as HttpServer } from "http";
import cors from "cors";
import helmet from "helmet";
import chalk from "chalk";
import { WebSocketServer, WebSocket } from "ws";
import { DataStorageService } from "./storage/dataStorageService.js";
import configRoutes from "./routes/api/config.routes.js";
import sensorRoutes from "./routes/api/sensors.routes.js";
import presetRoutes from "./routes/api/presets.routes.js";
import logRoutes from "./routes/api/logs.routes.js";
import liveRoutes from "./routes/api/live.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { broadcast } from "./utils/broadcast.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { validateEnv } from "./config.js";
import authRoutes from "./routes/api/auth.routes.js";
import { swaggerDocsHandler, swaggerSpec, swaggerUiHandler } from "./docs/swagger.js";
import { SensorPollingService } from "./services/sensorPolling.js";
import { SensorLoggingService } from "./services/sensorLogging.js";
import { servicesStore } from "./stores/servicesStore.js";

/**
 * Bootstraps the application:
 * - Validates environment variables
 * - Configures Express with security + parsing middleware
 * - Registers routes and error handler
 * - Starts HTTP + WebSocket servers
 * - Launches sensor polling & logging
 * - Handles graceful shutdown and uncaught errors
 */
async function bootstrap(): Promise<void> {
    // 1) Validate and load environment settings
    const env = validateEnv(process.env);
    const port = env.PORT;

    // 2) Create Express app
    const app: Application = express();
    app.use(helmet()); // basic security headers
    app.use(
        cors({
            origin: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()), // allow multiple origins
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        }),
    ); // configurable CORS
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 3) Mount routes
    const apiRouter = Router();
    apiRouter.use("/config", configRoutes);
    apiRouter.use("/sensors", sensorRoutes);
    apiRouter.use("/presets", presetRoutes);
    apiRouter.use("/logs", logRoutes);
    apiRouter.use("/live", liveRoutes);
    apiRouter.use("/auth", authRoutes);
    apiRouter.use("/docs", swaggerUiHandler, swaggerDocsHandler);
    app.get("/api/docs.json", (req, res) => {
        res.json(swaggerSpec);
    });

    app.use("/api", apiRouter);
    app.use("/health", healthRoutes);

    // 4) Global error handler
    app.use(errorMiddleware);

    // 5) Initialize data stores
    const dataStore = new DataStorageService(env.DATA_DIR);
    const configStore = dataStore.getSensorConfigStore();
    const liveStore = dataStore.getLiveDataStore();
    const logStore = dataStore.getSensorLogStore();
    const appConfigStore = dataStore.getAppConfigStore();
    const appConfig = appConfigStore.load();

    // 6) Create HTTP + WebSocket servers
    const httpServer: HttpServer = createHttpServer(app);
    const wss = new WebSocketServer({ server: httpServer });
    broadcast.setServer(wss);

    wss.on("connection", (ws: WebSocket) => {
        console.log(chalk.blue("[WS] New client connected"));
    });

    // 7) Start listening and background services
    httpServer.listen(port, () => {
        console.log(chalk.green(`🌿 Backend listening on port ${port}`));

        const sensorPollingService = new SensorPollingService(
            configStore,
            liveStore,
            appConfigStore,
            broadcast,
        );
        sensorPollingService.start();

        const sensorLoggingService = new SensorLoggingService(liveStore, logStore, appConfigStore);
        sensorLoggingService.start();

        servicesStore.register("sensorLoggingService", sensorLoggingService);
        servicesStore.register("sensorPollingService", sensorPollingService);
    });

    // 8) Graceful shutdown logic
    const shutdown = (): void => {
        console.log(chalk.yellow("🛑 Shutting down..."));

        servicesStore.get<SensorPollingService>("sensorPollingService").stop();
        servicesStore.get<SensorLoggingService>("sensorLoggingService").stop();

        wss.close();
        httpServer.close(() => {
            console.log(chalk.yellow("✔️ Shutdown complete."));
            process.exit(0);
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

// Run bootstrap and handle startup errors
bootstrap().catch((err) => {
    console.error(chalk.red("Failed to bootstrap application:"), err);
    process.exit(1);
});
