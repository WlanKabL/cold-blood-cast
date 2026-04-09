import { describe, it, expect, vi, beforeEach } from "vitest";

import { useAdminApi } from "../useAdmin";

// ─── Mock Nuxt auto-imports ──────────────────────────────────

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDel = vi.fn();
const mockPut = vi.fn();

vi.stubGlobal("useApi", () => ({
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    del: mockDel,
    put: mockPut,
}));

// ─── Setup ───────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── Users ───────────────────────────────────────────────────

describe("useAdminApi — Users", () => {
    it("listUsers calls GET with query params", async () => {
        mockGet.mockResolvedValueOnce({ items: [], meta: {} });
        const api = useAdminApi();

        await api.listUsers({ page: 2, search: "john" });

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/api/admin/users?"));
        const url = mockGet.mock.calls[0][0] as string;
        expect(url).toContain("page=2");
        expect(url).toContain("search=john");
    });

    it("listUsers calls without query when no params", async () => {
        mockGet.mockResolvedValueOnce({ items: [] });
        const api = useAdminApi();

        await api.listUsers();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/users");
    });

    it("getUserDetail calls GET with userId", async () => {
        mockGet.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.getUserDetail("u1");

        expect(mockGet).toHaveBeenCalledWith("/api/admin/users/u1");
    });

    it("updateUser calls PATCH", async () => {
        mockPatch.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.updateUser("u1", { displayName: "New Name" });

        expect(mockPatch).toHaveBeenCalledWith("/api/admin/users/u1", {
            displayName: "New Name",
        });
    });

    it("assignRole calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.assignRole("u1", "r1");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/roles", { roleId: "r1" });
    });

    it("removeRole calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.removeRole("u1", "r1");

        expect(mockDel).toHaveBeenCalledWith("/api/admin/users/u1/roles/r1");
    });

    it("setFeatureOverride calls PUT", async () => {
        mockPut.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.setFeatureOverride("u1", "f1", true);

        expect(mockPut).toHaveBeenCalledWith("/api/admin/users/u1/features/f1", {
            enabled: true,
        });
    });

    it("removeFeatureOverride calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.removeFeatureOverride("u1", "f1");

        expect(mockDel).toHaveBeenCalledWith("/api/admin/users/u1/features/f1");
    });

    it("setLimitOverride calls PUT", async () => {
        mockPut.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.setLimitOverride("u1", "max_enclosures", 10);

        expect(mockPut).toHaveBeenCalledWith("/api/admin/users/u1/limits/max_enclosures", {
            value: 10,
        });
    });

    it("removeLimitOverride calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.removeLimitOverride("u1", "max_enclosures");

        expect(mockDel).toHaveBeenCalledWith("/api/admin/users/u1/limits/max_enclosures");
    });

    it("banUser calls POST with reason", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.banUser("u1", "Spam");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/ban", { reason: "Spam" });
    });

    it("unbanUser calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.unbanUser("u1");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/unban");
    });

    it("deleteUser calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.deleteUser("u1");

        expect(mockDel).toHaveBeenCalledWith("/api/admin/users/u1");
    });

    it("bulkAssignRole calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.bulkAssignRole(["u1", "u2"], "r1");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/users/bulk/assign-role", {
            userIds: ["u1", "u2"],
            roleId: "r1",
        });
    });

    it("impersonateUser calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.impersonateUser("u1");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/impersonate");
    });
});

// ─── Roles ───────────────────────────────────────────────────

