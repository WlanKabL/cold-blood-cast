import type {
    AdminUser,
    AdminUserDetail,
    PlatformStats,
    UserGrowthPoint,
    AuditLogEntry,
    Role,
    RoleDetail,
    FeatureFlag,
    Tag,
    Announcement,
    AccessRequest,
    SystemSettingEntry,
    InviteCode,
    CreateInviteCodePayload,
    PaginatedResponse,
    AdminLegalDocument,
    UpdateLegalDocumentPayload,
} from "~/types/api";

export function useAdminApi() {
    const { get, post, patch, del, put } = useApi();

    // ── Users ────────────────────────────────────

    async function listUsers(params?: Record<string, string | number>) {
        const query = params
            ? `?${new URLSearchParams(
                  Object.entries(params).map(([k, v]) => [k, String(v)]),
              ).toString()}`
            : "";
        return get<PaginatedResponse<AdminUser>>(`/api/admin/users${query}`);
    }

    async function getUserDetail(userId: string) {
        return get<AdminUserDetail>(`/api/admin/users/${userId}`);
    }

    async function updateUser(userId: string, data: Record<string, unknown>) {
        return patch<{ id: string; username: string; email: string; displayName: string | null }>(
            `/api/admin/users/${userId}`,
            data,
        );
    }

    async function assignRole(userId: string, roleId: string) {
        return post(`/api/admin/users/${userId}/roles`, { roleId });
    }

    async function removeRole(userId: string, roleId: string) {
        return del(`/api/admin/users/${userId}/roles/${roleId}`);
    }

    async function setFeatureOverride(userId: string, featureFlagId: string, enabled: boolean) {
        return put(`/api/admin/users/${userId}/features/${featureFlagId}`, { enabled });
    }

    async function removeFeatureOverride(userId: string, featureFlagId: string) {
        return del(`/api/admin/users/${userId}/features/${featureFlagId}`);
    }

    async function setLimitOverride(userId: string, key: string, value: number) {
        return put(`/api/admin/users/${userId}/limits/${key}`, { value });
    }

    async function removeLimitOverride(userId: string, key: string) {
        return del(`/api/admin/users/${userId}/limits/${key}`);
    }

    async function banUser(userId: string, reason?: string) {
        return post(`/api/admin/users/${userId}/ban`, { reason });
    }

    async function unbanUser(userId: string) {
        return post(`/api/admin/users/${userId}/unban`);
    }

    async function deleteUser(userId: string) {
        return del(`/api/admin/users/${userId}`);
    }

    async function bulkAssignRole(userIds: string[], roleId: string) {
        return post("/api/admin/users/bulk/assign-role", { userIds, roleId });
    }

    async function bulkRemoveRole(userIds: string[], roleId: string) {
        return post("/api/admin/users/bulk/remove-role", { userIds, roleId });
    }

    async function impersonateUser(userId: string) {
        return post<{
            id: string;
            username: string;
            email: string;
            displayName: string | null;
            banned: boolean;
        }>(`/api/admin/users/${userId}/impersonate`);
    }

    // ── Roles ────────────────────────────────────

    async function listRoles() {
        return get<Role[]>("/api/admin/roles");
    }

    async function getRoleDetail(roleId: string) {
        return get<RoleDetail>(`/api/admin/roles/${roleId}`);
    }

    async function createRole(data: {
        name: string;
        displayName: string;
        description?: string;
        color?: string;
        priority?: number;
        showBadge?: boolean;
    }) {
        return post<Role>("/api/admin/roles", data);
    }

    async function updateRole(
        roleId: string,
        data: Partial<{
            displayName: string;
            description: string;
            color: string;
            priority: number;
            showBadge: boolean;
        }>,
    ) {
        return patch<Role>(`/api/admin/roles/${roleId}`, data);
    }

    async function deleteRole(roleId: string) {
        return del(`/api/admin/roles/${roleId}`);
    }

    async function setRoleFeature(roleId: string, featureFlagId: string, enabled: boolean) {
        return put(`/api/admin/roles/${roleId}/features/${featureFlagId}`, { enabled });
    }

    async function removeRoleFeature(roleId: string, featureFlagId: string) {
        return del(`/api/admin/roles/${roleId}/features/${featureFlagId}`);
    }

    async function setRoleLimit(roleId: string, key: string, value: number) {
        return put(`/api/admin/roles/${roleId}/limits/${key}`, { value });
    }

    async function removeRoleLimit(roleId: string, key: string) {
        return del(`/api/admin/roles/${roleId}/limits/${key}`);
    }

    // ── Feature Flags ────────────────────────────

    async function listFeatureFlags() {
        return get<FeatureFlag[]>("/api/admin/feature-flags");
    }

    async function createFeatureFlag(data: {
        key: string;
        name: string;
        description?: string;
        category?: string;
    }) {
        return post<FeatureFlag>("/api/admin/feature-flags", data);
    }

    async function updateFeatureFlag(
        flagId: string,
        data: Partial<{ name: string; description: string; category: string }>,
    ) {
        return patch<FeatureFlag>(`/api/admin/feature-flags/${flagId}`, data);
    }

    async function toggleFeatureFlag(flagId: string) {
        return post<FeatureFlag>(`/api/admin/feature-flags/${flagId}/toggle`);
    }

    async function deleteFeatureFlag(flagId: string) {
        return del(`/api/admin/feature-flags/${flagId}`);
    }

    // ── Tags ─────────────────────────────────────

    async function adminListGlobalTags() {
        return get<Tag[]>("/api/tags/admin/global");
    }

    async function createGlobalTag(data: { name: string; category?: string; color?: string }) {
        return post<Tag>("/api/tags/admin/global", data);
    }

    async function updateGlobalTag(
        tagId: string,
        data: Partial<{ name: string; category: string; color: string }>,
    ) {
        return patch<Tag>(`/api/tags/admin/global/${tagId}`, data);
    }

    async function deleteGlobalTag(tagId: string) {
        return del(`/api/tags/admin/global/${tagId}`);
    }

    // ── Announcements ────────────────────────────

    async function adminListAnnouncements() {
        return get<Announcement[]>("/api/announcements/admin/all");
    }

    async function createAnnouncement(data: {
        title: string;
        content: string;
        type?: string;
        global?: boolean;
        targetUserId?: string;
        startsAt?: string;
        expiresAt?: string;
    }) {
        return post<Announcement>("/api/announcements/admin", data);
    }

    async function updateAnnouncement(
        announcementId: string,
        data: Partial<{
            title: string;
            content: string;
            type: string;
            active: boolean;
            startsAt: string;
            expiresAt: string;
        }>,
    ) {
        return patch<Announcement>(`/api/announcements/admin/${announcementId}`, data);
    }

    async function deleteAnnouncement(announcementId: string) {
        return del(`/api/announcements/admin/${announcementId}`);
    }

    // ── Settings ─────────────────────────────────

    async function getSettings() {
        return get<SystemSettingEntry[]>("/api/admin/settings");
    }

    async function updateSetting(key: string, value: unknown) {
        return put(`/api/admin/settings/${key}`, { value });
    }

    // ── Stats ────────────────────────────────────

    async function getPlatformStats() {
        return get<PlatformStats>("/api/admin/stats");
    }

    async function getUserGrowth(days = 30) {
        return get<UserGrowthPoint[]>(`/api/admin/stats/growth?days=${days}`);
    }

    // ── Audit Log ────────────────────────────────

    async function getAuditLogs(params?: Record<string, string | number>) {
        const query = params
            ? `?${new URLSearchParams(
                  Object.entries(params).map(([k, v]) => [k, String(v)]),
              ).toString()}`
            : "";
        return get<PaginatedResponse<AuditLogEntry>>(`/api/admin/audit-log${query}`);
    }

    // ── Pending Approvals ────────────────────────

    async function listPendingApprovals() {
        return get<
            Array<{
                id: string;
                username: string;
                email: string;
                displayName: string | null;
                createdAt: string;
            }>
        >("/api/admin/pending-approvals");
    }

    async function approveUser(userId: string) {
        return post(`/api/admin/pending-approvals/${userId}/approve`, {});
    }

    async function rejectUser(userId: string) {
        return post(`/api/admin/pending-approvals/${userId}/reject`, {});
    }

    // ── Invite Codes ─────────────────────────────

    async function listInviteCodes() {
        return get<InviteCode[]>("/api/invites");
    }

    async function createInviteCode(data: CreateInviteCodePayload) {
        return post<InviteCode>("/api/invites", data);
    }

    async function revokeInviteCode(id: string) {
        return patch<InviteCode>(`/api/invites/${id}/revoke`, {});
    }

    async function deleteInviteCode(id: string) {
        return del(`/api/invites/${id}`);
    }

    // ── Access Requests ──────────────────────────

    async function listAccessRequests(status?: string) {
        const query = status ? `?status=${status}` : "";
        return get<AccessRequest[]>(`/api/access-requests${query}`);
    }

    async function reviewAccessRequest(id: string, action: "approved" | "rejected") {
        return post<AccessRequest>(`/api/access-requests/${id}/review`, { action });
    }

    async function deleteAccessRequest(id: string) {
        return del(`/api/access-requests/${id}`);
    }

    // ── Legal Documents ──────────────────────────

    async function listLegalDocuments() {
        return get<AdminLegalDocument[]>("/api/admin/legal");
    }

    async function getLegalDocument(key: string) {
        return get<AdminLegalDocument>(`/api/admin/legal/${key}`);
    }

    async function updateLegalDocument(key: string, data: UpdateLegalDocumentPayload) {
        return put<AdminLegalDocument>(`/api/admin/legal/${key}`, data);
    }

    async function toggleLegalDocumentPublished(key: string) {
        return post<AdminLegalDocument>(`/api/admin/legal/${key}/toggle`);
    }

    return {
        // Users
        listUsers,
        getUserDetail,
        updateUser,
        assignRole,
        removeRole,
        setFeatureOverride,
        removeFeatureOverride,
        setLimitOverride,
        removeLimitOverride,
        banUser,
        unbanUser,
        deleteUser,
        bulkAssignRole,
        bulkRemoveRole,
        impersonateUser,
        // Roles
        listRoles,
        getRoleDetail,
        createRole,
        updateRole,
        deleteRole,
        setRoleFeature,
        removeRoleFeature,
        setRoleLimit,
        removeRoleLimit,
        // Feature Flags
        listFeatureFlags,
        createFeatureFlag,
        updateFeatureFlag,
        toggleFeatureFlag,
        deleteFeatureFlag,
        // Tags
        adminListGlobalTags,
        createGlobalTag,
        updateGlobalTag,
        deleteGlobalTag,
        // Announcements
        adminListAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        // Settings
        getSettings,
        updateSetting,
        // Stats
        getPlatformStats,
        getUserGrowth,
        // Audit
        getAuditLogs,
        // Pending Approvals
        listPendingApprovals,
        approveUser,
        rejectUser,
        // Invite Codes
        listInviteCodes,
        createInviteCode,
        revokeInviteCode,
        deleteInviteCode,
        // Access Requests
        listAccessRequests,
        reviewAccessRequest,
        deleteAccessRequest,
        // Legal Documents
        listLegalDocuments,
        getLegalDocument,
        updateLegalDocument,
        toggleLegalDocumentPublished,
    };
}
