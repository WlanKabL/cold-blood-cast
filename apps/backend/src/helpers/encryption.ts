import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "@/config/env.js";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
    const key = env().ENCRYPTION_KEY;
    // Hex format (64 hex chars → 32 bytes) — recommended, matches .env.example generator
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
        return Buffer.from(key, "hex");
    }
    // UTF-8 fallback — must be at least 32 bytes, we use the first 32
    const buf = Buffer.from(key, "utf8");
    if (buf.length < 32) {
        throw new Error(
            `ENCRYPTION_KEY must be at least 32 bytes (got ${buf.length}). Use 64 hex chars or a ≥32-byte UTF-8 string.`,
        );
    }
    return buf.subarray(0, 32);
}

export interface EncryptedData {
    ciphertext: string; // hex
    iv: string; // hex
    tag: string; // hex
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns ciphertext, IV, and auth tag — all hex-encoded.
 */
export function encrypt(plaintext: string): EncryptedData {
    const key = getKey();
    const iv = randomBytes(12); // 96-bit IV for GCM
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return {
        ciphertext,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
    };
}

/**
 * Decrypt a ciphertext encrypted with `encrypt()`.
 */
export function decrypt(data: EncryptedData): string {
    const key = getKey();
    const iv = Buffer.from(data.iv, "hex");
    const tag = Buffer.from(data.tag, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let plaintext = decipher.update(data.ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");
    return plaintext;
}

/**
 * Deterministic HMAC-SHA-256 hash — safe for indexing and unique constraints.
 * Same input always produces the same output (unlike AES-GCM with random IV).
 */
export function hmacHash(value: string): string {
    return createHmac("sha256", getKey()).update(value).digest("hex");
}
