import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminGuard } from "../../middlewares/admin.middleware.js";
import { paramString } from "../../utils/params.js";
import { badRequest } from "../../helpers/errors.js";
import { auditLog, listAuditLogs } from "../../services/audit.service.js";
import {
    listUsers,
    getAdminUserDetail,
    assignRoleToUser,
    removeRoleFromUser,
    setUserFeatureOverride,
    removeUserFeatureOverride,
    setUserLimitOverride,
    removeUserLimitOverride,
    banUser,
    unbanUser,
    deleteUser,
    adminUpdateUser,
    getPlatformStats,
    getUserGrowth,
    listPendingApprovals,
    approveUser,
    rejectUser,
} from "../../services/admin.service.js";
import { listAccessRequests, reviewAccessRequest } from "../../services/accessRequests.service.js";
import {
    listRoles,
    getRoleDetail,
    createRole,
    updateRole,
    deleteRole,
    setRoleFeatureFlag,
    removeRoleFeatureFlag,
    setRoleLimit,
    removeRoleLimit,
} from "../../services/roles.service.js";
import {
    listFeatureFlags,
    createFeatureFlag,
    updateFeatureFlag,
    toggleFeatureFlag,
    deleteFeatureFlag,
} from "../../services/featureFlags.service.js";
import { getSystemSettings, updateSystemSetting } from "../../services/settings.service.js";
import {
    listInviteCodes,
    createInviteCode,
    deactivateInviteCode,
    deleteInviteCode,
} from "../../services/invites.service.js";
import {
    listAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from "../../services/announcements.service.js";
import {
    listLegalDocuments,
    upsertLegalDocument,
    updateLegalDocument,
} from "../../services/legal.service.js";

import type { Prisma } from "../../generated/prisma/client.js";

const router = Router();

// All admin routes require auth + admin
router.use(authMiddleware, adminGuard);

// ─── Platform Stats ──────────────────────────────────────────

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await getPlatformStats();
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

router.get("/stats/growth", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = parseInt(String(req.query.days ?? "30"), 10);
        const growth = await getUserGrowth(days);
        res.json(growth);
    } catch (err) {
        next(err);
    }
});

// ─── Users ───────────────────────────────────────────────────

