import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    refreshToken: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
    },
    role: { findUnique: vi.fn() },
    userRole: { create: vi.fn() },
    loginSession: {
        findFirst: vi.fn(),
        create: vi.fn(),
    },
};

vi.mock("@/config/index.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/config/env.js", () => ({
    env: () => ({
        CORS_ORIGIN: "https://cold-blood-cast.app",
        FRONTEND_URL: "https://cold-blood-cast.app",
        JWT_REFRESH_EXPIRY: "7d",
        HASH_PEPPER: "test_pepper",
    }),
}));

const mockHashPassword = vi.fn().mockResolvedValue("hashed_pw");
const mockVerifyPassword = vi.fn().mockResolvedValue(true);
const mockSignAccess = vi.fn().mockReturnValue("access_token");
const mockSignRefresh = vi.fn().mockReturnValue("refresh_token");
const mockVerifyRefresh = vi.fn();

vi.mock("@/helpers/index.js", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        hashPassword: mockHashPassword,
        verifyPassword: mockVerifyPassword,
        signAccessToken: mockSignAccess,
        signRefreshToken: mockSignRefresh,
        verifyRefreshToken: mockVerifyRefresh,
    };
});

vi.mock("@/helpers/user-agent.js", () => ({
    normalizeUserAgent: (ua: string) => ua,
}));

vi.mock("@/modules/notifications/notification.service.js", () => ({
    notifyNewUser: vi.fn(),
    notifyPendingApproval: vi.fn(),
    notifyLogin: vi.fn(),
    notifyFirstLogin: vi.fn(),
}));

vi.mock("@/modules/mail/index.js", () => ({
    sendMail: vi.fn(),
    pendingReviewTemplate: vi.fn().mockReturnValue("<html>"),
    verifyEmailTemplate: vi.fn().mockReturnValue("<html>"),
    passwordResetTemplate: vi.fn().mockReturnValue("<html>"),
    accountDeletionTemplate: vi.fn().mockReturnValue("<html>"),
    accountDeletedTemplate: vi.fn().mockReturnValue("<html>"),
    newLoginTemplate: vi.fn().mockReturnValue("<html>"),
}));

vi.mock("@/modules/admin/settings.service.js", () => ({
    getSystemSetting: vi.fn().mockImplementation((key: string, fallback: string) => {
        const settings: Record<string, string> = {
            registration_mode: "open",
            default_role: "FREE",
        };
        return Promise.resolve(settings[key] ?? fallback);
    }),
}));

vi.mock("@/modules/invites/invites.service.js", () => ({
    checkInviteCode: vi.fn().mockResolvedValue({ valid: true }),
    validateAndConsumeInviteCode: vi.fn(),
}));

// ─── Import SUT ──────────────────────────────────────────────

const {
    registerUser,
    loginUser,
    changePassword,
    refreshTokens,
    logoutUser,
    logoutAllDevices,
    sendVerificationEmail,
    verifyEmail,
    resendVerificationCode,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    requestAccountDeletion,
    confirmAccountDeletion,
} = await import("../auth.service.js");

// ─── Helpers ─────────────────────────────────────────────────

const USER_ID = "user_123";

function makeUser(overrides: Record<string, unknown> = {}) {
    return {
        id: USER_ID,
        username: "testuser",
        email: "test@example.com",
        displayName: "Test User",
        passwordHash: "hashed_pw",
        banned: false,
        approved: true,
        lastActiveAt: new Date(),
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockHashPassword.mockResolvedValue("hashed_pw");
    mockVerifyPassword.mockResolvedValue(true);
    mockSignAccess.mockReturnValue("access_token");
    mockSignRefresh.mockReturnValue("refresh_token");
    // Default: refreshToken.create succeeds
    mockPrisma.refreshToken.create.mockResolvedValue({});
});

// ─── registerUser ────────────────────────────────────────────

