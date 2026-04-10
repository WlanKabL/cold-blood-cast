import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { loadEnv, env } from "@/config/env.js";
import { prisma } from "@/config/database.js";
import { AppError, ErrorCodes, serviceUnavailable } from "@/helpers/errors.js";
import { verifyAccessToken } from "@/helpers/jwt.js";
import { authRoutes } from "@/modules/auth/index.js";
import { uploadRoutes } from "@/modules/uploads/index.js";
import { fileServingRoutes } from "@/modules/uploads/file-serving.routes.js";
import { adminRoutes } from "@/modules/admin/index.js";
import { announcementRoutes } from "@/modules/announcements/index.js";
import { apiKeyRoutes } from "@/modules/api-keys/index.js";
import { inviteRoutes } from "@/modules/invites/index.js";
import { emailAdminRoutes } from "@/modules/mail/index.js";
import { accessRequestRoutes } from "@/modules/access-requests/index.js";
import { legalRoutes } from "@/modules/legal/index.js";
import { cookieConsentRoutes } from "@/modules/cookie-consent/index.js";
import { enclosureRoutes } from "@/modules/enclosures/index.js";
import { petRoutes } from "@/modules/pets/index.js";
import { petPhotoRoutes } from "@/modules/pet-photos/index.js";
import { sensorRoutes } from "@/modules/sensors/index.js";
import { feedingRoutes } from "@/modules/feedings/index.js";
import { feedItemRoutes } from "@/modules/feed-items/index.js";
import { feedingReminderRoutes, startFeedingReminderScheduler, stopFeedingReminderScheduler } from "@/modules/feeding-reminders/index.js";
import { sheddingRoutes } from "@/modules/sheddings/index.js";
import { weightRoutes } from "@/modules/weights/index.js";
import {
    startMaintenanceScheduler,
    stopMaintenanceScheduler,
} from "@/modules/maintenance/index.js";
import { notifyServerError } from "@/modules/notifications/notification.service.js";

// ─── Bootstrap ───────────────────────────────────────────────

