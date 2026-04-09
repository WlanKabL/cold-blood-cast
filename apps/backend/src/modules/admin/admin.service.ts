import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { ErrorCodes, notFound, badRequest, forbidden } from "@/helpers/errors.js";
import { LIMIT_KEYS, type LimitKey } from "@cold-blood-cast/shared";
import {
    sendMail,
    accountBannedTemplate,
    accountApprovedTemplate,
    accountRejectedTemplate,
} from "@/modules/mail/index.js";

// ─── User Management ─────────────────────────────────────────

const ALLOWED_SORT_FIELDS = [
    "createdAt",
    "username",
    "email",
    "lastActiveAt",
    "updatedAt",
] as const;

export interface AdminUserFilters {
    search?: string;
    role?: string;
    banned?: string;
    approved?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
}

export async function listUsers(filters: AdminUserFilters) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;
    const orderBy: Record<string, "asc" | "desc"> = {};
    const sortField = ALLOWED_SORT_FIELDS.includes(
        filters.sortBy as (typeof ALLOWED_SORT_FIELDS)[number],
    )
        ? filters.sortBy!
        : "createdAt";
    orderBy[sortField] = filters.sortDir ?? "desc";

    const where: Record<string, unknown> = {};

    if (filters.search) {
        where.OR = [
            { username: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
            { displayName: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    if (filters.role) {
        where.roles = { some: { role: { name: filters.role } } };
    }

    if (filters.banned === "true") where.banned = true;
    else if (filters.banned === "false") where.banned = false;

    if (filters.approved === "true") where.approved = true;
    else if (filters.approved === "false") where.approved = false;

    if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom)
            (where.createdAt as Record<string, unknown>).gte = new Date(filters.dateFrom);
        if (filters.dateTo)
            (where.createdAt as Record<string, unknown>).lte = new Date(filters.dateTo);
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where: where as never,
            skip,
            take: limit,
            orderBy,
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                banned: true,
                approved: true,
                emailVerified: true,
                bannedReason: true,
                lastActiveAt: true,
                createdAt: true,
                updatedAt: true,
                roles: {
                    include: {
                        role: { select: { id: true, name: true, displayName: true, color: true } },
                    },
                },
                subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
                _count: {
                    select: {
                        enclosures: true,
                        pets: true,
                        sensors: true,
                    },
                },
            },
        }),
        prisma.user.count({ where: where as never }),
    ]);

    return {
        items: users.map((u) => ({
            ...u,
            roles: u.roles, // keep nested { role: {...} } shape
        })),
        meta: {
            page,
            perPage: limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getAdminUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            banned: true,
            emailVerified: true,
            bannedAt: true,
            bannedBy: true,
            bannedReason: true,
            lastActiveAt: true,
            createdAt: true,
            updatedAt: true,
            roles: { include: { role: true } },
            featureFlags: { include: { featureFlag: true } },
            limitOverrides: true,
            subscription: true,
            _count: {
                select: {
                    enclosures: true,
                    pets: true,
                    sensors: true,
                    alertRules: true,
                },
            },
        },
    });

    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");

    return {
        ...user,
        roles: user.roles, // keep nested { role: {...} } shape for frontend
        featureFlags: user.featureFlags, // keep nested { featureFlagId, enabled, featureFlag } shape
    };
}

// ─── Role Assignment ─────────────────────────────────────────

export async function assignRoleToUser(userId: string, roleId: string, grantedBy: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw notFound(ErrorCodes.E_ROLE_NOT_FOUND, "Role not found");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");

    const existing = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId, roleId } },
    });
    if (existing) throw badRequest(ErrorCodes.E_ROLE_ALREADY_ASSIGNED, "Role already assigned");

    return prisma.userRole.create({
        data: { userId, roleId, grantedBy },
        include: { role: true },
    });
}

