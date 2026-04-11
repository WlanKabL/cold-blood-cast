import { randomUUID, randomInt, createHash } from "node:crypto";
import ms from "ms";
import type { StringValue } from "ms";
import { prisma } from "@/config/index.js";
import { env } from "@/config/env.js";
import {
    hashPassword,
    verifyPassword,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    AppError,
    ErrorCodes,
    badRequest,
    unauthorized,
    notFound,
} from "@/helpers/index.js";
import type { RefreshTokenPayload } from "@/helpers/index.js";
import type {
    RegisterInput,
    LoginInput,
    ChangePasswordInput,
    VerifyEmailInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    UpdateProfileInput,
    ConfirmAccountDeletionInput,
    AuthTokens,
} from "./auth.schemas.js";
import {
    notifyNewUser,
    notifyPendingApproval,
    notifyLogin,
    notifyFirstLogin,
} from "@/modules/notifications/notification.service.js";
import {
    sendMail,
    pendingReviewTemplate,
    verifyEmailTemplate,
    passwordResetTemplate,
    accountDeletionTemplate,
    accountDeletedTemplate,
    newLoginTemplate,
} from "@/modules/mail/index.js";
import { getSystemSetting } from "@/modules/admin/settings.service.js";
import {
    checkInviteCode,
    validateAndConsumeInviteCode,
} from "@/modules/invites/invites.service.js";
import pino from "pino";

// ─── Register ────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
    // Check registration mode
    const regMode = await getSystemSetting<string>("registration_mode", "open");

    if (regMode === "invite_only") {
        // An invite code is required
        if (!input.inviteCode) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "An invite code is required to register",
            );
        }
        // We validate and consume AFTER user creation so we can pass userId.
        // Pre-check to give early error feedback:
        const check = await checkInviteCode(input.inviteCode);
        if (!check.valid) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid or expired invite code");
        }
    }

    const needsApproval = regMode === "approval";

    const existingEmail = await prisma.user.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
    });
    if (existingEmail) {
        throw badRequest(ErrorCodes.E_AUTH_EMAIL_TAKEN, "Email is already registered");
    }

    const existingUsername = await prisma.user.findFirst({
        where: { username: { equals: input.username, mode: "insensitive" } },
    });
    if (existingUsername) {
        throw badRequest(ErrorCodes.E_AUTH_USERNAME_TAKEN, "Username is already taken");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
        data: {
            username: input.username.toLowerCase(),
            email: input.email.toLowerCase(),
            passwordHash,
            displayName: input.displayName ?? input.username,
            approved: !needsApproval,
        },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
        },
    });

    // Assign default role (FREE)
    const defaultRoleName = await getSystemSetting<string>("default_role", "FREE");
    const defaultRole = await prisma.role.findUnique({ where: { name: defaultRoleName } });
    if (defaultRole) {
        await prisma.userRole.create({
            data: { userId: user.id, roleId: defaultRole.id },
        });
    }

    // Consume invite code after successful user creation
    if (regMode === "invite_only" && input.inviteCode) {
        await validateAndConsumeInviteCode(input.inviteCode, user.id);
    }

    // If approval is required, return success but indicate pending status
    if (needsApproval) {
        notifyPendingApproval(user.username, user.email);

        // Send pending review email to the user (fire-and-forget)
        void sendMail({
            to: user.email,
            subject: "Your KeeperLog registration is under review ⏳",
            html: pendingReviewTemplate({ username: user.username }),
            log: { userId: user.id, template: "pending_review" },
        });

        return { user, tokens: null, pendingApproval: true };
    }

    notifyNewUser(user.username, user.email);

    // Send verification email (fire-and-forget)
    void sendVerificationEmail(user.id);

    const tokens = await generateTokens(user.id, user.username);

    return { user, tokens, pendingApproval: false };
}

// ─── Login ───────────────────────────────────────────────────

