import { Router, type Request, type Response, type NextFunction } from "express";
import crypto, { createHash, randomInt } from "crypto";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { userStore } from "../../stores/userStore.js";
import { hashPassword, verifyPassword, generateSalt } from "../../helpers/hash.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_OPTIONS,
} from "../../helpers/jwt.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { badRequest, unauthorized, forbidden, notFound, conflict } from "../../helpers/errors.js";
import { isAdmin } from "../../utils/permissions.js";
import { paramString } from "../../utils/params.js";
import { resolveUserFeatures } from "../../services/featureFlags.service.js";
import { auditLog } from "../../services/audit.service.js";
import { getRegistrationMode, getSystemSetting } from "../../services/settings.service.js";
import { validateAndUseInviteCode } from "../../services/invites.service.js";
import { normalizeUserAgent } from "../../helpers/user-agent.js";
import { sendMail } from "../../services/mail.service.js";
import {
    verifyEmailTemplate,
    passwordResetTemplate,
    newLoginTemplate,
    pendingReviewTemplate,
    accountDeletionTemplate,
    accountDeletedTemplate,
} from "../../services/mail/templates.js";
import {
    notifyNewUser,
    notifyLogin,
    notifyFirstLogin,
    notifyPendingApproval,
} from "../../services/notification.service.js";
import { env } from "../../config.js";

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────

const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

const RegisterSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(32),
    password: z.string().min(8),
    displayName: z.string().max(64).optional(),
    inviteCode: z.string().min(1).optional(),
});

// ─── POST /login ─────────────────────────────────────────────

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = LoginSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid login payload"));

        const { username, password } = body.data;

        const user = await userStore.findByUsername(username);
        if (!user) return next(unauthorized("Invalid credentials"));

        const valid = verifyPassword(password, user.salt, user.passwordHash);
        if (!valid) return next(unauthorized("Invalid credentials"));

        const accessToken = signAccessToken(user);
        const { token: refreshToken, tokenId } = signRefreshToken(user);

        await prisma.refreshToken.create({
            data: {
                tokenId,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
        res.json({
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });

        // Track login session with device fingerprint (fire-and-forget)
        void trackLoginDevice(user, req);
        prisma.user
            .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
            .catch(() => {});
    } catch (err) {
        next(err);
    }
});

