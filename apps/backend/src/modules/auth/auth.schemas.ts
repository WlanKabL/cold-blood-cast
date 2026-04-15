import { z } from "zod";

// ─── Shared Validators ──────────────────────────────────────

/** Shared password rules — one source of truth for register, change, and reset */
const passwordField = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// ─── Request Schemas ─────────────────────────────────────────

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(32, "Username must be at most 32 characters")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Username can only contain letters, numbers, hyphens and underscores",
        ),
    email: z.string().email("Invalid email address"),
    password: passwordField,
    displayName: z.string().min(1).max(64).optional(),
    inviteCode: z.string().optional(),
});

export const loginSchema = z.object({
    login: z.string().min(1, "Username or email is required"),
    password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
    refreshToken: z.string().optional(), // Falls als Cookie gesendet
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
});

export const verifyEmailSchema = z.object({
    code: z.string().length(6, "Verification code must be 6 digits"),
});

export const resendVerificationSchema = z.object({});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: passwordField,
});

export const updateProfileSchema = z.object({
    displayName: z
        .string()
        .min(1, "Display name must be at least 1 character")
        .max(64, "Display name must be at most 64 characters")
        .nullable()
        .optional(),
    onboardingCompleted: z.boolean().optional(),
    locale: z.enum(["de", "en"]).optional(),
    weeklyReportEnabled: z.boolean().optional(),
});

export const confirmAccountDeletionSchema = z.object({
    token: z.string().min(1, "Deletion token is required"),
    password: z.string().min(1, "Password is required"),
});

export const changeUsernameSchema = z.object({
    newUsername: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(32, "Username must be at most 32 characters")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Username can only contain letters, numbers, hyphens and underscores",
        ),
    password: z.string().min(1, "Password is required"),
});

export const requestEmailChangeSchema = z.object({
    newEmail: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const confirmEmailChangeSchema = z.object({
    code: z.string().length(6, "Verification code must be 6 digits"),
});

// ─── Types ───────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ConfirmAccountDeletionInput = z.infer<typeof confirmAccountDeletionSchema>;
export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
export type ConfirmEmailChangeInput = z.infer<typeof confirmEmailChangeSchema>;

// ─── Response Types ──────────────────────────────────────────

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    success: true;
    data: {
        user: {
            id: string;
            username: string;
            email: string;
            displayName: string | null;
        };
        tokens: AuthTokens;
    };
}

export interface RefreshResponse {
    success: true;
    data: {
        tokens: AuthTokens;
    };
}
