import crypto from "crypto";
import { validateEnv } from "../config.js";

const ITERATIONS = 100_000;
const KEY_LENGTH = 128;
const DIGEST = "sha512";

export function hashPassword(password: string, salt: string): string {
    const env = validateEnv(process.env);
    const derivedKey = crypto.pbkdf2Sync(
        password + env.PEPPER,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        DIGEST,
    );
    return derivedKey.toString("hex");
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
    const hash = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
}

export function generateSalt(): string {
    return crypto.randomBytes(64).toString("hex");
}