router.get("/users", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = parseInt(String(req.query.limit ?? "25"), 10);
        const result = await listUsers({
            page,
            limit,
            search: req.query.search as string | undefined,
            role: req.query.role as string | undefined,
            banned: req.query.banned as string | undefined,
            approved: req.query.approved as string | undefined,
            sortBy: (req.query.sortBy as string) ?? "createdAt",
            sortDir: (req.query.sortDir as "asc" | "desc") ?? "desc",
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.get("/users/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = paramString(req, "userId");
        const user = await getAdminUserDetail(userId);
        res.json(user);
    } catch (err) {
        next(err);
    }
});

const UpdateUserSchema = z.object({
    displayName: z.string().max(64).optional(),
    email: z.string().email().optional(),
    approved: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    isAdmin: z.boolean().optional(),
});

router.patch("/users/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = paramString(req, "userId");
        const body = UpdateUserSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const updated = await adminUpdateUser(userId, body.data);
        await auditLog(req.user!.id, "admin.user.update", "User", userId, body.data, req.ip);
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

router.delete("/users/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = paramString(req, "userId");
        await deleteUser(userId, req.user!.id);
        await auditLog(req.user!.id, "admin.user.delete", "User", userId, undefined, req.ip);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── Ban / Unban ─────────────────────────────────────────────

const BanSchema = z.object({ reason: z.string().optional() });

router.post("/users/:userId/ban", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = paramString(req, "userId");
        const body = BanSchema.safeParse(req.body);
        const reason = body.success ? body.data.reason : undefined;
        const user = await banUser(userId, req.user!.id, reason);
        await auditLog(req.user!.id, "admin.user.ban", "User", userId, { reason }, req.ip);
        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.post("/users/:userId/unban", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = paramString(req, "userId");
        const user = await unbanUser(userId);
        await auditLog(req.user!.id, "admin.user.unban", "User", userId, undefined, req.ip);
        res.json(user);
    } catch (err) {
        next(err);
    }
});

// ─── User Roles ──────────────────────────────────────────────

router.post(
    "/users/:userId/roles/:roleId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = paramString(req, "userId");
            const roleId = paramString(req, "roleId");
            const result = await assignRoleToUser(userId, roleId, req.user!.id);
            await auditLog(
                req.user!.id,
                "admin.user.role.assign",
                "User",
                userId,
                { roleId },
                req.ip,
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    },
);

router.delete(
    "/users/:userId/roles/:roleId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = paramString(req, "userId");
            const roleId = paramString(req, "roleId");
            await removeRoleFromUser(userId, roleId);
            await auditLog(
                req.user!.id,
                "admin.user.role.remove",
                "User",
                userId,
                { roleId },
                req.ip,
            );
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── User Feature Overrides ─────────────────────────────────

const FeatureOverrideSchema = z.object({ enabled: z.boolean() });

router.post(
    "/users/:userId/features/:featureFlagId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = paramString(req, "userId");
            const featureFlagId = paramString(req, "featureFlagId");
            const body = FeatureOverrideSchema.safeParse(req.body);
            if (!body.success) return next(badRequest("Invalid payload"));

            const result = await setUserFeatureOverride(
                userId,
                featureFlagId,
                body.data.enabled,
                req.user!.id,
            );
            await auditLog(
                req.user!.id,
                "admin.user.feature.set",
                "User",
                userId,
                { featureFlagId, enabled: body.data.enabled },
                req.ip,
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    },
);

router.delete(
    "/users/:userId/features/:featureFlagId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = paramString(req, "userId");
            const featureFlagId = paramString(req, "featureFlagId");
            await removeUserFeatureOverride(userId, featureFlagId);
            await auditLog(
                req.user!.id,
                "admin.user.feature.remove",
                "User",
                userId,
                { featureFlagId },
                req.ip,
            );
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── User Limit Overrides ────────────────────────────────────

const LimitOverrideSchema = z.object({ key: z.string(), value: z.number().int() });

router.post("/users/:userId/limits", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = paramString(req, "userId");
        const body = LimitOverrideSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const result = await setUserLimitOverride(
            userId,
            body.data.key,
            body.data.value,
            req.user!.id,
        );
        await auditLog(req.user!.id, "admin.user.limit.set", "User", userId, body.data, req.ip);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.delete(
    "/users/:userId/limits/:key",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = paramString(req, "userId");
            const key = paramString(req, "key");
            await removeUserLimitOverride(userId, key);
            await auditLog(
                req.user!.id,
                "admin.user.limit.remove",
                "User",
                userId,
                { key },
                req.ip,
            );
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── Approvals ───────────────────────────────────────────────

router.get("/approvals", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pending = await listPendingApprovals();
        res.json(pending);
    } catch (err) {
        next(err);
    }
});

router.post(
    "/approvals/:userId/approve",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = paramString(req, "userId");
            const user = await approveUser(userId);
            await auditLog(req.user!.id, "admin.user.approve", "User", userId, undefined, req.ip);
            res.json(user);
        } catch (err) {
            next(err);
        }
    },
);

router.post(
    "/approvals/:userId/reject",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = paramString(req, "userId");
            const user = await rejectUser(userId);
            await auditLog(req.user!.id, "admin.user.reject", "User", userId, undefined, req.ip);
            res.json(user);
        } catch (err) {
            next(err);
        }
    },
);

// ─── Roles ───────────────────────────────────────────────────

router.get("/roles", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = await listRoles();
        res.json(roles);
    } catch (err) {
        next(err);
    }
});

router.get("/roles/:roleId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roleId = paramString(req, "roleId");
        const role = await getRoleDetail(roleId);
        res.json(role);
    } catch (err) {
        next(err);
    }
});

const CreateRoleSchema = z.object({
    name: z.string().min(1).max(64),
    displayName: z.string().min(1).max(128),
    description: z.string().optional(),
    color: z.string().optional(),
    priority: z.number().int().optional(),
    showBadge: z.boolean().optional(),
});

router.post("/roles", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateRoleSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const role = await createRole(body.data);
        await auditLog(req.user!.id, "admin.role.create", "Role", role.id, body.data, req.ip);
        res.status(201).json(role);
    } catch (err) {
        next(err);
    }
});

const UpdateRoleSchema = z.object({
    displayName: z.string().min(1).max(128).optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    priority: z.number().int().optional(),
    showBadge: z.boolean().optional(),
});

