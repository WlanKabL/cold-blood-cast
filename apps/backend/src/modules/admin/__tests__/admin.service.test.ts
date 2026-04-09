import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    role: {
        findUnique: vi.fn(),
    },
    userRole: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
    },
    featureFlag: {
        findUnique: vi.fn(),
    },
    userFeatureFlag: {
        upsert: vi.fn(),
        delete: vi.fn(),
    },
    userLimitOverride: {
        upsert: vi.fn(),
        delete: vi.fn(),
    },
    refreshToken: {
        updateMany: vi.fn(),
    },
    enclosure: { count: vi.fn() },
    pet: { count: vi.fn() },
    sensor: { count: vi.fn() },
    subscription: { count: vi.fn() },
    auditLog: { count: vi.fn() },
    accessRequest: { count: vi.fn() },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/config/env.js", () => ({
    env: () => ({ CORS_ORIGIN: "https://cold-blood-cast.app" }),
}));

const mockSendMail = vi.fn();
vi.mock("@/modules/mail/index.js", () => ({
    sendMail: mockSendMail,
    accountBannedTemplate: vi.fn(() => "<html>banned</html>"),
    accountApprovedTemplate: vi.fn(() => "<html>approved</html>"),
    accountRejectedTemplate: vi.fn(() => "<html>rejected</html>"),
}));

// ─── Import SUT ──────────────────────────────────────────────

const {
    listUsers,
    getAdminUserDetail,
    assignRoleToUser,
    removeRoleFromUser,
    banUser,
    unbanUser,
    deleteUser,
    adminUpdateUser,
    getPlatformStats,
    getUserGrowth,
    bulkAssignRole,
    bulkRemoveRole,
    approveUser,
    rejectUser,
    setUserFeatureOverride,
    removeUserFeatureOverride,
    setUserLimitOverride,
    removeUserLimitOverride,
} = await import("../admin.service.js");

// ─── Helpers ─────────────────────────────────────────────────

const USER_ID = "user_123";
const ADMIN_ID = "admin_456";

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listUsers ───────────────────────────────────────────────

describe("listUsers", () => {
    it("returns paginated users with defaults", async () => {
        mockPrisma.user.findMany.mockResolvedValue([
            { id: USER_ID, username: "testuser", roles: [] },
        ]);
        mockPrisma.user.count.mockResolvedValue(1);

        const result = await listUsers({});

        expect(result.items).toHaveLength(1);
        expect(result.meta.page).toBe(1);
        expect(result.meta.total).toBe(1);
    });

    it("caps limit at 100", async () => {
        mockPrisma.user.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        await listUsers({ limit: 500 });

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 100 }),
        );
    });

    it("applies search filter", async () => {
        mockPrisma.user.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        await listUsers({ search: "john" });

        const call = mockPrisma.user.findMany.mock.calls[0][0];
        expect(call.where.OR).toBeDefined();
        expect(call.where.OR.length).toBe(3);
    });

    it("applies role filter", async () => {
        mockPrisma.user.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        await listUsers({ role: "ADMIN" });

        const call = mockPrisma.user.findMany.mock.calls[0][0];
        expect(call.where.roles).toBeDefined();
    });

    it("applies banned filter", async () => {
        mockPrisma.user.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        await listUsers({ banned: "true" });

        const call = mockPrisma.user.findMany.mock.calls[0][0];
        expect(call.where.banned).toBe(true);
    });
});

// ─── getAdminUserDetail ──────────────────────────────────────

describe("getAdminUserDetail", () => {
    it("returns detailed user data", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: USER_ID,
            username: "testuser",
            roles: [],
            featureFlags: [],
        });

        const result = await getAdminUserDetail(USER_ID);

        expect(result.id).toBe(USER_ID);
    });

    it("throws when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(getAdminUserDetail(USER_ID)).rejects.toThrow("User not found");
    });
});

// ─── assignRoleToUser ────────────────────────────────────────

describe("assignRoleToUser", () => {
    it("assigns role successfully", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "role_1", name: "PREMIUM" });
        mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
        mockPrisma.userRole.findUnique.mockResolvedValue(null);
        mockPrisma.userRole.create.mockResolvedValue({ userId: USER_ID, roleId: "role_1" });

        const result = await assignRoleToUser(USER_ID, "role_1", ADMIN_ID);

        expect(mockPrisma.userRole.create).toHaveBeenCalled();
    });

    it("throws when role not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);

        await expect(assignRoleToUser(USER_ID, "role_1", ADMIN_ID)).rejects.toThrow(
            "Role not found",
        );
    });

    it("throws when user not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "role_1" });
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(assignRoleToUser(USER_ID, "role_1", ADMIN_ID)).rejects.toThrow(
            "User not found",
        );
    });

    it("throws when role already assigned", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "role_1" });
        mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
        mockPrisma.userRole.findUnique.mockResolvedValue({ userId: USER_ID, roleId: "role_1" });

        await expect(assignRoleToUser(USER_ID, "role_1", ADMIN_ID)).rejects.toThrow(
            "Role already assigned",
        );
    });
});

