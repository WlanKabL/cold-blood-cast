import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFile, writeFile, unlink, rename } from "node:fs/promises";
import { env } from "@/config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Derive the 32-byte AES key from ENCRYPTION_KEY env var.
 * Same logic as helpers/encryption.ts to keep one key for everything.
 */
function getKey(): Buffer {
    const key = env().ENCRYPTION_KEY;
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
        return Buffer.from(key, "hex");
    }
    const buf = Buffer.from(key, "utf8");
    if (buf.length < 32) {
        throw new Error(`ENCRYPTION_KEY must be at least 32 bytes (got ${buf.length}).`);
    }
    return buf.subarray(0, 32);
}

/**
 * Encrypt a buffer with AES-256-GCM.
 * Returns a single buffer: [IV (12 bytes)][Auth Tag (16 bytes)][Ciphertext]
 */
export function encryptBuffer(plaintext: Buffer): Buffer {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Pack: IV + tag + ciphertext
    return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypt a buffer produced by `encryptBuffer`.
 * Input format: [IV (12 bytes)][Auth Tag (16 bytes)][Ciphertext]
 */
export function decryptBuffer(packed: Buffer): Buffer {
    if (packed.length < IV_LENGTH + TAG_LENGTH) {
        throw new Error("Encrypted data too short — missing IV or auth tag");
    }

    const key = getKey();
    const iv = packed.subarray(0, IV_LENGTH);
    const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = packed.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Encrypt a file on disk in-place.
 * Reads the plaintext file, encrypts it, writes `path.enc`, deletes original.
 * Returns the .enc path.
 */
export async function encryptFile(plainPath: string): Promise<string> {
    const plaintext = await readFile(plainPath);
    const encrypted = encryptBuffer(plaintext);
    const encPath = `${plainPath}.enc`;
    await writeFile(encPath, encrypted);
    await unlink(plainPath);
    return encPath;
}

/**
 * Read and decrypt a .enc file, returning the plaintext buffer.
 */
export async function decryptFile(encPath: string): Promise<Buffer> {
    const packed = await readFile(encPath);
    return decryptBuffer(packed);
}

/**
 * Encrypt an existing plaintext file for migration purposes.
 * Keeps original as .bak until encryption is confirmed, then removes .bak.
 */
export async function migrateFileToEncrypted(plainPath: string): Promise<string> {
    const bakPath = `${plainPath}.bak`;
    const encPath = `${plainPath}.enc`;

    // Rename original to .bak for safety
    await rename(plainPath, bakPath);

    try {
        const plaintext = await readFile(bakPath);
        const encrypted = encryptBuffer(plaintext);
        await writeFile(encPath, encrypted);
        // Verify decryption roundtrip
        const decrypted = decryptBuffer(encrypted);
        if (!plaintext.equals(decrypted)) {
            throw new Error("Roundtrip verification failed");
        }
        // Remove backup
        await unlink(bakPath);
        return encPath;
    } catch (err) {
        // Restore original on failure
        await rename(bakPath, plainPath).catch(() => {});
        throw err;
    }
}