// ─── POST /register ──────────────────────────────────────────

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = RegisterSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid registration payload"));

        const { email, username, password, displayName, inviteCode } = body.data;

        // ── Enforce registration_mode ────────────────────────
        const regMode = await getRegistrationMode();

        if (regMode === "closed") {
            return next(forbidden("Registration is currently closed"));
        }

        if (regMode === "invite") {
            if (!inviteCode) return next(badRequest("An invite code is required to register"));
        }

        // ── Check require_approval ───────────────────────────
        const requireApproval = (await getSystemSetting("require_approval")) === "true";

        // Check uniqueness
        const existingUsername = await userStore.findByUsername(username);
        if (existingUsername) return next(conflict("Username already taken"));

        const existingEmail = await userStore.findByEmail(email);
        if (existingEmail) return next(conflict("Email already registered"));

        // Validate invite code before user creation
        if (regMode === "invite" && inviteCode) {
            const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
            if (!invite || !invite.active)
                return next(badRequest("Invalid or expired invite code"));
            if (invite.expiresAt && invite.expiresAt < new Date())
                return next(badRequest("Invalid or expired invite code"));
            if (invite.uses >= invite.maxUses)
                return next(badRequest("Invite code has been fully used"));
        }

        // Create user
        const salt = generateSalt();
        const passwordHash = hashPassword(password, salt);

        const user = await userStore.create({
            email,
            username,
            passwordHash,
            salt,
            displayName,
            approved: !requireApproval,
        });

        // Consume invite code after successful user creation
        if (regMode === "invite" && inviteCode) {
            await validateAndUseInviteCode(inviteCode, user.id);
        }

        // Assign default role
        const defaultRoleName = (await getSystemSetting("default_role")) ?? "FREE";
        const defaultRole = await prisma.role.findUnique({ where: { name: defaultRoleName } });
        if (defaultRole) {
            await prisma.userRole
                .create({
                    data: { userId: user.id, roleId: defaultRole.id },
                })
                .catch(() => {});
        }

        // If approval is required, don't issue tokens
        if (requireApproval) {
            notifyPendingApproval(user.username, email);
            void sendMail({
                to: email,
                subject: "Registration under review — Cold Blood Cast",
                html: pendingReviewTemplate({ username: user.username }),
                log: { userId: user.id, template: "pending_review" },
            });

            res.status(201).json({
                pendingApproval: true,
                user: { id: user.id, username: user.username, email: user.email },
            });
            return;
        }

        notifyNewUser(user.username, email);
        void sendVerificationEmail(user.id);

        // Issue tokens
        const accessToken = signAccessToken(user);
        const { token: refreshToken, tokenId } = signRefreshToken(user);

        await prisma.refreshToken.create({
            data: {
                tokenId,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(201).json({
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── POST /refresh ───────────────────────────────────────────

router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!token) return next(unauthorized("No refresh token"));

        const payload = verifyRefreshToken(token);

        const stored = await prisma.refreshToken.findUnique({
            where: { tokenId: payload.tokenId },
        });
        if (!stored || stored.expiresAt < new Date()) {
            if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
            return next(unauthorized("Refresh token expired or revoked"));
        }

        const user = await userStore.findById(payload.userId);
        if (!user) return next(unauthorized("User not found"));

        // Rotate: delete old, issue new
        await prisma.refreshToken.delete({ where: { id: stored.id } });

        const accessToken = signAccessToken(user);
        const { token: newRefreshToken, tokenId } = signRefreshToken(user);

        await prisma.refreshToken.create({
            data: {
                tokenId,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);
        res.json({ accessToken });
    } catch (err) {
        next(err);
    }
});

// ─── POST /logout ────────────────────────────────────────────

router.post("/logout", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.[REFRESH_COOKIE_NAME];
        if (token) {
            try {
                const payload = verifyRefreshToken(token);
                await prisma.refreshToken.deleteMany({ where: { tokenId: payload.tokenId } });
            } catch {
                // Token invalid — still clear cookie
            }
        }

        res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── GET /me ─────────────────────────────────────────────────

router.get("/me", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        const { features, enabledFlags, limits } = await resolveUserFeatures(user.id);

        const roles = await prisma.userRole.findMany({
            where: { userId: user.id },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        color: true,
                        showBadge: true,
                        priority: true,
                    },
                },
            },
        });

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            locale: user.locale,
            timezone: user.timezone,
            isAdmin: user.isAdmin,
            emailVerified: user.emailVerified,
            approved: user.approved,
            banned: user.banned,
            createdAt: user.createdAt,
            roles: roles.map((ur) => ur.role),
            features,
            enabledFlags,
            limits,
        });
    } catch (err) {
        next(err);
    }
});

// ─── PATCH /me ───────────────────────────────────────────────

const UpdateProfileSchema = z.object({
    displayName: z.string().max(64).optional(),
    locale: z.enum(["de", "en"]).optional(),
    timezone: z.string().max(64).optional(),
});

router.patch("/me", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = UpdateProfileSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const updated = await prisma.user.update({
            where: { id: req.user!.id },
            data: body.data,
        });
        res.json({
            id: updated.id,
            username: updated.username,
            email: updated.email,
            displayName: updated.displayName,
            locale: updated.locale,
            timezone: updated.timezone,
        });
    } catch (err) {
        next(err);
    }
});

// ─── POST /change-password ───────────────────────────────────

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
});

router.post(
    "/change-password",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = ChangePasswordSchema.safeParse(req.body);
            if (!body.success) return next(badRequest("Invalid payload"));

            const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
            if (!user) return next(notFound("User not found"));

            const valid = verifyPassword(body.data.currentPassword, user.salt, user.passwordHash);
            if (!valid) return next(unauthorized("Current password is incorrect"));

            const salt = generateSalt();
            const passwordHash = hashPassword(body.data.newPassword, salt);

            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash, salt },
            });

            await auditLog(user.id, "user.password.change", "User", user.id, undefined, req.ip);
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── Login Device Tracking ───────────────────────────────────

