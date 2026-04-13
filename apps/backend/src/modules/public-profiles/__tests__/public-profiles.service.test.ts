import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
    publicProfile: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    pet: {
        findUnique: vi.fn(),
    },
    petPhoto: {
        findFirst: vi.fn(),
    },
}));

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const mockResolveUserFeatures = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        public_profiles: true,
        user_public_profiles: true,
    }),
);
vi.mock("@/modules/admin/feature-flags.service.js", () => ({
    resolveUserFeatures: mockResolveUserFeatures,
}));

import {
    getProfileByPetId,
    createProfile,
    updateProfile,
    deleteProfile,
    checkSlugAvailability,
    getPublicPetDataByUserSlug,
    getPublicPhoto,
} from "../public-profiles.service.js";

beforeEach(() => vi.clearAllMocks());

// ─── Helpers ─────────────────────────────────────────────

function makeProfile(overrides = {}) {
    return {
        id: "profile-1",
        petId: "pet-1",
        userId: "user-1",
        slug: "monty-python",
        active: true,
        bio: "A friendly corn snake",
        showPhotos: true,
        showWeight: true,
        showAge: true,
        showFeedings: true,
        showSheddings: true,
        showSpecies: true,
        showMorph: true,
        views: 42,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
        ...overrides,
    };
}

function makePet(overrides = {}) {
    return {
        id: "pet-1",
        userId: "user-1",
        name: "Monty",
        species: "Corn Snake",
        morph: "Amel",
        gender: "MALE",
        birthDate: new Date("2024-06-15"),
        acquisitionDate: new Date("2024-08-01"),
        notes: null,
        ...overrides,
    };
}

// ─── getProfileByPetId ──────────────────────────────────

describe("getProfileByPetId", () => {
    it("returns the profile when found and owned by user", async () => {
        const profile = makeProfile();
        mockPrisma.publicProfile.findUnique.mockResolvedValue(profile);

        const result = await getProfileByPetId("pet-1", "user-1");
        expect(result).toEqual(profile);
        expect(mockPrisma.publicProfile.findUnique).toHaveBeenCalledWith({
            where: { petId: "pet-1" },
        });
    });

    it("throws when profile not found", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(null);
        await expect(getProfileByPetId("pet-99", "user-1")).rejects.toThrow(
            "Public profile not found",
        );
    });

    it("throws when profile belongs to another user", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(
            makeProfile({ userId: "other-user" }),
        );
        await expect(getProfileByPetId("pet-1", "user-1")).rejects.toThrow("Not your profile");
    });
});

// ─── createProfile ──────────────────────────────────────

describe("createProfile", () => {
    it("creates a profile with auto-generated slug", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(makePet());
        mockPrisma.publicProfile.findUnique
            .mockResolvedValueOnce(null) // no existing profile for pet
            .mockResolvedValueOnce(null); // slug not taken
        mockPrisma.publicProfile.create.mockResolvedValue(makeProfile());

        const result = await createProfile("user-1", { petId: "pet-1" });
        expect(result).toEqual(makeProfile());
        expect(mockPrisma.publicProfile.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    petId: "pet-1",
                    userId: "user-1",
                }),
            }),
        );
    });

    it("creates a profile with a custom slug", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(makePet());
        mockPrisma.publicProfile.findUnique
            .mockResolvedValueOnce(null) // no existing profile
            .mockResolvedValueOnce(null); // custom slug not taken
        mockPrisma.publicProfile.create.mockResolvedValue(makeProfile({ slug: "my-monty" }));

        const result = await createProfile("user-1", {
            petId: "pet-1",
            customSlug: "my-monty",
        });
        expect(result.slug).toBe("my-monty");
    });

    it("throws when pet not found", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);
        await expect(createProfile("user-1", { petId: "pet-99" })).rejects.toThrow("Pet not found");
    });

    it("throws when pet belongs to another user", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(makePet({ userId: "other-user" }));
        await expect(createProfile("user-1", { petId: "pet-1" })).rejects.toThrow("Pet not found");
    });

    it("throws when profile already exists for pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(makePet());
        mockPrisma.publicProfile.findUnique.mockResolvedValue(makeProfile()); // profile exists
        await expect(createProfile("user-1", { petId: "pet-1" })).rejects.toThrow(
            "already has a public profile",
        );
    });

    it("throws when custom slug is already taken", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(makePet());
        mockPrisma.publicProfile.findUnique
            .mockResolvedValueOnce(null) // no existing profile for pet
            .mockResolvedValueOnce(makeProfile()); // slug taken
        await expect(
            createProfile("user-1", { petId: "pet-1", customSlug: "monty-python" }),
        ).rejects.toThrow("slug is already taken");
    });

    it("throws when custom slug is too short", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(makePet());
        mockPrisma.publicProfile.findUnique.mockResolvedValueOnce(null);
        await expect(createProfile("user-1", { petId: "pet-1", customSlug: "ab" })).rejects.toThrow(
            "at least 3 characters",
        );
    });

    it("throws when custom slug has invalid characters", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(makePet());
        mockPrisma.publicProfile.findUnique.mockResolvedValueOnce(null);
        await expect(
            createProfile("user-1", { petId: "pet-1", customSlug: "My Snake!" }),
        ).rejects.toThrow("lowercase letters");
    });
});

