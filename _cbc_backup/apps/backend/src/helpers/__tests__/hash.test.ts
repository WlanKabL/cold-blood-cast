import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword, generateSalt } from "../hash.js";

vi.mock("../../config.js", () => ({
    env: () => ({
        PEPPER: "a".repeat(32),
    }),
}));

describe("hash helpers", () => {
    describe("generateSalt", () => {
        it("returns a hex string of 128 characters", () => {
            const salt = generateSalt();
            expect(salt).toMatch(/^[a-f0-9]{128}$/);
        });

        it("returns unique salts on each call", () => {
            const salt1 = generateSalt();
            const salt2 = generateSalt();
            expect(salt1).not.toBe(salt2);
        });
    });

    describe("hashPassword", () => {
        it("returns a consistent hash for same input", () => {
            const salt = generateSalt();
            const hash1 = hashPassword("password123", salt);
            const hash2 = hashPassword("password123", salt);
            expect(hash1).toBe(hash2);
        });

        it("returns different hashes for different passwords", () => {
            const salt = generateSalt();
            const hash1 = hashPassword("password1", salt);
            const hash2 = hashPassword("password2", salt);
            expect(hash1).not.toBe(hash2);
        });

        it("returns different hashes for different salts", () => {
            const salt1 = generateSalt();
            const salt2 = generateSalt();
            const hash1 = hashPassword("password", salt1);
            const hash2 = hashPassword("password", salt2);
            expect(hash1).not.toBe(hash2);
        });

        it("returns a hex string", () => {
            const salt = generateSalt();
            const hash = hashPassword("test", salt);
            expect(hash).toMatch(/^[a-f0-9]+$/);
        });
    });

    describe("verifyPassword", () => {
        it("returns true for correct password", () => {
            const salt = generateSalt();
            const hash = hashPassword("correctPassword", salt);
            expect(verifyPassword("correctPassword", salt, hash)).toBe(true);
        });

        it("returns false for wrong password", () => {
            const salt = generateSalt();
            const hash = hashPassword("correctPassword", salt);
            expect(verifyPassword("wrongPassword", salt, hash)).toBe(false);
        });

        it("returns false for wrong salt", () => {
            const salt1 = generateSalt();
            const salt2 = generateSalt();
            const hash = hashPassword("password", salt1);
            expect(verifyPassword("password", salt2, hash)).toBe(false);
        });
    });
});
