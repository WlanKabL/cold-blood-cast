import { prisma } from "../db/client.js";
import { notFound, badRequest, forbidden } from "../helpers/errors.js";

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
                banned: true,
                approved: true,
                emailVerified: true,
                bannedReason: true,
                lastActiveAt: true,
                createdAt: true,
                updatedAt: true,
                isAdmin: true,
                roles: {
                    include: {
                        role: { select: { id: true, name: true, displayName: true, color: true } },
                    },
                },
                _count: {
                    select: { enclosures: true, pets: true, sensors: true },
                },
            },
        }),
        prisma.user.count({ where: where as never }),
    ]);

    return {
        items: users,
        meta: { page, perPage: limit, total, totalPages: Math.ceil(total / limit) },
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
            banned: true,
            emailVerified: true,
            bannedAt: true,
            bannedBy: true,
            bannedReason: true,
            lastActiveAt: true,
            createdAt: true,
            updatedAt: true,
            isAdmin: true,
            roles: { include: { role: true } },
            featureFlags: { include: { featureFlag: true } },
            limitOverrides: true,
            _count: { select: { enclosures: true, pets: true, sensors: true } },
        },
    });

    if (!user) throw notFound("User not found");
    return user;
}

// ─── Role Assignment ─────────────────────────────────────────

export async function assignRoleToUser(userId: string, roleId: string, grantedBy: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw notFound("Role not found");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound("User not found");

    const existing = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId, roleId } },
    });
    if (existing) throw badRequest("Role already assigned");

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
    if (!userRole) throw notFound("User does not have this role");

    if (userRole.role.name === "ADMIN" && removedBy === userId) {
        throw forbidden("Cannot remove your own admin role");
    }

    await prisma.userRole.delete({ where: { id: userRole.id } });
}

// ─── Feature Overrides ───────────────────────────────────────

export async function setUserFeatureOverride(
    userId: string,
    featureFlagId: string,
    enabled: boolean,
    grantedBy: string,
) {
    return prisma.userFeatureFlag.upsert({
        where: { userId_featureFlagId: { userId, featureFlagId } },
        create: { userId, featureFlagId, enabled, grantedBy },
        update: { enabled },
    });
}

export async function removeUserFeatureOverride(userId: string, featureFlagId: string) {
    await prisma.userFeatureFlag.deleteMany({ where: { userId, featureFlagId } });
}

// ─── Limit Overrides ─────────────────────────────────────────

export async function setUserLimitOverride(
    userId: string,
    key: string,
    value: number,
    grantedBy: string,
) {
    return prisma.userLimitOverride.upsert({
        where: { userId_key: { userId, key } },
        create: { userId, key, value, grantedBy },
        update: { value },
    });
}

export async function removeUserLimitOverride(userId: string, key: string) {
    await prisma.userLimitOverride.deleteMany({ where: { userId, key } });
}

// ─── Ban / Unban ─────────────────────────────────────────────

export async function banUser(userId: string, bannedBy: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound("User not found");
    if (user.id === bannedBy) throw forbidden("Cannot ban yourself");

    await prisma.user.update({
        where: { id: userId },
        data: { banned: true, bannedAt: new Date(), bannedBy, bannedReason: reason ?? null },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function unbanUser(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: { banned: false, bannedAt: null, bannedBy: null, bannedReason: null },
    });
}

// ─── Delete User ─────────────────────────────────────────────

export async function deleteUser(userId: string, deletedBy: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound("User not found");
    if (user.id === deletedBy) throw forbidden("Cannot delete yourself via admin");

    await prisma.user.delete({ where: { id: userId } });
}

// ─── Admin User Update ──────────────────────────────────────

export async function adminUpdateUser(
    userId: string,
    data: {
        username?: string;
        email?: string;
        displayName?: string;
        emailVerified?: boolean;
    },
) {
    return prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            emailVerified: true,
        },
    });
}

// ─── Platform Stats ──────────────────────────────────────────

export async function getPlatformStats() {
    const [totalUsers, bannedUsers, activeUsers, totalEnclosures, totalPets, totalSensors] =
        await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { banned: true } }),
            prisma.user.count({
                where: { lastActiveAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            }),
            prisma.enclosure.count(),
            prisma.pet.count(),
            prisma.sensor.count(),
        ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newToday = await prisma.user.count({ where: { createdAt: { gte: todayStart } } });

    return {
        totalUsers,
        bannedUsers,
        activeUsers,
        totalEnclosures,
        totalPets,
        totalSensors,
        newToday,
    };
}

export async function getUserGrowth(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const users = await prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    const map = new Map<string, number>();
    for (const u of users) {
        const key = u.createdAt.toISOString().slice(0, 10);
        map.set(key, (map.get(key) ?? 0) + 1);
    }

    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        result.push({ date: key, count: map.get(key) ?? 0 });
    }
    return result;
}

// ─── Pending Approvals ───────────────────────────────────────

export async function listPendingApprovals() {
    return prisma.user.findMany({
        where: { approved: false },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
}

export async function approveUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound("User not found");
    return prisma.user.update({ where: { id: userId }, data: { approved: true } });
}

export async function rejectUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound("User not found");
    await prisma.user.delete({ where: { id: userId } });
}