export async function loginUser(input: LoginInput, ip?: string, userAgent?: string) {
    // Support login with either email or username
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: { equals: input.login, mode: "insensitive" } },
                { username: { equals: input.login, mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            passwordHash: true,
            banned: true,
            approved: true,
            lastActiveAt: true,
            emailVerified: true,
            verificationCodeExpiresAt: true,
        },
    });

    if (!user) {
        throw unauthorized(ErrorCodes.E_AUTH_INVALID_CREDENTIALS, "Invalid credentials");
    }

    // Verify password FIRST to prevent user-enumeration via ban/approval errors
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
        throw unauthorized(ErrorCodes.E_AUTH_INVALID_CREDENTIALS, "Invalid credentials");
    }

    // Check ban status after password verification
    if (user.banned) {
        throw new AppError(ErrorCodes.E_USER_BANNED, 403, "Your account has been suspended");
    }

    // Check approval status
    if (!user.approved) {
        throw new AppError(
            ErrorCodes.E_FORBIDDEN,
            403,
            "Your account is pending approval. Please wait for an administrator to approve your registration.",
        );
    }

    const isFirstLogin = !user.lastActiveAt;

    // Update lastActiveAt
    await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
    });

    // Fire-and-forget notifications
    if (isFirstLogin) {
        notifyFirstLogin(user.username);
    } else {
        notifyLogin(user.username, ip);
        // Track login device and notify user on new device/IP (fire-and-forget)
        // Skip on first login — no prior sessions exist, so every device would look "new"
        void trackLoginDevice(user.id, user.username, user.email, ip, userAgent);
    }

    // Auto-send verification email if user is unverified and has no active code
    if (!user.emailVerified) {
        const hasActiveCode =
            user.verificationCodeExpiresAt && user.verificationCodeExpiresAt > new Date();
        if (!hasActiveCode) {
            void sendVerificationEmail(user.id);
        }
    }

    const tokens = await generateTokens(user.id, user.username);

    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
        },
        tokens,
    };
}

// ─── Login Device Tracking ───────────────────────────────────

import { normalizeUserAgent } from "@/helpers/user-agent.js";

async function trackLoginDevice(
    userId: string,
    username: string,
    email: string,
    ip?: string,
    userAgent?: string,
) {
    try {
        const safeIp = ip ?? "unknown";
        const safeUa = userAgent ?? "unknown";
        const normalizedUa = normalizeUserAgent(safeUa);
        // Fingerprint based on device only (browser + OS), NOT IP.
        // IP changes frequently (WiFi→mobile, VPN, new day) — big platforms
        // (Google, GitHub) track devices, not IPs.
        const fingerprint = createHash("sha256").update(normalizedUa).digest("hex");

        const existing = await prisma.loginSession.findFirst({
            where: { userId, fingerprint },
        });

        // Always record the session
        await prisma.loginSession.create({
            data: {
                userId,
                ipAddress: safeIp,
                userAgent: safeUa,
                fingerprint,
            },
        });

        // If this fingerprint was never seen before, notify the user
        if (!existing) {
            const timestamp = `${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`;
            void sendMail({
                to: email,
                subject: "New login to your KeeperLog account",
                html: newLoginTemplate({
                    username,
                    ipAddress: safeIp,
                    userAgent: safeUa,
                    timestamp,
                }),
                log: {
                    userId,
                    template: "new_login",
                },
            });
        }
    } catch (err) {
        // Never let device tracking break the login flow
        pino({ name: "auth" }).error({ err, userId }, "Failed to track login device");
    }
}

// ─── Change Password ─────────────────────────────────────────

export async function changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");
    }

    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) {
        throw unauthorized(ErrorCodes.E_AUTH_INVALID_CREDENTIALS, "Current password is incorrect");
    }

    const newHash = await hashPassword(input.newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
    });
}

// ─── Refresh ─────────────────────────────────────────────────