async function trackLoginDevice(
    user: { id: string; username: string; email: string; lastActiveAt: Date | null },
    req: Request,
): Promise<void> {
    try {
        const safeIp = req.ip ?? "unknown";
        const safeUa = req.headers["user-agent"] ?? "unknown";
        const normalizedUa = normalizeUserAgent(safeUa);
        const fingerprint = createHash("sha256").update(normalizedUa).digest("hex");

        const existing = await prisma.loginSession.findFirst({
            where: { userId: user.id, fingerprint },
        });

        await prisma.loginSession.create({
            data: {
                userId: user.id,
                ipAddress: safeIp,
                userAgent: safeUa,
                fingerprint,
            },
        });

        const isFirstLogin = !user.lastActiveAt;

        if (isFirstLogin) {
            notifyFirstLogin(user.username);
        } else {
            notifyLogin(user.username, safeIp);
        }

        if (!existing && !isFirstLogin) {
            const timestamp = `${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`;
            void sendMail({
                to: user.email,
                subject: "New login to your Cold Blood Cast account",
                html: newLoginTemplate({
                    username: user.username,
                    ipAddress: safeIp,
                    userAgent: safeUa,
                    timestamp,
                }),
                log: { userId: user.id, template: "new_login" },
            });
        }
    } catch {
        // Never let device tracking break the login flow
    }
}

// ─── Email Verification ──────────────────────────────────────

async function sendVerificationEmail(userId: string): Promise<void> {
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            verificationCode: code,
            verificationCodeExpiresAt: expiresAt,
        },
        select: { email: true, username: true },
    });

    const verifyUrl = `${env().FRONTEND_URL}/verify-email?code=${code}`;

    void sendMail({
        to: user.email,
        subject: "Verify your email — Cold Blood Cast",
        html: verifyEmailTemplate({
            username: user.username,
            verifyUrl,
            code,
            expiresInMinutes: 30,
        }),
        log: { userId, template: "verify_email" },
    });
}

const VerifyEmailSchema = z.object({
    code: z.string().min(6).max(6),
});

router.post(
    "/verify-email",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = VerifyEmailSchema.safeParse(req.body);
            if (!body.success) return next(badRequest("Invalid verification code"));

            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                select: {
                    emailVerified: true,
                    verificationCode: true,
                    verificationCodeExpiresAt: true,
                },
            });
            if (!user) return next(notFound("User not found"));
            if (user.emailVerified) return res.json({ verified: true });

            if (!user.verificationCode || user.verificationCode !== body.data.code) {
                return next(badRequest("Invalid verification code"));
            }
            if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
                return next(badRequest("Verification code has expired. Please request a new one"));
            }

            await prisma.user.update({
                where: { id: req.user!.id },
                data: {
                    emailVerified: true,
                    verificationCode: null,
                    verificationCodeExpiresAt: null,
                },
            });

            await auditLog(
                req.user!.id,
                "user.email.verified",
                "User",
                req.user!.id,
                undefined,
                req.ip,
            );
            res.json({ verified: true });
        } catch (err) {
            next(err);
        }
    },
);

router.post(
    "/resend-verification",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                select: { emailVerified: true },
            });
            if (!user) return next(notFound("User not found"));
            if (user.emailVerified) return next(badRequest("Email is already verified"));

            await sendVerificationEmail(req.user!.id);
            res.json({ sent: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── Forgot Password ────────────────────────────────────────

const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

router.post("/forgot-password", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = ForgotPasswordSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid email"));

        // Always return success to prevent email enumeration
        const user = await prisma.user.findFirst({
            where: { email: { equals: body.data.email, mode: "insensitive" } },
            select: { id: true, username: true, email: true },
        });

        if (user) {
            const token = crypto.randomUUID();
            const tokenHash = createHash("sha256").update(token).digest("hex");
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await prisma.user.update({
                where: { id: user.id },
                data: { resetToken: tokenHash, resetTokenExpiresAt: expiresAt },
            });

            const resetUrl = `${env().FRONTEND_URL}/reset-password?token=${token}`;

            void sendMail({
                to: user.email,
                subject: "Reset your password — Cold Blood Cast",
                html: passwordResetTemplate({
                    username: user.username,
                    resetUrl,
                    expiresInMinutes: 15,
                }),
                log: { userId: user.id, template: "password_reset" },
            });

            await auditLog(
                user.id,
                "user.password.reset_requested",
                "User",
                user.id,
                undefined,
                req.ip,
            );
        }

        res.json({ sent: true });
    } catch (err) {
        next(err);
    }
});

