import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.stubGlobal("useHttp", () => ({
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    put: mockPut,
    delete: mockDelete,
}));

const { useAdmin } = await import("~/composables/useAdmin");

describe("useAdmin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Stats", () => {
        it("getStats calls correct endpoint", async () => {
            mockGet.mockResolvedValueOnce({ data: { totalUsers: 10 } });
            const admin = useAdmin();
            const result = await admin.getStats();

            expect(mockGet).toHaveBeenCalledWith("/api/admin/stats");
            expect(result).toEqual({ totalUsers: 10 });
        });
    });

    describe("Users", () => {
        it("listUsers calls with params", async () => {
            mockGet.mockResolvedValueOnce({ data: { items: [], meta: {} } });
            const admin = useAdmin();
            await admin.listUsers({ page: "1", limit: 10 });

            expect(mockGet).toHaveBeenCalledWith("/api/admin/users", {
                params: { page: "1", limit: 10 },
            });
        });

        it("getUserDetail calls correct endpoint", async () => {
            mockGet.mockResolvedValueOnce({ data: { id: "u1", username: "test" } });
            const admin = useAdmin();
            const result = await admin.getUserDetail("u1");

            expect(mockGet).toHaveBeenCalledWith("/api/admin/users/u1");
            expect(result.username).toBe("test");
        });

        it("banUser posts to ban endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: { success: true } });
            const admin = useAdmin();
            await admin.banUser("u1", "spam");

            expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/ban", { reason: "spam" });
        });

        it("deleteUser calls delete endpoint", async () => {
            mockDelete.mockResolvedValueOnce({ data: { success: true } });
            const admin = useAdmin();
            await admin.deleteUser("u1");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/users/u1");
        });
    });

    describe("Roles", () => {
        it("listRoles returns data", async () => {
            mockGet.mockResolvedValueOnce({ data: [{ id: "r1", name: "admin" }] });
            const admin = useAdmin();
            const result = await admin.listRoles();

            expect(result).toEqual([{ id: "r1", name: "admin" }]);
        });

        it("createRole sends correct data", async () => {
            mockPost.mockResolvedValueOnce({ data: { id: "r1" } });
            const admin = useAdmin();
            await admin.createRole({ name: "moderator", displayName: "Moderator" });

            expect(mockPost).toHaveBeenCalledWith("/api/admin/roles", {
                name: "moderator",
                displayName: "Moderator",
            });
        });

        it("deleteRole calls correct endpoint", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.deleteRole("r1");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/roles/r1");
        });
    });

    describe("Feature Flags", () => {
        it("toggleFeatureFlag posts to toggle endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: { enabled: true } });
            const admin = useAdmin();
            await admin.toggleFeatureFlag("f1");

            expect(mockPost).toHaveBeenCalledWith("/api/admin/feature-flags/f1/toggle");
        });
    });

    describe("Settings", () => {
        it("updateSetting sends PUT with value", async () => {
            mockPut.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.updateSetting("maintenance_mode", "true");

            expect(mockPut).toHaveBeenCalledWith("/api/admin/settings/maintenance_mode", {
                value: "true",
            });
        });
    });

    describe("Legal", () => {
        it("toggleLegalPublished sends isPublished (not published)", async () => {
            mockPatch.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.toggleLegalPublished("doc1", true);

            expect(mockPatch).toHaveBeenCalledWith("/api/admin/legal/doc1", { isPublished: true });
        });

        it("upsertLegalDocument sends PUT", async () => {
            mockPut.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.upsertLegalDocument({
                key: "privacy_policy",
                contentDe: "Inhalt",
                contentEn: "Content",
            });

            expect(mockPut).toHaveBeenCalledWith("/api/admin/legal", {
                key: "privacy_policy",
                contentDe: "Inhalt",
                contentEn: "Content",
            });
        });
    });

    describe("Invites", () => {
        it("createInvite posts to invites endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: { code: "ABC123" } });
            const admin = useAdmin();
            const result = await admin.createInvite({ maxUses: 5 });

            expect(mockPost).toHaveBeenCalledWith("/api/admin/invites", { maxUses: 5 });
            expect(result.code).toBe("ABC123");
        });

        it("deactivateInvite posts to correct endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.deactivateInvite("inv1");

            expect(mockPost).toHaveBeenCalledWith("/api/admin/invites/inv1/deactivate");
        });
    });

    describe("Audit Log", () => {
        it("getAuditLog passes query params", async () => {
            mockGet.mockResolvedValueOnce({ data: { items: [], meta: {} } });
            const admin = useAdmin();
            await admin.getAuditLog({ page: 1, limit: 25 });

            expect(mockGet).toHaveBeenCalledWith("/api/admin/audit-log", {
                params: { page: 1, limit: 25 },
            });
        });
    });

    describe("Announcements", () => {
        it("createAnnouncement sends correct data", async () => {
            mockPost.mockResolvedValueOnce({ data: { id: "a1" } });
            const admin = useAdmin();
            await admin.createAnnouncement({ message: "System maintenance", type: "warning" });

            expect(mockPost).toHaveBeenCalledWith("/api/admin/announcements", {
                message: "System maintenance",
                type: "warning",
            });
        });

        it("updateAnnouncement sends PATCH with data", async () => {
            mockPatch.mockResolvedValueOnce({ data: { id: "a1", active: false } });
            const admin = useAdmin();
            await admin.updateAnnouncement("a1", { active: false });

            expect(mockPatch).toHaveBeenCalledWith("/api/admin/announcements/a1", {
                active: false,
            });
        });

        it("deleteAnnouncement calls DELETE", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.deleteAnnouncement("a1");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/announcements/a1");
        });
    });

    describe("User Features", () => {
        it("setUserFeature posts to correct endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: { success: true } });
            const admin = useAdmin();
            await admin.setUserFeature("u1", "f1", { enabled: true });

            expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/features/f1", {
                enabled: true,
            });
        });

        it("removeUserFeature calls DELETE", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.removeUserFeature("u1", "f1");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/users/u1/features/f1");
        });
    });

    describe("User Limits", () => {
        it("setUserLimit posts key and value", async () => {
            mockPost.mockResolvedValueOnce({ data: { success: true } });
            const admin = useAdmin();
            await admin.setUserLimit("u1", { key: "maxSensors", value: 20 });

            expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/limits", {
                key: "maxSensors",
                value: 20,
            });
        });

        it("removeUserLimit calls DELETE with key in path", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.removeUserLimit("u1", "maxSensors");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/users/u1/limits/maxSensors");
        });
    });

    describe("Approvals", () => {
        it("listApprovals calls GET", async () => {
            mockGet.mockResolvedValueOnce({ data: [] });
            const admin = useAdmin();
            await admin.listApprovals();

            expect(mockGet).toHaveBeenCalledWith("/api/admin/approvals");
        });

        it("approveUser posts to approve endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: { approved: true } });
            const admin = useAdmin();
            await admin.approveUser("u1");

            expect(mockPost).toHaveBeenCalledWith("/api/admin/approvals/u1/approve");
        });

        it("rejectUser posts to reject endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.rejectUser("u1");

            expect(mockPost).toHaveBeenCalledWith("/api/admin/approvals/u1/reject");
        });
    });

    describe("Role Features", () => {
        it("setRoleFeature sends enabled body", async () => {
            mockPost.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.setRoleFeature("r1", "f1", true);

            expect(mockPost).toHaveBeenCalledWith("/api/admin/roles/r1/features/f1", {
                enabled: true,
            });
        });

        it("removeRoleFeature calls DELETE", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.removeRoleFeature("r1", "f1");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/roles/r1/features/f1");
        });
    });

    describe("Role Limits", () => {
        it("setRoleLimit posts key and value", async () => {
            mockPost.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.setRoleLimit("r1", { key: "maxPets", value: 10 });

            expect(mockPost).toHaveBeenCalledWith("/api/admin/roles/r1/limits", {
                key: "maxPets",
                value: 10,
            });
        });

        it("removeRoleLimit calls DELETE", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.removeRoleLimit("r1", "maxPets");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/roles/r1/limits/maxPets");
        });
    });

    describe("User Roles", () => {
        it("assignUserRole posts to roles endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.assignUserRole("u1", "r1");

            expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/roles/r1");
        });

        it("removeUserRole calls DELETE", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.removeUserRole("u1", "r1");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/users/u1/roles/r1");
        });
    });

    describe("Invites extended", () => {
        it("listInvites calls GET", async () => {
            mockGet.mockResolvedValueOnce({ data: [] });
            const admin = useAdmin();
            await admin.listInvites();

            expect(mockGet).toHaveBeenCalledWith("/api/admin/invites");
        });

        it("deleteInvite calls DELETE", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.deleteInvite("inv1");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/invites/inv1");
        });
    });

    describe("Feature Flags extended", () => {
        it("listFeatureFlags calls GET", async () => {
            mockGet.mockResolvedValueOnce({ data: [] });
            const admin = useAdmin();
            await admin.listFeatureFlags();

            expect(mockGet).toHaveBeenCalledWith("/api/admin/feature-flags");
        });

        it("createFeatureFlag posts data", async () => {
            mockPost.mockResolvedValueOnce({ data: { id: "f1" } });
            const admin = useAdmin();
            await admin.createFeatureFlag({ key: "new_feature", name: "New Feature" });

            expect(mockPost).toHaveBeenCalledWith("/api/admin/feature-flags", {
                key: "new_feature",
                name: "New Feature",
            });
        });

        it("updateFeatureFlag sends PATCH", async () => {
            mockPatch.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.updateFeatureFlag("f1", { name: "Updated" });

            expect(mockPatch).toHaveBeenCalledWith("/api/admin/feature-flags/f1", {
                name: "Updated",
            });
        });

        it("deleteFeatureFlag calls DELETE", async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.deleteFeatureFlag("f1");

            expect(mockDelete).toHaveBeenCalledWith("/api/admin/feature-flags/f1");
        });
    });

    describe("User management extended", () => {
        it("updateUser sends PATCH with data", async () => {
            mockPatch.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.updateUser("u1", { displayName: "New Name" });

            expect(mockPatch).toHaveBeenCalledWith("/api/admin/users/u1", {
                displayName: "New Name",
            });
        });

        it("unbanUser posts to unban endpoint", async () => {
            mockPost.mockResolvedValueOnce({ data: {} });
            const admin = useAdmin();
            await admin.unbanUser("u1");

            expect(mockPost).toHaveBeenCalledWith("/api/admin/users/u1/unban");
        });
    });
});
