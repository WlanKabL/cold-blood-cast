import { type FastifyInstance } from "fastify";
import { AppError, ErrorCodes, badRequest, unauthorized } from "@/helpers/index.js";
import { authGuard } from "@/middleware/index.js";
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    confirmAccountDeletionSchema,
    changeUsernameSchema,
    requestEmailChangeSchema,
    confirmEmailChangeSchema,
} from "./auth.schemas.js";
import {
    registerUser,
    loginUser,
    changePassword,
    refreshTokens,
    logoutUser,
    logoutAllDevices,
    verifyEmail,
    resendVerificationCode,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    requestAccountDeletion,
    confirmAccountDeletion,
    changeUsername,
    requestEmailChange,
    confirmEmailChange,
} from "./auth.service.js";

import { env } from "@/config/env.js";

const REFRESH_COOKIE = "kl_refresh_token";

function cookieOptions() {
    return {
        httpOnly: true,
        secure: env().NODE_ENV === "production",
        sameSite: "strict" as const,
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        signed: true,
    };
}

export async function authRoutes(app: FastifyInstance) {
    // Stricter rate limit for auth routes (5 attempts per minute)
    const authRateLimit = {
        config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    };

    // ── GET /api/auth/registration-status ────────
    // Public endpoint – lets the register page check the mode before showing the form
    app.get("/registration-status", async (_request, reply) => {
        const { getSystemSetting } = await import("@/modules/admin/settings.service.js");
        const mode = await getSystemSetting<string>("registration_mode", "open");
        return reply.send({ success: true, data: { mode } });
    });

    // ── GET /api/auth/platform-status ────────────
    // Public endpoint – returns maintenance mode status
    app.get("/platform-status", async (_request, reply) => {
        const { getSystemSetting } = await import("@/modules/admin/settings.service.js");
        const maintenance = await getSystemSetting<boolean>("maintenance_mode", false);
        return reply.send({ success: true, data: { maintenance } });
    });

    // ── POST /api/auth/register ──────────────────
    app.post("/register", { ...authRateLimit }, async (request, reply) => {
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        const result = await registerUser(parsed.data, {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
        });

        // If approval is required, don't issue tokens
        if (result.pendingApproval || !result.tokens) {
            return reply.status(201).send({
                success: true,
                data: {
                    user: result.user,
                    pendingApproval: true,
                },
            });
        }

        reply.setCookie(REFRESH_COOKIE, result.tokens.refreshToken, cookieOptions());

        return reply.status(201).send({
            success: true,
            data: {
                user: result.user,
                tokens: {
                    accessToken: result.tokens.accessToken,
                },
                marketingDispatch: result.marketingDispatch,
            },
        });
    });

    // ── POST /api/auth/login ─────────────────────
    app.post("/login", { ...authRateLimit }, async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        const result = await loginUser(parsed.data, request.ip, request.headers["user-agent"]);

        reply.setCookie(REFRESH_COOKIE, result.tokens.refreshToken, cookieOptions());

        return reply.send({
            success: true,
            data: {
                user: result.user,
                tokens: {
                    accessToken: result.tokens.accessToken,
                },
            },
        });
    });

    // ── POST /api/auth/refresh ───────────────────
    app.post(
        "/refresh",
        { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
        async (request, reply) => {
            // Read from signed cookie first, then fall back to body
            let refreshToken: string | undefined;
            const cookieVal = request.cookies[REFRESH_COOKIE];
            if (cookieVal) {
                const unsigned = request.unsignCookie(cookieVal);
                refreshToken = unsigned.valid ? unsigned.value! : undefined;
            }
            if (!refreshToken) {
                refreshToken = (request.body as { refreshToken?: string })?.refreshToken;
            }

            if (!refreshToken) {
                throw unauthorized(
                    ErrorCodes.E_AUTH_REFRESH_TOKEN_INVALID,
                    "No refresh token provided",
                );
            }

            const result = await refreshTokens(refreshToken);

            reply.setCookie(REFRESH_COOKIE, result.tokens.refreshToken, cookieOptions());

            return reply.send({
                success: true,
                data: {
                    tokens: {
                        accessToken: result.tokens.accessToken,
                    },
                },
            });
        },
    );

    // ── POST /api/auth/logout ────────────────────
    app.post("/logout", async (request, reply) => {
        const cookieVal = request.cookies[REFRESH_COOKIE];
        if (cookieVal) {
            const unsigned = request.unsignCookie(cookieVal);
            if (unsigned.valid && unsigned.value) {
                await logoutUser(unsigned.value);
            }
        }

        reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });

        return reply.send({ success: true });
    });

    // ── POST /api/auth/logout-all ────────────────
    app.post("/logout-all", { preHandler: [authGuard] }, async (request, reply) => {
        await logoutAllDevices(request.userId);

        reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });

        return reply.send({ success: true });
    });

    // ── PATCH /api/auth/password ──────────────────
    app.patch("/password", { preHandler: [authGuard] }, async (request, reply) => {
        const parsed = changePasswordSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        await changePassword(request.userId!, parsed.data);

        reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });

        return reply.send({ success: true, message: "Password changed successfully" });
    });

    // ── PATCH /api/auth/profile ────────────────
    app.patch("/profile", { preHandler: [authGuard] }, async (request, reply) => {
        const parsed = updateProfileSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        const user = await updateProfile(request.userId, parsed.data);

        return reply.send({ success: true, data: { user } });
    });

    // ── GET /api/auth/me ─────────────────────────
    app.get("/me", { preHandler: [authGuard] }, async (request, reply) => {
        const { prisma } = await import("@/config/index.js");
        const { resolveUserFeatures, resolveUserLimits, getEnabledFeatureKeys, getFeatureTiers } =
            await import("@/modules/admin/feature-flags.service.js");

        const user = await prisma.user.findUnique({
            where: { id: request.userId },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                createdAt: true,
                emailVerified: true,
                onboardingCompleted: true,
                locale: true,
                weeklyReportEnabled: true,
                usernameChangedAt: true,
            },
        });

        if (!user) {
            throw new AppError(ErrorCodes.E_USER_NOT_FOUND, 404, "User not found");
        }

        // Resolve roles, features, and limits for the frontend
        const [features, limits, enabledFlags] = await Promise.all([
            resolveUserFeatures(request.userId),
            resolveUserLimits(request.userId),
            getEnabledFeatureKeys(),
        ]);

        // For locked features: which role would unlock them?
        const featureTiers = await getFeatureTiers(request.userId, features);

        return reply.send({
            success: true,
            data: {
                user,
                roles: request.userRoles,
                features,
                limits,
                enabledFlags,
                featureTiers,
                impersonatedBy: request.impersonatedBy ?? null,
            },
        });
    });

    // ── POST /api/auth/verify-email ──────────────
    app.post("/verify-email", { preHandler: [authGuard] }, async (request, reply) => {
        const parsed = verifyEmailSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        await verifyEmail(request.userId, parsed.data);

        return reply.send({ success: true, data: { verified: true } });
    });

    // ── POST /api/auth/resend-verification ───────
    app.post(
        "/resend-verification",
        { preHandler: [authGuard], ...authRateLimit },
        async (request, reply) => {
            await resendVerificationCode(request.userId);

            return reply.send({ success: true, data: { sent: true } });
        },
    );

    // ── POST /api/auth/forgot-password ───────────
    app.post("/forgot-password", { ...authRateLimit }, async (request, reply) => {
        const parsed = forgotPasswordSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        await requestPasswordReset(parsed.data);

        // Always return success to prevent email enumeration
        return reply.send({ success: true, data: { sent: true } });
    });

    // ── POST /api/auth/reset-password ────────────
    app.post("/reset-password", { ...authRateLimit }, async (request, reply) => {
        const parsed = resetPasswordSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        await resetPassword(parsed.data);

        return reply.send({ success: true, data: { reset: true } });
    });

    // ── POST /api/auth/request-account-deletion ──
    app.post(
        "/request-account-deletion",
        { preHandler: [authGuard], ...authRateLimit },
        async (request, reply) => {
            await requestAccountDeletion(request.userId);

            return reply.send({ success: true, data: { sent: true } });
        },
    );

    // ── POST /api/auth/confirm-account-deletion ──
    app.post("/confirm-account-deletion", { ...authRateLimit }, async (request, reply) => {
        const parsed = confirmAccountDeletionSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        await confirmAccountDeletion(parsed.data);

        reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });

        return reply.send({ success: true, data: { deleted: true } });
    });

    // ── POST /api/auth/change-username ────────────
    app.post(
        "/change-username",
        { ...authRateLimit, preHandler: [authGuard] },
        async (request, reply) => {
            const parsed = changeUsernameSchema.safeParse(request.body);
            if (!parsed.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Validation failed",
                    parsed.error.format(),
                );
            }

            const result = await changeUsername(request.userId, parsed.data);

            return reply.send({ success: true, data: result });
        },
    );

    // ── POST /api/auth/request-email-change ──────
    app.post(
        "/request-email-change",
        { ...authRateLimit, preHandler: [authGuard] },
        async (request, reply) => {
            const parsed = requestEmailChangeSchema.safeParse(request.body);
            if (!parsed.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Validation failed",
                    parsed.error.format(),
                );
            }

            await requestEmailChange(request.userId, parsed.data);

            return reply.send({ success: true, data: { sent: true } });
        },
    );

    // ── POST /api/auth/confirm-email-change ──────
    app.post("/confirm-email-change", { preHandler: [authGuard] }, async (request, reply) => {
        const parsed = confirmEmailChangeSchema.safeParse(request.body);
        if (!parsed.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Validation failed",
                parsed.error.format(),
            );
        }

        const result = await confirmEmailChange(request.userId, parsed.data);

        return reply.send({ success: true, data: result });
    });
}
