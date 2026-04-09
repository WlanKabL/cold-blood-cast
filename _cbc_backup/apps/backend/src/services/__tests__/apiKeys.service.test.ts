import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the service
vi.mock("../../db/client.js", () => ({
    prisma: {
        apiKey: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

import { generateApiKey } from "../apiKeys.service.js";

describe("apiKeys.service", () => {
    describe("generateApiKey", () => {
        it("returns raw key with cbc_ prefix", () => {
            const { raw } = generateApiKey();
            expect(raw).toMatch(/^cbc_[a-f0-9]{64}$/);
        });

        it("returns prefix as first 12 chars of raw key", () => {
            const { raw, prefix } = generateApiKey();
            expect(prefix).toBe(raw.substring(0, 12));
            expect(prefix).toHaveLength(12);
        });

        it("returns a 64-char hex hash", () => {
            const { hash } = generateApiKey();
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it("generates unique keys on each call", () => {
            const a = generateApiKey();
            const b = generateApiKey();
            expect(a.raw).not.toBe(b.raw);
            expect(a.hash).not.toBe(b.hash);
        });

        it("hash is deterministic for the same raw key", () => {
            const { raw, hash } = generateApiKey();
            const { createHash } = require("crypto");
            const rehash = createHash("sha256").update(raw).digest("hex");
            expect(hash).toBe(rehash);
        });
    });
});