router.patch("/roles/:roleId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roleId = paramString(req, "roleId");
        const body = UpdateRoleSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const role = await updateRole(roleId, body.data);
        await auditLog(req.user!.id, "admin.role.update", "Role", roleId, body.data, req.ip);
        res.json(role);
    } catch (err) {
        next(err);
    }
});

router.delete("/roles/:roleId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roleId = paramString(req, "roleId");
        await deleteRole(roleId);
        await auditLog(req.user!.id, "admin.role.delete", "Role", roleId, undefined, req.ip);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── Role Feature Flags ──────────────────────────────────────

const RoleFeatureSchema = z.object({ enabled: z.boolean() });

router.post(
    "/roles/:roleId/features/:featureFlagId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const roleId = paramString(req, "roleId");
            const featureFlagId = paramString(req, "featureFlagId");
            const body = RoleFeatureSchema.safeParse(req.body);
            if (!body.success) return next(badRequest("Invalid payload"));

            const result = await setRoleFeatureFlag(roleId, featureFlagId, body.data.enabled);
            await auditLog(
                req.user!.id,
                "admin.role.feature.set",
                "Role",
                roleId,
                { featureFlagId, enabled: body.data.enabled },
                req.ip,
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    },
);

router.delete(
    "/roles/:roleId/features/:featureFlagId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const roleId = paramString(req, "roleId");
            const featureFlagId = paramString(req, "featureFlagId");
            await removeRoleFeatureFlag(roleId, featureFlagId);
            await auditLog(
                req.user!.id,
                "admin.role.feature.remove",
                "Role",
                roleId,
                { featureFlagId },
                req.ip,
            );
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── Role Limits ─────────────────────────────────────────────

const RoleLimitSchema = z.object({ key: z.string(), value: z.number().int() });

router.post("/roles/:roleId/limits", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roleId = paramString(req, "roleId");
        const body = RoleLimitSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const result = await setRoleLimit(roleId, body.data.key, body.data.value);
        await auditLog(req.user!.id, "admin.role.limit.set", "Role", roleId, body.data, req.ip);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.delete(
    "/roles/:roleId/limits/:key",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const roleId = paramString(req, "roleId");
            const key = paramString(req, "key");
            await removeRoleLimit(roleId, key);
            await auditLog(
                req.user!.id,
                "admin.role.limit.remove",
                "Role",
                roleId,
                { key },
                req.ip,
            );
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── Feature Flags ───────────────────────────────────────────

router.get("/feature-flags", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const flags = await listFeatureFlags();
        res.json(flags);
    } catch (err) {
        next(err);
    }
});

const CreateFeatureFlagSchema = z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string().optional(),
    enabled: z.boolean().optional(),
});

router.post("/feature-flags", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateFeatureFlagSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const flag = await createFeatureFlag(body.data);
        await auditLog(
            req.user!.id,
            "admin.feature.create",
            "FeatureFlag",
            flag.id,
            body.data,
            req.ip,
        );
        res.status(201).json(flag);
    } catch (err) {
        next(err);
    }
});

const UpdateFeatureFlagSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    enabled: z.boolean().optional(),
});

router.patch("/feature-flags/:flagId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const flagId = paramString(req, "flagId");
        const body = UpdateFeatureFlagSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const flag = await updateFeatureFlag(flagId, body.data);
        await auditLog(
            req.user!.id,
            "admin.feature.update",
            "FeatureFlag",
            flagId,
            body.data,
            req.ip,
        );
        res.json(flag);
    } catch (err) {
        next(err);
    }
});

router.post(
    "/feature-flags/:flagId/toggle",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const flagId = paramString(req, "flagId");
            const flag = await toggleFeatureFlag(flagId);
            await auditLog(
                req.user!.id,
                "admin.feature.toggle",
                "FeatureFlag",
                flagId,
                { enabled: flag.enabled },
                req.ip,
            );
            res.json(flag);
        } catch (err) {
            next(err);
        }
    },
);

router.delete("/feature-flags/:flagId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const flagId = paramString(req, "flagId");
        await deleteFeatureFlag(flagId);
        await auditLog(
            req.user!.id,
            "admin.feature.delete",
            "FeatureFlag",
            flagId,
            undefined,
            req.ip,
        );
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── System Settings ─────────────────────────────────────────

router.get("/settings", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await getSystemSettings();
        res.json(settings);
    } catch (err) {
        next(err);
    }
});

