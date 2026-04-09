export function useAdmin() {
    const http = useHttp();
    const base = "/api/admin";

    return {
        // ─── Stats ─────────────────────────────────────────
        getStats: () => http.get(`${base}/stats`).then((r) => r.data),
        getUserGrowth: (days = 30) =>
            http.get(`${base}/stats/growth`, { params: { days } }).then((r) => r.data),

        // ─── Users ─────────────────────────────────────────
        listUsers: (params?: Record<string, string | number | undefined>) =>
            http.get(`${base}/users`, { params }).then((r) => r.data),
        getUserDetail: (userId: string) => http.get(`${base}/users/${userId}`).then((r) => r.data),
        updateUser: (userId: string, data: Record<string, unknown>) =>
            http.patch(`${base}/users/${userId}`, data).then((r) => r.data),
        deleteUser: (userId: string) => http.delete(`${base}/users/${userId}`).then((r) => r.data),
        banUser: (userId: string, reason?: string) =>
            http.post(`${base}/users/${userId}/ban`, { reason }).then((r) => r.data),
        unbanUser: (userId: string) =>
            http.post(`${base}/users/${userId}/unban`).then((r) => r.data),

        // User → Roles
        assignUserRole: (userId: string, roleId: string) =>
            http.post(`${base}/users/${userId}/roles/${roleId}`).then((r) => r.data),
        removeUserRole: (userId: string, roleId: string) =>
            http.delete(`${base}/users/${userId}/roles/${roleId}`).then((r) => r.data),

        // User → Features
        setUserFeature: (userId: string, featureFlagId: string, data?: Record<string, unknown>) =>
            http
                .post(`${base}/users/${userId}/features/${featureFlagId}`, data)
                .then((r) => r.data),
        removeUserFeature: (userId: string, featureFlagId: string) =>
            http.delete(`${base}/users/${userId}/features/${featureFlagId}`).then((r) => r.data),

        // User → Limits
        setUserLimit: (userId: string, data: { key: string; value: number }) =>
            http.post(`${base}/users/${userId}/limits`, data).then((r) => r.data),
        removeUserLimit: (userId: string, key: string) =>
            http.delete(`${base}/users/${userId}/limits/${key}`).then((r) => r.data),

        // ─── Approvals ────────────────────────────────────
        listApprovals: () => http.get(`${base}/approvals`).then((r) => r.data),
        approveUser: (userId: string) =>
            http.post(`${base}/approvals/${userId}/approve`).then((r) => r.data),
        rejectUser: (userId: string) =>
            http.post(`${base}/approvals/${userId}/reject`).then((r) => r.data),

        // ─── Roles ─────────────────────────────────────────
        listRoles: () => http.get(`${base}/roles`).then((r) => r.data),
        getRoleDetail: (roleId: string) => http.get(`${base}/roles/${roleId}`).then((r) => r.data),
        createRole: (data: Record<string, unknown>) =>
            http.post(`${base}/roles`, data).then((r) => r.data),
        updateRole: (roleId: string, data: Record<string, unknown>) =>
            http.patch(`${base}/roles/${roleId}`, data).then((r) => r.data),
        deleteRole: (roleId: string) => http.delete(`${base}/roles/${roleId}`).then((r) => r.data),

        // Role → Features
        setRoleFeature: (roleId: string, featureFlagId: string, enabled = true) =>
            http
                .post(`${base}/roles/${roleId}/features/${featureFlagId}`, { enabled })
                .then((r) => r.data),
        removeRoleFeature: (roleId: string, featureFlagId: string) =>
            http.delete(`${base}/roles/${roleId}/features/${featureFlagId}`).then((r) => r.data),

        // Role → Limits
        setRoleLimit: (roleId: string, data: { key: string; value: number }) =>
            http.post(`${base}/roles/${roleId}/limits`, data).then((r) => r.data),
        removeRoleLimit: (roleId: string, key: string) =>
            http.delete(`${base}/roles/${roleId}/limits/${key}`).then((r) => r.data),

        // ─── Feature Flags ─────────────────────────────────
        listFeatureFlags: () => http.get(`${base}/feature-flags`).then((r) => r.data),
        createFeatureFlag: (data: Record<string, unknown>) =>
            http.post(`${base}/feature-flags`, data).then((r) => r.data),
        updateFeatureFlag: (flagId: string, data: Record<string, unknown>) =>
            http.patch(`${base}/feature-flags/${flagId}`, data).then((r) => r.data),
        toggleFeatureFlag: (flagId: string) =>
            http.post(`${base}/feature-flags/${flagId}/toggle`).then((r) => r.data),
        deleteFeatureFlag: (flagId: string) =>
            http.delete(`${base}/feature-flags/${flagId}`).then((r) => r.data),

        // ─── Settings ──────────────────────────────────────
        getSettings: () => http.get(`${base}/settings`).then((r) => r.data),
        updateSetting: (key: string, value: string) =>
            http.put(`${base}/settings/${key}`, { value }).then((r) => r.data),

        // ─── Audit Log ─────────────────────────────────────
        getAuditLog: (params?: Record<string, string | number | undefined>) =>
            http.get(`${base}/audit-log`, { params }).then((r) => r.data),

        // ─── Invites ───────────────────────────────────────
        listInvites: () => http.get(`${base}/invites`).then((r) => r.data),
        createInvite: (data: Record<string, unknown>) =>
            http.post(`${base}/invites`, data).then((r) => r.data),
        deactivateInvite: (id: string) =>
            http.post(`${base}/invites/${id}/deactivate`).then((r) => r.data),
        deleteInvite: (id: string) => http.delete(`${base}/invites/${id}`).then((r) => r.data),

        // ─── Announcements ─────────────────────────────────
        listAnnouncements: () => http.get(`${base}/announcements`).then((r) => r.data),
        createAnnouncement: (data: Record<string, unknown>) =>
            http.post(`${base}/announcements`, data).then((r) => r.data),
        updateAnnouncement: (id: string, data: Record<string, unknown>) =>
            http.patch(`${base}/announcements/${id}`, data).then((r) => r.data),
        deleteAnnouncement: (id: string) =>
            http.delete(`${base}/announcements/${id}`).then((r) => r.data),

        // ─── Legal ─────────────────────────────────────────
        listLegalDocuments: () => http.get(`${base}/legal`).then((r) => r.data),
        upsertLegalDocument: (data: Record<string, unknown>) =>
            http.put(`${base}/legal`, data).then((r) => r.data),
        toggleLegalPublished: (id: string, isPublished: boolean) =>
            http.patch(`${base}/legal/${id}`, { isPublished }).then((r) => r.data),

        // ─── Access Requests ───────────────────────────────
        listAccessRequests: (params?: Record<string, string | number | undefined>) =>
            http.get(`${base}/access-requests`, { params }).then((r) => r.data),
        approveAccessRequest: (id: string) =>
            http.post(`${base}/access-requests/${id}/approve`).then((r) => r.data),
        rejectAccessRequest: (id: string) =>
            http.post(`${base}/access-requests/${id}/reject`).then((r) => r.data),

        // ─── Emails ────────────────────────────────────────
        listEmails: (params?: Record<string, string | number | undefined>) =>
            http.get(`${base}/emails`, { params }).then((r) => r.data),
        sendEmail: (data: { to: string; subject: string; body: string }) =>
            http.post(`${base}/emails/send`, data).then((r) => r.data),

        // ─── Maintenance ───────────────────────────────────
        triggerMaintenance: (data: Record<string, unknown>) =>
            http.post(`${base}/maintenance`, data).then((r) => r.data),
        listMaintenanceLogs: () => http.get(`${base}/maintenance/logs`).then((r) => r.data),
    };
}
