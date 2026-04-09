import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    role: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    featureFlag: {
        findUnique: vi.fn(),
    },
    roleFeatureFlag: {
        upsert: vi.fn(),
        delete: vi.fn(),
    },
    roleLimit: {
        upsert: vi.fn(),
        delete: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/helpers/errors.js", async () => {
    const actual = await vi.importActual("@/helpers/errors.js");
    return actual;
});

// ─── Import SUT ──────────────────────────────────────────────

const {
    listRoles,
    getRoleDetail,
    createRole,
    updateRole,
    deleteRole,
    setRoleFeatureFlag,
    removeRoleFeatureFlag,
    setRoleLimit,
    removeRoleLimit,
} = await import("../roles.service.js");

// ─── Helpers ─────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listRoles ───────────────────────────────────────────────

describe("listRoles", () => {
    it("returns all roles ordered by priority desc", async () => {
        const roles = [{ id: "r1", name: "ADMIN", priority: 100 }];
        mockPrisma.role.findMany.mockResolvedValue(roles);

        const result = await listRoles();

        expect(result).toEqual(roles);
        expect(mockPrisma.role.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ orderBy: { priority: "desc" } }),
        );
    });
});

// ─── getRoleDetail ───────────────────────────────────────────

describe("getRoleDetail", () => {
    it("returns role with includes", async () => {
        const role = { id: "r1", name: "ADMIN" };
        mockPrisma.role.findUnique.mockResolvedValue(role);

        const result = await getRoleDetail("r1");

        expect(result).toEqual(role);
    });

    it("throws when role not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);

        await expect(getRoleDetail("none")).rejects.toThrow("Role not found");
    });
});

// ─── createRole ──────────────────────────────────────────────

describe("createRole", () => {
    it("creates role with normalized uppercase name", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);
        mockPrisma.role.create.mockResolvedValue({ id: "r1", name: "PREMIUM_USER" });

        const result = await createRole({
            name: "premium user",
            displayName: "Premium User",
        });

        expect(result.name).toBe("PREMIUM_USER");
        expect(mockPrisma.role.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    name: "PREMIUM_USER",
                    displayName: "Premium User",
                    isSystem: false,
                }),
            }),
        );
    });

    it("throws when role name already exists", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "existing" });

        await expect(createRole({ name: "ADMIN", displayName: "Admin" })).rejects.toThrow(
            "already exists",
        );
    });
});

// ─── updateRole ──────────────────────────────────────────────

describe("updateRole", () => {
    it("updates a non-system role with all fields", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "r1", isSystem: false });
        mockPrisma.role.update.mockResolvedValue({ id: "r1", displayName: "Updated", priority: 5 });

        const result = await updateRole("r1", { displayName: "Updated", priority: 5 });

        expect(result.displayName).toBe("Updated");
    });

    it("allows cosmetic changes on system roles", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "r1", isSystem: true });
        mockPrisma.role.update.mockResolvedValue({ id: "r1", displayName: "Admin V2" });

        await updateRole("r1", { displayName: "Admin V2", color: "#ff0000" });

        expect(mockPrisma.role.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ displayName: "Admin V2", color: "#ff0000" }),
            }),
        );
    });

    it("throws when changing priority of system role", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "r1", isSystem: true });

        await expect(updateRole("r1", { priority: 999 })).rejects.toThrow("Cannot change priority");
    });

    it("throws when role not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);

        await expect(updateRole("none", { displayName: "X" })).rejects.toThrow("Role not found");
    });
});

// ─── deleteRole ──────────────────────────────────────────────

describe("deleteRole", () => {
    it("deletes a non-system role with no users", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({
            id: "r1",
            isSystem: false,
            _count: { users: 0 },
        });
        mockPrisma.role.delete.mockResolvedValue({ id: "r1" });

        await deleteRole("r1");

        expect(mockPrisma.role.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
    });

    it("throws when deleting system role", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({
            id: "r1",
            isSystem: true,
            _count: { users: 0 },
        });

        await expect(deleteRole("r1")).rejects.toThrow("Cannot delete a system role");
    });

    it("throws when role has assigned users", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({
            id: "r1",
            isSystem: false,
            _count: { users: 3 },
        });

        await expect(deleteRole("r1")).rejects.toThrow("assigned user(s)");
    });

    it("throws when role not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);

        await expect(deleteRole("none")).rejects.toThrow("Role not found");
    });
});

// ─── setRoleFeatureFlag ──────────────────────────────────────

describe("setRoleFeatureFlag", () => {
    it("upserts role feature flag", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "r1" });
        mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: "f1" });
        mockPrisma.roleFeatureFlag.upsert.mockResolvedValue({ roleId: "r1", featureFlagId: "f1" });

        await setRoleFeatureFlag("r1", "f1", true);

        expect(mockPrisma.roleFeatureFlag.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { roleId_featureFlagId: { roleId: "r1", featureFlagId: "f1" } },
                update: { enabled: true },
                create: { roleId: "r1", featureFlagId: "f1", enabled: true },
            }),
        );
    });

    it("throws when role not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);

        await expect(setRoleFeatureFlag("none", "f1", true)).rejects.toThrow("Role not found");
    });

    it("throws when feature flag not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "r1" });
        mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

        await expect(setRoleFeatureFlag("r1", "none", true)).rejects.toThrow(
            "Feature flag not found",
        );
    });
});

// ─── removeRoleFeatureFlag ───────────────────────────────────

describe("removeRoleFeatureFlag", () => {
    it("deletes role feature flag", async () => {
        mockPrisma.roleFeatureFlag.delete.mockResolvedValue({});

        await removeRoleFeatureFlag("r1", "f1");

        expect(mockPrisma.roleFeatureFlag.delete).toHaveBeenCalled();
    });

    it("throws when not found", async () => {
        mockPrisma.roleFeatureFlag.delete.mockRejectedValue(new Error("not found"));

        await expect(removeRoleFeatureFlag("r1", "none")).rejects.toThrow();
    });
});

// ─── setRoleLimit ────────────────────────────────────────────

describe("setRoleLimit", () => {
    it("upserts limit with valid key", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "r1" });
        mockPrisma.roleLimit.upsert.mockResolvedValue({ roleId: "r1", key: "max_enclosures" });

        await setRoleLimit("r1", "max_enclosures", 10);

        expect(mockPrisma.roleLimit.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { roleId_key: { roleId: "r1", key: "max_enclosures" } },
                update: { value: 10 },
                create: { roleId: "r1", key: "max_enclosures", value: 10 },
            }),
        );
    });

    it("throws for invalid limit key", async () => {
        mockPrisma.role.findUnique.mockResolvedValue({ id: "r1" });

        await expect(setRoleLimit("r1", "invalid_key", 10)).rejects.toThrow("Invalid limit key");
    });

    it("throws when role not found", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);

        await expect(setRoleLimit("none", "max_enclosures", 5)).rejects.toThrow("Role not found");
    });
});

// ─── removeRoleLimit ─────────────────────────────────────────

describe("removeRoleLimit", () => {
    it("deletes role limit", async () => {
        mockPrisma.roleLimit.delete.mockResolvedValue({});

        await removeRoleLimit("r1", "max_enclosures");

        expect(mockPrisma.roleLimit.delete).toHaveBeenCalled();
    });

    it("throws when not found", async () => {
        mockPrisma.roleLimit.delete.mockRejectedValue(new Error("not found"));

        await expect(removeRoleLimit("r1", "invalid")).rejects.toThrow();
    });
});
