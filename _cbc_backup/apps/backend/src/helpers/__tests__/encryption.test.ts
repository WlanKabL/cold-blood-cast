import { describe, it, expect, vi, beforeEach } from "vitest";
import { encrypt, decrypt, hmacHash } from "../encryption.js";

const TEST_KEY_HEX = "a".repeat(64); // valid 32-byte hex key

vi.mock("../../config.js", () => ({
    env: () => ({
        ENCRYPTION_KEY: TEST_KEY_HEX,
    }),
}));

describe("encryption helpers", () => {
    describe("encrypt + decrypt", () => {
        it("round-trips a plaintext string", () => {
            const plaintext = "Hello, World!";
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });

        it("produces different ciphertexts for the same plaintext (random IV)", () => {
            const plaintext = "same text";
            const a = encrypt(plaintext);
            const b = encrypt(plaintext);
            expect(a.ciphertext).not.toBe(b.ciphertext);
            expect(a.iv).not.toBe(b.iv);
        });

        it("returns base64-encoded fields", () => {
            const result = encrypt("test");
            const base64Regex = /^[A-Za-z0-9+/]+=*$/;
            expect(result.ciphertext).toMatch(base64Regex);
            expect(result.iv).toMatch(base64Regex);
            expect(result.tag).toMatch(base64Regex);
        });

        it("fails to decrypt with tampered ciphertext", () => {
            const encrypted = encrypt("sensitive data");
            encrypted.ciphertext = Buffer.from("tampered").toString("base64");
            expect(() => decrypt(encrypted)).toThrow();
        });

        it("fails to decrypt with tampered tag", () => {
            const encrypted = encrypt("sensitive data");
            encrypted.tag = Buffer.from("0".repeat(16)).toString("base64");
            expect(() => decrypt(encrypted)).toThrow();
        });

        it("handles empty string", () => {
            const encrypted = encrypt("");
            expect(decrypt(encrypted)).toBe("");
        });

        it("handles unicode content", () => {
            const plaintext = "Über 🐍 Schlangen — «Ñoño»";
            const encrypted = encrypt(plaintext);
            expect(decrypt(encrypted)).toBe(plaintext);
        });
    });

    describe("hmacHash", () => {
        it("returns a 64-character hex string", () => {
            const result = hmacHash("test-value");
            expect(result).toMatch(/^[a-f0-9]{64}$/);
        });

        it("is deterministic for the same input", () => {
            expect(hmacHash("abc")).toBe(hmacHash("abc"));
        });

        it("produces different hashes for different inputs", () => {
            expect(hmacHash("input1")).not.toBe(hmacHash("input2"));
        });
    });
});
