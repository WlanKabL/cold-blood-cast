import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env.js";

const ALGORITHM = "sha512";
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;

function deriveKey(password: string, salt: Buffer, iterations: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        pbkdf2(
            password + env().HASH_PEPPER,
            salt,
            iterations,
            KEY_LENGTH,
            ALGORITHM,
            (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey);
            },
        );
    });
}

/**
 * Hash a password using PBKDF2 + HMAC-SHA512 with salt and pepper.
 * Returns format: `iterations:salt:hash` (all hex-encoded).
 */
export async function hashPassword(password: string): Promise<string> {
    const iterations = env().HASH_ITERATIONS;
    const salt = randomBytes(SALT_LENGTH);
    const hash = await deriveKey(password, salt, iterations);

    return `${iterations}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verify a password against a stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [iterStr, saltHex, hashHex] = storedHash.split(":");
    if (!iterStr || !saltHex || !hashHex) return false;

    const iterations = parseInt(iterStr, 10);
    const salt = Buffer.from(saltHex, "hex");
    const expectedHash = Buffer.from(hashHex, "hex");

    const derivedHash = await deriveKey(password, salt, iterations);

    return timingSafeEqual(derivedHash, expectedHash);
}
