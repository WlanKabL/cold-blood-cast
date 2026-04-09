import { type FastifyInstance } from "fastify";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { auditLog } from "@/modules/audit/audit.service.js";
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
    bulkAssignRole,
    bulkRemoveRole,
    validateImpersonateTarget,
    listPendingApprovals,
    approveUser,
    rejectUser,
} from "./admin.service.js";
import {
    listRoles,
    createRole,
    updateRole,
    deleteRole,
    getRoleDetail,
    setRoleFeatureFlag,
    removeRoleFeatureFlag,
    setRoleLimit,
    removeRoleLimit,
} from "./roles.service.js";
import {
    listFeatureFlags,
    createFeatureFlag,
    updateFeatureFlag,
    deleteFeatureFlag,
    toggleFeatureFlag,
} from "./feature-flags.service.js";
import { getSystemSettings, updateSystemSetting } from "./settings.service.js";
import { reseedDefaults } from "@/config/seed.js";
import { prisma } from "@/config/database.js";

export async function adminRoutes(app: FastifyInstance) {
    // All admin routes require auth + admin role
    app.addHook("onRequest", authGuard);
    app.addHook("onRequest", emailVerifiedGuard);
    app.addHook("onRequest", adminGuard);

    // ══════════════════════════════════════════════
    // Users
    // ══════════════════════════════════════════════

    app.get("/users", async (request) => {
        const q = request.query as Record<string, string>;
        const result = await listUsers({
            search: q.search,
            role: q.role,
            banned: q.banned,
            approved: q.approved,
            dateFrom: q.dateFrom,
            dateTo: q.dateTo,
            page: q.page ? Number(q.page) : undefined,
            limit: q.limit ? Number(q.limit) : undefined,
            sortBy: q.sortBy,
            sortDir: q.sortDir as "asc" | "desc" | undefined,
        });
        return { success: true, data: result };
    });

    app.get("/users/:userId", async (request) => {
        const { userId } = request.params as { userId: string };
        const user = await getAdminUserDetail(userId);
        return { success: true, data: user };
    });

    app.patch("/users/:userId", async (request) => {
        const { userId } = request.params as { userId: string };
        const body = request.body as {
            username?: string;
            email?: string;
            displayName?: string;
            emailVerified?: boolean;
        };
        const user = await adminUpdateUser(userId, body);
        await auditLog(request.userId, "user.update", "User", userId, body, request.ip);
        return { success: true, data: user };
    });

    // ── Role assignment ──────────────────────────

    app.post("/users/:userId/roles", async (request) => {
        const { userId } = request.params as { userId: string };
        const { roleId } = request.body as { roleId: string };
        const result = await assignRoleToUser(userId, roleId, request.userId);
        await auditLog(request.userId, "user.role.assign", "User", userId, { roleId }, request.ip);
        return { success: true, data: result };
    });

    app.delete("/users/:userId/roles/:roleId", async (request) => {
        const { userId, roleId } = request.params as { userId: string; roleId: string };
        await removeRoleFromUser(userId, roleId, request.userId);
        await auditLog(request.userId, "user.role.remove", "User", userId, { roleId }, request.ip);
        return { success: true };
    });

    // ── Feature overrides ────────────────────────

    app.put("/users/:userId/features/:featureFlagId", async (request) => {
        const { userId, featureFlagId } = request.params as {
            userId: string;
            featureFlagId: string;
        };
        const { enabled } = request.body as { enabled: boolean };
        const result = await setUserFeatureOverride(userId, featureFlagId, enabled, request.userId);
        await auditLog(
            request.userId,
            "user.feature.override",
            "User",
            userId,
            { featureFlagId, enabled },
            request.ip,
        );
        return { success: true, data: result };
    });

    app.delete("/users/:userId/features/:featureFlagId", async (request) => {
        const { userId, featureFlagId } = request.params as {
            userId: string;
            featureFlagId: string;
        };
        await removeUserFeatureOverride(userId, featureFlagId);
        await auditLog(
            request.userId,
            "user.feature.override.remove",
            "User",
            userId,
            { featureFlagId },
            request.ip,
        );
        return { success: true };
    });

    // ── Limit overrides ──────────────────────────

    app.put("/users/:userId/limits/:key", async (request) => {
        const { userId, key } = request.params as { userId: string; key: string };
        const { value } = request.body as { value: number };
        const result = await setUserLimitOverride(userId, key, value, request.userId);
        await auditLog(
            request.userId,
            "user.limit.override",
            "User",
            userId,
            { key, value },
            request.ip,
        );
        return { success: true, data: result };
    });

    app.delete("/users/:userId/limits/:key", async (request) => {
        const { userId, key } = request.params as { userId: string; key: string };
        await removeUserLimitOverride(userId, key);
        await auditLog(
            request.userId,
            "user.limit.override.remove",
            "User",
            userId,
            { key },
            request.ip,
        );
        return { success: true };
    });

    // ── Ban / Unban ──────────────────────────────

    app.post("/users/:userId/ban", async (request) => {
        const { userId } = request.params as { userId: string };
        const { reason } = request.body as { reason?: string };
        await banUser(userId, request.userId, reason);
        await auditLog(request.userId, "user.ban", "User", userId, { reason }, request.ip);
        return { success: true };
    });

    app.post("/users/:userId/unban", async (request) => {
        const { userId } = request.params as { userId: string };
        await unbanUser(userId);
        await auditLog(request.userId, "user.unban", "User", userId, null, request.ip);
        return { success: true };
    });

    app.delete("/users/:userId", async (request) => {
        const { userId } = request.params as { userId: string };
        await deleteUser(userId, request.userId);
        await auditLog(request.userId, "user.delete", "User", userId, null, request.ip);
        return { success: true };
    });

    // ── Bulk operations ──────────────────────────

    app.post("/users/bulk/assign-role", async (request) => {
        const { userIds, roleId } = request.body as { userIds: string[]; roleId: string };
        const result = await bulkAssignRole(userIds, roleId, request.userId);
        await auditLog(
            request.userId,
            "user.bulk.role.assign",
            "User",
            null,
            { userIds, roleId },
            request.ip,
        );
        return { success: true, data: { count: result.count } };
    });

    app.post("/users/bulk/remove-role", async (request) => {
        const { userIds, roleId } = request.body as { userIds: string[]; roleId: string };
        const result = await bulkRemoveRole(userIds, roleId);
        await auditLog(
            request.userId,
            "user.bulk.role.remove",
            "User",
            null,
            { userIds, roleId },
            request.ip,
        );
        return { success: true, data: { count: result.count } };
    });

    // ── Impersonate ──────────────────────────────

    app.post("/users/:userId/impersonate", async (request) => {
        const { userId } = request.params as { userId: string };
        const target = await validateImpersonateTarget(userId);
        await auditLog(request.userId, "user.impersonate", "User", userId, null, request.ip);
        return { success: true, data: target };
    });

    // ══════════════════════════════════════════════
    // Roles
    // ══════════════════════════════════════════════

    app.get("/roles", async () => {
        const roles = await listRoles();
        return { success: true, data: roles };
    });

    app.get("/roles/:roleId", async (request) => {
        const { roleId } = request.params as { roleId: string };
        const role = await getRoleDetail(roleId);
        return { success: true, data: role };
    });

    app.post("/roles", async (request) => {
        const body = request.body as {
            name: string;
            displayName: string;
            description?: string;
            color?: string;
            priority?: number;
            showBadge?: boolean;
        };
        const role = await createRole(body);
        await auditLog(request.userId, "role.create", "Role", role.id, body, request.ip);
        return { success: true, data: role };
    });

    app.patch("/roles/:roleId", async (request) => {
        const { roleId } = request.params as { roleId: string };
        const body = request.body as Partial<{
            displayName: string;
            description: string;
            color: string;
            priority: number;
            showBadge: boolean;
        }>;
        const role = await updateRole(roleId, body);
        await auditLog(request.userId, "role.update", "Role", roleId, body, request.ip);
        return { success: true, data: role };
    });

    app.delete("/roles/:roleId", async (request) => {
        const { roleId } = request.params as { roleId: string };
        await deleteRole(roleId);
        await auditLog(request.userId, "role.delete", "Role", roleId, null, request.ip);
        return { success: true };
    });

    // ── Role feature flags ───────────────────────

    app.put("/roles/:roleId/features/:featureFlagId", async (request) => {
        const { roleId, featureFlagId } = request.params as {
            roleId: string;
            featureFlagId: string;
        };
        const { enabled } = request.body as { enabled: boolean };
        const result = await setRoleFeatureFlag(roleId, featureFlagId, enabled);
        await auditLog(
            request.userId,
            "role.feature.set",
            "Role",
            roleId,
            { featureFlagId, enabled },
            request.ip,
        );
        return { success: true, data: result };
    });

    app.delete("/roles/:roleId/features/:featureFlagId", async (request) => {
        const { roleId, featureFlagId } = request.params as {
            roleId: string;
            featureFlagId: string;
        };
        await removeRoleFeatureFlag(roleId, featureFlagId);
        await auditLog(
            request.userId,
            "role.feature.remove",
            "Role",
            roleId,
            { featureFlagId },
            request.ip,
        );
        return { success: true };
    });

    // ── Role limits ──────────────────────────────

    app.put("/roles/:roleId/limits/:key", async (request) => {
        const { roleId, key } = request.params as { roleId: string; key: string };
        const { value } = request.body as { value: number };
        const result = await setRoleLimit(roleId, key, value);
        await auditLog(
            request.userId,
            "role.limit.set",
            "Role",
            roleId,
            { key, value },
            request.ip,
        );
        return { success: true, data: result };
    });

    app.delete("/roles/:roleId/limits/:key", async (request) => {
        const { roleId, key } = request.params as { roleId: string; key: string };
        await removeRoleLimit(roleId, key);
        await auditLog(request.userId, "role.limit.remove", "Role", roleId, { key }, request.ip);
        return { success: true };
    });

    // ══════════════════════════════════════════════
    // Feature Flags
    // ══════════════════════════════════════════════

    app.get("/feature-flags", async () => {
        const flags = await listFeatureFlags();
        return { success: true, data: flags };
    });

    app.post("/feature-flags", async (request) => {
        const body = request.body as {
            key: string;
            name: string;
            description?: string;
            category?: string;
        };
        const flag = await createFeatureFlag(body);
        await auditLog(
            request.userId,
            "feature_flag.create",
            "FeatureFlag",
            flag.id,
            body,
            request.ip,
        );
        return { success: true, data: flag };
    });

    app.patch("/feature-flags/:flagId", async (request) => {
        const { flagId } = request.params as { flagId: string };
        const body = request.body as Partial<{
            name: string;
            description: string;
            category: string;
        }>;
        const flag = await updateFeatureFlag(flagId, body);
        await auditLog(
            request.userId,
            "feature_flag.update",
            "FeatureFlag",
            flagId,
            body,
            request.ip,
        );
        return { success: true, data: flag };
    });

    app.post("/feature-flags/:flagId/toggle", async (request) => {
        const { flagId } = request.params as { flagId: string };
        const flag = await toggleFeatureFlag(flagId);
        await auditLog(
            request.userId,
            "feature_flag.toggle",
            "FeatureFlag",
            flagId,
            { enabled: flag.enabled },
            request.ip,
        );
        return { success: true, data: flag };
    });

    app.delete("/feature-flags/:flagId", async (request) => {
        const { flagId } = request.params as { flagId: string };
        await deleteFeatureFlag(flagId);
        await auditLog(
            request.userId,
            "feature_flag.delete",
            "FeatureFlag",
            flagId,
            null,
            request.ip,
        );
        return { success: true };
    });

    // ══════════════════════════════════════════════
    // System Settings
    // ══════════════════════════════════════════════

    app.get("/settings", async () => {
        const settings = await getSystemSettings();
        return { success: true, data: settings };
    });

    app.put("/settings/:key", async (request) => {
        const { key } = request.params as { key: string };
        const { value } = request.body as { value: unknown };
        const setting = await updateSystemSetting(key, value);
        await auditLog(
            request.userId,
            "setting.update",
            "SystemSetting",
            key,
            { value },
            request.ip,
        );
        return { success: true, data: setting };
    });

    // ══════════════════════════════════════════════
    // Platform Stats
    // ══════════════════════════════════════════════

    app.get("/stats", async () => {
        const stats = await getPlatformStats();
        return { success: true, data: stats };
    });

    app.get("/stats/growth", async (request) => {
        const { days } = request.query as { days?: string };
        const growth = await getUserGrowth(days ? Number(days) : 30);
        return { success: true, data: growth };
    });

    // ══════════════════════════════════════════════
    // Audit Log
    // ══════════════════════════════════════════════

    app.get("/audit-log", async (request) => {
        const q = request.query as Record<string, string>;
        const { getAuditLogs } = await import("@/modules/audit/audit.service.js");
        const result = await getAuditLogs({
            userId: q.userId,
            action: q.action,
            page: q.page ? Number(q.page) : undefined,
            limit: q.limit ? Number(q.limit) : undefined,
        });
        return { success: true, data: result };
    });

    // ══════════════════════════════════════════════
    // Pending Approvals
    // ══════════════════════════════════════════════

    app.get("/pending-approvals", async () => {
        const users = await listPendingApprovals();
        return { success: true, data: users };
    });

    app.post("/pending-approvals/:userId/approve", async (request) => {
        const { userId } = request.params as { userId: string };
        await approveUser(userId);
        await auditLog(request.userId, "user.approve", "User", userId, null, request.ip);
        return { success: true };
    });

    app.post("/pending-approvals/:userId/reject", async (request) => {
        const { userId } = request.params as { userId: string };
        await rejectUser(userId);
        await auditLog(request.userId, "user.reject", "User", userId, null, request.ip);
        return { success: true };
    });

    // ══════════════════════════════════════════════
    // Factory Reset (reseed defaults)
    // ══════════════════════════════════════════════

    app.post("/reseed", async (request) => {
        const result = await reseedDefaults(prisma);
        await auditLog(request.userId, "system.reseed", "System", null, result, request.ip);
        return { success: true, data: result };
    });
}
