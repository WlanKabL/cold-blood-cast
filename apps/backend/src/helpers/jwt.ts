import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validateEnv } from "../config.js";
import type { User } from "@cold-blood-cast/shared";

export interface AccessTokenPayload {
    userId: string;
    username: string;
}

export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
}

export function signAccessToken(user: User): string {
    const env = validateEnv(process.env);
    const payload: AccessTokenPayload = { userId: user.id, username: user.username };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
    });
}

export function signRefreshToken(user: User): { token: string; tokenId: string } {
    const env = validateEnv(process.env);
    const tokenId = crypto.randomUUID();
    const payload: RefreshTokenPayload = { userId: user.id, tokenId };
    const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
    });
    return { token, tokenId };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    const env = validateEnv(process.env);
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    const env = validateEnv(process.env);
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export const REFRESH_COOKIE_NAME = "cold_blood_cast_refresh";

export const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
