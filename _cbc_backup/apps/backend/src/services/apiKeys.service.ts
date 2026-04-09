import { randomBytes, createHash } from "crypto";
import { prisma } from "../db/client.js";
import { badRequest, notFound, forbidden } from "../helpers/errors.js";

const PREFIX = "cbc_";
const PREFIX_LENGTH = 12;

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
    const bytes = randomBytes(32);
    const raw = `${PREFIX}${bytes.toString("hex")}`;
    const prefix = raw.substring(0, PREFIX_LENGTH);
    const hash = createHash("sha256").update(raw).digest("hex");
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

export async function createApiKey(
    userId: string,
    data: { name: string; scopes?: string[]; expiresAt?: Date },
) {
    const { raw, prefix, hash } = generateApiKey();

    const key = await prisma.apiKey.create({
        data: {
            userId,
            name: data.name,
            prefix,
            hash,
            scopes: data.scopes ?? [],
            expiresAt: data.expiresAt,
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

    return { ...key, raw };
}

export async function revokeApiKey(userId: string, id: string): Promise<void> {
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw notFound("API key not found");
    if (key.userId !== userId) throw forbidden("Not your API key");
    if (key.revoked) throw badRequest("API key is already revoked");

    await prisma.apiKey.update({
        where: { id },
        data: { revoked: true },
    });
}

export async function deleteApiKey(userId: string, id: string): Promise<void> {
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw notFound("API key not found");
    if (key.userId !== userId) throw forbidden("Not your API key");

    await prisma.apiKey.delete({ where: { id } });
}

export async function validateApiKey(
    rawKey: string,
): Promise<{ userId: string; scopes: string[] } | null> {
    const hash = createHash("sha256").update(rawKey).digest("hex");

    const key = await prisma.apiKey.findFirst({
        where: { hash },
        select: {
            id: true,
            userId: true,
            scopes: true,
            revoked: true,
            expiresAt: true,
        },
    });

    if (!key) return null;
    if (key.revoked) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;

    // Update lastUsedAt (fire-and-forget)
    prisma.apiKey
        .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
        .catch(() => {});

    return { userId: key.userId, scopes: key.scopes };
}