// ─── removeRoleFromUser ──────────────────────────────────────

describe("removeRoleFromUser", () => {
    it("removes role successfully", async () => {
        mockPrisma.userRole.findUnique.mockResolvedValue({
            userId: USER_ID,
            roleId: "role_1",
            role: { name: "FREE" },
        });
        mockPrisma.userRole.delete.mockResolvedValue({});

        await removeRoleFromUser(USER_ID, "role_1");

        expect(mockPrisma.userRole.delete).toHaveBeenCalled();
    });

    it("throws when role not assigned", async () => {
        mockPrisma.userRole.findUnique.mockResolvedValue(null);

        await expect(removeRoleFromUser(USER_ID, "role_1")).rejects.toThrow(
            "User does not have this role",
        );
    });

    it("prevents removing own ADMIN role", async () => {
        mockPrisma.userRole.findUnique.mockResolvedValue({
            userId: ADMIN_ID,
            roleId: "role_1",
            role: { name: "ADMIN" },
        });

        await expect(removeRoleFromUser(ADMIN_ID, "role_1", ADMIN_ID)).rejects.toThrow(
            "Cannot remove your own admin role",
        );
    });
});

// ─── banUser ─────────────────────────────────────────────────

describe("banUser", () => {
    it("bans user and revokes tokens", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: USER_ID,
            email: "test@test.com",
            username: "test",
        });
        mockPrisma.userRole.findFirst.mockResolvedValue(null);
        mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
        mockPrisma.user.update.mockResolvedValue({
            id: USER_ID,
            email: "test@test.com",
            username: "test",
            banned: true,
        });

        await banUser(USER_ID, ADMIN_ID, "Spam");

        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: USER_ID, revoked: false },
                data: { revoked: true },
            }),
        );
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ banned: true }),
            }),
        );
    });

    it("throws when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(banUser(USER_ID, ADMIN_ID)).rejects.toThrow("User not found");
    });

    it("throws when trying to ban admin", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
        mockPrisma.userRole.findFirst.mockResolvedValue({ role: { name: "ADMIN" } });

        await expect(banUser(USER_ID, ADMIN_ID)).rejects.toThrow("Cannot ban an admin user");
    });
});

// ─── unbanUser ───────────────────────────────────────────────

describe("unbanUser", () => {
    it("unbans user and clears ban fields", async () => {
        mockPrisma.user.update.mockResolvedValue({ id: USER_ID, banned: false });

        await unbanUser(USER_ID);

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    banned: false,
                    bannedAt: null,
                    bannedBy: null,
                    bannedReason: null,
                },
            }),
        );
    });
});

// ─── deleteUser ──────────────────────────────────────────────

describe("deleteUser", () => {
    it("deletes user successfully", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: USER_ID,
            roles: [{ role: { name: "FREE" } }],
        });
        mockPrisma.user.delete.mockResolvedValue({});

        await deleteUser(USER_ID, ADMIN_ID);

        expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: USER_ID } });
    });

    it("throws when trying to delete self", async () => {
        await expect(deleteUser(ADMIN_ID, ADMIN_ID)).rejects.toThrow(
            "Cannot delete your own account",
        );
    });

    it("throws when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(deleteUser(USER_ID, ADMIN_ID)).rejects.toThrow("User not found");
    });

    it("throws when trying to delete admin", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: USER_ID,
            roles: [{ role: { name: "ADMIN" } }],
        });

        await expect(deleteUser(USER_ID, ADMIN_ID)).rejects.toThrow("Cannot delete an admin user");
    });
});

// ─── adminUpdateUser ─────────────────────────────────────────

describe("adminUpdateUser", () => {
    it("updates allowed fields only", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
        mockPrisma.user.update.mockResolvedValue({ id: USER_ID, username: "newname" });

        await adminUpdateUser(USER_ID, { username: "newname" });

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { username: "newname" },
            }),
        );
    });

    it("clears verification fields when manually verifying email", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
        mockPrisma.user.update.mockResolvedValue({});

        await adminUpdateUser(USER_ID, { emailVerified: true });

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    emailVerified: true,
                    verificationCode: null,
                    verificationCodeExpiresAt: null,
                }),
            }),
        );
    });

    it("throws when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(adminUpdateUser(USER_ID, { username: "new" })).rejects.toThrow(
            "User not found",
        );
    });
});

