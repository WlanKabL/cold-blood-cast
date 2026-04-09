import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, badRequest } from "@/helpers/errors.js";

export async function listFeatureFlags() {
    return prisma.featureFlag.findMany({
        orderBy: [{ category: "asc" }, { key: "asc" }],
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
}) {
    const normalized = data.key.toLowerCase().replace(/\s+/g, "_");
    const existing = await prisma.featureFlag.findUnique({ where: { key: normalized } });
    if (existing)
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Feature flag key already exists");

    return prisma.featureFlag.create({
        data: {
            key: normalized,
            name: data.name,
            description: data.description,
            category: data.category ?? "general",
            enabled: true,
        },
    });
}

export async function updateFeatureFlag(
    flagId: string,
    data: Partial<{ name: string; description: string; category: string }>,
) {
    const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw notFound(ErrorCodes.E_FEATURE_FLAG_NOT_FOUND, "Feature flag not found");

    return prisma.featureFlag.update({ where: { id: flagId }, data });
}

export async function toggleFeatureFlag(flagId: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw notFound(ErrorCodes.E_FEATURE_FLAG_NOT_FOUND, "Feature flag not found");

    return prisma.featureFlag.update({
        where: { id: flagId },
        data: { enabled: !flag.enabled },
    });
}

export async function deleteFeatureFlag(flagId: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw notFound(ErrorCodes.E_FEATURE_FLAG_NOT_FOUND, "Feature flag not found");

    return prisma.featureFlag.delete({ where: { id: flagId } });
}

/**
 * Resolves which features a user has access to.
 * Priority: User override > Role flags > Global kill-switch
 */
export async function resolveUserFeatures(userId: string): Promise<Record<string, boolean>> {
    // Get all feature flags
    const allFlags = await prisma.featureFlag.findMany();

    // Get user's roles and their feature flags
    const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    featureFlags: true,
                },
            },
        },
    });

    // Get user-level overrides
    const userOverrides = await prisma.userFeatureFlag.findMany({
        where: { userId },
    });

    const result: Record<string, boolean> = {};

    for (const flag of allFlags) {
        // Global kill-switch
        if (!flag.enabled) {
            result[flag.key] = false;
            continue;
        }

        // Check user-level override first
        const userOverride = userOverrides.find((uo) => uo.featureFlagId === flag.id);
        if (userOverride) {
            result[flag.key] = userOverride.enabled;
            continue;
        }

        // Check role-level flags (any role grants = enabled)
        let roleEnabled = false;
        for (const ur of userRoles) {
            const roleFlag = ur.role.featureFlags.find((rf) => rf.featureFlagId === flag.id);
            if (roleFlag?.enabled) {
                roleEnabled = true;
                break;
            }
        }
        result[flag.key] = roleEnabled;
    }

    return result;
}

/**
 * Returns keys of all globally enabled feature flags.
 * Used by frontend to distinguish "globally off" (hidden) vs "role-locked" (badge).
 */
export async function getEnabledFeatureKeys(): Promise<string[]> {
    const flags = await prisma.featureFlag.findMany({
        where: { enabled: true },
        select: { key: true },
    });
    return flags.map((f) => f.key);
}

export interface FeatureTierInfo {
    role: string;
    displayName: string;
    color: string;
    priority: number;
}

/**
 * For each globally-enabled feature the user does NOT have,
 * find ALL system roles that grant it (sorted by priority asc).
 * Used by the frontend to show upgrade badges (P, B, etc.).
 */
export async function getFeatureTiers(
    userId: string,
    userFeatures: Record<string, boolean>,
): Promise<Record<string, FeatureTierInfo[]>> {
    // Get all system roles with their feature flags, ordered by priority
    const systemRoles = await prisma.role.findMany({
        where: { isSystem: true, showBadge: true },
        orderBy: { priority: "asc" },
        include: {
            featureFlags: {
                where: { enabled: true },
                include: {
                    featureFlag: { select: { key: true, enabled: true } },
                },
            },
        },
    });

    const result: Record<string, FeatureTierInfo[]> = {};

    // For each feature the user doesn't have, collect all roles that grant it
    for (const [key, hasAccess] of Object.entries(userFeatures)) {
        if (hasAccess) continue; // user already has it

        const tiers: FeatureTierInfo[] = [];
        for (const role of systemRoles) {
            const grants = role.featureFlags.some(
                (rf) => rf.featureFlag.key === key && rf.featureFlag.enabled,
            );
            if (grants) {
                tiers.push({
                    role: role.name,
                    displayName: role.displayName,
                    color: role.color ?? "#6b7280",
                    priority: role.priority,
                });
            }
        }
        if (tiers.length > 0) {
            result[key] = tiers;
        }
    }

    return result;
}

/**
 * Resolves the effective limits for a user.
 * Priority: User override > Best role limit (highest value)
 * -1 means unlimited
 */
export async function resolveUserLimits(userId: string): Promise<Record<string, number>> {
    const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
            role: {
                include: { limits: true },
            },
        },
    });

    const userOverrides = await prisma.userLimitOverride.findMany({
        where: { userId },
    });

    // Merge role limits (take the highest / most permissive)
    const roleLimits: Record<string, number> = {};
    for (const ur of userRoles) {
        for (const limit of ur.role.limits) {
            const current = roleLimits[limit.key];
            if (current === undefined) {
                roleLimits[limit.key] = limit.value;
            } else if (current === -1) {
                // already unlimited, keep it
            } else if (limit.value === -1 || limit.value > current) {
                roleLimits[limit.key] = limit.value;
            }
        }
    }

    // Apply user overrides
    for (const override of userOverrides) {
        roleLimits[override.key] = override.value;
    }

    return roleLimits;
}