// ─── updateProfile ──────────────────────────────────────

describe("updateProfile", () => {
    it("updates profile settings", async () => {
        const profile = makeProfile();
        mockPrisma.publicProfile.findUnique.mockResolvedValue(profile);
        mockPrisma.publicProfile.update.mockResolvedValue({ ...profile, active: false });

        const result = await updateProfile("pet-1", "user-1", { active: false });
        expect(result.active).toBe(false);
        expect(mockPrisma.publicProfile.update).toHaveBeenCalledWith({
            where: { petId: "pet-1" },
            data: { active: false },
        });
    });

    it("updates slug when new slug is available", async () => {
        const profile = makeProfile();
        mockPrisma.publicProfile.findUnique
            .mockResolvedValueOnce(profile) // existing profile
            .mockResolvedValueOnce(null); // new slug not taken
        mockPrisma.publicProfile.update.mockResolvedValue({ ...profile, slug: "new-slug" });

        const result = await updateProfile("pet-1", "user-1", { slug: "new-slug" });
        expect(result.slug).toBe("new-slug");
    });

    it("throws when profile not found", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(null);
        await expect(updateProfile("pet-99", "user-1", { active: false })).rejects.toThrow(
            "Public profile not found",
        );
    });

    it("throws when not the owner", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(makeProfile({ userId: "other" }));
        await expect(updateProfile("pet-1", "user-1", { active: false })).rejects.toThrow(
            "Public profile not found",
        );
    });

    it("throws when new slug is taken", async () => {
        const profile = makeProfile();
        mockPrisma.publicProfile.findUnique
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce(makeProfile({ slug: "taken-slug" })); // slug taken
        await expect(updateProfile("pet-1", "user-1", { slug: "taken-slug" })).rejects.toThrow(
            "slug is already taken",
        );
    });

    it("skips slug check when slug is unchanged", async () => {
        const profile = makeProfile({ slug: "monty-python" });
        mockPrisma.publicProfile.findUnique.mockResolvedValue(profile);
        mockPrisma.publicProfile.update.mockResolvedValue({ ...profile, bio: "Updated" });

        await updateProfile("pet-1", "user-1", { slug: "monty-python", bio: "Updated" });

        // Should only call findUnique once (for the profile itself), not for slug check
        expect(mockPrisma.publicProfile.findUnique).toHaveBeenCalledTimes(1);
    });

    it("updates multiple visibility toggles at once", async () => {
        const profile = makeProfile();
        mockPrisma.publicProfile.findUnique.mockResolvedValue(profile);
        mockPrisma.publicProfile.update.mockResolvedValue({
            ...profile,
            showPhotos: false,
            showWeight: false,
        });

        const result = await updateProfile("pet-1", "user-1", {
            showPhotos: false,
            showWeight: false,
        });
        expect(result.showPhotos).toBe(false);
        expect(result.showWeight).toBe(false);
    });
});

// ─── deleteProfile ──────────────────────────────────────