export async function refreshTokens(refreshToken: string) {
    let payload: RefreshTokenPayload;

    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        throw unauthorized(ErrorCodes.E_AUTH_REFRESH_TOKEN_INVALID, "Invalid refresh token");
    }

    // Check if token exists in DB and is not revoked
    const stored = await prisma.refreshToken.findUnique({
        where: { id: payload.tokenId },
    });

    if (!stored || stored.revoked) {
        throw unauthorized(
            ErrorCodes.E_AUTH_REFRESH_TOKEN_INVALID,
            "Refresh token revoked or not found",
        );
    }

    if (stored.expiresAt < new Date()) {
        throw unauthorized(ErrorCodes.E_AUTH_REFRESH_TOKEN_EXPIRED, "Refresh token expired");
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
    });

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, username: true },
    });

    if (!user) {
        throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");
    }

    const tokens = await generateTokens(user.id, user.username);

    return { tokens };
}

// ─── Logout ──────────────────────────────────────────────────

export async function logoutUser(refreshToken: string) {
    try {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.refreshToken.update({
            where: { id: payload.tokenId },
            data: { revoked: true },
        });
    } catch {
        // Silently ignore invalid tokens on logout
    }
}

export async function logoutAllDevices(userId: string) {
    await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
    });
}

// ─── Email Verification ──────────────────────────────────────

function generateVerificationCode(): string {
    return String(randomInt(100000, 999999));
}

export async function sendVerificationEmail(userId: string): Promise<void> {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            verificationCode: code,
            verificationCodeExpiresAt: expiresAt,
        },
        select: { email: true, username: true },
    });

    const verifyUrl = `${env().CORS_ORIGIN}/verify-email?code=${code}`;

    void sendMail({
        to: user.email,
        subject: "Verify your email — KeeperLog",
        html: verifyEmailTemplate({
            username: user.username,
            verifyUrl,
            code,
            expiresInMinutes: 30,
        }),
        log: { userId, template: "verify_email" },
    });
}

export async function verifyEmail(userId: string, input: VerifyEmailInput): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            emailVerified: true,
            verificationCode: true,
            verificationCodeExpiresAt: true,
        },
    });

    if (!user) {
        throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");
    }

    if (user.emailVerified) {
        return; // Already verified — idempotent
    }

    if (!user.verificationCode || user.verificationCode !== input.code) {
        throw badRequest(ErrorCodes.E_VERIFICATION_CODE_INVALID, "Invalid verification code");
    }

    if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
        throw badRequest(
            ErrorCodes.E_VERIFICATION_CODE_EXPIRED,
            "Verification code has expired. Please request a new one",
        );
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            emailVerified: true,
            verificationCode: null,
            verificationCodeExpiresAt: null,
        },
    });
}

export async function resendVerificationCode(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true },
    });

    if (!user) {
        throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");
    }

    if (user.emailVerified) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Email is already verified");
    }

    // Invalidate old code and send new one
    await sendVerificationEmail(userId);
}

// ─── Password Reset ──────────────────────────────────────────

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
    // Always return void — never reveal whether email exists
    const user = await prisma.user.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
        select: { id: true, username: true, email: true },
    });

    if (!user) return;

    const token = randomUUID();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: tokenHash,
            resetTokenExpiresAt: expiresAt,
        },
    });

    const resetUrl = `${env().CORS_ORIGIN}/reset-password?token=${token}`;

    void sendMail({
        to: user.email,
        subject: "Reset your password — KeeperLog",
        html: passwordResetTemplate({
            username: user.username,
            resetUrl,
            expiresInMinutes: 15,
        }),
        log: { userId: user.id, template: "password_reset" },
    });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = createHash("sha256").update(input.token).digest("hex");

    const user = await prisma.user.findFirst({
        where: { resetToken: tokenHash },
        select: { id: true, resetTokenExpiresAt: true },
    });

    if (!user) {
        throw badRequest(ErrorCodes.E_RESET_TOKEN_INVALID, "Invalid or expired reset token");
    }

    if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
        // Clear expired token
        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: null, resetTokenExpiresAt: null },
        });
        throw badRequest(
            ErrorCodes.E_RESET_TOKEN_EXPIRED,
            "Reset token has expired. Please request a new one",
        );
    }

    const newHash = await hashPassword(input.newPassword);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: newHash,
            resetToken: null,
            resetTokenExpiresAt: null,
        },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true },
    });
}