describe("registerUser", () => {
    const input = {
        username: "newuser",
        email: "new@example.com",
        password: "StrongP@ss1",
    };

    beforeEach(() => {
        mockPrisma.user.findFirst.mockResolvedValue(null); // no duplicates
        mockPrisma.user.create.mockResolvedValue({
            id: "new_id",
            username: "newuser",
            email: "new@example.com",
            displayName: "newuser",
        });
        mockPrisma.role.findUnique.mockResolvedValue({ id: "role_1", name: "FREE" });
        mockPrisma.userRole.create.mockResolvedValue({});
        mockPrisma.user.update.mockResolvedValue({
            email: "new@example.com",
            username: "newuser",
        });
    });

    it("creates user in open mode and returns tokens", async () => {
        const result = await registerUser(input);

        expect(result.user.username).toBe("newuser");
        expect(result.tokens).not.toBeNull();
        expect(result.pendingApproval).toBe(false);
        expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it("throws E_AUTH_EMAIL_TAKEN when email exists", async () => {
        mockPrisma.user.findFirst.mockResolvedValueOnce({ id: "existing" }); // email duplicate

        await expect(registerUser(input)).rejects.toThrow(/Email is already registered/);
    });

    it("throws E_AUTH_USERNAME_TAKEN when username exists", async () => {
        mockPrisma.user.findFirst
            .mockResolvedValueOnce(null) // email check: clear
            .mockResolvedValueOnce({ id: "existing" }); // username duplicate

        await expect(registerUser(input)).rejects.toThrow(/Username is already taken/);
    });

    it("assigns default role after creation", async () => {
        await registerUser(input);

        expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({ where: { name: "FREE" } });
        expect(mockPrisma.userRole.create).toHaveBeenCalledWith({
            data: { userId: "new_id", roleId: "role_1" },
        });
    });

    it("lowercases username and email", async () => {
        await registerUser({
            username: "TestUser",
            email: "Test@Example.COM",
            password: "StrongP@ss1",
        });

        const createData = mockPrisma.user.create.mock.calls[0][0].data;
        expect(createData.username).toBe("testuser");
        expect(createData.email).toBe("test@example.com");
    });
});

// ─── loginUser ───────────────────────────────────────────────

describe("loginUser", () => {
    const input = { login: "testuser", password: "StrongP@ss1" };

    beforeEach(() => {
        mockPrisma.user.findFirst.mockResolvedValue(makeUser());
        mockPrisma.user.update.mockResolvedValue({});
        mockPrisma.loginSession.findFirst.mockResolvedValue({ id: "existing" });
        mockPrisma.loginSession.create.mockResolvedValue({});
    });

    it("returns user and tokens on valid credentials", async () => {
        const result = await loginUser(input);

        expect(result.user.username).toBe("testuser");
        expect(result.tokens.accessToken).toBe("access_token");
        expect(result.tokens.refreshToken).toBe("refresh_token");
    });

    it("throws E_AUTH_INVALID_CREDENTIALS for unknown user", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(null);

        await expect(loginUser(input)).rejects.toThrow("Invalid credentials");
    });

    it("throws E_AUTH_INVALID_CREDENTIALS for wrong password", async () => {
        mockVerifyPassword.mockResolvedValue(false);

        await expect(loginUser(input)).rejects.toThrow("Invalid credentials");
    });

    it("throws E_USER_BANNED for banned user (after password check)", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(makeUser({ banned: true }));

        await expect(loginUser(input)).rejects.toThrow(/suspended/);
    });

    it("throws E_FORBIDDEN for unapproved user (after password check)", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(makeUser({ approved: false }));

        await expect(loginUser(input)).rejects.toThrow(/pending approval/);
    });

    it("updates lastActiveAt on successful login", async () => {
        await loginUser(input);

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: USER_ID },
                data: expect.objectContaining({ lastActiveAt: expect.any(Date) }),
            }),
        );
    });
});

// ─── changePassword ──────────────────────────────────────────

