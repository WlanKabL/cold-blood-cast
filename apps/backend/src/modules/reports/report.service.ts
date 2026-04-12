import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

// ─── Public: Create Report ───────────────────────────────────

interface CreateReportInput {
    targetType: string;
    targetId: string;
    targetUrl?: string;
    reason: string;
    description?: string;
    reporterName?: string;
}

export async function createReport(input: CreateReportInput) {
    return prisma.contentReport.create({
        data: {
            targetType: input.targetType,
            targetId: input.targetId,
            targetUrl: input.targetUrl,
            reason: input.reason,
            description: input.description,
            reporterName: input.reporterName,
        },
    });
}

// ─── Admin: List Reports ─────────────────────────────────────

interface ListReportsOptions {
    status?: string;
    targetType?: string;
    page?: number;
    limit?: number;
}

export async function listReports(options: ListReportsOptions) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options.status) where.status = options.status;
    if (options.targetType) where.targetType = options.targetType;

    const [items, total] = await Promise.all([
        prisma.contentReport.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                resolvedBy: { select: { id: true, username: true, displayName: true } },
            },
        }),
        prisma.contentReport.count({ where }),
    ]);

    // Resolve user_profile slugs → userId for admin quick-actions
    const userProfileSlugs = items
        .filter((r) => r.targetType === "user_profile")
        .map((r) => r.targetId);

    const resolvedUsers =
        userProfileSlugs.length > 0
            ? await prisma.userPublicProfile.findMany({
                  where: { slug: { in: userProfileSlugs } },
                  select: { slug: true, userId: true, user: { select: { id: true, username: true, banned: true } } },
              })
            : [];

    const slugToUser = new Map(resolvedUsers.map((u) => [u.slug, u.user]));

    const enrichedItems = items.map((item) => ({
        ...item,
        targetUser: item.targetType === "user_profile" ? (slugToUser.get(item.targetId) ?? null) : null,
    }));

    return { items: enrichedItems, total, page, limit };
}

// ─── Admin: Resolve Report ───────────────────────────────────

export async function resolveReport(
    reportId: string,
    adminUserId: string,
    status: "reviewed" | "dismissed",
    adminNote?: string,
) {
    const report = await prisma.contentReport.findUnique({ where: { id: reportId } });
    if (!report) {
        throw notFound(ErrorCodes.E_REPORT_NOT_FOUND, "Report not found");
    }

    return prisma.contentReport.update({
        where: { id: reportId },
        data: {
            status,
            adminNote,
            resolvedAt: new Date(),
            resolvedById: adminUserId,
        },
    });
}

// ─── Admin: Get Report Stats ─────────────────────────────────

export async function getReportStats() {
    const [pending, reviewed, dismissed, total] = await Promise.all([
        prisma.contentReport.count({ where: { status: "pending" } }),
        prisma.contentReport.count({ where: { status: "reviewed" } }),
        prisma.contentReport.count({ where: { status: "dismissed" } }),
        prisma.contentReport.count(),
    ]);

    return { pending, reviewed, dismissed, total };
}
