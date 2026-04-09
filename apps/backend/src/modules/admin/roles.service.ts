import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, badRequest, forbidden } from "@/helpers/errors.js";
import { LIMIT_KEYS, type LimitKey } from "@cold-blood-cast/shared";

export async function listRoles() {
    return prisma.role.findMany({
        orderBy: { priority: "desc" },
        include: {
            featureFlags: { include: { featureFlag: true } },
            limits: true,
            _count: { select: { users: true } },
        },
    });
}

export async function getRoleDetail(roleId: string) {
    const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
            featureFlags: { include: { featureFlag: true } },
            limits: true,
            users: {
                take: 100, // Limit to prevent loading thousands of users
                include: {
                    user: { select: { id: true, username: true, email: true, displayName: true } },
                },
            },
            _count: { select: { users: true } },
        },
    });
    if (!role) throw notFound(ErrorCodes.E_ROLE_NOT_FOUND, "Role not found");
    return role;
}

export async function createRole(data: {
    name: string;
    displayName: string;
    description?: string;
    color?: string;
    priority?: number;
    showBadge?: boolean;
}) {
    const normalized = data.name.toUpperCase().replace(/\s+/g, "_");
    const existing = await prisma.role.findUnique({ where: { name: normalized } });
    if (existing) throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Role name already exists");

    return prisma.role.create({
        data: {
            name: normalized,
            displayName: data.displayName,
            description: data.description,
            color: data.color ?? "#6b7280",
            priority: data.priority ?? 0,
            showBadge: data.showBadge ?? false,
            isSystem: false,
        },
    });
}

export async function updateRole(
    roleId: string,
    data: Partial<{
        displayName: string;
        description: string;
        color: string;
        priority: number;
        showBadge: boolean;
    }>,
) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw notFound(ErrorCodes.E_ROLE_NOT_FOUND, "Role not found");

    // System roles: only allow cosmetic changes (displayName, description, color, showBadge)
    if (role.isSystem) {
        const { displayName, description, color, showBadge } = data;
        if (data.priority !== undefined) {
            throw forbidden("Cannot change priority of a system role");
        }
        return prisma.role.update({
            where: { id: roleId },
            data: { displayName, description, color, showBadge },
        });
    }

    return prisma.role.update({ where: { id: roleId }, data });
}

export async function deleteRole(roleId: string) {
    const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: { _count: { select: { users: true } } },
    });
    if (!role) throw notFound(ErrorCodes.E_ROLE_NOT_FOUND, "Role not found");
    if (role.isSystem) throw forbidden("Cannot delete a system role");
    if (role._count.users > 0) {
        throw badRequest(
            ErrorCodes.E_VALIDATION_ERROR,
            `Cannot delete role with ${role._count.users} assigned user(s). Remove all users first.`,
        );
    }

    return prisma.role.delete({ where: { id: roleId } });
}

export async function setRoleFeatureFlag(roleId: string, featureFlagId: string, enabled: boolean) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw notFound(ErrorCodes.E_ROLE_NOT_FOUND, "Role not found");
    const flag = await prisma.featureFlag.findUnique({ where: { id: featureFlagId } });
    if (!flag) throw notFound(ErrorCodes.E_FEATURE_FLAG_NOT_FOUND, "Feature flag not found");

    return prisma.roleFeatureFlag.upsert({
        where: { roleId_featureFlagId: { roleId, featureFlagId } },
        update: { enabled },
        create: { roleId, featureFlagId, enabled },
        include: { featureFlag: true },
    });
}

export async function removeRoleFeatureFlag(roleId: string, featureFlagId: string) {
    return prisma.roleFeatureFlag
        .delete({
            where: { roleId_featureFlagId: { roleId, featureFlagId } },
        })
        .catch(() => {
            throw notFound(ErrorCodes.E_NOT_FOUND, "Role feature flag not found");
        });
}

export async function setRoleLimit(roleId: string, key: string, value: number) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw notFound(ErrorCodes.E_ROLE_NOT_FOUND, "Role not found");
    if (!LIMIT_KEYS.includes(key as LimitKey)) {
        throw badRequest(
            ErrorCodes.E_VALIDATION_ERROR,
            `Invalid limit key: ${key}. Valid keys: ${LIMIT_KEYS.join(", ")}`,
        );
    }

    return prisma.roleLimit.upsert({
        where: { roleId_key: { roleId, key } },
        update: { value },
        create: { roleId, key, value },
    });
}

export async function removeRoleLimit(roleId: string, key: string) {
    return prisma.roleLimit
        .delete({
            where: { roleId_key: { roleId, key } },
        })
        .catch(() => {
            throw notFound(ErrorCodes.E_NOT_FOUND, "Role limit not found");
        });
}