export async function removeRoleFromUser(userId: string, roleId: string, removedBy?: string) {
    const userRole = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId, roleId } },
        include: { role: { select: { name: true } } },
    });
    if (!userRole) throw notFound(ErrorCodes.E_ROLE_NOT_FOUND, "User does not have this role");

    // Prevent removing own ADMIN role
    if (userRole.role.name === "ADMIN" && removedBy === userId) {
        throw forbidden("Cannot remove your own admin role");
    }

    return prisma.userRole.delete({
        where: { userId_roleId: { userId, roleId } },
    });
}

// ─── User Feature Flag Overrides ─────────────────────────────

export async function setUserFeatureOverride(
    userId: string,
    featureFlagId: string,
    enabled: boolean,
    grantedBy: string,
) {
    const flag = await prisma.featureFlag.findUnique({ where: { id: featureFlagId } });
    if (!flag) throw notFound(ErrorCodes.E_FEATURE_FLAG_NOT_FOUND, "Feature flag not found");

    return prisma.userFeatureFlag.upsert({
        where: { userId_featureFlagId: { userId, featureFlagId } },
        update: { enabled, grantedBy },
        create: { userId, featureFlagId, enabled, grantedBy },
        include: { featureFlag: true },
    });
}

export async function removeUserFeatureOverride(userId: string, featureFlagId: string) {
    return prisma.userFeatureFlag
        .delete({
            where: { userId_featureFlagId: { userId, featureFlagId } },
        })
        .catch(() => {
            throw notFound(ErrorCodes.E_FEATURE_FLAG_NOT_FOUND, "Override not found");
        });
}

// ─── User Limit Overrides ────────────────────────────────────

export async function setUserLimitOverride(
    userId: string,
    key: string,
    value: number,
    grantedBy: string,
) {
    if (!LIMIT_KEYS.includes(key as LimitKey)) {
        throw badRequest(
            ErrorCodes.E_VALIDATION_ERROR,
            `Invalid limit key: ${key}. Valid keys: ${LIMIT_KEYS.join(", ")}`,
        );
    }

    return prisma.userLimitOverride.upsert({
        where: { userId_key: { userId, key } },
        update: { value, grantedBy },
        create: { userId, key, value, grantedBy },
    });
}

export async function removeUserLimitOverride(userId: string, key: string) {
    return prisma.userLimitOverride
        .delete({
            where: { userId_key: { userId, key } },
        })
        .catch(() => {
            throw notFound(ErrorCodes.E_NOT_FOUND, "Limit override not found");
        });
}

// ─── Ban / Unban ─────────────────────────────────────────────

export async function banUser(userId: string, bannedBy: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");

    // Can't ban admins
    const adminRole = await prisma.userRole.findFirst({
        where: { userId, role: { name: "ADMIN" } },
    });
    if (adminRole) throw forbidden("Cannot ban an admin user");

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
    });

    const u = await prisma.user.update({
        where: { id: userId },
        data: { banned: true, bannedAt: new Date(), bannedBy, bannedReason: reason },
    });

    // Send ban notification email (fire-and-forget)
    void sendMail({
        to: u.email,
        subject: "Account Suspended — KeeperLog",
        html: accountBannedTemplate({
            username: u.username,
            reason,
            supportEmail: "support@cold-blood-cast.app",
        }),
        log: { userId, template: "account_banned", sentBy: bannedBy },
    });

    return u;
}

export async function unbanUser(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { banned: false, bannedAt: null, bannedBy: null, bannedReason: null },
    });
}

export async function deleteUser(userId: string, requestingUserId: string) {
    if (userId === requestingUserId) {
        throw forbidden("Cannot delete your own account");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: { include: { role: { select: { name: true } } } } },
    });
    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");

    const isAdmin = user.roles.some((r) => r.role.name === "ADMIN");
    if (isAdmin) throw forbidden("Cannot delete an admin user");

    // All relations have onDelete: Cascade — single delete is sufficient
    await prisma.user.delete({ where: { id: userId } });
}

