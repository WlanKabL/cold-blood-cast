import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, badRequest } from "@/helpers/errors.js";
import { Prisma } from "@prisma/client";

// ─── User Tags ───────────────────────────────────────────────

export async function listTags(userId: string, category?: string) {
    const where: Record<string, unknown> = {
        OR: [{ userId }, { userId: null }],
    };
    if (category) where.category = category;

    return prisma.tag.findMany({
        where,
        orderBy: [{ category: "asc" }, { name: "asc" }],
    });
}

export async function getTag(id: string, userId: string) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag || (tag.userId !== null && tag.userId !== userId)) {
        throw notFound(ErrorCodes.E_TAG_NOT_FOUND, "Tag not found");
    }
    return tag;
}

export async function createTag(
    userId: string,
    data: { name: string; category: string; color?: string },
) {
    const normalizedName = data.name.trim();

    try {
        return await prisma.tag.create({
            data: {
                name: normalizedName,
                category: data.category,
                color: data.color ?? null,
                userId,
            },
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw badRequest(
                ErrorCodes.E_TAG_DUPLICATE,
                "A tag with this name already exists in this category",
            );
        }
        throw err;
    }
}

export async function updateTag(
    id: string,
    userId: string,
    data: { name?: string; category?: string; color?: string },
) {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_TAG_NOT_FOUND, "Tag not found");
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.color !== undefined) updateData.color = data.color || null;

    try {
        return await prisma.tag.update({
            where: { id },
            data: updateData,
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw badRequest(
                ErrorCodes.E_TAG_DUPLICATE,
                "A tag with this name already exists in this category",
            );
        }
        throw err;
    }
}

export async function deleteTag(id: string, userId: string) {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_TAG_NOT_FOUND, "Tag not found");
    }
    await prisma.tag.delete({ where: { id } });
}

// ─── Admin: Global Tags ─────────────────────────────────────

export async function listGlobalTags() {
    return prisma.tag.findMany({
        where: { userId: null },
        orderBy: [{ category: "asc" }, { name: "asc" }],
    });
}

export async function createGlobalTag(data: {
    name: string;
    category: string;
    color?: string;
}) {
    const normalizedName = data.name.trim();

    try {
        return await prisma.tag.create({
            data: {
                name: normalizedName,
                category: data.category,
                color: data.color ?? null,
                userId: null,
            },
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw badRequest(
                ErrorCodes.E_TAG_DUPLICATE,
                "A global tag with this name already exists in this category",
            );
        }
        throw err;
    }
}

export async function updateGlobalTag(
    id: string,
    data: { name?: string; category?: string; color?: string },
) {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing || existing.userId !== null) {
        throw notFound(ErrorCodes.E_TAG_NOT_FOUND, "Global tag not found");
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.color !== undefined) updateData.color = data.color || null;

    try {
        return await prisma.tag.update({
            where: { id },
            data: updateData,
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw badRequest(
                ErrorCodes.E_TAG_DUPLICATE,
                "A global tag with this name already exists in this category",
            );
        }
        throw err;
    }
}

export async function deleteGlobalTag(id: string) {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing || existing.userId !== null) {
        throw notFound(ErrorCodes.E_TAG_NOT_FOUND, "Global tag not found");
    }
    await prisma.tag.delete({ where: { id } });
}