describe("useAdminApi — Roles", () => {
    it("listRoles calls GET", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.listRoles();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/roles");
    });

    it("createRole calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.createRole({ name: "BETA", displayName: "Beta" });

        expect(mockPost).toHaveBeenCalledWith("/api/admin/roles", {
            name: "BETA",
            displayName: "Beta",
        });
    });

    it("updateRole calls PATCH", async () => {
        mockPatch.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.updateRole("r1", { color: "#ff0000" });

        expect(mockPatch).toHaveBeenCalledWith("/api/admin/roles/r1", { color: "#ff0000" });
    });

    it("deleteRole calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.deleteRole("r1");

        expect(mockDel).toHaveBeenCalledWith("/api/admin/roles/r1");
    });

    it("setRoleFeature calls PUT", async () => {
        mockPut.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.setRoleFeature("r1", "f1", true);

        expect(mockPut).toHaveBeenCalledWith("/api/admin/roles/r1/features/f1", {
            enabled: true,
        });
    });

    it("setRoleLimit calls PUT", async () => {
        mockPut.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.setRoleLimit("r1", "max_enclosures", 5);

        expect(mockPut).toHaveBeenCalledWith("/api/admin/roles/r1/limits/max_enclosures", {
            value: 5,
        });
    });
});

// ─── Feature Flags ───────────────────────────────────────────

describe("useAdminApi — Feature Flags", () => {
    it("listFeatureFlags calls GET", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.listFeatureFlags();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/feature-flags");
    });

    it("createFeatureFlag calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.createFeatureFlag({ key: "new_feature", name: "New Feature" });

        expect(mockPost).toHaveBeenCalledWith("/api/admin/feature-flags", {
            key: "new_feature",
            name: "New Feature",
        });
    });

    it("toggleFeatureFlag calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.toggleFeatureFlag("f1");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/feature-flags/f1/toggle");
    });

    it("deleteFeatureFlag calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.deleteFeatureFlag("f1");

        expect(mockDel).toHaveBeenCalledWith("/api/admin/feature-flags/f1");
    });
});

// ─── Tags ────────────────────────────────────────────────────

describe("useAdminApi — Tags", () => {
    it("adminListGlobalTags calls GET", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.adminListGlobalTags();

        expect(mockGet).toHaveBeenCalledWith("/api/tags/admin/global");
    });

    it("createGlobalTag calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.createGlobalTag({ name: "Breakout" });

        expect(mockPost).toHaveBeenCalledWith("/api/tags/admin/global", { name: "Breakout" });
    });
});

// ─── Announcements ───────────────────────────────────────────

describe("useAdminApi — Announcements", () => {
    it("adminListAnnouncements calls GET", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.adminListAnnouncements();

        expect(mockGet).toHaveBeenCalledWith("/api/announcements/admin/all");
    });

    it("createAnnouncement calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.createAnnouncement({ title: "Notice", content: "Maintenance" });

        expect(mockPost).toHaveBeenCalledWith("/api/announcements/admin", {
            title: "Notice",
            content: "Maintenance",
        });
    });

    it("deleteAnnouncement calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.deleteAnnouncement("a1");

        expect(mockDel).toHaveBeenCalledWith("/api/announcements/admin/a1");
    });
});

// ─── Settings ────────────────────────────────────────────────

describe("useAdminApi — Settings", () => {
    it("getSettings calls GET", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.getSettings();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/settings");
    });

    it("updateSetting calls PUT", async () => {
        mockPut.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.updateSetting("maintenance_mode", true);

        expect(mockPut).toHaveBeenCalledWith("/api/admin/settings/maintenance_mode", {
            value: true,
        });
    });
});

// ─── Stats ───────────────────────────────────────────────────

describe("useAdminApi — Stats", () => {
    it("getPlatformStats calls GET", async () => {
        mockGet.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.getPlatformStats();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/stats");
    });

    it("getUserGrowth with default days", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.getUserGrowth();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/stats/growth?days=30");
    });

    it("getUserGrowth with custom days", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.getUserGrowth(90);

        expect(mockGet).toHaveBeenCalledWith("/api/admin/stats/growth?days=90");
    });
});

// ─── Audit Log ───────────────────────────────────────────────

