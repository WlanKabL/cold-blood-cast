import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/config/env.js", () => ({
    env: () => ({
        HASH_PEPPER: "test-pepper-value",
        HASH_ITERATIONS: 1000, // low for fast tests
    }),
}));

// Import after mock
const { hashPassword, verifyPassword } = await import("../hash.js");

describe("hashPassword", () => {
    it("returns iterations:salt:hash format", async () => {
        const hash = await hashPassword("MyP@ssw0rd");
        const parts = hash.split(":");
        expect(parts).toHaveLength(3);
        expect(parseInt(parts[0], 10)).toBe(1000);
        expect(parts[1]).toMatch(/^[a-f0-9]{64}$/); // 32 bytes hex = 64 chars
        expect(parts[2]).toMatch(/^[a-f0-9]{128}$/); // 64 bytes hex = 128 chars
    });

    it("generates different salts for the same password", async () => {
        const hash1 = await hashPassword("SamePassword1!");
        const hash2 = await hashPassword("SamePassword1!");
        expect(hash1).not.toBe(hash2);

        const salt1 = hash1.split(":")[1];
        const salt2 = hash2.split(":")[1];
        expect(salt1).not.toBe(salt2);
    });
});

describe("verifyPassword", () => {
    it("returns true for correct password", async () => {
        const hash = await hashPassword("CorrectHorse!");
        const result = await verifyPassword("CorrectHorse!", hash);
        expect(result).toBe(true);
    });

    it("returns false for wrong password", async () => {
        const hash = await hashPassword("CorrectHorse!");
        const result = await verifyPassword("WrongHorse!", hash);
        expect(result).toBe(false);
    });

    it("returns false for malformed hash string", async () => {
        expect(await verifyPassword("any", "invalid")).toBe(false);
        expect(await verifyPassword("any", "")).toBe(false);
        expect(await verifyPassword("any", "a:b")).toBe(false);
    });

    it("handles empty password", async () => {
        const hash = await hashPassword("");
        expect(await verifyPassword("", hash)).toBe(true);
        expect(await verifyPassword("notempty", hash)).toBe(false);
    });
});
