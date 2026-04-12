import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma Mock ─────────────────────────────────────────────

const mockPrisma = {
    userPublicProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    userSocialLink: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
        findMany: vi.fn(),
    },
    userPetOrder: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
        findMany: vi.fn(),
    },
    pet: {
        findMany: vi.fn(),
        count: vi.fn(),
    },
    petPhoto: {
        count: vi.fn(),
    },
    feeding: {
        count: vi.fn(),
    },
    weightRecord: {
        count: vi.fn(),
    },
    userBadge: {
        findMany: vi.fn(),
    },
    publicProfile: {
        findMany: vi.fn(),
    },
    upload: {
        findUnique: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const {
    validateSlug,
    getOwnProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    setAvatar,
    removeAvatar,
    setSocialLinks,
    setPetOrder,
    checkSlugAvailability,
    getPublicUserData,
    getPublicUserAvatar,
    resolveUserForPetProfile,
} = await import("../user-public-profiles.service.js");

const USER_ID = "user_123";
const PROFILE_ID = "profile_001";

function makeProfile(overrides: Record<string, unknown> = {}) {
    return {
        id: PROFILE_ID,
        userId: USER_ID,
        slug: "testkeeper",
        active: true,
        bio: "Test bio",
        tagline: "Test tagline",
        location: "Berlin",
        keeperSince: new Date("2020-01-01"),
        avatarUploadId: null,
        showStats: true,
        showPets: true,
        showSocialLinks: true,
        showLocation: true,
        showKeeperSince: true,
        showBadges: true,
        themePreset: "default",
        views: 42,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-06-01"),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── Slug Validation ─────────────────────────────────────────

describe("validateSlug", () => {
    it("accepts a valid slug", () => {
        expect(validateSlug("my-keeper")).toBeNull();
    });

    it("rejects slugs shorter than 3 characters", () => {
        expect(validateSlug("ab")).toContain("at least 3");
    });

    it("rejects slugs with uppercase characters", () => {
        expect(validateSlug("MyKeeper")).not.toBeNull();
    });

    it("rejects slugs with consecutive hyphens", () => {
        expect(validateSlug("my--keeper")).toContain("consecutive");
    });

    it("rejects slugs starting with a hyphen", () => {
        expect(validateSlug("-invalid")).not.toBeNull();
    });

    it("accepts a 3-character slug", () => {
        expect(validateSlug("abc")).toBeNull();
    });
});

// ─── getOwnProfile ──────────────────────────────────────────

describe("getOwnProfile", () => {
    it("returns null when no profile exists", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        const result = await getOwnProfile(USER_ID);
        expect(result).toBeNull();
    });

    it("returns profile with pet order mapped", async () => {
        const profile = makeProfile({
            socialLinks: [],
            petOrder: [
                {
                    petId: "pet_1",
                    sortOrder: 0,
                    pet: {
                        id: "pet_1",
                        name: "Monty",
                        publicProfile: { id: "pp_1" },
                    },
                },
            ],
        });
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(profile);

        const result = await getOwnProfile(USER_ID);
        expect(result).not.toBeNull();
        expect(result!.petOrder[0]).toEqual({
            petId: "pet_1",
            petName: "Monty",
            hasPublicProfile: true,
            sortOrder: 0,
        });
    });
});

// ─── createProfile ───────────────────────────────────────────

describe("createProfile", () => {
    it("creates a profile with auto-generated slug", async () => {
        mockPrisma.userPublicProfile.findUnique
            .mockResolvedValueOnce(null) // no existing profile
            .mockResolvedValueOnce(null); // slug "testuser" not taken

        const created = makeProfile({ slug: "testuser" });
        mockPrisma.userPublicProfile.create.mockResolvedValue(created);

        const result = await createProfile(USER_ID, "testuser", {});
        expect(result.slug).toBe("testuser");
        expect(mockPrisma.userPublicProfile.create).toHaveBeenCalledOnce();
    });

    it("throws when profile already exists", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());

        await expect(createProfile(USER_ID, "testuser", {})).rejects.toThrow(
            "You already have a public profile",
        );
    });

    it("throws when custom slug is taken", async () => {
        mockPrisma.userPublicProfile.findUnique
            .mockResolvedValueOnce(null) // no existing profile
            .mockResolvedValueOnce(makeProfile()); // slug taken

        await expect(createProfile(USER_ID, "testuser", { slug: "testkeeper" })).rejects.toThrow(
            "slug is already taken",
        );
    });

    it("throws when custom slug is invalid", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValueOnce(null);

        await expect(createProfile(USER_ID, "testuser", { slug: "AB" })).rejects.toThrow();
    });
});

