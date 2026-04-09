import { describe, it, expect, vi } from "vitest";
import {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
} from "../jwt.js";
import type { User } from "@cold-blood-cast/shared";

vi.mock("../../config.js", () => ({
    env: () => ({
        JWT_ACCESS_SECRET: "test-access-secret-that-is-at-least-32-chars-long",
        JWT_REFRESH_SECRET: "test-refresh-secret-that-is-at-least-32-chars-long",
        JWT_ACCESS_EXPIRY: "15m",
        JWT_REFRESH_EXPIRY: "7d",
    }),
}));

const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    username: "testuser",
    displayName: "Test User",
    isAdmin: false,
    locale: "de",
    timezone: "Europe/Berlin",
};

describe("JWT helpers", () => {
    describe("access tokens", () => {
        it("signs and verifies an access token", () => {
            const token = signAccessToken(mockUser);
            const payload = verifyAccessToken(token);
            expect(payload.userId).toBe("user-123");
            expect(payload.username).toBe("testuser");
        });

        it("throws on invalid access token", () => {
            expect(() => verifyAccessToken("invalid-token")).toThrow();
        });

        it("returns a non-empty string", () => {
            const token = signAccessToken(mockUser);
            expect(typeof token).toBe("string");
            expect(token.length).toBeGreaterThan(0);
        });
    });

    describe("refresh tokens", () => {
        it("signs and verifies a refresh token", () => {
            const { token, tokenId } = signRefreshToken(mockUser);
            const payload = verifyRefreshToken(token);
            expect(payload.userId).toBe("user-123");
            expect(payload.tokenId).toBe(tokenId);
        });

        it("returns a unique tokenId each time", () => {
            const { tokenId: id1 } = signRefreshToken(mockUser);
            const { tokenId: id2 } = signRefreshToken(mockUser);
            expect(id1).not.toBe(id2);
        });

        it("throws on invalid refresh token", () => {
            expect(() => verifyRefreshToken("invalid-token")).toThrow();
        });

        it("access token cannot be verified as refresh token", () => {
            const accessToken = signAccessToken(mockUser);
            expect(() => verifyRefreshToken(accessToken)).toThrow();
        });

        it("refresh token cannot be verified as access token", () => {
            const { token } = signRefreshToken(mockUser);
            expect(() => verifyAccessToken(token)).toThrow();
        });
    });
});