describe("changePassword", () => {
    it("changes password and revokes all refresh tokens", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(makeUser());
        mockPrisma.user.update.mockResolvedValue({});
        mockPrisma.refreshToken.updateMany.mockResolvedValue({});

        await changePassword(USER_ID, {
            currentPassword: "OldP@ss1",
            newPassword: "NewP@ss2",
        });

        expect(mockHashPassword).toHaveBeenCalledWith("NewP@ss2");
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { passwordHash: "hashed_pw" },
            }),
        );
        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, revoked: false },
            data: { revoked: true },
        });
    });

    it("throws E_USER_NOT_FOUND when user doesn't exist", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
            changePassword(USER_ID, {
                currentPassword: "OldP@ss1",
                newPassword: "NewP@ss2",
            }),
        ).rejects.toThrow("User not found");
    });

    it("throws E_AUTH_INVALID_CREDENTIALS for wrong current password", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(makeUser());
        mockVerifyPassword.mockResolvedValue(false);

        await expect(
            changePassword(USER_ID, {
                currentPassword: "WrongP@ss",
                newPassword: "NewP@ss2",
            }),
        ).rejects.toThrow("Current password is incorrect");
    });
});

// ─── refreshTokens ───────────────────────────────────────────

describe("refreshTokens", () => {
    const tokenId = "token_abc";

    it("rotates token: revokes old, issues new", async () => {
        mockVerifyRefresh.mockReturnValue({ userId: USER_ID, tokenId });
        mockPrisma.refreshToken.findUnique.mockResolvedValue({
            id: tokenId,
            revoked: false,
            expiresAt: new Date(Date.now() + 86400000),
        });
        mockPrisma.refreshToken.update.mockResolvedValue({});
        mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID, username: "testuser" });

        const result = await refreshTokens("old_refresh_token");

        expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
            where: { id: tokenId },
            data: { revoked: true },
        });
        expect(result.tokens.accessToken).toBe("access_token");
    });

    it("rejects invalid JWT", async () => {
        mockVerifyRefresh.mockImplementation(() => {
            throw new Error("Invalid");
        });

        await expect(refreshTokens("bad_token")).rejects.toThrow("Invalid refresh token");
    });

    it("rejects revoked token", async () => {
        mockVerifyRefresh.mockReturnValue({ userId: USER_ID, tokenId });
        mockPrisma.refreshToken.findUnique.mockResolvedValue({
            id: tokenId,
            revoked: true,
            expiresAt: new Date(Date.now() + 86400000),
        });

        await expect(refreshTokens("revoked_token")).rejects.toThrow(/revoked or not found/);
    });

    it("rejects expired token", async () => {
        mockVerifyRefresh.mockReturnValue({ userId: USER_ID, tokenId });
        mockPrisma.refreshToken.findUnique.mockResolvedValue({
            id: tokenId,
            revoked: false,
            expiresAt: new Date(Date.now() - 1000), // expired
        });

        await expect(refreshTokens("expired_token")).rejects.toThrow("Refresh token expired");
    });

    it("throws E_USER_NOT_FOUND when user deleted after token issued", async () => {
        mockVerifyRefresh.mockReturnValue({ userId: USER_ID, tokenId });
        mockPrisma.refreshToken.findUnique.mockResolvedValue({
            id: tokenId,
            revoked: false,
            expiresAt: new Date(Date.now() + 86400000),
        });
        mockPrisma.refreshToken.update.mockResolvedValue({});
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(refreshTokens("valid_but_orphan")).rejects.toThrow("User not found");
    });
});

// ─── logoutUser / logoutAllDevices ───────────────────────────

