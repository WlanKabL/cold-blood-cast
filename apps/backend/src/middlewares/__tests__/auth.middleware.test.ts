import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, NextFunction } from "express";

vi.mock("../../config.js", () => ({
    env: () => ({
        JWT_ACCESS_SECRET: "test-access-secret-that-is-at-least-32-chars-long",
        JWT_REFRESH_SECRET: "test-refresh-secret-that-is-at-least-32-chars-long",
        JWT_ACCESS_EXPIRY: "15m",
        JWT_REFRESH_EXPIRY: "7d",
    }),
}));

const mockUser = {
    id: "user-123",
    username: "testuser",
    passwordHash: "hash",
    salt: "salt",
    permissions: {
        isAdmin: false,
        viewSensors: [],
        manageSensors: [],
        viewWebcams: false,
        viewPrivateSensors: false,
        detectNewSensors: false,
        manageUsers: false,
        manageAppConfig: false,
        useRemoteAccess: false,
        manageRegistrationKeys: false,
    },
};

vi.mock("../../stores/userStore.js", () => ({
    userStore: {
        findById: vi.fn(),
    },
}));

import { authMiddleware } from "../auth.middleware.js";
import { signAccessToken } from "../../helpers/jwt.js";
import { userStore } from "../../stores/userStore.js";
import { AppError } from "../../helpers/errors.js";

describe("authMiddleware", () => {
    let next: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
        next = vi.fn() as unknown as NextFunction;
    });

    it("calls next with unauthorized error when no authorization header", async () => {
        const req = { headers: {} } as Request;

        await authMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
        expect(err.statusCode).toBe(401);
    });

    it("calls next with unauthorized error for non-Bearer token", async () => {
        const req = { headers: { authorization: "Basic abc123" } } as Request;

        await authMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("calls next with unauthorized error for invalid token", async () => {
        const req = { headers: { authorization: "Bearer invalid-token" } } as Request;

        await authMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("calls next with unauthorized error when user not found", async () => {
        const token = signAccessToken(mockUser);
        const req = { headers: { authorization: `Bearer ${token}` } } as Request;

        vi.mocked(userStore.findById).mockResolvedValue(undefined);

        await authMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("sets req.user and calls next() for valid token", async () => {
        const token = signAccessToken(mockUser);
        const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;

        vi.mocked(userStore.findById).mockResolvedValue(mockUser);

        await authMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.user).toEqual(mockUser);
    });
});
