import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    userPublicProfile: {
        findUnique: vi.fn(),
    },
    publicProfile: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
    },
    profileLike: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    profileComment: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

const mockResolveUserFeatures = vi.fn().mockResolvedValue({
    public_profiles: true,
    user_public_profiles: true,
});
vi.mock("@/modules/admin/feature-flags.service.js", () => ({
    resolveUserFeatures: mockResolveUserFeatures,
}));

const {
    toggleLike,
    getLikeStatus,
    addComment,
    getApprovedComments,
    deleteOwnComment,
    getPendingComments,
    moderateComment,
    deleteApprovedComment,
    adminDeleteComment,
    adminListComments,
    getApprovedCommentsForOwner,
} = await import("../community.service.js");

const PROFILE_ID = "profile_001";
const USER_ID = "user_123";
const SLUG = "testkeeper";
const IP = "192.168.1.1";

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── toggleLike ──────────────────────────────────────────────

describe("toggleLike", () => {
    it("creates a like when none exists", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockPrisma.profileLike.findUnique.mockResolvedValue(null);
        mockPrisma.profileLike.create.mockResolvedValue({});
        mockPrisma.profileLike.count.mockResolvedValue(1);

        const result = await toggleLike("user", SLUG, IP);

        expect(result.liked).toBe(true);
        expect(result.count).toBe(1);
        expect(mockPrisma.profileLike.create).toHaveBeenCalledOnce();
    });

    it("removes a like when one already exists", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockPrisma.profileLike.findUnique.mockResolvedValue({ id: "like_1" });
        mockPrisma.profileLike.delete.mockResolvedValue({});
        mockPrisma.profileLike.count.mockResolvedValue(0);

        const result = await toggleLike("user", SLUG, IP);

        expect(result.liked).toBe(false);
        expect(result.count).toBe(0);
        expect(mockPrisma.profileLike.delete).toHaveBeenCalledOnce();
    });

    it("throws when profile not found", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        await expect(toggleLike("user", "nonexistent", IP)).rejects.toThrow("not found");
    });

    it("throws when profile is inactive", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: false,
        });

        await expect(toggleLike("user", SLUG, IP)).rejects.toThrow("not found");
    });

    it("works with pet profiles when userSlug is provided", async () => {
        mockPrisma.publicProfile.findFirst.mockResolvedValue({
            id: "pet_profile_1",
            active: true,
            userId: USER_ID,
        });
        mockPrisma.profileLike.findUnique.mockResolvedValue(null);
        mockPrisma.profileLike.create.mockResolvedValue({});
        mockPrisma.profileLike.count.mockResolvedValue(1);

        const result = await toggleLike("pet", "pet-slug", IP, "keeper-slug");
        expect(result.liked).toBe(true);
        expect(mockPrisma.publicProfile.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    slug: "pet-slug",
                    user: { userPublicProfile: { slug: "keeper-slug" } },
                }),
            }),
        );
    });

    it("throws when pet profile is requested without userSlug", async () => {
        await expect(toggleLike("pet", "pet-slug", IP)).rejects.toThrow("User slug required");
    });
});

// ─── getLikeStatus ───────────────────────────────────────────

describe("getLikeStatus", () => {
    it("returns liked=true when like exists", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockPrisma.profileLike.findUnique.mockResolvedValue({ id: "like_1" });
        mockPrisma.profileLike.count.mockResolvedValue(5);

        const result = await getLikeStatus("user", SLUG, IP);
        expect(result.liked).toBe(true);
        expect(result.count).toBe(5);
    });

    it("returns liked=false when no like exists", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockPrisma.profileLike.findUnique.mockResolvedValue(null);
        mockPrisma.profileLike.count.mockResolvedValue(3);

        const result = await getLikeStatus("user", SLUG, IP);
        expect(result.liked).toBe(false);
        expect(result.count).toBe(3);
    });
});

// ─── addComment ──────────────────────────────────────────────

