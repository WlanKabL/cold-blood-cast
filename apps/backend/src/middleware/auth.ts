import { type FastifyRequest, type FastifyReply } from "fastify";
import {
    verifyAccessToken,
    AppError,
    ErrorCodes,
    unauthorized,
    forbidden,
} from "@/helpers/index.js";
import { prisma } from "@/config/database.js";
import { resolveUserFeatures } from "@/modules/admin/feature-flags.service.js";

declare module "fastify" {
    interface FastifyRequest {
        userId: string;
        username: string;
        userRoles: string[]; // Role names, e.g. ["ADMIN", "PREMIUM"]
        emailVerified: boolean;
        impersonatedBy?: string; // Original admin userId if impersonating
        /** Resolved feature flags, cached per request by requireFeature */
        _resolvedFeatures?: Record<string, boolean>;
    }
}

/**
 * Standard auth guard — verifies JWT, checks ban status, loads roles.
 */
export async function authGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        throw unauthorized(
            ErrorCodes.E_AUTH_TOKEN_MISSING,
            "Authorization header missing or invalid",
        );
    }

    const token = authHeader.slice(7);

    try {
        const payload = verifyAccessToken(token);
        request.userId = payload.userId;
        request.username = payload.username;
    } catch (err: unknown) {
        if (err instanceof Error && err.name === "TokenExpiredError") {
            throw unauthorized(ErrorCodes.E_AUTH_TOKEN_EXPIRED, "Access token expired");
        }
        throw unauthorized(ErrorCodes.E_AUTH_TOKEN_INVALID, "Invalid access token");
    }

    // ── Check impersonation header ───────────────
    const impersonateHeader = request.headers["x-impersonate-user"] as string | undefined;
    if (impersonateHeader) {
        // Verify the real user is an admin
        const adminRoles = await prisma.userRole.findMany({
            where: { userId: request.userId },
            include: { role: true },
        });
        const isAdmin = adminRoles.some((ur) => ur.role.name === "ADMIN");
        if (!isAdmin) {
            throw forbidden("Only admins can impersonate users");
        }
        // Verify target user exists
        const target = await prisma.user.findUnique({
            where: { id: impersonateHeader },
            select: { id: true },
        });
        if (!target) {
            throw unauthorized(ErrorCodes.E_AUTH_TOKEN_INVALID, "Impersonation target not found");
        }

        // Log original admin, switch to impersonated user
        request.impersonatedBy = request.userId;
        request.userId = impersonateHeader;
    }

    // ── Check ban status (skip for impersonating admins) ─────
    const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { banned: true, emailVerified: true },
    });
    if (user?.banned && !request.impersonatedBy) {
        throw new AppError(ErrorCodes.E_USER_BANNED, 403, "Your account has been suspended");
    }
    request.emailVerified = user?.emailVerified ?? false;

    // ── Load roles ───────────────────────────────
    const userRoles = await prisma.userRole.findMany({
        where: { userId: request.userId },
        include: { role: { select: { name: true } } },
    });
    request.userRoles = userRoles.map((ur) => ur.role.name);

    // ── Track last active (use original admin's ID, not impersonated) ──
    const trackUserId = request.impersonatedBy ?? request.userId;
    prisma.user
        .update({
            where: { id: trackUserId },
            data: { lastActiveAt: new Date() },
        })
        .catch(() => {}); // Fire-and-forget
}

/**
 * Requires the user's email to be verified.
 * Must be used AFTER authGuard (uses request.emailVerified cached by authGuard).
 * Skipped for impersonating admins.
 */
export async function emailVerifiedGuard(
    request: FastifyRequest,
    _reply: FastifyReply,
): Promise<void> {
    if (request.impersonatedBy) return;

    if (!request.emailVerified) {
        throw new AppError(ErrorCodes.E_EMAIL_NOT_VERIFIED, 403, "Email verification required");
    }
}

/**
 * Requires the user to have at least one of the specified roles.
 * Must be used AFTER authGuard.
 */
export function requireRole(...roles: string[]) {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        if (!request.userRoles || !request.userRoles.some((r) => roles.includes(r))) {
            throw forbidden(`Required role: ${roles.join(" or ")}`);
        }
    };
}

/**
 * Shorthand: requires ADMIN role.
 */
export async function adminGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    return requireRole("ADMIN")(request, reply);
}

/**
 * Requires that the user has a specific feature flag enabled.
 * Must be used AFTER authGuard.
 */
export function requireFeature(featureKey: string) {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        // Admins always bypass feature gates
        if (request.userRoles?.includes("ADMIN")) return;

        // Resolve once per request, then cache on the request object
        if (!request._resolvedFeatures) {
            request._resolvedFeatures = await resolveUserFeatures(request.userId);
        }
        const features = request._resolvedFeatures;
        if (!features[featureKey]) {
            throw new AppError(
                ErrorCodes.E_FEATURE_DISABLED,
                403,
                `This feature is not available on your current plan: ${featureKey}`,
            );
        }
    };
}