describe("logoutUser", () => {
    it("revokes token on valid JWT", async () => {
        mockVerifyRefresh.mockReturnValue({ tokenId: "t1" });
        mockPrisma.refreshToken.update.mockResolvedValue({});

        await logoutUser("valid_token");

        expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
            where: { id: "t1" },
            data: { revoked: true },
        });
    });

    it("silently ignores invalid token", async () => {
        mockVerifyRefresh.mockImplementation(() => {
            throw new Error("Invalid");
        });

        // Should NOT throw
        await logoutUser("bad_token");
    });
});

describe("logoutAllDevices", () => {
    it("revokes all active refresh tokens", async () => {
        mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 5 });

        await logoutAllDevices(USER_ID);

        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, revoked: false },
            data: { revoked: true },
        });
    });
});

// ─── Email Verification ──────────────────────────────────────

describe("verifyEmail", () => {
    it("marks email as verified with correct code", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            emailVerified: false,
            verificationCode: "123456",
            verificationCodeExpiresAt: new Date(Date.now() + 600000),
        });
        mockPrisma.user.update.mockResolvedValue({});

        await verifyEmail(USER_ID, { code: "123456" });

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: {
                emailVerified: true,
                verificationCode: null,
                verificationCodeExpiresAt: null,
            },
        });
    });

    it("returns silently if already verified (idempotent)", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: true });

        // Should NOT throw
        await verifyEmail(USER_ID, { code: "000000" });
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("throws on wrong code", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            emailVerified: false,
            verificationCode: "123456",
            verificationCodeExpiresAt: new Date(Date.now() + 600000),
        });

        await expect(verifyEmail(USER_ID, { code: "999999" })).rejects.toThrow(
            "Invalid verification code",
        );
    });

    it("throws on expired code", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            emailVerified: false,
            verificationCode: "123456",
            verificationCodeExpiresAt: new Date(Date.now() - 1000), // expired
        });

        await expect(verifyEmail(USER_ID, { code: "123456" })).rejects.toThrow(/expired/);
    });

    it("throws E_USER_NOT_FOUND for missing user", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(verifyEmail(USER_ID, { code: "123456" })).rejects.toThrow("User not found");
    });
});

describe("resendVerificationCode", () => {
    it("sends new verification email", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: false });
        mockPrisma.user.update.mockResolvedValue({
            email: "test@example.com",
            username: "testuser",
        });

        await resendVerificationCode(USER_ID);

        // sendVerificationEmail calls user.update to save code
        expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it("throws if email already verified", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: true });

        await expect(resendVerificationCode(USER_ID)).rejects.toThrow("Email is already verified");
    });

    it("throws E_USER_NOT_FOUND for missing user", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(resendVerificationCode(USER_ID)).rejects.toThrow("User not found");
    });
});

// ─── Password Reset ──────────────────────────────────────────

describe("requestPasswordReset", () => {
    it("generates token and stores hash when user exists", async () => {
        mockPrisma.user.findFirst.mockResolvedValue({
            id: USER_ID,
            username: "testuser",
            email: "test@example.com",
        });
        mockPrisma.user.update.mockResolvedValue({});

        await requestPasswordReset({ email: "test@example.com" });

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: USER_ID },
                data: expect.objectContaining({
                    resetToken: expect.any(String),
                    resetTokenExpiresAt: expect.any(Date),
                }),
            }),
        );
    });

    it("returns silently when email not found (security)", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(null);

        // Should NOT throw — silent for security
        await requestPasswordReset({ email: "nonexistent@example.com" });
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
});

