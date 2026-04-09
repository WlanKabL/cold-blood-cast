import { prisma } from "../db/client.js";
import { notFound, badRequest } from "../helpers/errors.js";

export async function listFeatureFlags() {
    return prisma.featureFlag.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
        include: {
            roleFlags: {
                include: { role: { select: { id: true, name: true, displayName: true } } },
            },
            _count: { select: { userFlags: true } },
        },
    });
}

export async function createFeatureFlag(data: {
    key: string;
    name: string;
    description?: string;
    category?: string;
    enabled?: boolean;
}) {
    const existing = await prisma.featureFlag.findUnique({ where: { key: data.key } });
    if (existing) throw badRequest("Feature flag key already exists");
    return prisma.featureFlag.create({ data });
}

export async function updateFeatureFlag(
    id: string,
    data: Partial<{ name: string; description: string; category: string; enabled: boolean }>,
) {
    const flag = await prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) throw notFound("Feature flag not found");
    return prisma.featureFlag.update({ where: { id }, data });
}

export async function toggleFeatureFlag(id: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) throw notFound("Feature flag not found");
    return prisma.featureFlag.update({ where: { id }, data: { enabled: !flag.enabled } });
}

export async function deleteFeatureFlag(id: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) throw notFound("Feature flag not found");
    await prisma.featureFlag.delete({ where: { id } });
}

// ─── Feature Resolution (user override > role > global) ──────

export async function resolveUserFeatures(userId: string) {
    // Get user roles
    const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: { role: { include: { featureFlags: true, limits: true } } },
    });

    // Get all feature flags
    const allFlags = await prisma.featureFlag.findMany();

    // Get user-level overrides
    const userOverrides = await prisma.userFeatureFlag.findMany({
        where: { userId },
    });

    // Get user-level limit overrides
    const userLimitOverrides = await prisma.userLimitOverride.findMany({
        where: { userId },
    });

    // Resolve features: user override > role > global
    const features: Record<string, boolean> = {};
    const enabledFlags: string[] = [];

    for (const flag of allFlags) {
        // 1) Check user overrides
        const userOverride = userOverrides.find((o) => o.featureFlagId === flag.id);
        if (userOverride) {
            features[flag.key] = userOverride.enabled;
            if (userOverride.enabled) enabledFlags.push(flag.key);
            continue;
        }

        // 2) Check role flags (highest priority role wins)
        let resolved = false;
        const sortedRoles = [...userRoles].sort((a, b) => b.role.priority - a.role.priority);
        for (const ur of sortedRoles) {
            const roleFlag = ur.role.featureFlags.find((rf) => rf.featureFlagId === flag.id);
            if (roleFlag) {
                features[flag.key] = roleFlag.enabled;
                if (roleFlag.enabled) enabledFlags.push(flag.key);
                resolved = true;
                break;
            }
        }

        // 3) Fall back to global
        if (!resolved) {
            features[flag.key] = flag.enabled;
            if (flag.enabled) enabledFlags.push(flag.key);
        }
    }

    // Resolve limits: user override > role (highest value)
    const limits: Record<string, number> = {};
    const allLimitKeys = new Set<string>();

    for (const ur of userRoles) {
        for (const rl of ur.role.limits) {
            allLimitKeys.add(rl.key);
            const current = limits[rl.key] ?? 0;
            limits[rl.key] = Math.max(current, rl.value);
        }
    }

    for (const ulo of userLimitOverrides) {
        limits[ulo.key] = ulo.value;
    }

    return { features, enabledFlags, limits };
}
