import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma mock ─────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
    apiKey: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));
vi.mock("@/config/index.js", () => ({ prisma: mockPrisma }));

import {
    listApiKeys,
    createApiKey,
    revokeApiKey,
    deleteApiKey,
    validateApiKey,
} from "../api-keys.service.js";

beforeEach(() => vi.clearAllMocks());

// ─── listApiKeys ─────────────────────────────────────────────

describe("listApiKeys", () => {
    it("returns keys for user ordered by createdAt desc", async () => {
        const keys = [{ id: "k1", name: "Key 1" }];
        mockPrisma.apiKey.findMany.mockResolvedValue(keys);

        const result = await listApiKeys("u1");

        expect(result).toEqual(keys);
        expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: "u1" },
                orderBy: { createdAt: "desc" },
            }),
        );
    });
});

// ─── createApiKey ────────────────────────────────────────────

describe("createApiKey", () => {
    it("creates key and returns raw key only once", async () => {
        mockPrisma.apiKey.create.mockImplementation(({ data }) => ({
            id: "k1",
            name: data.name,
            prefix: data.prefix,
            scopes: data.scopes,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
        }));

        const result = await createApiKey("u1", {
            name: "My Key",
            scopes: ["sensors", "read"],
        });

        expect(result.key).toMatch(/^kl_/);
        expect(result.key).toHaveLength(67); // "kl_" + 64 hex chars
        expect(result.name).toBe("My Key");
        expect(result.prefix).toMatch(/^kl_/);
    });

    it("sets expiresAt when expiresInDays provided", async () => {
        const now = Date.now();
        vi.spyOn(Date, "now").mockReturnValue(now);

        mockPrisma.apiKey.create.mockImplementation(({ data }) => ({
            id: "k1",
            name: data.name,
            prefix: data.prefix,
            scopes: data.scopes,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
        }));

        const result = await createApiKey("u1", {
            name: "Temp Key",
            scopes: [],
            expiresInDays: 30,
        });

        const expectedExpiry = now + 30 * 24 * 60 * 60 * 1000;
        expect(result.expiresAt?.getTime()).toBe(expectedExpiry);

        vi.restoreAllMocks();
    });

    it("sets expiresAt to null without expiresInDays", async () => {
        mockPrisma.apiKey.create.mockImplementation(({ data }) => ({
            id: "k1",
            name: data.name,
            prefix: data.prefix,
            scopes: data.scopes,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
        }));

        const result = await createApiKey("u1", {
            name: "Permanent Key",
            scopes: [],
        });

        expect(result.expiresAt).toBeNull();
    });

    it("generates unique keys each time", async () => {
        mockPrisma.apiKey.create.mockImplementation(({ data }) => ({
            id: "k1",
            name: data.name,
            prefix: data.prefix,
            scopes: [],
            expiresAt: null,
            createdAt: new Date(),
        }));

        const r1 = await createApiKey("u1", { name: "A", scopes: [] });
        const r2 = await createApiKey("u1", { name: "B", scopes: [] });

        expect(r1.key).not.toBe(r2.key);
    });
});

// ─── revokeApiKey ────────────────────────────────────────────

describe("revokeApiKey", () => {
    it("revokes an existing key", async () => {
        mockPrisma.apiKey.findFirst.mockResolvedValue({ id: "k1", userId: "u1" });
        mockPrisma.apiKey.update.mockResolvedValue({ id: "k1", revoked: true });

        const result = await revokeApiKey("u1", "k1");

        expect(result.revoked).toBe(true);
        expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
            where: { id: "k1" },
            data: { revoked: true },
        });
    });

    it("throws not found for wrong user", async () => {
        mockPrisma.apiKey.findFirst.mockResolvedValue(null);
        await expect(revokeApiKey("u1", "k99")).rejects.toThrow("API key not found");
    });
});

// ─── deleteApiKey ────────────────────────────────────────────

describe("deleteApiKey", () => {
    it("deletes an existing key", async () => {
        mockPrisma.apiKey.findFirst.mockResolvedValue({ id: "k1", userId: "u1" });
        mockPrisma.apiKey.delete.mockResolvedValue({});

        await deleteApiKey("u1", "k1");
        expect(mockPrisma.apiKey.delete).toHaveBeenCalledWith({ where: { id: "k1" } });
    });

    it("throws not found for non-existent key", async () => {
        mockPrisma.apiKey.findFirst.mockResolvedValue(null);
        await expect(deleteApiKey("u1", "nope")).rejects.toThrow("API key not found");
    });
});

// ─── validateApiKey ──────────────────────────────────────────

describe("validateApiKey", () => {
    it("validates a valid key and updates lastUsedAt", async () => {
        mockPrisma.apiKey.findFirst.mockResolvedValue({
            id: "k1",
            userId: "u1",
            revoked: false,
            expiresAt: null,
            scopes: ["sensors:read"],
            user: { id: "u1", banned: false },
        });
        mockPrisma.apiKey.update.mockResolvedValue({});

        const result = await validateApiKey("kl_abc123");

        expect(result.userId).toBe("u1");
        expect(result.scopes).toEqual(["sensors:read"]);
        expect(result.banned).toBe(false);
        expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "k1" },
                data: { lastUsedAt: expect.any(Date) },
            }),
        );
    });

    it("throws for unknown key", async () => {
        mockPrisma.apiKey.findFirst.mockResolvedValue(null);
        await expect(validateApiKey("kl_invalid")).rejects.toThrow("Invalid API key");
    });

    it("throws for revoked key", async () => {
        mockPrisma.apiKey.findFirst.mockResolvedValue({
            id: "k1",
            userId: "u1",
            revoked: true,
            expiresAt: null,
            scopes: [],
            user: { id: "u1", banned: false },
        });
        await expect(validateApiKey("kl_revoked")).rejects.toThrow("revoked");
    });

    it("throws for expired key", async () => {
        mockPrisma.apiKey.findFirst.mockResolvedValue({
            id: "k1",
            userId: "u1",
            revoked: false,
            expiresAt: new Date("2020-01-01"),
            scopes: [],
            user: { id: "u1", banned: false },
        });
        await expect(validateApiKey("kl_expired")).rejects.toThrow("expired");
    });
});
