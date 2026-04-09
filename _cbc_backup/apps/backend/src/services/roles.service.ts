import { prisma } from "../db/client.js";
import { notFound, badRequest } from "../helpers/errors.js";

// ─── Roles CRUD ──────────────────────────────────────────────

export async function listRoles() {
    return prisma.role.findMany({
        orderBy: { priority: "desc" },
        include: {
            _count: { select: { users: true } },
            featureFlags: {
                include: { featureFlag: { select: { id: true, key: true, name: true } } },
            },
            limits: true,
        },
    });
}

export async function getRoleDetail(roleId: string) {
    const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
            _count: { select: { users: true } },
            featureFlags: { include: { featureFlag: true } },
            limits: true,
            users: {
                include: {
                    user: { select: { id: true, username: true, displayName: true, email: true } },
                },
                take: 50,
            },
        },
    });
    if (!role) throw notFound("Role not found");
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
    const existing = await prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw badRequest("Role name already exists");

    return prisma.role.create({ data });
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
    if (!role) throw notFound("Role not found");
    return prisma.role.update({ where: { id: roleId }, data });
}

export async function deleteRole(roleId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw notFound("Role not found");
    if (role.isSystem) throw badRequest("Cannot delete system role");
    await prisma.role.delete({ where: { id: roleId } });
}

// ─── Role Feature Flags ──────────────────────────────────────

export async function setRoleFeatureFlag(roleId: string, featureFlagId: string, enabled: boolean) {
    return prisma.roleFeatureFlag.upsert({
        where: { roleId_featureFlagId: { roleId, featureFlagId } },
        create: { roleId, featureFlagId, enabled },
        update: { enabled },
    });
}

export async function removeRoleFeatureFlag(roleId: string, featureFlagId: string) {
    await prisma.roleFeatureFlag.deleteMany({ where: { roleId, featureFlagId } });
}

// ─── Role Limits ─────────────────────────────────────────────

export async function setRoleLimit(roleId: string, key: string, value: number) {
    return prisma.roleLimit.upsert({
        where: { roleId_key: { roleId, key } },
        create: { roleId, key, value },
        update: { value },
    });
}

export async function removeRoleLimit(roleId: string, key: string) {
    await prisma.roleLimit.deleteMany({ where: { roleId, key } });
}
