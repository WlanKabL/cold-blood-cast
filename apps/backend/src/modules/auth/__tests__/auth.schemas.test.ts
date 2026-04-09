import { describe, it, expect } from "vitest";
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    confirmAccountDeletionSchema,
} from "../../auth/auth.schemas.js";

// ─── Register Schema ─────────────────────────────────────────

describe("registerSchema", () => {
    const valid = {
        username: "keeper1",
        email: "keeper@example.com",
        password: "Str0ng!Pass",
    };

    it("accepts valid registration", () => {
        const result = registerSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
        const result = registerSchema.safeParse({
            ...valid,
            displayName: "Keeper One",
            inviteCode: "ABC123",
        });
        expect(result.success).toBe(true);
    });

    // Username rules
    it("rejects username shorter than 3 chars", () => {
        expect(registerSchema.safeParse({ ...valid, username: "ab" }).success).toBe(false);
    });

    it("rejects username longer than 32 chars", () => {
        expect(registerSchema.safeParse({ ...valid, username: "a".repeat(33) }).success).toBe(
            false,
        );
    });

    it("rejects username with special characters", () => {
        expect(registerSchema.safeParse({ ...valid, username: "user@name" }).success).toBe(false);
        expect(registerSchema.safeParse({ ...valid, username: "user name" }).success).toBe(false);
    });

    it("allows hyphens and underscores in username", () => {
        expect(registerSchema.safeParse({ ...valid, username: "my-user_1" }).success).toBe(true);
    });

    // Password rules
    it("rejects password shorter than 8 chars", () => {
        expect(registerSchema.safeParse({ ...valid, password: "Aa1!567" }).success).toBe(false);
    });

    it("rejects password without uppercase", () => {
        expect(registerSchema.safeParse({ ...valid, password: "nouppercase1!" }).success).toBe(
            false,
        );
    });

    it("rejects password without lowercase", () => {
        expect(registerSchema.safeParse({ ...valid, password: "NOLOWERCASE1!" }).success).toBe(
            false,
        );
    });

    it("rejects password without digit", () => {
        expect(registerSchema.safeParse({ ...valid, password: "NoDigitHere!" }).success).toBe(
            false,
        );
    });

    it("rejects password without special character", () => {
        expect(registerSchema.safeParse({ ...valid, password: "NoSpecial1x" }).success).toBe(false);
    });

    it("rejects invalid email", () => {
        expect(registerSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
    });
});

// ─── Login Schema ────────────────────────────────────────────

describe("loginSchema", () => {
    it("accepts valid login", () => {
        expect(loginSchema.safeParse({ login: "keeper1", password: "any" }).success).toBe(true);
    });

    it("rejects empty login", () => {
        expect(loginSchema.safeParse({ login: "", password: "pass" }).success).toBe(false);
    });

    it("rejects empty password", () => {
        expect(loginSchema.safeParse({ login: "user", password: "" }).success).toBe(false);
    });
});

// ─── Change Password Schema ─────────────────────────────────

describe("changePasswordSchema", () => {
    it("accepts valid password change", () => {
        const result = changePasswordSchema.safeParse({
            currentPassword: "oldpass",
            newPassword: "NewStr0ng!Pass",
        });
        expect(result.success).toBe(true);
    });

    it("validates new password strength", () => {
        const result = changePasswordSchema.safeParse({
            currentPassword: "old",
            newPassword: "weak",
        });
        expect(result.success).toBe(false);
    });
});

// ─── Verify Email Schema ────────────────────────────────────

describe("verifyEmailSchema", () => {
    it("accepts 6-char code", () => {
        expect(verifyEmailSchema.safeParse({ code: "123456" }).success).toBe(true);
    });

    it("rejects wrong length", () => {
        expect(verifyEmailSchema.safeParse({ code: "12345" }).success).toBe(false);
        expect(verifyEmailSchema.safeParse({ code: "1234567" }).success).toBe(false);
    });
});

// ─── Forgot/Reset Password Schemas ──────────────────────────

describe("forgotPasswordSchema", () => {
    it("accepts valid email", () => {
        expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    });

    it("rejects invalid email", () => {
        expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
    });
});

describe("resetPasswordSchema", () => {
    it("accepts valid reset", () => {
        const result = resetPasswordSchema.safeParse({
            token: "some-reset-token",
            newPassword: "NewStr0ng!Pass",
        });
        expect(result.success).toBe(true);
    });

    it("rejects weak new password", () => {
        const result = resetPasswordSchema.safeParse({
            token: "token",
            newPassword: "weak",
        });
        expect(result.success).toBe(false);
    });
});

// ─── Update Profile & Deletion ──────────────────────────────

describe("updateProfileSchema", () => {
    it("accepts displayName", () => {
        expect(updateProfileSchema.safeParse({ displayName: "Test" }).success).toBe(true);
    });

    it("accepts null displayName", () => {
        expect(updateProfileSchema.safeParse({ displayName: null }).success).toBe(true);
    });

    it("accepts onboardingCompleted", () => {
        expect(updateProfileSchema.safeParse({ onboardingCompleted: true }).success).toBe(true);
    });

    it("rejects displayName too long", () => {
        expect(updateProfileSchema.safeParse({ displayName: "a".repeat(65) }).success).toBe(false);
    });
});

describe("confirmAccountDeletionSchema", () => {
    it("requires token and password", () => {
        expect(
            confirmAccountDeletionSchema.safeParse({ token: "tok", password: "pass" }).success,
        ).toBe(true);
    });

    it("rejects empty token", () => {
        expect(
            confirmAccountDeletionSchema.safeParse({ token: "", password: "pass" }).success,
        ).toBe(false);
    });
});
