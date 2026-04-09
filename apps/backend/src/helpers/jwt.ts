import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "@/config/env.js";

export interface AccessTokenPayload {
    userId: string;
    username: string;
}

export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign({ ...payload }, env().JWT_ACCESS_SECRET, {
        expiresIn: env().JWT_ACCESS_EXPIRY as StringValue,
    });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign({ ...payload }, env().JWT_REFRESH_SECRET, {
        expiresIn: env().JWT_REFRESH_EXPIRY as StringValue,
    });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env().JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env().JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