describe("addComment", () => {
    it("creates a comment with approved=true", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockPrisma.profileComment.findFirst.mockResolvedValue(null); // no recent comment
        mockPrisma.profileComment.create.mockResolvedValue({
            id: "comment_1",
            authorName: "Visitor",
            content: "Nice profile!",
            approved: true,
        });

        const result = await addComment("user", SLUG, "user_123", "Visitor", "Nice profile!");

        expect(result.approved).toBe(true);
        expect(mockPrisma.profileComment.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    profileType: "user",
                    profileId: PROFILE_ID,
                    authorId: "user_123",
                    authorName: "Visitor",
                    content: "Nice profile!",
                    approved: true,
                }),
            }),
        );
    });

    it("throws when rate limited (recent comment exists)", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockPrisma.profileComment.findFirst.mockResolvedValue({
            id: "recent_comment",
            createdAt: new Date(),
        });

        await expect(addComment("user", SLUG, "user_123", "Visitor", "Spam!")).rejects.toThrow(
            "wait",
        );
    });

    it("throws when profile not found", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);

        await expect(
            addComment("user", "nonexistent", "user_123", "Visitor", "Hello"),
        ).rejects.toThrow("not found");
    });
});

// ─── getApprovedComments ─────────────────────────────────────

describe("getApprovedComments", () => {
    it("returns only approved comments", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockPrisma.profileComment.findMany.mockResolvedValue([
            { id: "c_1", content: "Great!", approved: true },
        ]);

        const result = await getApprovedComments("user", SLUG);
        expect(result).toHaveLength(1);
        expect(mockPrisma.profileComment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ approved: true }),
            }),
        );
    });
});

// ─── getPendingComments ──────────────────────────────────────

describe("getPendingComments", () => {
    it("returns pending comments for all owned profiles", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({ id: PROFILE_ID });
        mockPrisma.publicProfile.findMany.mockResolvedValue([{ id: "pet_profile_1" }]);
        mockPrisma.profileComment.findMany.mockResolvedValue([
            { id: "c_1", profileType: "user", content: "Pending" },
        ]);

        const result = await getPendingComments(USER_ID);
        expect(result).toHaveLength(1);
    });

    it("returns empty when user has no profiles", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);
        mockPrisma.publicProfile.findMany.mockResolvedValue([]);

        const result = await getPendingComments(USER_ID);
        expect(result).toEqual([]);
    });
});

// ─── moderateComment ─────────────────────────────────────────

describe("moderateComment", () => {
    it("approves a comment", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({
            id: "c_1",
            profileType: "user",
            profileId: PROFILE_ID,
        });
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.profileComment.update.mockResolvedValue({
            id: "c_1",
            approved: true,
        });

        const result = await moderateComment(USER_ID, "c_1", true);
        expect(result!.approved).toBe(true);
    });

    it("deletes a rejected comment", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({
            id: "c_1",
            profileType: "user",
            profileId: PROFILE_ID,
        });
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.profileComment.delete.mockResolvedValue({});

        const result = await moderateComment(USER_ID, "c_1", false);
        expect(result).toBeNull();
        expect(mockPrisma.profileComment.delete).toHaveBeenCalledOnce();
    });

    it("throws when comment not found", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue(null);

        await expect(moderateComment(USER_ID, "c_nonexistent", true)).rejects.toThrow("not found");
    });

    it("throws when user doesn't own the profile", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({
            id: "c_1",
            profileType: "user",
            profileId: PROFILE_ID,
        });
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(moderateComment(USER_ID, "c_1", true)).rejects.toThrow("not found");
    });
});

// ─── deleteApprovedComment ───────────────────────────────────

describe("deleteApprovedComment", () => {
    it("deletes a comment when user owns the user profile", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({
            id: "c_1",
            profileType: "user",
            profileId: PROFILE_ID,
        });
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.profileComment.delete.mockResolvedValue({});

        await deleteApprovedComment(USER_ID, "c_1");
        expect(mockPrisma.profileComment.delete).toHaveBeenCalledWith({ where: { id: "c_1" } });
    });

    it("deletes a comment when user owns the pet profile", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({
            id: "c_2",
            profileType: "pet",
            profileId: "pet_profile_1",
        });
        mockPrisma.publicProfile.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.profileComment.delete.mockResolvedValue({});

        await deleteApprovedComment(USER_ID, "c_2");
        expect(mockPrisma.profileComment.delete).toHaveBeenCalledOnce();
    });

    it("throws when comment not found", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue(null);

        await expect(deleteApprovedComment(USER_ID, "c_nonexistent")).rejects.toThrow("not found");
    });

    it("throws when user doesn't own the profile", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({
            id: "c_1",
            profileType: "user",
            profileId: PROFILE_ID,
        });
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(deleteApprovedComment(USER_ID, "c_1")).rejects.toThrow("not found");
    });
});

// ─── adminDeleteComment ──────────────────────────────────────

