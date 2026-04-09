import { describe, it, expect, vi, beforeAll } from "vitest";
import {
    encryptBuffer,
    decryptBuffer,
    encryptFile,
    decryptFile,
    migrateFileToEncrypted,
} from "../file-crypto.js";
import { writeFile, readFile, stat, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes, randomUUID } from "node:crypto";

// Mock env() to return a test encryption key
vi.mock("@/config/env.js", () => ({
    env: () => ({
        ENCRYPTION_KEY: "a".repeat(64), // 64 hex chars → 32 bytes
    }),
}));

describe("file-crypto", () => {
    // ── Buffer encrypt/decrypt ───────────────────

    it("encrypts and decrypts a buffer roundtrip", () => {
        const original = Buffer.from("Hello, encrypted world!");
        const encrypted = encryptBuffer(original);

        expect(encrypted).not.toEqual(original);
        expect(encrypted.length).toBeGreaterThan(original.length);

        const decrypted = decryptBuffer(encrypted);
        expect(decrypted).toEqual(original);
    });

    it("encrypts binary data (image-like) roundtrip", () => {
        const original = randomBytes(10_000);
        const encrypted = encryptBuffer(original);
        const decrypted = decryptBuffer(encrypted);
        expect(decrypted).toEqual(original);
    });

    it("produces different ciphertext for same input (random IV)", () => {
        const original = Buffer.from("same input");
        const enc1 = encryptBuffer(original);
        const enc2 = encryptBuffer(original);
        expect(enc1).not.toEqual(enc2);
    });

    it("throws on tampered ciphertext", () => {
        const original = Buffer.from("tamper test");
        const encrypted = encryptBuffer(original);

        // Flip a byte in the ciphertext portion (after IV + tag = 28 bytes)
        encrypted[30] ^= 0xff;

        expect(() => decryptBuffer(encrypted)).toThrow();
    });

    it("throws on truncated data", () => {
        expect(() => decryptBuffer(Buffer.alloc(10))).toThrow("too short");
    });

    it("handles empty buffer", () => {
        const original = Buffer.alloc(0);
        const encrypted = encryptBuffer(original);
        const decrypted = decryptBuffer(encrypted);
        expect(decrypted).toEqual(original);
    });

    // ── File encrypt/decrypt ─────────────────────

    let testDir: string;

    beforeAll(async () => {
        testDir = join(tmpdir(), `cbc-crypto-test-${randomUUID()}`);
        await mkdir(testDir, { recursive: true });
    });

    it("encrypts a file and creates .enc, removes original", async () => {
        const filePath = join(testDir, "test-image.png");
        const content = randomBytes(5_000);
        await writeFile(filePath, content);

        const encPath = await encryptFile(filePath);

        expect(encPath).toBe(`${filePath}.enc`);

        // Original should be deleted
        const originalExists = await stat(filePath).catch(() => null);
        expect(originalExists).toBeNull();

        // .enc should exist
        const encExists = await stat(encPath).catch(() => null);
        expect(encExists).not.toBeNull();
    });

    it("decrypts a .enc file back to original content", async () => {
        const filePath = join(testDir, "test-decrypt.png");
        const content = randomBytes(5_000);
        await writeFile(filePath, content);

        const encPath = await encryptFile(filePath);
        const decrypted = await decryptFile(encPath);

        expect(decrypted).toEqual(content);

        // Cleanup
        await unlink(encPath).catch(() => {});
    });

    it("migrateFileToEncrypted verifies roundtrip and removes original", async () => {
        const filePath = join(testDir, "migrate-test.json");
        const content = Buffer.from('{"test": true}');
        await writeFile(filePath, content);

        const encPath = await migrateFileToEncrypted(filePath);

        expect(encPath).toBe(`${filePath}.enc`);

        // Original deleted
        const originalExists = await stat(filePath).catch(() => null);
        expect(originalExists).toBeNull();

        // Decryption matches
        const decrypted = await decryptFile(encPath);
        expect(decrypted).toEqual(content);

        // Cleanup
        await unlink(encPath).catch(() => {});
    });

    it("migrateFileToEncrypted restores original on failure with bad permissions", async () => {
        const filePath = join(testDir, "migrate-fail.txt");
        const content = Buffer.from("should survive");
        await writeFile(filePath, content);

        // Create a directory where .enc file should go — writeFile to a dir path will fail
        const encPath = `${filePath}.enc`;
        await mkdir(encPath, { recursive: true });

        await expect(migrateFileToEncrypted(filePath)).rejects.toThrow();

        // Original should be restored from .bak
        const restored = await readFile(filePath);
        expect(restored).toEqual(content);

        // Cleanup the blocking directory
        const { rmdir } = await import("node:fs/promises");
        await rmdir(encPath).catch(() => {});
        await unlink(filePath).catch(() => {});
    });

    it("handles large files (1MB+)", { timeout: 15_000 }, async () => {
        const filePath = join(testDir, "large-file.bin");
        const content = randomBytes(1_500_000); // 1.5 MB
        await writeFile(filePath, content);

        const encPath = await encryptFile(filePath);
        const decrypted = await decryptFile(encPath);
        expect(decrypted).toEqual(content);

        await unlink(encPath).catch(() => {});
    });
});