describe("deleteProfile", () => {
    it("deletes the profile", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(makeProfile());
        mockPrisma.publicProfile.delete.mockResolvedValue(makeProfile());

        await deleteProfile("pet-1", "user-1");
        expect(mockPrisma.publicProfile.delete).toHaveBeenCalledWith({
            where: { petId: "pet-1" },
        });
    });

    it("throws when profile not found", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(null);
        await expect(deleteProfile("pet-99", "user-1")).rejects.toThrow("Public profile not found");
    });

    it("throws when not the owner", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(makeProfile({ userId: "other" }));
        await expect(deleteProfile("pet-1", "user-1")).rejects.toThrow("Public profile not found");
    });
});

// ─── checkSlugAvailability ──────────────────────────────

describe("checkSlugAvailability", () => {
    it("returns available when slug is free", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(null);

        const result = await checkSlugAvailability("fresh-slug", "user-1");
        expect(result).toEqual({ available: true });
    });

    it("returns not available when slug is taken", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(makeProfile());

        const result = await checkSlugAvailability("monty-python", "user-1");
        expect(result).toEqual({ available: false });
    });

    it("returns not available with reason for invalid slug", async () => {
        const result = await checkSlugAvailability("ab", "user-1");
        expect(result.available).toBe(false);
        expect(result.reason).toContain("at least 3");
    });

    it("returns not available for slug with invalid chars", async () => {
        const result = await checkSlugAvailability("Hello World!", "user-1");
        expect(result.available).toBe(false);
        expect(result.reason).toContain("lowercase");
    });

    it("returns not available for slug with consecutive hyphens", async () => {
        const result = await checkSlugAvailability("my--slug", "user-1");
        expect(result.available).toBe(false);
        expect(result.reason).toContain("consecutive");
    });
});

// ─── getPublicPetDataByUserSlug ──────────────────────────

describe("getPublicPetDataByUserSlug", () => {
    function makeFullProfile() {
        return {
            ...makeProfile(),
            pet: {
                ...makePet(),
                photos: [
                    {
                        id: "photo-1",
                        isProfilePicture: true,
                        sortOrder: 0,
                        caption: "Profile pic",
                        tags: ["cute"],
                        takenAt: new Date("2025-06-01"),
                        upload: {
                            id: "upload-1",
                            url: "/uploads/photo1.jpg",
                            originalName: "photo.jpg",
                        },
                    },
                ],
                feedings: [
                    {
                        feedItem: { name: "Mouse" },
                        foodType: "MOUSE",
                        foodSize: "adult",
                        quantity: 1,
                        accepted: true,
                        fedAt: new Date("2025-12-01"),
                        notes: null,
                    },
                ],
                sheddings: [
                    {
                        startedAt: new Date("2025-11-01"),
                        completedAt: new Date("2025-11-05"),
                        complete: true,
                        quality: "complete",
                        notes: null,
                    },
                ],
                weightRecords: [
                    {
                        weightGrams: 350,
                        measuredAt: new Date("2025-12-01"),
                    },
                ],
            },
        };
    }

    it("returns assembled public data for an active profile", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(makeFullProfile());
        mockPrisma.publicProfile.update.mockResolvedValue({}); // view counter

        const result = await getPublicPetDataByUserSlug("user-1", "monty-python");

        expect(result.name).toBe("Monty");
        expect(result.species).toBe("Corn Snake");
        expect(result.morph).toBe("Amel");
        expect(result.birthDate).toBeTruthy();
        expect(result.photos).toHaveLength(1);
        expect(result.feedings).toHaveLength(1);
        expect(result.sheddings).toHaveLength(1);
        expect(result.weightRecords).toHaveLength(1);
        expect(result.profilePhotoId).toBe("photo-1");
        expect(result.slug).toBe("monty-python");
    });

    it("hides fields based on visibility toggles", async () => {
        const profile = makeFullProfile();
        profile.showPhotos = false;
        profile.showWeight = false;
        profile.showAge = false;
        profile.showSpecies = false;
        profile.showMorph = false;
        profile.showFeedings = false;
        profile.showSheddings = false;
        mockPrisma.publicProfile.findUnique.mockResolvedValue(profile);
        mockPrisma.publicProfile.update.mockResolvedValue({});

        const result = await getPublicPetDataByUserSlug("user-1", "monty-python");

        expect(result.photos).toEqual([]);
        expect(result.weightRecords).toEqual([]);
        expect(result.birthDate).toBeNull();
        expect(result.species).toBeNull();
        expect(result.morph).toBeNull();
        expect(result.feedings).toEqual([]);
        expect(result.sheddings).toEqual([]);
    });

    it("throws when profile not found", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(null);
        await expect(getPublicPetDataByUserSlug("user-1", "nope")).rejects.toThrow(
            "Profile not found",
        );
    });

    it("throws when profile is inactive", async () => {
        const profile = makeFullProfile();
        profile.active = false;
        mockPrisma.publicProfile.findUnique.mockResolvedValue(profile);
        await expect(getPublicPetDataByUserSlug("user-1", "monty-python")).rejects.toThrow(
            "Profile not found",
        );
    });

    it("increments view counter", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(makeFullProfile());
        mockPrisma.publicProfile.update.mockResolvedValue({});

        await getPublicPetDataByUserSlug("user-1", "monty-python");

        expect(mockPrisma.publicProfile.update).toHaveBeenCalledWith({
            where: { id: "profile-1" },
            data: { views: { increment: 1 } },
        });
    });

    it("returns null profilePhotoId when no photos exist", async () => {
        const profile = makeFullProfile();
        profile.pet.photos = [];
        mockPrisma.publicProfile.findUnique.mockResolvedValue(profile);
        mockPrisma.publicProfile.update.mockResolvedValue({});

        const result = await getPublicPetDataByUserSlug("user-1", "monty-python");
        expect(result.profilePhotoId).toBeNull();
    });
});