// ─── updateProfile ───────────────────────────────────────────

describe("updateProfile", () => {
    it("updates profile fields", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.userPublicProfile.update.mockResolvedValue(makeProfile({ bio: "New bio" }));

        const result = await updateProfile(USER_ID, { bio: "New bio" });
        expect(result.bio).toBe("New bio");
    });

    it("throws when profile not found", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        await expect(updateProfile(USER_ID, { bio: "test" })).rejects.toThrow("not found");
    });

    it("validates new slug uniqueness", async () => {
        mockPrisma.userPublicProfile.findUnique
            .mockResolvedValueOnce(makeProfile()) // own profile
            .mockResolvedValueOnce(makeProfile({ userId: "other" })); // slug taken

        await expect(updateProfile(USER_ID, { slug: "other-slug" })).rejects.toThrow(
            "slug is already taken",
        );
    });

    it("converts keeperSince string to Date", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.userPublicProfile.update.mockResolvedValue(makeProfile());

        await updateProfile(USER_ID, { keeperSince: "2020-06-15" });

        const updateCall = mockPrisma.userPublicProfile.update.mock.calls[0][0];
        expect(updateCall.data.keeperSince).toBeInstanceOf(Date);
    });
});

// ─── deleteProfile ───────────────────────────────────────────

describe("deleteProfile", () => {
    it("deletes existing profile", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.userPublicProfile.delete.mockResolvedValue(makeProfile());

        await expect(deleteProfile(USER_ID)).resolves.not.toThrow();
        expect(mockPrisma.userPublicProfile.delete).toHaveBeenCalledWith({
            where: { userId: USER_ID },
        });
    });

    it("throws when profile not found", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        await expect(deleteProfile(USER_ID)).rejects.toThrow("not found");
    });
});

// ─── setAvatar / removeAvatar ────────────────────────────────

describe("setAvatar", () => {
    it("sets avatar upload ID", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.userPublicProfile.update.mockResolvedValue(
            makeProfile({ avatarUploadId: "upload_1" }),
        );

        const result = await setAvatar(USER_ID, "upload_1");
        expect(result.avatarUploadId).toBe("upload_1");
    });

    it("throws when profile not found", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        await expect(setAvatar(USER_ID, "upload_1")).rejects.toThrow("not found");
    });
});

describe("removeAvatar", () => {
    it("clears avatar upload ID", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(
            makeProfile({ avatarUploadId: "upload_1" }),
        );
        mockPrisma.userPublicProfile.update.mockResolvedValue(
            makeProfile({ avatarUploadId: null }),
        );

        await expect(removeAvatar(USER_ID)).resolves.not.toThrow();
        const callData = mockPrisma.userPublicProfile.update.mock.calls[0][0].data;
        expect(callData.avatarUploadId).toBeNull();
    });
});

// ─── setSocialLinks ──────────────────────────────────────────

describe("setSocialLinks", () => {
    it("replaces all social links", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.userSocialLink.deleteMany.mockResolvedValue({ count: 0 });
        mockPrisma.userSocialLink.createMany.mockResolvedValue({ count: 2 });
        mockPrisma.userSocialLink.findMany.mockResolvedValue([
            { id: "sl_1", platform: "instagram", url: "https://instagram.com/test" },
        ]);

        const result = await setSocialLinks(USER_ID, [
            { platform: "instagram" as const, url: "https://instagram.com/test" },
        ]);

        expect(mockPrisma.userSocialLink.deleteMany).toHaveBeenCalledOnce();
        expect(result).toHaveLength(1);
    });

    it("throws when profile not found", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        await expect(
            setSocialLinks(USER_ID, [
                { platform: "instagram" as const, url: "https://example.com" },
            ]),
        ).rejects.toThrow("not found");
    });

    it("returns empty array for empty links", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.userSocialLink.deleteMany.mockResolvedValue({ count: 0 });

        const result = await setSocialLinks(USER_ID, []);
        expect(result).toEqual([]);
        expect(mockPrisma.userSocialLink.createMany).not.toHaveBeenCalled();
    });
});

// ─── setPetOrder ─────────────────────────────────────────────

