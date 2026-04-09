import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    featureFlag: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    userRole: { findMany: vi.fn() },
    userFeatureFlag: { findMany: vi.fn() },
    userLimitOverride: { findMany: vi.fn() },
    role: { findMany: vi.fn() },
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
    listFeatureFlags,
    createFeatureFlag,
    updateFeatureFlag,
    toggleFeatureFlag,
    deleteFeatureFlag,
    resolveUserFeatures,
    getEnabledFeatureKeys,
    getFeatureTiers,
    resolveUserLimits,
} = await import("../feature-flags.service.js");

// ─── Helpers ─────────────────────────────────────────────────

const USER_ID = "user_123";

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listFeatureFlags ────────────────────────────────────────

describe("listFeatureFlags", () => {
    it("returns all feature flags with includes", async () => {
        const flags = [{ id: "f1", key: "analytics", enabled: true }];
        mockPrisma.featureFlag.findMany.mockResolvedValue(flags);

        const result = await listFeatureFlags();

        expect(result).toEqual(flags);
        expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: [{ category: "asc" }, { key: "asc" }],
            }),
        );
    });
});

// ─── createFeatureFlag ───────────────────────────────────────

describe("createFeatureFlag", () => {
    it("creates flag with normalized key", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue(null);
        mockPrisma.featureFlag.create.mockResolvedValue({ id: "f1", key: "my_flag" });

        const result = await createFeatureFlag({
            key: "My Flag",
            name: "My Feature Flag",
        });

        expect(result.key).toBe("my_flag");
        expect(mockPrisma.featureFlag.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    key: "my_flag",
                    name: "My Feature Flag",
                    category: "general",
                    enabled: true,
                }),
            }),
        );
    });

    it("throws when key already exists", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: "existing" });

        await expect(createFeatureFlag({ key: "existing", name: "Duplicate" })).rejects.toThrow(
            "already exists",
        );
    });
});

// ─── updateFeatureFlag ───────────────────────────────────────

describe("updateFeatureFlag", () => {
    it("updates an existing flag", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: "f1" });
        mockPrisma.featureFlag.update.mockResolvedValue({ id: "f1", name: "Updated" });

        const result = await updateFeatureFlag("f1", { name: "Updated" });

        expect(result.name).toBe("Updated");
    });

    it("throws when flag not found", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

        await expect(updateFeatureFlag("none", { name: "X" })).rejects.toThrow("not found");
    });
});

// ─── toggleFeatureFlag ───────────────────────────────────────

describe("toggleFeatureFlag", () => {
    it("toggles enabled to disabled", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: "f1", enabled: true });
        mockPrisma.featureFlag.update.mockResolvedValue({ id: "f1", enabled: false });

        await toggleFeatureFlag("f1");

        expect(mockPrisma.featureFlag.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { enabled: false } }),
        );
    });

    it("toggles disabled to enabled", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: "f1", enabled: false });
        mockPrisma.featureFlag.update.mockResolvedValue({ id: "f1", enabled: true });

        await toggleFeatureFlag("f1");

        expect(mockPrisma.featureFlag.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { enabled: true } }),
        );
    });

    it("throws when flag not found", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

        await expect(toggleFeatureFlag("none")).rejects.toThrow("not found");
    });
});

// ─── deleteFeatureFlag ───────────────────────────────────────

describe("deleteFeatureFlag", () => {
    it("deletes an existing flag", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: "f1" });
        mockPrisma.featureFlag.delete.mockResolvedValue({ id: "f1" });

        await deleteFeatureFlag("f1");

        expect(mockPrisma.featureFlag.delete).toHaveBeenCalledWith({ where: { id: "f1" } });
    });

    it("throws when flag not found", async () => {
        mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

        await expect(deleteFeatureFlag("none")).rejects.toThrow("not found");
    });
});

// ─── resolveUserFeatures ─────────────────────────────────────