// ─── getPlatformStats ────────────────────────────────────────

describe("getPlatformStats", () => {
    it("returns all platform statistics", async () => {
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.enclosure.count.mockResolvedValue(50);
        mockPrisma.pet.count.mockResolvedValue(120);
        mockPrisma.sensor.count.mockResolvedValue(200);
        mockPrisma.subscription.count.mockResolvedValue(10);
        mockPrisma.auditLog.count.mockResolvedValue(1000);
        mockPrisma.accessRequest.count.mockResolvedValue(5);

        const stats = await getPlatformStats();

        expect(stats.totalUsers).toBeDefined();
        expect(stats.totalEnclosures).toBeDefined();
        expect(stats.totalPets).toBeDefined();
        expect(stats.totalSensors).toBeDefined();
        expect(stats.pendingAccessRequests).toBeDefined();
    });
});

// ─── approveUser ─────────────────────────────────────────────

describe("approveUser", () => {
    it("approves user and sends email", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: USER_ID,
            approved: false,
        });
        mockPrisma.user.update.mockResolvedValue({
            id: USER_ID,
            email: "test@test.com",
            username: "testuser",
            approved: true,
        });

        await approveUser(USER_ID);

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { approved: true },
            }),
        );
    });

    it("throws when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(approveUser(USER_ID)).rejects.toThrow("User not found");
    });

    it("throws when user already approved", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: USER_ID,
            approved: true,
        });

        await expect(approveUser(USER_ID)).rejects.toThrow("User is already approved");
    });
});

// ─── rejectUser ──────────────────────────────────────────────

describe("rejectUser", () => {
    it("deletes user and sends rejection email", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: USER_ID,
            email: "test@test.com",
            username: "testuser",
        });
        mockPrisma.user.delete.mockResolvedValue({});

        await rejectUser(USER_ID);

        expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: USER_ID } });
    });

    it("throws when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(rejectUser(USER_ID)).rejects.toThrow("User not found");
    });
});

// ─── setUserFeatureOverride ──────────────────────────────────

describe("setUserFeatureOverride", () => {
    it("upserts feature flag override", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: "flag_1" });
        mockPrisma.userFeatureFlag.upsert.mockResolvedValue({});

        await setUserFeatureOverride(USER_ID, "flag_1", true, ADMIN_ID);

        expect(mockPrisma.userFeatureFlag.upsert).toHaveBeenCalled();
    });

    it("throws when flag not found", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

        await expect(setUserFeatureOverride(USER_ID, "flag_1", true, ADMIN_ID)).rejects.toThrow(
            "Feature flag not found",
        );
    });
});

// ─── setUserLimitOverride ────────────────────────────────────

describe("setUserLimitOverride", () => {
    it("throws for invalid limit key", async () => {
        await expect(
            setUserLimitOverride(USER_ID, "not_a_real_key", 999, ADMIN_ID),
        ).rejects.toThrow("Invalid limit key");
    });
});

// ─── getUserGrowth ───────────────────────────────────────────

describe("getUserGrowth", () => {
    it("groups users by registration date", async () => {
        mockPrisma.user.findMany.mockResolvedValue([
            { createdAt: new Date("2025-06-01T10:00:00Z") },
            { createdAt: new Date("2025-06-01T14:00:00Z") },
            { createdAt: new Date("2025-06-02T08:00:00Z") },
        ]);

        const result = await getUserGrowth(30);

        expect(result).toHaveLength(2);
        expect(result[0].count).toBe(2);
        expect(result[1].count).toBe(1);
    });
});

// ─── bulkAssignRole ──────────────────────────────────────────

describe("bulkAssignRole", () => {
    it("assigns role to multiple users", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "role_1" });
        mockPrisma.userRole.createMany.mockResolvedValue({ count: 3 });

        await bulkAssignRole(["u1", "u2", "u3"], "role_1", ADMIN_ID);

        expect(mockPrisma.userRole.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ userId: "u1" }),
                    expect.objectContaining({ userId: "u2" }),
                    expect.objectContaining({ userId: "u3" }),
                ]),
                skipDuplicates: true,
            }),
        );
    });

    it("throws when role not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);

        await expect(bulkAssignRole(["u1"], "role_1", ADMIN_ID)).rejects.toThrow("Role not found");
    });
});