describe("setPetOrder", () => {
    it("replaces pet order after verifying ownership", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.pet.findMany.mockResolvedValue([{ id: "pet_1" }, { id: "pet_2" }]);
        mockPrisma.userPetOrder.deleteMany.mockResolvedValue({ count: 0 });
        mockPrisma.userPetOrder.createMany.mockResolvedValue({ count: 2 });
        mockPrisma.userPetOrder.findMany.mockResolvedValue([]);

        const result = await setPetOrder(USER_ID, [
            { petId: "pet_1", sortOrder: 0 },
            { petId: "pet_2", sortOrder: 1 },
        ]);

        expect(mockPrisma.pet.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: { in: ["pet_1", "pet_2"] }, userId: USER_ID },
            }),
        );
    });

    it("throws when pet IDs don't belong to user", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.pet.findMany.mockResolvedValue([{ id: "pet_1" }]); // pet_2 not returned

        await expect(
            setPetOrder(USER_ID, [
                { petId: "pet_1", sortOrder: 0 },
                { petId: "pet_2", sortOrder: 1 },
            ]),
        ).rejects.toThrow("Invalid pet IDs");
    });
});

// ─── checkSlugAvailability ───────────────────────────────────

describe("checkSlugAvailability", () => {
    it("returns available for unused slug", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        const result = await checkSlugAvailability("new-slug");
        expect(result.available).toBe(true);
    });

    it("returns unavailable for taken slug", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(makeProfile());

        const result = await checkSlugAvailability("testkeeper");
        expect(result.available).toBe(false);
    });

    it("returns unavailable with reason for invalid slug", async () => {
        const result = await checkSlugAvailability("ab");
        expect(result.available).toBe(false);
        expect(result).toHaveProperty("reason");
    });
});

// ─── getPublicUserData ───────────────────────────────────────

describe("getPublicUserData", () => {
    it("throws when profile not found", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        await expect(getPublicUserData("nonexistent")).rejects.toThrow("not found");
    });

    it("throws when profile is inactive", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(
            makeProfile({
                active: false,
                user: { id: USER_ID, username: "test", displayName: "Test" },
                socialLinks: [],
                petOrder: [],
            }),
        );

        await expect(getPublicUserData("testkeeper")).rejects.toThrow("not found");
    });

    it("returns public data with stats when showStats=true", async () => {
        const profile = makeProfile({
            user: { id: USER_ID, username: "test", displayName: "Test User" },
            socialLinks: [
                { platform: "instagram", url: "https://instagram.com/test", label: null },
            ],
            petOrder: [],
        });
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(profile);
        mockPrisma.userPublicProfile.update.mockResolvedValue(profile); // views increment
        mockPrisma.pet.count.mockResolvedValue(3);
        mockPrisma.petPhoto.count.mockResolvedValue(10);
        mockPrisma.feeding.count.mockResolvedValue(50);
        mockPrisma.weightRecord.count.mockResolvedValue(15);
        mockPrisma.userBadge.findMany.mockResolvedValue([]);

        const result = await getPublicUserData("testkeeper");

        expect(result.displayName).toBe("Test User");
        expect(result.stats).not.toBeNull();
        expect(result.stats!.petCount).toBe(3);
        expect(result.socialLinks).toHaveLength(1);
    });

    it("hides location when showLocation=false", async () => {
        const profile = makeProfile({
            showLocation: false,
            user: { id: USER_ID, username: "test", displayName: "Test" },
            socialLinks: [],
            petOrder: [],
        });
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(profile);
        mockPrisma.userPublicProfile.update.mockResolvedValue(profile);
        mockPrisma.userBadge.findMany.mockResolvedValue([]);

        const result = await getPublicUserData("testkeeper");
        expect(result.location).toBeNull();
    });
});

// ─── getPublicUserAvatar ─────────────────────────────────────

describe("getPublicUserAvatar", () => {
    it("throws when profile inactive", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            active: false,
            avatarUploadId: "upload_1",
        });

        await expect(getPublicUserAvatar("testkeeper")).rejects.toThrow("not found");
    });

    it("throws when no avatar set", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            active: true,
            avatarUploadId: null,
        });

        await expect(getPublicUserAvatar("testkeeper")).rejects.toThrow("not found");
    });

    it("returns upload record when avatar exists", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            active: true,
            avatarUploadId: "upload_1",
        });
        mockPrisma.upload.findUnique.mockResolvedValue({
            id: "upload_1",
            url: "/uploads/avatars/test.jpg",
        });

        const result = await getPublicUserAvatar("testkeeper");
        expect(result.id).toBe("upload_1");
    });
});

// ─── resolveUserForPetProfile ────────────────────────────────

describe("resolveUserForPetProfile", () => {
    it("returns user when found by username", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID, username: "testuser" });

        const result = await resolveUserForPetProfile("testuser");
        expect(result.id).toBe(USER_ID);
    });

    it("throws when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(resolveUserForPetProfile("nonexistent")).rejects.toThrow("not found");
    });
});
