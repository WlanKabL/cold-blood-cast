import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/config/env.js", () => ({
    env: () => ({
        JWT_ACCESS_SECRET: "test-access-secret-must-be-long-enough-for-safety",
        JWT_REFRESH_SECRET: "test-refresh-secret-must-be-long-enough-for-safety",
        JWT_ACCESS_EXPIRY: "15m",
        JWT_REFRESH_EXPIRY: "7d",
    }),
}));

const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } =
    await import("../jwt.js");

describe("Access Token", () => {
    const payload = { userId: "user-123", username: "testuser" };

    it("signs and verifies a valid access token", () => {
        const token = signAccessToken(payload);
        expect(typeof token).toBe("string");
        expect(token.split(".")).toHaveLength(3); // JWT format

        const decoded = verifyAccessToken(token);
        expect(decoded.userId).toBe("user-123");
        expect(decoded.username).toBe("testuser");
    });

    it("throws on invalid access token", () => {
        expect(() => verifyAccessToken("invalid.token.here")).toThrow();
    });

    it("throws on tampered token", () => {
        const token = signAccessToken(payload);
        const tampered = `${token.slice(0, -5)}xxxxx`;
        expect(() => verifyAccessToken(tampered)).toThrow();
    });

    it("refresh token cannot be verified as access token", () => {
        const refreshPayload = { userId: "user-123", tokenId: "tok-456" };
        const refreshToken = signRefreshToken(refreshPayload);
        expect(() => verifyAccessToken(refreshToken)).toThrow();
    });
});

describe("Refresh Token", () => {
    const payload = { userId: "user-789", tokenId: "tok-abc" };

    it("signs and verifies a valid refresh token", () => {
        const token = signRefreshToken(payload);
        expect(typeof token).toBe("string");

        const decoded = verifyRefreshToken(token);
        expect(decoded.userId).toBe("user-789");
        expect(decoded.tokenId).toBe("tok-abc");
    });

    it("throws on invalid refresh token", () => {
        expect(() => verifyRefreshToken("garbage")).toThrow();
    });

    it("access token cannot be verified as refresh token", () => {
        const accessToken = signAccessToken({ userId: "u1", username: "u" });
        expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
});
