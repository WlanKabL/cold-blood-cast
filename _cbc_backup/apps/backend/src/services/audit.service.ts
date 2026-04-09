import { prisma } from "../db/client.js";
import type { Prisma } from "../generated/prisma/client.js";

export async function auditLog(
    userId: string | null,
    action: string,
    entity?: string | null,
    entityId?: string | null,
    details?: Prisma.InputJsonValue,
    ipAddress?: string | null,
): Promise<void> {
    await prisma.auditLog.create({
        data: {
            userId,
            action,
            entity: entity ?? null,
            entityId: entityId ?? null,
            details: details ?? undefined,
            ipAddress: ipAddress ?? null,
        },
    });
}

export interface AuditLogFilters {
    action?: string;
    entity?: string;
    userId?: string;
    page?: number;
    limit?: number;
}

export async function listAuditLogs(filters: AuditLogFilters) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.action) where.action = { contains: filters.action };
    if (filters.entity) where.entity = { contains: filters.entity };
    if (filters.userId) where.userId = filters.userId;

    const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        items,
        meta: { page, perPage: limit, total, totalPages: Math.ceil(total / limit) },
    };
}
