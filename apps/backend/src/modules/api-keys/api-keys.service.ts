import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/config/index.js";
import { notFound, unauthorized, ErrorCodes } from "@/helpers/index.js";
import type { CreateApiKeyInput } from "./api-keys.schemas.js";

function hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): { raw: string; prefix: string; hash: string } {
    const raw = `kl_${randomBytes(32).toString("hex")}`;
    const prefix = raw.slice(0, 12);
    const hash = hashKey(raw);
    return { raw, prefix, hash };
}

export async function listApiKeys(userId: string) {
    return prisma.apiKey.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            prefix: true,
            scopes: true,
            lastUsedAt: true,
            expiresAt: true,
            revoked: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createApiKey(userId: string, data: CreateApiKeyInput) {
    const { raw, prefix, hash } = generateApiKey();

    const expiresAt = data.expiresInDays
        ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    const key = await prisma.apiKey.create({
        data: {
            userId,
            name: data.name,
            keyHash: hash,
            prefix,
            scopes: data.scopes,
            expiresAt,
        },
        select: {
            id: true,
            name: true,
            prefix: true,
            scopes: true,
            expiresAt: true,
            createdAt: true,
        },
    });

    // Return the raw key only on creation — it won't be retrievable after this
    return { ...key, key: raw };
}

export async function revokeApiKey(userId: string, id: string) {
    const existing = await prisma.apiKey.findFirst({ where: { id, userId } });
    if (!existing) throw notFound(ErrorCodes.E_API_KEY_NOT_FOUND, "API key not found");

    return prisma.apiKey.update({
        where: { id },
        data: { revoked: true },
    });
}

export async function deleteApiKey(userId: string, id: string) {
    const existing = await prisma.apiKey.findFirst({ where: { id, userId } });
    if (!existing) throw notFound(ErrorCodes.E_API_KEY_NOT_FOUND, "API key not found");
    await prisma.apiKey.delete({ where: { id } });
}

/**
 * Validate an API key from a request header.
 * Returns the userId if valid, throws otherwise.
 */
export async function validateApiKey(rawKey: string) {
    const hash = hashKey(rawKey);

    const apiKey = await prisma.apiKey.findFirst({
        where: { keyHash: hash },
        include: { user: { select: { id: true, banned: true } } },
    });

    if (!apiKey) throw unauthorized(ErrorCodes.E_API_KEY_NOT_FOUND, "Invalid API key");
    if (apiKey.revoked)
        throw unauthorized(ErrorCodes.E_API_KEY_REVOKED, "API key has been revoked");
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        throw unauthorized(ErrorCodes.E_API_KEY_EXPIRED, "API key has expired");
    }

    // Update last used
    await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
    });

    return {
        userId: apiKey.userId,
        scopes: apiKey.scopes,
        banned: apiKey.user.banned,
    };
}
