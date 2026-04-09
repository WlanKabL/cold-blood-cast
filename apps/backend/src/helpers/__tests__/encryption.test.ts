import { describe, it, expect, vi } from "vitest";
import { encrypt, decrypt, hmacHash } from "../encryption.js";

// Mock env() to return a test encryption key
vi.mock("@/config/env.js", () => ({
    env: () => ({
        ENCRYPTION_KEY: "a".repeat(64), // 64 hex chars → 32 bytes
    }),
}));

describe("encryption", () => {
    // ── AES-256-GCM encrypt / decrypt ────────────

    it("encrypts and decrypts a string roundtrip", () => {
        const plaintext = "5047032565";
        const data = encrypt(plaintext);
        expect(data.ciphertext).toBeTruthy();
        expect(data.iv).toBeTruthy();
        expect(data.tag).toBeTruthy();

        const result = decrypt(data);
        expect(result).toBe(plaintext);
    });

    it("produces different ciphertext for same input (random IV)", () => {
        const plaintext = "5047032565";
        const a = encrypt(plaintext);
        const b = encrypt(plaintext);
        expect(a.ciphertext).not.toBe(b.ciphertext);
        expect(a.iv).not.toBe(b.iv);
    });

    it("throws on tampered ciphertext", () => {
        const data = encrypt("secret");
        data.ciphertext = data.ciphertext.replace(/./g, "0");
        expect(() => decrypt(data)).toThrow();
    });

    it("handles empty string", () => {
        const data = encrypt("");
        expect(decrypt(data)).toBe("");
    });

    // ── HMAC-SHA-256 ─────────────────────────────

    it("produces deterministic hash for same input", () => {
        const a = hmacHash("5047032565");
        const b = hmacHash("5047032565");
        expect(a).toBe(b);
    });

    it("produces different hashes for different inputs", () => {
        const a = hmacHash("5047032565");
        const b = hmacHash("9999999999");
        expect(a).not.toBe(b);
    });

    it("returns a 64-char hex string", () => {
        const hash = hmacHash("test");
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    // ── Integration: HMAC + encrypt/decrypt for sensitive data flow ─────

    it("can use HMAC for lookup and decrypt for real value", () => {
        const sensorId = "5047032565";

        // Simulate create: store hash + encrypted
        const hash = hmacHash(sensorId);
        const encrypted = encrypt(sensorId);

        // Simulate lookup by hash: deterministic, works for WHERE clause
        expect(hmacHash(sensorId)).toBe(hash);

        // Simulate read: decrypt the real value
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(sensorId);

        // Hash is not the plaintext
        expect(hash).not.toBe(sensorId);
    });
});
