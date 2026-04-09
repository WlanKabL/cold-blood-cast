import { type Request, type Response, type NextFunction } from "express";
import { forbidden } from "../helpers/errors.js";
import { prisma } from "../db/client.js";

/**
 * Middleware: requires that the authenticated user is an admin.
 * Checks both the legacy `isAdmin` flag and RBAC roles with name "ADMIN".
 * Must be used AFTER authMiddleware.
 */
export async function adminGuard(req: Request, _res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) return next(forbidden("Access denied"));

    if (user.isAdmin) return next();

    const adminRole = await prisma.userRole.findFirst({
        where: { userId: user.id, role: { name: "ADMIN" } },
    });

    if (adminRole) return next();

    return next(forbidden("Access denied — admin required"));
}

/**
 * Middleware factory: requires the user to have one of the specified roles.
 * Must be used AFTER authMiddleware.
 */
export function requireRole(...roleNames: string[]) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) return next(forbidden("Access denied"));

        if (user.isAdmin) return next();

        const match = await prisma.userRole.findFirst({
            where: {
                userId: user.id,
                role: { name: { in: roleNames } },
            },
        });

        if (match) return next();

        return next(forbidden(`Requires role: ${roleNames.join(" or ")}`));
    };
}

/**
 * Middleware factory: requires the user to have a specific feature flag enabled.
 * Resolution: user override > role flag > global default.
 * Must be used AFTER authMiddleware.
 */
export function featureGate(featureKey: string) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) return next(forbidden("Access denied"));

        if (user.isAdmin) return next();

        const userOverride = await prisma.userFeatureFlag.findFirst({
            where: { userId: user.id, featureFlag: { key: featureKey } },
            include: { featureFlag: true },
        });

        if (userOverride) {
            return userOverride.enabled
                ? next()
                : next(forbidden(`Feature "${featureKey}" is disabled`));
        }

        const roleFlags = await prisma.roleFeatureFlag.findMany({
            where: {
                role: { users: { some: { userId: user.id } } },
                featureFlag: { key: featureKey },
            },
            include: { featureFlag: true, role: true },
            orderBy: { role: { priority: "desc" } },
        });

        if (roleFlags.length > 0) {
            return roleFlags[0].enabled
                ? next()
                : next(forbidden(`Feature "${featureKey}" is disabled`));
        }

        const globalFlag = await prisma.featureFlag.findUnique({ where: { key: featureKey } });
        if (!globalFlag) return next(forbidden(`Feature "${featureKey}" not found`));

        return globalFlag.enabled ? next() : next(forbidden(`Feature "${featureKey}" is disabled`));
    };
}