describe("useAdminApi — Audit Log", () => {
    it("getAuditLogs with params", async () => {
        mockGet.mockResolvedValueOnce({ items: [] });
        const api = useAdminApi();

        await api.getAuditLogs({ page: 1, action: "LOGIN" });

        const url = mockGet.mock.calls[0][0] as string;
        expect(url).toContain("/api/admin/audit-log?");
        expect(url).toContain("page=1");
        expect(url).toContain("action=LOGIN");
    });

    it("getAuditLogs without params", async () => {
        mockGet.mockResolvedValueOnce({ items: [] });
        const api = useAdminApi();

        await api.getAuditLogs();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/audit-log");
    });
});

// ─── Pending Approvals ───────────────────────────────────────

describe("useAdminApi — Pending Approvals", () => {
    it("listPendingApprovals calls GET", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.listPendingApprovals();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/pending-approvals");
    });

    it("approveUser calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.approveUser("u1");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/pending-approvals/u1/approve", {});
    });

    it("rejectUser calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.rejectUser("u1");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/pending-approvals/u1/reject", {});
    });
});

// ─── Invite Codes ────────────────────────────────────────────

describe("useAdminApi — Invite Codes", () => {
    it("listInviteCodes calls GET", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.listInviteCodes();

        expect(mockGet).toHaveBeenCalledWith("/api/invites");
    });

    it("createInviteCode calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.createInviteCode({ maxUses: 5 } as never);

        expect(mockPost).toHaveBeenCalledWith("/api/invites", { maxUses: 5 });
    });

    it("revokeInviteCode calls PATCH", async () => {
        mockPatch.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.revokeInviteCode("ic1");

        expect(mockPatch).toHaveBeenCalledWith("/api/invites/ic1/revoke", {});
    });

    it("deleteInviteCode calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.deleteInviteCode("ic1");

        expect(mockDel).toHaveBeenCalledWith("/api/invites/ic1");
    });
});

// ─── Access Requests ─────────────────────────────────────────

describe("useAdminApi — Access Requests", () => {
    it("listAccessRequests with status", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.listAccessRequests("pending");

        expect(mockGet).toHaveBeenCalledWith("/api/access-requests?status=pending");
    });

    it("listAccessRequests without status", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.listAccessRequests();

        expect(mockGet).toHaveBeenCalledWith("/api/access-requests");
    });

    it("reviewAccessRequest calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.reviewAccessRequest("ar1", "approved");

        expect(mockPost).toHaveBeenCalledWith("/api/access-requests/ar1/review", {
            action: "approved",
        });
    });

    it("deleteAccessRequest calls DEL", async () => {
        mockDel.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.deleteAccessRequest("ar1");

        expect(mockDel).toHaveBeenCalledWith("/api/access-requests/ar1");
    });
});

// ─── Legal Documents ─────────────────────────────────────────

describe("useAdminApi — Legal Documents", () => {
    it("listLegalDocuments calls GET", async () => {
        mockGet.mockResolvedValueOnce([]);
        const api = useAdminApi();

        await api.listLegalDocuments();

        expect(mockGet).toHaveBeenCalledWith("/api/admin/legal");
    });

    it("getLegalDocument calls GET with key", async () => {
        mockGet.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.getLegalDocument("terms-of-service");

        expect(mockGet).toHaveBeenCalledWith("/api/admin/legal/terms-of-service");
    });

    it("updateLegalDocument calls PUT", async () => {
        mockPut.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.updateLegalDocument("tos", { contentDe: "Neue AGB" } as never);

        expect(mockPut).toHaveBeenCalledWith("/api/admin/legal/tos", {
            contentDe: "Neue AGB",
        });
    });

    it("toggleLegalDocumentPublished calls POST", async () => {
        mockPost.mockResolvedValueOnce({});
        const api = useAdminApi();

        await api.toggleLegalDocumentPublished("tos");

        expect(mockPost).toHaveBeenCalledWith("/api/admin/legal/tos/toggle");
    });
});
