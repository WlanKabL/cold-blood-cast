import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "../config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
    const key = env().ENCRYPTION_KEY;
    if (!key) {
        throw new Error("ENCRYPTION_KEY is not configured");
    }
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
        return Buffer.from(key, "hex");
    }
    const buf = Buffer.from(key, "utf8");
    if (buf.length < 32) {
        throw new Error(`ENCRYPTION_KEY must be at least 32 bytes (got ${buf.length})`);
    }
    return buf.subarray(0, 32);
}

export function encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
        ciphertext: encrypted.toString("base64"),
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
    };
}

export function decrypt(data: { ciphertext: string; iv: string; tag: string }): string {
    const key = getKey();
    const iv = Buffer.from(data.iv, "base64");
    const tag = Buffer.from(data.tag, "base64");
    const ciphertext = Buffer.from(data.ciphertext, "base64");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function hmacHash(value: string): string {
    const key = getKey();
    return createHmac("sha256", key).update(value).digest("hex");
}