// ─── Profile Update ─────────────────────────────────────────

export async function updateProfile(userId: string, input: UpdateProfileInput) {
    const data: Record<string, unknown> = {};

    if (input.displayName !== undefined) {
        data.displayName = input.displayName;
    }

    if (input.onboardingCompleted !== undefined) {
        data.onboardingCompleted = input.onboardingCompleted;
    }

    if (input.locale !== undefined) {
        data.locale = input.locale;
    }

    if (input.weeklyReportEnabled !== undefined) {
        data.weeklyReportEnabled = input.weeklyReportEnabled;
        data.weeklyReportDecidedAt = new Date();
    }

    if (Object.keys(data).length === 0) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "No fields to update");
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data,
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
        },
    });

    return updated;
}

// ─── Token Generation ────────────────────────────────────────

async function generateTokens(userId: string, username: string): Promise<AuthTokens> {
    const tokenId = randomUUID();

    // Calculate refresh token expiry from env (default "7d")
    const expiresAt = new Date();
    const expiryMs = ms(env().JWT_REFRESH_EXPIRY as StringValue);
    expiresAt.setTime(expiresAt.getTime() + expiryMs);

    // Store refresh token in DB
    await prisma.refreshToken.create({
        data: {
            id: tokenId,
            userId,
            expiresAt,
        },
    });

    const accessToken = signAccessToken({ userId, username });
    const refreshToken = signRefreshToken({ userId, tokenId });

    return { accessToken, refreshToken };
}

// ─── Account Deletion ────────────────────────────────────────

export async function requestAccountDeletion(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true },
    });

    if (!user) {
        throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");
    }

    const token = randomUUID();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
        where: { id: userId },
        data: {
            deleteToken: tokenHash,
            deleteTokenExpiresAt: expiresAt,
        },
    });

    const confirmUrl = `${env().FRONTEND_URL}/confirm-delete?token=${token}`;

    void sendMail({
        to: user.email,
        subject: "Confirm account deletion — KeeperLog",
        html: accountDeletionTemplate({
            username: user.username,
            confirmUrl,
            expiresInMinutes: 15,
        }),
        log: { userId: user.id, template: "account_deletion" },
    });
}

export async function confirmAccountDeletion(input: ConfirmAccountDeletionInput): Promise<void> {
    const tokenHash = createHash("sha256").update(input.token).digest("hex");

    const user = await prisma.user.findFirst({
        where: { deleteToken: tokenHash },
        select: {
            id: true,
            email: true,
            username: true,
            passwordHash: true,
            deleteTokenExpiresAt: true,
        },
    });

    if (!user) {
        throw badRequest(ErrorCodes.E_DELETE_TOKEN_INVALID, "Invalid or expired deletion token");
    }

    if (!user.deleteTokenExpiresAt || user.deleteTokenExpiresAt < new Date()) {
        await prisma.user.update({
            where: { id: user.id },
            data: { deleteToken: null, deleteTokenExpiresAt: null },
        });
        throw badRequest(
            ErrorCodes.E_DELETE_TOKEN_EXPIRED,
            "Deletion token has expired. Please request a new one",
        );
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
        throw unauthorized(ErrorCodes.E_AUTH_INVALID_CREDENTIALS, "Incorrect password");
    }

    // Capture info before deletion
    const { email, username } = user;

    // Delete user — all relations cascade
    await prisma.user.delete({ where: { id: user.id } });

    // Send goodbye confirmation email (fire-and-forget, user no longer exists)
    void sendMail({
        to: email,
        subject: "Your KeeperLog account has been deleted",
        html: accountDeletedTemplate({ username }),
        log: { template: "account_deleted" },
    });
}
