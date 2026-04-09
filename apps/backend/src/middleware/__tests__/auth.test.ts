import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest, FastifyReply } from "fastify";

// ─── Mocks ───────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
    },
    userRole: {
        findMany: vi.fn(),
    },
}));
vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const mockVerifyAccessToken = vi.hoisted(() => vi.fn());
vi.mock("@/helpers/index.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        verifyAccessToken: mockVerifyAccessToken,
    };
});

const mockResolveUserFeatures = vi.hoisted(() => vi.fn());
vi.mock("@/modules/admin/feature-flags.service.js", () => ({
    resolveUserFeatures: mockResolveUserFeatures,
}));

import { authGuard, emailVerifiedGuard, requireRole, adminGuard, requireFeature } from "../auth.js";

// ─── Helpers ─────────────────────────────────────────────────

function makeRequest(overrides = {}): FastifyRequest {
    return {
        headers: { authorization: "Bearer valid_token" },
        userId: "",
        username: "",
        userRoles: [],
        emailVerified: false,
        ...overrides,
    } as unknown as FastifyRequest;
}

const mockReply = {} as FastifyReply;

beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue({ userId: "u1", username: "keeper" });
    mockPrisma.user.findUnique.mockResolvedValue({ banned: false, emailVerified: true });
    mockPrisma.userRole.findMany.mockResolvedValue([{ role: { name: "FREE" } }]);
});

// ─── authGuard ───────────────────────────────────────────────

describe("authGuard", () => {
    it("sets userId and roles on request", async () => {
        const req = makeRequest();
        await authGuard(req, mockReply);

        expect(req.userId).toBe("u1");
        expect(req.username).toBe("keeper");
        expect(req.userRoles).toEqual(["FREE"]);
        expect(req.emailVerified).toBe(true);
    });

    it("throws when Authorization header is missing", async () => {
        const req = makeRequest({ headers: {} });
        await expect(authGuard(req, mockReply)).rejects.toThrow("Authorization header missing");
    });

    it("throws when Authorization header is not Bearer", async () => {
        const req = makeRequest({ headers: { authorization: "Basic abc" } });
        await expect(authGuard(req, mockReply)).rejects.toThrow("Authorization header missing");
    });

    it("throws for expired token", async () => {
        const err = new Error("Token expired");
        err.name = "TokenExpiredError";
        mockVerifyAccessToken.mockImplementation(() => {
            throw err;
        });

        const req = makeRequest();
        await expect(authGuard(req, mockReply)).rejects.toThrow("Access token expired");
    });

    it("throws for invalid token", async () => {
        mockVerifyAccessToken.mockImplementation(() => {
            throw new Error("bad");
        });

        const req = makeRequest();
        await expect(authGuard(req, mockReply)).rejects.toThrow("Invalid access token");
    });

    it("throws when user is banned", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ banned: true, emailVerified: true });

        const req = makeRequest();
        await expect(authGuard(req, mockReply)).rejects.toThrow("suspended");
    });

    it("tracks lastActiveAt fire-and-forget", async () => {
        const req = makeRequest();
        await authGuard(req, mockReply);

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "u1" },
                data: { lastActiveAt: expect.any(Date) },
            }),
        );
    });
});

// ─── emailVerifiedGuard ──────────────────────────────────────

describe("emailVerifiedGuard", () => {
    it("passes when email is verified", async () => {
        const req = makeRequest({ emailVerified: true });
        await expect(emailVerifiedGuard(req, mockReply)).resolves.toBeUndefined();
    });

    it("throws when email is not verified", async () => {
        const req = makeRequest({ emailVerified: false });
        await expect(emailVerifiedGuard(req, mockReply)).rejects.toThrow(
            "Email verification required",
        );
    });

    it("skips check for impersonating admin", async () => {
        const req = makeRequest({ emailVerified: false, impersonatedBy: "admin1" });
        await expect(emailVerifiedGuard(req, mockReply)).resolves.toBeUndefined();
    });
});

// ─── requireRole ─────────────────────────────────────────────

describe("requireRole", () => {
    it("passes when user has required role", async () => {
        const guard = requireRole("FREE", "PREMIUM");
        const req = makeRequest({ userRoles: ["FREE"] });
        await expect(guard(req, mockReply)).resolves.toBeUndefined();
    });

    it("throws when user lacks required role", async () => {
        const guard = requireRole("ADMIN");
        const req = makeRequest({ userRoles: ["FREE"] });
        await expect(guard(req, mockReply)).rejects.toThrow("Required role");
    });
});

// ─── adminGuard ──────────────────────────────────────────────

describe("adminGuard", () => {
    it("passes for ADMIN role", async () => {
        const req = makeRequest({ userRoles: ["ADMIN"] });
        await expect(adminGuard(req, mockReply)).resolves.toBeUndefined();
    });

    it("throws for non-admin", async () => {
        const req = makeRequest({ userRoles: ["FREE"] });
        await expect(adminGuard(req, mockReply)).rejects.toThrow("Required role");
    });
});

// ─── requireFeature ──────────────────────────────────────────

describe("requireFeature", () => {
    it("passes when feature is enabled", async () => {
        mockResolveUserFeatures.mockResolvedValue({ analytics: true });
        const guard = requireFeature("analytics");
        const req = makeRequest({ userRoles: ["FREE"] });

        await expect(guard(req, mockReply)).resolves.toBeUndefined();
    });

    it("throws when feature is disabled", async () => {
        mockResolveUserFeatures.mockResolvedValue({ analytics: false });
        const guard = requireFeature("analytics");
        const req = makeRequest({ userRoles: ["FREE"] });

        await expect(guard(req, mockReply)).rejects.toThrow("not available");
    });

    it("bypasses check for ADMIN role", async () => {
        const guard = requireFeature("anything");
        const req = makeRequest({ userRoles: ["ADMIN"] });

        await expect(guard(req, mockReply)).resolves.toBeUndefined();
        expect(mockResolveUserFeatures).not.toHaveBeenCalled();
    });

    it("caches resolved features on request", async () => {
        mockResolveUserFeatures.mockResolvedValue({ a: true, b: true });
        const guardA = requireFeature("a");
        const guardB = requireFeature("b");
        const req = makeRequest({ userRoles: ["FREE"] });

        await guardA(req, mockReply);
        await guardB(req, mockReply);

        // Only resolved once
        expect(mockResolveUserFeatures).toHaveBeenCalledTimes(1);
    });
});