describe("resetPassword", () => {
    it("resets password and revokes all tokens", async () => {
        mockPrisma.user.findFirst.mockResolvedValue({
            id: USER_ID,
            resetTokenExpiresAt: new Date(Date.now() + 600000),
        });
        mockPrisma.user.update.mockResolvedValue({});
        mockPrisma.refreshToken.updateMany.mockResolvedValue({});

        await resetPassword({ token: "valid-token", newPassword: "NewStr0ng!" });

        expect(mockHashPassword).toHaveBeenCalledWith("NewStr0ng!");
        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, revoked: false },
            data: { revoked: true },
        });
    });

    it("throws E_RESET_TOKEN_INVALID for unknown token", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(null);

        await expect(
            resetPassword({ token: "bad-token", newPassword: "NewStr0ng!" }),
        ).rejects.toThrow(/Invalid or expired reset token/);
    });

    it("cleans up expired token and throws", async () => {
        mockPrisma.user.findFirst.mockResolvedValue({
            id: USER_ID,
            resetTokenExpiresAt: new Date(Date.now() - 1000), // expired
        });
        mockPrisma.user.update.mockResolvedValue({});

        await expect(
            resetPassword({ token: "expired-token", newPassword: "NewStr0ng!" }),
        ).rejects.toThrow(/expired/);

        // Cleans up token
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: { resetToken: null, resetTokenExpiresAt: null },
        });
    });
});

// ─── updateProfile ───────────────────────────────────────────

describe("updateProfile", () => {
    it("updates displayName", async () => {
        const updated = { id: USER_ID, displayName: "New Name" };
        mockPrisma.user.update.mockResolvedValue(updated);

        const result = await updateProfile(USER_ID, { displayName: "New Name" });

        expect(result.displayName).toBe("New Name");
    });

    it("updates onboardingCompleted", async () => {
        mockPrisma.user.update.mockResolvedValue({ id: USER_ID, onboardingCompleted: true });

        await updateProfile(USER_ID, { onboardingCompleted: true });

        expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it("throws when no fields provided", async () => {
        await expect(updateProfile(USER_ID, {})).rejects.toThrow("No fields to update");
    });
});

// ─── Account Deletion ───────────────────────────────────────

describe("requestAccountDeletion", () => {
    it("generates delete token and stores hash", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: USER_ID,
            username: "testuser",
            email: "test@example.com",
        });
        mockPrisma.user.update.mockResolvedValue({});

        await requestAccountDeletion(USER_ID);

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    deleteToken: expect.any(String),
                    deleteTokenExpiresAt: expect.any(Date),
                }),
            }),
        );
    });

    it("throws E_USER_NOT_FOUND for missing user", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(requestAccountDeletion(USER_ID)).rejects.toThrow("User not found");
    });
});

describe("confirmAccountDeletion", () => {
    it("deletes user after password verification", async () => {
        mockPrisma.user.findFirst.mockResolvedValue({
            id: USER_ID,
            email: "test@example.com",
            username: "testuser",
            passwordHash: "hashed_pw",
            deleteTokenExpiresAt: new Date(Date.now() + 600000),
        });
        mockPrisma.user.delete.mockResolvedValue({});

        await confirmAccountDeletion({
            token: "valid-token",
            password: "StrongP@ss1",
        });

        expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: USER_ID } });
    });

    it("throws E_DELETE_TOKEN_INVALID for unknown token", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(null);

        await expect(confirmAccountDeletion({ token: "bad", password: "x" })).rejects.toThrow(
            /Invalid or expired deletion token/,
        );
    });

    it("cleans up expired token and throws", async () => {
        mockPrisma.user.findFirst.mockResolvedValue({
            id: USER_ID,
            passwordHash: "hashed_pw",
            deleteTokenExpiresAt: new Date(Date.now() - 1000),
        });
        mockPrisma.user.update.mockResolvedValue({});

        await expect(confirmAccountDeletion({ token: "expired", password: "x" })).rejects.toThrow(
            /expired/,
        );
    });

    it("throws E_AUTH_INVALID_CREDENTIALS for wrong password", async () => {
        mockPrisma.user.findFirst.mockResolvedValue({
            id: USER_ID,
            passwordHash: "hashed_pw",
            deleteTokenExpiresAt: new Date(Date.now() + 600000),
        });
        mockVerifyPassword.mockResolvedValue(false);

        await expect(confirmAccountDeletion({ token: "valid", password: "wrong" })).rejects.toThrow(
            "Incorrect password",
        );
    });
});