// ─── Admin Update User Profile ───────────────────────────────

export async function adminUpdateUser(
    userId: string,
    data: { username?: string; email?: string; displayName?: string; emailVerified?: boolean },
) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");

    // Only pass allowed fields to prevent mass-assignment
    const updateData: Record<string, unknown> = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.emailVerified !== undefined) {
        updateData.emailVerified = data.emailVerified;
        // Clear verification code fields when manually verifying
        if (data.emailVerified) {
            updateData.verificationCode = null;
            updateData.verificationCodeExpiresAt = null;
        }
    }

    return prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, username: true, email: true, displayName: true, emailVerified: true },
    });
}

// ─── Platform Stats ──────────────────────────────────────────

export async function getPlatformStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        newUsersToday,
        activeUsersWeek,
        totalEnclosures,
        totalPets,
        totalSensors,
        bannedUsers,
        premiumUsers,
        totalAuditLogs,
        pendingAccessRequests,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({ where: { lastActiveAt: { gte: weekAgo } } }),
        prisma.enclosure.count(),
        prisma.pet.count(),
        prisma.sensor.count(),
        prisma.user.count({ where: { banned: true } }),
        prisma.subscription.count({ where: { status: "active" } }),
        prisma.auditLog.count(),
        prisma.accessRequest.count({ where: { status: "pending" } }),
    ]);

    return {
        totalUsers,
        activeUsers: activeUsersWeek,
        bannedUsers,
        premiumUsers,
        totalEnclosures,
        totalPets,
        totalSensors,
        todayNewUsers: newUsersToday,
        pendingAccessRequests,
        totalAuditLogs,
    };
}

// ─── User Growth (for charts) ────────────────────────────────

export async function getUserGrowth(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const users = await prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    for (const u of users) {
        const dateKey = u.createdAt.toISOString().split("T")[0];
        grouped[dateKey] = (grouped[dateKey] ?? 0) + 1;
    }

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

// ─── Bulk Operations ─────────────────────────────────────────

export async function bulkAssignRole(userIds: string[], roleId: string, grantedBy: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw notFound(ErrorCodes.E_ROLE_NOT_FOUND, "Role not found");

    return prisma.userRole.createMany({
        data: userIds.map((userId) => ({ userId, roleId, grantedBy })),
        skipDuplicates: true,
    });
}

export async function bulkRemoveRole(userIds: string[], roleId: string) {
    return prisma.userRole.deleteMany({
        where: { userId: { in: userIds }, roleId },
    });
}

// ─── Impersonate Token ───────────────────────────────────────
// We don't generate a token here — the frontend sends X-Impersonate-User
// header with the authGuard handling the logic. This just validates.

export async function validateImpersonateTarget(targetUserId: string) {
    const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true, email: true, displayName: true, banned: true },
    });
    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "Target user not found");
    return user;
}

// ─── Pending Approvals ───────────────────────────────────────

export async function listPendingApprovals() {
    return prisma.user.findMany({
        where: { approved: false, banned: false },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function approveUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");
    if (user.approved) throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "User is already approved");

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { approved: true },
    });

    // Send approval email (fire-and-forget)
    const loginUrl = `${env().CORS_ORIGIN}/login`;
    void sendMail({
        to: updated.email,
        subject: "You're in! Your KeeperLog account is approved ✅",
        html: accountApprovedTemplate({ username: updated.username, loginUrl }),
        log: { userId, template: "account_approved" },
    });

    return updated;
}

export async function rejectUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");

    // Send rejection email before deleting the user (fire-and-forget)
    void sendMail({
        to: user.email,
        subject: "Your KeeperLog registration has been declined",
        html: accountRejectedTemplate({
            username: user.username,
            supportEmail: "support@cold-blood-cast.app",
        }),
        log: { userId, template: "account_rejected" },
    });

    // Delete the user since they were never approved
    return prisma.user.delete({ where: { id: userId } });
}