async function main() {
    loadEnv();

    const app = Fastify({
        logger: {
            level: env().NODE_ENV === "development" ? "debug" : "info",
            transport:
                env().NODE_ENV === "development"
                    ? { target: "pino-pretty", options: { colorize: true } }
                    : undefined,
        },
        trustProxy: true,
    });

    // ── Plugins ──────────────────────────────────
    await app.register(cors, {
        origin: env().CORS_ORIGIN,
        credentials: true,
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Impersonate-User"],
    });

    await app.register(cookie, {
        secret: env().COOKIE_SECRET,
    });

    if (env().NODE_ENV === "production") {
        await app.register(helmet, {
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: "cross-origin" },
        });
    }

    await app.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute",
        keyGenerator: (request) => request.ip,
        allowList: (request) => {
            const authHeader = request.headers.authorization;
            if (authHeader?.startsWith("Bearer ")) {
                try {
                    const payload = verifyAccessToken(authHeader.slice(7));
                    return !!payload?.userId;
                } catch {
                    // Invalid / expired token → apply rate limit normally
                }
            }
            return false;
        },
    });

    await app.register(multipart, {
        limits: { fileSize: env().MAX_FILE_SIZE },
    });

    // Ensure upload directory exists
    const uploadDir = resolve(env().UPLOAD_DIR);
    await mkdir(uploadDir, { recursive: true });

    // Swagger API docs (development only)
    if (env().NODE_ENV !== "production") {
        await app.register(swagger, {
            openapi: {
                info: {
                    title: "KeeperLog API",
                    description: "Smart Terrarium Monitoring & Alerting System API",
                    version: "0.1.0",
                },
                servers: [
                    {
                        url: `http://localhost:${env().PORT}`,
                        description: "Development",
                    },
                ],
            },
        });

        await app.register(swaggerUi, {
            routePrefix: "/docs",
        });
    }

    // ── Maintenance Mode Global Hook ───────────────
    let maintenanceCache: { value: boolean; ts: number } = { value: false, ts: 0 };
    const MAINTENANCE_TTL = 30_000;

    const MAINTENANCE_ALLOWED = new Set([
        "/api/health",
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/auth/platform-status",
        "/api/auth/registration-status",
        "/api/access-requests",
    ]);

    app.addHook("onRequest", async (request, _reply) => {
        const pathname = request.url.split("?")[0];
        if (MAINTENANCE_ALLOWED.has(pathname)) return;

        const now = Date.now();
        if (now - maintenanceCache.ts > MAINTENANCE_TTL) {
            const { getSystemSetting } = await import("@/modules/admin/settings.service.js");
            maintenanceCache = {
                value: await getSystemSetting<boolean>("maintenance_mode", false),
                ts: now,
            };
        }

        if (!maintenanceCache.value) return;

        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const payload = verifyAccessToken(authHeader.slice(7));
                const userRoles = await prisma.userRole.findMany({
                    where: { userId: payload.userId },
                    include: { role: { select: { name: true } } },
                });
                if (userRoles.some((ur) => ur.role.name === "ADMIN")) return;
            } catch {
                // Invalid token — fall through to maintenance page
            }
        }

        throw serviceUnavailable(
            ErrorCodes.E_MAINTENANCE_MODE,
            "The application is currently under maintenance. Please try again later.",
        );
    });

    // ── Global Error Handler ─────────────────────
    app.setErrorHandler((error: unknown, _request, reply) => {
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(error.toResponse());
        }

        if (
            error !== null &&
            typeof error === "object" &&
            "validation" in error &&
            error.validation
        ) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "E_VALIDATION_ERROR",
                    message: "Validation failed",
                    details: (error as { validation: unknown }).validation,
                },
            });
        }

        app.log.error(error);

        const isDev = env().NODE_ENV === "development";
        const message = isDev && error instanceof Error ? error.message : "Internal server error";

        const errMsg = error instanceof Error ? error.message : String(error);
        notifyServerError(errMsg, _request.url);

        return reply.status(500).send({
            success: false,
            error: {
                code: "E_INTERNAL_SERVER_ERROR",
                message,
                ...(isDev && error instanceof Error ? { type: error.constructor.name } : {}),
            },
        });
    });

    // ── Health Check ─────────────────────────────
    app.get("/api/health", async (_request, reply) => {
        const checks: Record<string, "ok" | "error"> = {
            server: "ok",
            database: "error",
        };

        try {
            await prisma.$queryRawUnsafe("SELECT 1");
            checks.database = "ok";
        } catch {
            /* stays "error" */
        }

        const allHealthy = Object.values(checks).every((v) => v === "ok");

        return reply.status(allHealthy ? 200 : 503).send({
            success: allHealthy,
            data: {
                status: allHealthy ? "ok" : "degraded",
                version: process.env.APP_VERSION || "dev",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                checks,
            },
        });
    });

    // ── Routes ───────────────────────────────────
    await app.register(authRoutes, { prefix: "/api/auth" });
    await app.register(uploadRoutes, { prefix: "/api/uploads" });
    await app.register(fileServingRoutes);
    await app.register(adminRoutes, { prefix: "/api/admin" });
    await app.register(announcementRoutes, { prefix: "/api/announcements" });
    await app.register(apiKeyRoutes, { prefix: "/api/api-keys" });
    await app.register(inviteRoutes, { prefix: "/api/invites" });
    await app.register(emailAdminRoutes, { prefix: "/api/admin/emails" });
    await app.register(accessRequestRoutes, { prefix: "/api/access-requests" });
    await app.register(legalRoutes);
    await app.register(cookieConsentRoutes);

    // ── CBC Domain Routes ────────────────────────
    await app.register(enclosureRoutes, { prefix: "/api/enclosures" });
    await app.register(petRoutes, { prefix: "/api/pets" });
    await app.register(petPhotoRoutes, { prefix: "/api/pets" });
    await app.register(sensorRoutes, { prefix: "/api/sensors" });
    await app.register(feedingRoutes, { prefix: "/api/feedings" });
    await app.register(feedItemRoutes, { prefix: "/api/feed-items" });
    await app.register(feedingReminderRoutes, { prefix: "/api/feeding-reminders" });
    await app.register(sheddingRoutes, { prefix: "/api/sheddings" });
    await app.register(weightRoutes, { prefix: "/api/weights" });

    // ── Start Maintenance Scheduler (daily 03:00 Berlin) ──
    try {
        startMaintenanceScheduler();
        app.log.info("Maintenance scheduler started");
    } catch (err) {
        app.log.warn({ err }, "Failed to start maintenance scheduler");
    }

    // ── Start Feeding Reminder Scheduler (daily 08:00 Berlin) ──
    try {
        startFeedingReminderScheduler();
        app.log.info("Feeding reminder scheduler started");
    } catch (err) {
        app.log.warn({ err }, "Failed to start feeding reminder scheduler");
    }

    // ── Graceful Shutdown ────────────────────────
    const shutdown = async (signal: string) => {
        app.log.info(`Received ${signal}, shutting down...`);
        stopMaintenanceScheduler();
        stopFeedingReminderScheduler();
        await app.close();
        await prisma.$disconnect();
        process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // ── Start ────────────────────────────────────
    try {
        await app.listen({ port: env().PORT, host: env().HOST });
        app.log.info(`🐍 KeeperLog API running at http://${env().HOST}:${env().PORT}`);
        if (env().NODE_ENV !== "production") {
            app.log.info(`📚 Swagger docs at http://localhost:${env().PORT}/docs`);
        }
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();