const UpdateSettingSchema = z.object({ value: z.string() });

router.put("/settings/:key", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = paramString(req, "key");
        const body = UpdateSettingSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const setting = await updateSystemSetting(key, body.data.value);
        await auditLog(
            req.user!.id,
            "admin.setting.update",
            "SystemSetting",
            key,
            { value: body.data.value },
            req.ip,
        );
        res.json(setting);
    } catch (err) {
        next(err);
    }
});

// ─── Audit Log ───────────────────────────────────────────────

router.get("/audit-log", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = parseInt(String(req.query.limit ?? "50"), 10);
        const result = await listAuditLogs({
            page,
            limit,
            userId: req.query.userId as string | undefined,
            action: req.query.action as string | undefined,
            entity: req.query.entity as string | undefined,
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ─── Invite Codes ────────────────────────────────────────────

router.get("/invites", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const invites = await listInviteCodes();
        res.json(invites);
    } catch (err) {
        next(err);
    }
});

const CreateInviteSchema = z.object({
    code: z.string().min(1).optional(),
    label: z.string().optional(),
    maxUses: z.number().int().positive().optional(),
    expiresAt: z.string().datetime().optional(),
});

router.post("/invites", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateInviteSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const code = body.data.code || crypto.randomUUID().slice(0, 8).toUpperCase();
        const invite = await createInviteCode({
            ...body.data,
            code,
            createdBy: req.user!.id,
            expiresAt: body.data.expiresAt ? new Date(body.data.expiresAt) : undefined,
        });
        await auditLog(
            req.user!.id,
            "admin.invite.create",
            "InviteCode",
            invite.id,
            { code },
            req.ip,
        );
        res.status(201).json(invite);
    } catch (err) {
        next(err);
    }
});

router.post("/invites/:id/deactivate", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const invite = await deactivateInviteCode(id);
        await auditLog(
            req.user!.id,
            "admin.invite.deactivate",
            "InviteCode",
            id,
            undefined,
            req.ip,
        );
        res.json(invite);
    } catch (err) {
        next(err);
    }
});

router.delete("/invites/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        await deleteInviteCode(id);
        await auditLog(req.user!.id, "admin.invite.delete", "InviteCode", id, undefined, req.ip);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── Announcements ───────────────────────────────────────────

router.get("/announcements", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const announcements = await listAnnouncements();
        res.json(announcements);
    } catch (err) {
        next(err);
    }
});

const CreateAnnouncementSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.string().optional(),
    global: z.boolean().optional(),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
});

router.post("/announcements", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = CreateAnnouncementSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const announcement = await createAnnouncement({
            ...body.data,
            type: body.data.type ?? "info",
            global: body.data.global ?? true,
            createdBy: req.user!.id,
            startsAt: body.data.startsAt ? new Date(body.data.startsAt) : undefined,
            expiresAt: body.data.expiresAt ? new Date(body.data.expiresAt) : undefined,
        });
        await auditLog(
            req.user!.id,
            "admin.announcement.create",
            "Announcement",
            announcement.id,
            { title: body.data.title },
            req.ip,
        );
        res.status(201).json(announcement);
    } catch (err) {
        next(err);
    }
});

const UpdateAnnouncementSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    type: z.string().optional(),
    active: z.boolean().optional(),
    global: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
});

router.patch("/announcements/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const body = UpdateAnnouncementSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const data = {
            ...body.data,
            startsAt:
                body.data.startsAt === null
                    ? null
                    : body.data.startsAt
                      ? new Date(body.data.startsAt)
                      : undefined,
            expiresAt:
                body.data.expiresAt === null
                    ? null
                    : body.data.expiresAt
                      ? new Date(body.data.expiresAt)
                      : undefined,
        };

        const announcement = await updateAnnouncement(id, data);
        await auditLog(
            req.user!.id,
            "admin.announcement.update",
            "Announcement",
            id,
            body.data,
            req.ip,
        );
        res.json(announcement);
    } catch (err) {
        next(err);
    }
});

router.delete("/announcements/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        await deleteAnnouncement(id);
        await auditLog(
            req.user!.id,
            "admin.announcement.delete",
            "Announcement",
            id,
            undefined,
            req.ip,
        );
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── Legal Documents ─────────────────────────────────────────

router.get("/legal", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const docs = await listLegalDocuments();
        res.json(docs);
    } catch (err) {
        next(err);
    }
});

