import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config.js";
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
    const { JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRY } = env();
    const payload: AccessTokenPayload = { userId: user.id, username: user.username };
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
    });
}

export function signRefreshToken(user: User): { token: string; tokenId: string } {
    const { JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRY } = env();
    const tokenId = crypto.randomUUID();
    const payload: RefreshTokenPayload = { userId: user.id, tokenId };
    const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
    });
    return { token, tokenId };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    const { JWT_ACCESS_SECRET } = env();
    return jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    const { JWT_REFRESH_SECRET } = env();
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export const REFRESH_COOKIE_NAME = "cold_blood_cast_refresh";

export const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