// ─── getPublicPhoto ─────────────────────────────────────

describe("getPublicPhoto", () => {
    it("returns upload data for a valid public photo", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue({
            active: true,
            showPhotos: true,
            petId: "pet-1",
        });
        const upload = { id: "upload-1", url: "/uploads/photo1.jpg", originalName: "photo1.jpg" };
        mockPrisma.petPhoto.findFirst.mockResolvedValue({
            id: "photo-1",
            petId: "pet-1",
            upload,
        });

        const result = await getPublicPhoto("user-1", "monty-python", "photo-1");
        expect(result).toEqual(upload);
    });

    it("throws when profile is not active", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue({
            active: false,
            showPhotos: true,
            petId: "pet-1",
        });
        await expect(getPublicPhoto("user-1", "monty-python", "photo-1")).rejects.toThrow(
            "Profile not found",
        );
    });

    it("throws when showPhotos is disabled", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue({
            active: true,
            showPhotos: false,
            petId: "pet-1",
        });
        await expect(getPublicPhoto("user-1", "monty-python", "photo-1")).rejects.toThrow(
            "Profile not found",
        );
    });

    it("throws when profile not found", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(null);
        await expect(getPublicPhoto("user-1", "nope", "photo-1")).rejects.toThrow(
            "Profile not found",
        );
    });

    it("throws when photo not found", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue({
            active: true,
            showPhotos: true,
            petId: "pet-1",
        });
        mockPrisma.petPhoto.findFirst.mockResolvedValue(null);
        await expect(getPublicPhoto("user-1", "monty-python", "photo-99")).rejects.toThrow(
            "Photo not found",
        );
    });
});

// ─── Feature Flag Enforcement ────────────────────────────

describe("feature flag enforcement", () => {
    it("getPublicPetDataByUserSlug throws when public_profiles is disabled", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue(makeProfile());
        mockResolveUserFeatures.mockResolvedValueOnce({ public_profiles: false });

        await expect(getPublicPetDataByUserSlug("user-1", "monty-python")).rejects.toThrow(
            "Profile not found",
        );
    });

    it("getPublicPhoto throws when public_profiles is disabled", async () => {
        mockPrisma.publicProfile.findUnique.mockResolvedValue({
            active: true,
            showPhotos: true,
            petId: "pet-1",
        });
        mockResolveUserFeatures.mockResolvedValueOnce({ public_profiles: false });

        await expect(getPublicPhoto("user-1", "monty-python", "photo-1")).rejects.toThrow(
            "Profile not found",
        );
    });
});