const UpsertLegalSchema = z.object({
    key: z.string().min(1),
    title: z.string().min(1),
    titleDe: z.string().min(1),
    content: z.string().min(1),
    contentDe: z.string().min(1),
    isPublished: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    metadata: z.record(z.unknown()).optional(),
});

router.put("/legal", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = UpsertLegalSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const doc = await upsertLegalDocument({
            ...body.data,
            metadata: body.data.metadata as Prisma.InputJsonValue | undefined,
            updatedBy: req.user!.id,
        });
        await auditLog(
            req.user!.id,
            "admin.legal.upsert",
            "LegalDocument",
            doc.id,
            { key: body.data.key },
            req.ip,
        );
        res.json(doc);
    } catch (err) {
        next(err);
    }
});

const UpdateLegalSchema = z.object({
    title: z.string().min(1).optional(),
    titleDe: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    contentDe: z.string().min(1).optional(),
    isPublished: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    metadata: z.record(z.unknown()).optional(),
});

router.patch("/legal/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = paramString(req, "id");
        const body = UpdateLegalSchema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const doc = await updateLegalDocument(id, {
            ...body.data,
            metadata: body.data.metadata as Prisma.InputJsonValue | undefined,
            updatedBy: req.user!.id,
        });
        await auditLog(
            req.user!.id,
            "admin.legal.update",
            "LegalDocument",
            id,
            body.data as Prisma.InputJsonValue,
            req.ip,
        );
        res.json(doc);
    } catch (err) {
        next(err);
    }
});

// ─── Access Requests ─────────────────────────────────────────

router.get("/access-requests", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = req.query.status as string | undefined;
        const requests = await listAccessRequests(status);
        res.json(requests);
    } catch (err) {
        next(err);
    }
});

router.post(
    "/access-requests/:id/approve",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = paramString(req, "id");
            await reviewAccessRequest(id, "approved", req.user!.id);
            await auditLog(
                req.user!.id,
                "admin.access_request.approve",
                "AccessRequest",
                id,
                undefined,
                req.ip,
            );
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

router.post(
    "/access-requests/:id/reject",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = paramString(req, "id");
            await reviewAccessRequest(id, "rejected", req.user!.id);
            await auditLog(
                req.user!.id,
                "admin.access_request.reject",
                "AccessRequest",
                id,
                undefined,
                req.ip,
            );
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

// ─── Email Logs ──────────────────────────────────────────────

router.get("/emails", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
        const offset = (page - 1) * limit;

        const [emails, total] = await Promise.all([
            prisma.emailLog.findMany({
                orderBy: { sentAt: "desc" },
                skip: offset,
                take: limit,
                include: { user: { select: { id: true, username: true, email: true } } },
            }),
            prisma.emailLog.count(),
        ]);

        res.json({ emails, total, page, limit });
    } catch (err) {
        next(err);
    }
});

router.post("/emails/send", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({
            to: z.string().email(),
            subject: z.string().min(1),
            body: z.string().min(1),
        });
        const body = schema.safeParse(req.body);
        if (!body.success) return next(badRequest("Invalid payload"));

        const { customTemplate } = await import("../../services/mail/templates.js");
        const { sendMail } = await import("../../services/mail.service.js");

        await sendMail({
            to: body.data.to,
            subject: body.data.subject,
            html: customTemplate({ subject: body.data.subject, body: body.data.body }),
            log: { userId: req.user!.id, template: "custom" },
        });

        await auditLog(
            req.user!.id,
            "admin.email.send",
            "Email",
            undefined,
            { to: body.data.to, subject: body.data.subject } as Prisma.InputJsonValue,
            req.ip,
        );
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── POST /admin/maintenance ─────────────────────────────────

router.post("/maintenance", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { runMaintenance } = await import("../../services/maintenance.service.js");
        const result = await runMaintenance();
        await auditLog(
            req.user!.id,
            "admin.maintenance.run",
            undefined,
            undefined,
            result as unknown as Prisma.InputJsonValue,
            req.ip,
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ─── GET /admin/maintenance/logs ─────────────────────────────

router.get("/maintenance/logs", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const logs = await prisma.maintenanceLog.findMany({
            orderBy: { startedAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.maintenanceLog.count();
        res.json({ logs, total, page, limit });
    } catch (err) {
        next(err);
    }
});

export default router;
