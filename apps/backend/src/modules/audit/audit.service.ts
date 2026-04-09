import { prisma } from "@/config/database.js";

/**
 * Log an auditable action. Fire-and-forget friendly.
 */
export async function auditLog(
    userId: string | null,
    action: string,
    entity?: string | null,
    entityId?: string | null,
    details?: unknown,
    ipAddress?: string | null,
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity: entity ?? null,
                entityId: entityId ?? null,
                details: details ? (details as object) : undefined,
                ipAddress: ipAddress ?? null,
            },
        });
    } catch (err) {
        // Never let audit logging crash the request
        console.error("Audit log write failed:", err);
    }
}

export interface AuditLogFilters {
    userId?: string;
    action?: string;
    entity?: string;
    page?: number;
    limit?: number;
}

export async function getAuditLogs(filters: AuditLogFilters) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.entity) where.entity = filters.entity;

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: where as never,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.count({ where: where as never }),
    ]);

    return {
        items: logs,
        meta: {
            page,
            perPage: limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