describe("adminDeleteComment", () => {
    it("deletes any comment", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({ id: "c_1" });
        mockPrisma.profileComment.delete.mockResolvedValue({});

        await adminDeleteComment("c_1");
        expect(mockPrisma.profileComment.delete).toHaveBeenCalledWith({ where: { id: "c_1" } });
    });

    it("throws when comment not found", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue(null);

        await expect(adminDeleteComment("c_nonexistent")).rejects.toThrow("not found");
    });
});

// ─── adminListComments ───────────────────────────────────────

describe("adminListComments", () => {
    it("returns paginated comments", async () => {
        mockPrisma.profileComment.findMany.mockResolvedValue([{ id: "c_1", content: "Hello" }]);
        mockPrisma.profileComment.count.mockResolvedValue(1);

        const result = await adminListComments({ page: 1, limit: 10 });
        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it("filters by approved status", async () => {
        mockPrisma.profileComment.findMany.mockResolvedValue([]);
        mockPrisma.profileComment.count.mockResolvedValue(0);

        await adminListComments({ approved: true });
        expect(mockPrisma.profileComment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ approved: true }),
            }),
        );
    });
});

// ─── getApprovedCommentsForOwner ─────────────────────────────

describe("getApprovedCommentsForOwner", () => {
    it("returns approved comments across owned profiles", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({ id: PROFILE_ID });
        mockPrisma.publicProfile.findMany.mockResolvedValue([{ id: "pet_profile_1" }]);
        mockPrisma.profileComment.findMany.mockResolvedValue([
            { id: "c_1", content: "Nice!", approved: true },
        ]);

        const result = await getApprovedCommentsForOwner(USER_ID);
        expect(result).toHaveLength(1);
    });

    it("returns empty when user has no profiles", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue(null);
        mockPrisma.publicProfile.findMany.mockResolvedValue([]);

        const result = await getApprovedCommentsForOwner(USER_ID);
        expect(result).toEqual([]);
    });
});

// ─── deleteOwnComment ────────────────────────────────────────

describe("deleteOwnComment", () => {
    it("deletes a comment owned by the user", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({
            id: "comment_1",
            authorId: USER_ID,
        });
        mockPrisma.profileComment.delete.mockResolvedValue({});

        await deleteOwnComment(USER_ID, "comment_1");
        expect(mockPrisma.profileComment.delete).toHaveBeenCalledWith({
            where: { id: "comment_1" },
        });
    });

    it("throws when comment not found", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue(null);

        await expect(deleteOwnComment(USER_ID, "nonexistent")).rejects.toThrow("not found");
    });

    it("throws when user does not own the comment", async () => {
        mockPrisma.profileComment.findUnique.mockResolvedValue({
            id: "comment_1",
            authorId: "other_user",
        });

        await expect(deleteOwnComment(USER_ID, "comment_1")).rejects.toThrow("not found");
    });
});

// ─── Feature Flag Enforcement ────────────────────────────────

describe("feature flag enforcement", () => {
    it("toggleLike throws when user_public_profiles is disabled for user profile", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockResolveUserFeatures.mockResolvedValueOnce({ user_public_profiles: false });

        await expect(toggleLike("user", SLUG, IP)).rejects.toThrow("not found");
    });

    it("toggleLike throws when public_profiles is disabled for pet profile", async () => {
        mockPrisma.publicProfile.findFirst.mockResolvedValue({
            id: "pet_profile_1",
            active: true,
            userId: USER_ID,
        });
        mockResolveUserFeatures.mockResolvedValueOnce({ public_profiles: false });

        await expect(toggleLike("pet", "pet-slug", IP, "keeper-slug")).rejects.toThrow("not found");
    });

    it("addComment throws when user_public_profiles is disabled", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockResolveUserFeatures.mockResolvedValueOnce({ user_public_profiles: false });

        await expect(addComment("user", SLUG, "author_1", "Visitor", "Hello")).rejects.toThrow(
            "not found",
        );
    });

    it("getApprovedComments throws when user_public_profiles is disabled", async () => {
        mockPrisma.userPublicProfile.findUnique.mockResolvedValue({
            id: PROFILE_ID,
            active: true,
            userId: USER_ID,
        });
        mockResolveUserFeatures.mockResolvedValueOnce({ user_public_profiles: false });

        await expect(getApprovedComments("user", SLUG)).rejects.toThrow("not found");
    });
});