describe("resolveUserFeatures", () => {
    it("returns false for globally disabled flags", async () => {
        mockPrisma.featureFlag.findMany.mockResolvedValue([
            { id: "f1", key: "analytics", enabled: false },
        ]);
        mockPrisma.userRole.findMany.mockResolvedValue([]);
        mockPrisma.userFeatureFlag.findMany.mockResolvedValue([]);

        const result = await resolveUserFeatures(USER_ID);

        expect(result.analytics).toBe(false);
    });

    it("user override wins over role flags", async () => {
        mockPrisma.featureFlag.findMany.mockResolvedValue([
            { id: "f1", key: "analytics", enabled: true },
        ]);
        mockPrisma.userRole.findMany.mockResolvedValue([
            {
                role: {
                    featureFlags: [{ featureFlagId: "f1", enabled: true }],
                },
            },
        ]);
        mockPrisma.userFeatureFlag.findMany.mockResolvedValue([
            { featureFlagId: "f1", enabled: false },
        ]);

        const result = await resolveUserFeatures(USER_ID);

        expect(result.analytics).toBe(false);
    });

    it("role flag grants access when no user override", async () => {
        mockPrisma.featureFlag.findMany.mockResolvedValue([
            { id: "f1", key: "analytics", enabled: true },
        ]);
        mockPrisma.userRole.findMany.mockResolvedValue([
            {
                role: {
                    featureFlags: [{ featureFlagId: "f1", enabled: true }],
                },
            },
        ]);
        mockPrisma.userFeatureFlag.findMany.mockResolvedValue([]);

        const result = await resolveUserFeatures(USER_ID);

        expect(result.analytics).toBe(true);
    });

    it("returns false when no role grants and no override", async () => {
        mockPrisma.featureFlag.findMany.mockResolvedValue([
            { id: "f1", key: "analytics", enabled: true },
        ]);
        mockPrisma.userRole.findMany.mockResolvedValue([{ role: { featureFlags: [] } }]);
        mockPrisma.userFeatureFlag.findMany.mockResolvedValue([]);

        const result = await resolveUserFeatures(USER_ID);

        expect(result.analytics).toBe(false);
    });
});

// ─── getEnabledFeatureKeys ───────────────────────────────────

describe("getEnabledFeatureKeys", () => {
    it("returns keys of enabled flags", async () => {
        mockPrisma.featureFlag.findMany.mockResolvedValue([
            { key: "analytics" },
            { key: "import" },
        ]);

        const result = await getEnabledFeatureKeys();

        expect(result).toEqual(["analytics", "import"]);
    });
});

// ─── getFeatureTiers ─────────────────────────────────────────

describe("getFeatureTiers", () => {
    it("returns roles that grant features user lacks", async () => {
        mockPrisma.role.findMany.mockResolvedValue([
            {
                name: "PREMIUM",
                displayName: "Premium",
                color: "#FFD700",
                priority: 10,
                featureFlags: [{ enabled: true, featureFlag: { key: "analytics", enabled: true } }],
            },
        ]);

        const result = await getFeatureTiers(USER_ID, { analytics: false });

        expect(result.analytics).toHaveLength(1);
        expect(result.analytics[0].role).toBe("PREMIUM");
    });

    it("skips features user already has", async () => {
        mockPrisma.role.findMany.mockResolvedValue([]);

        const result = await getFeatureTiers(USER_ID, { analytics: true });

        expect(result.analytics).toBeUndefined();
    });
});

// ─── resolveUserLimits ───────────────────────────────────────

describe("resolveUserLimits", () => {
    it("merges role limits taking highest value", async () => {
        mockPrisma.userRole.findMany.mockResolvedValue([
            { role: { limits: [{ key: "max_enclosures", value: 5 }] } },
            { role: { limits: [{ key: "max_enclosures", value: 10 }] } },
        ]);
        mockPrisma.userLimitOverride.findMany.mockResolvedValue([]);

        const result = await resolveUserLimits(USER_ID);

        expect(result.max_enclosures).toBe(10);
    });

    it("unlimited (-1) always wins", async () => {
        mockPrisma.userRole.findMany.mockResolvedValue([
            { role: { limits: [{ key: "max_enclosures", value: -1 }] } },
            { role: { limits: [{ key: "max_enclosures", value: 100 }] } },
        ]);
        mockPrisma.userLimitOverride.findMany.mockResolvedValue([]);

        const result = await resolveUserLimits(USER_ID);

        expect(result.max_enclosures).toBe(-1);
    });

    it("user override wins over role limits", async () => {
        mockPrisma.userRole.findMany.mockResolvedValue([
            { role: { limits: [{ key: "max_enclosures", value: 10 }] } },
        ]);
        mockPrisma.userLimitOverride.findMany.mockResolvedValue([
            { key: "max_enclosures", value: 50 },
        ]);

        const result = await resolveUserLimits(USER_ID);

        expect(result.max_enclosures).toBe(50);
    });

    it("returns empty when no roles or overrides", async () => {
        mockPrisma.userRole.findMany.mockResolvedValue([]);
        mockPrisma.userLimitOverride.findMany.mockResolvedValue([]);

        const result = await resolveUserLimits(USER_ID);

        expect(result).toEqual({});
    });
});