// ─── Reset Password ─────────────────────────────────────────

const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
});

router.post("/reset-password", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = ResetPasswordSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const tokenHash = createHash("sha256").update(body.data.token).digest("hex");

        const user = await prisma.user.findFirst({
            where: {
                resetToken: tokenHash,
                resetTokenExpiresAt: { gt: new Date() },
            },
        });

        if (!user) return next(badRequest("Invalid or expired reset token"));

        const salt = generateSalt();
        const passwordHash = hashPassword(body.data.password, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                salt,
                resetToken: null,
                resetTokenExpiresAt: null,
            },
        });

        // Revoke all refresh tokens for security
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

        await auditLog(user.id, "user.password.reset", "User", user.id, undefined, req.ip);
        res.json({ reset: true });
    } catch (err) {
        next(err);
    }
});

// ─── Request Account Deletion (via email) ────────────────────

router.post(
    "/request-account-deletion",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                select: { id: true, username: true, email: true },
            });
            if (!user) return next(notFound("User not found"));

            const token = crypto.randomUUID();
            const tokenHash = createHash("sha256").update(token).digest("hex");
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await prisma.user.update({
                where: { id: user.id },
                data: { deleteToken: tokenHash, deleteTokenExpiresAt: expiresAt },
            });

            const confirmUrl = `${env().FRONTEND_URL}/confirm-delete?token=${token}`;

            void sendMail({
                to: user.email,
                subject: "Confirm account deletion — Cold Blood Cast",
                html: accountDeletionTemplate({
                    username: user.username,
                    confirmUrl,
                    expiresInHours: 24,
                }),
                log: { userId: user.id, template: "account_deletion" },
            });

            await auditLog(user.id, "user.deletion.requested", "User", user.id, undefined, req.ip);
            res.json({ sent: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── Confirm Account Deletion (via token) ────────────────────

const ConfirmDeletionSchema = z.object({
    token: z.string().min(1),
});

router.post(
    "/confirm-account-deletion",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = ConfirmDeletionSchema.safeParse(req.body);
            if (!body.success) return next(badRequest("Invalid payload"));

            const tokenHash = createHash("sha256").update(body.data.token).digest("hex");

            const user = await prisma.user.findFirst({
                where: {
                    deleteToken: tokenHash,
                    deleteTokenExpiresAt: { gt: new Date() },
                },
                select: { id: true, username: true, email: true },
            });

            if (!user) return next(badRequest("Invalid or expired deletion token"));

            // Send goodbye email before deletion
            void sendMail({
                to: user.email,
                subject: "Account deleted — Cold Blood Cast",
                html: accountDeletedTemplate({ username: user.username }),
                log: { template: "account_deleted" },
            });

            // Cascading delete via Prisma relations
            await prisma.user.delete({ where: { id: user.id } });

            res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
            res.json({ deleted: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── GET /registration-status ────────────────────────────────

router.get("/registration-status", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const mode = await getRegistrationMode();
        res.json({ mode });
    } catch (err) {
        next(err);
    }
});

// ─── Registration Key Management (admin only) ───────────────

router.get(
    "/registration-keys",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAdmin(req.user)) return next(forbidden());

            const keys = await prisma.registrationKey.findMany({
                orderBy: { createdAt: "desc" },
            });
            res.json(keys);
        } catch (err) {
            next(err);
        }
    },
);

router.post(
    "/registration-keys",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAdmin(req.user)) return next(forbidden());

            const key = await prisma.registrationKey.create({
                data: { key: crypto.randomUUID() },
            });
            res.status(201).json(key);
        } catch (err) {
            next(err);
        }
    },
);

router.delete(
    "/registration-keys/:id",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAdmin(req.user)) return next(forbidden());

            const id = paramString(req, "id");
            const existing = await prisma.registrationKey.findUnique({ where: { id } });
            if (!existing) return next(notFound("Registration key not found"));

            await prisma.registrationKey.delete({ where: { id } });
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
