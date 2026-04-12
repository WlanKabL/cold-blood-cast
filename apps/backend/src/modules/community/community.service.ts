import { createHash } from "node:crypto";
import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound, badRequest } from "@/helpers/errors.js";

// ─── Helpers ─────────────────────────────────────────────────

function hashIp(ip: string): string {
    return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

type ProfileType = "user" | "pet";

function resolveProfileId(profileType: ProfileType, slug: string, userSlug?: string) {
    if (profileType === "user") {
        return prisma.userPublicProfile.findUnique({
            where: { slug },
            select: { id: true, active: true },
        });
    }
    // Pet profiles: look up via user slug first for disambiguation
    if (!userSlug) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "User slug required for pet profiles");
    }
    return prisma.publicProfile.findFirst({
        where: {
            slug,
            active: true,
            user: {
                userPublicProfile: { slug: userSlug },
            },
        },
        select: { id: true, active: true },
    });
}

// ─── Likes ───────────────────────────────────────────────────

export async function toggleLike(profileType: ProfileType, slug: string, ip: string, userSlug?: string) {
    const profile = await resolveProfileId(profileType, slug, userSlug);
    if (!profile || !profile.active) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Profile not found");
    }

    const ipHash = hashIp(ip);

    const existing = await prisma.profileLike.findUnique({
        where: {
            profileType_profileId_ipHash: {
                profileType,
                profileId: profile.id,
                ipHash,
            },
        },
    });

    if (existing) {
        await prisma.profileLike.delete({ where: { id: existing.id } });
        const count = await prisma.profileLike.count({
            where: { profileType, profileId: profile.id },
        });
        return { liked: false, count };
    }

    await prisma.profileLike.create({
        data: { profileType, profileId: profile.id, ipHash },
    });

    const count = await prisma.profileLike.count({
        where: { profileType, profileId: profile.id },
    });

    return { liked: true, count };
}

export async function getLikeStatus(profileType: ProfileType, slug: string, ip: string, userSlug?: string) {
    const profile = await resolveProfileId(profileType, slug, userSlug);
    if (!profile || !profile.active) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Profile not found");
    }

    const ipHash = hashIp(ip);

    const existing = await prisma.profileLike.findUnique({
        where: {
            profileType_profileId_ipHash: {
                profileType,
                profileId: profile.id,
                ipHash,
            },
        },
    });

    const count = await prisma.profileLike.count({
        where: { profileType, profileId: profile.id },
    });

    return { liked: !!existing, count };
}

// ─── Comments ────────────────────────────────────────────────

const COMMENT_RATE_LIMIT_MINUTES = 2;

export async function addComment(
    profileType: ProfileType,
    slug: string,
    authorId: string,
    authorName: string,
    content: string,
    userSlug?: string,
) {
    const profile = await resolveProfileId(profileType, slug, userSlug);
    if (!profile || !profile.active) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Profile not found");
    }

    // Rate limit: max 1 comment per COMMENT_RATE_LIMIT_MINUTES per user per profile
    const recentCutoff = new Date(Date.now() - COMMENT_RATE_LIMIT_MINUTES * 60_000);
    const recentComment = await prisma.profileComment.findFirst({
        where: {
            profileType,
            profileId: profile.id,
            authorId,
            createdAt: { gte: recentCutoff },
        },
    });

    if (recentComment) {
        throw badRequest(
            ErrorCodes.E_RATE_LIMIT_EXCEEDED,
            `Please wait ${COMMENT_RATE_LIMIT_MINUTES} minutes between comments`,
        );
    }

    return prisma.profileComment.create({
        data: {
            profileType,
            profileId: profile.id,
            authorId,
            authorName,
            content,
            approved: true,
        },
    });
}

export async function getApprovedComments(profileType: ProfileType, slug: string, userSlug?: string) {
    const profile = await resolveProfileId(profileType, slug, userSlug);
    if (!profile || !profile.active) {
        throw notFound(ErrorCodes.E_USER_PROFILE_NOT_FOUND, "Profile not found");
    }

    return prisma.profileComment.findMany({
        where: {
            profileType,
            profileId: profile.id,
            approved: true,
        },
        select: {
            id: true,
            authorId: true,
            authorName: true,
            content: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
}

// ─── Delete Own Comment (author) ─────────────────────────────

export async function deleteOwnComment(userId: string, commentId: string) {
    const comment = await prisma.profileComment.findUnique({ where: { id: commentId } });
    if (!comment) {
        throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
    }

    if (comment.authorId !== userId) {
        throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
    }

    await prisma.profileComment.delete({ where: { id: commentId } });
}

// ─── Comment Moderation (authenticated) ──────────────────────

export async function getPendingComments(userId: string) {
    // Get all profile IDs owned by this user
    const [userProfile, petProfiles] = await Promise.all([
        prisma.userPublicProfile.findUnique({
            where: { userId },
            select: { id: true },
        }),
        prisma.publicProfile.findMany({
            where: { userId },
            select: { id: true },
        }),
    ]);

    const profileIds: Array<{ type: string; id: string }> = [];
    if (userProfile) profileIds.push({ type: "user", id: userProfile.id });
    for (const pp of petProfiles) profileIds.push({ type: "pet", id: pp.id });

    if (profileIds.length === 0) return [];

    // Fetch all pending comments for all owned profiles
    const comments = await prisma.profileComment.findMany({
        where: {
            approved: false,
            OR: profileIds.map((p) => ({
                profileType: p.type,
                profileId: p.id,
            })),
        },
        orderBy: { createdAt: "desc" },
    });

    return comments;
}

export async function moderateComment(userId: string, commentId: string, approved: boolean) {
    const comment = await prisma.profileComment.findUnique({ where: { id: commentId } });
    if (!comment) {
        throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
    }

    // Verify ownership of the profile
    if (comment.profileType === "user") {
        const profile = await prisma.userPublicProfile.findUnique({
            where: { id: comment.profileId },
            select: { userId: true },
        });
        if (!profile || profile.userId !== userId) {
            throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
        }
    } else {
        const profile = await prisma.publicProfile.findUnique({
            where: { id: comment.profileId },
            select: { userId: true },
        });
        if (!profile || profile.userId !== userId) {
            throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
        }
    }

    if (approved) {
        return prisma.profileComment.update({
            where: { id: commentId },
            data: { approved: true },
        });
    }

    await prisma.profileComment.delete({ where: { id: commentId } });
    return null;
}

// ─── Delete Approved Comment (owner) ─────────────────────────

export async function deleteApprovedComment(userId: string, commentId: string) {
    const comment = await prisma.profileComment.findUnique({ where: { id: commentId } });
    if (!comment) {
        throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
    }

    // Verify ownership of the profile
    if (comment.profileType === "user") {
        const profile = await prisma.userPublicProfile.findUnique({
            where: { id: comment.profileId },
            select: { userId: true },
        });
        if (!profile || profile.userId !== userId) {
            throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
        }
    } else {
        const profile = await prisma.publicProfile.findUnique({
            where: { id: comment.profileId },
            select: { userId: true },
        });
        if (!profile || profile.userId !== userId) {
            throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
        }
    }

    await prisma.profileComment.delete({ where: { id: commentId } });
}

// ─── Admin: Delete Any Comment ───────────────────────────────

export async function adminDeleteComment(commentId: string) {
    const comment = await prisma.profileComment.findUnique({ where: { id: commentId } });
    if (!comment) {
        throw notFound(ErrorCodes.E_COMMENT_NOT_FOUND, "Comment not found");
    }

    await prisma.profileComment.delete({ where: { id: commentId } });
}

// ─── Admin: List All Comments ────────────────────────────────

interface ListCommentsOptions {
    approved?: boolean;
    page?: number;
    limit?: number;
}

export async function adminListComments(options: ListCommentsOptions) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options.approved !== undefined) where.approved = options.approved;

    const [items, total] = await Promise.all([
        prisma.profileComment.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.profileComment.count({ where }),
    ]);

    return { items, total, page, limit };
}

// ─── Owner: Get Approved Comments for Own Profiles ───────────

export async function getApprovedCommentsForOwner(userId: string) {
    const [userProfile, petProfiles] = await Promise.all([
        prisma.userPublicProfile.findUnique({
            where: { userId },
            select: { id: true },
        }),
        prisma.publicProfile.findMany({
            where: { userId },
            select: { id: true },
        }),
    ]);

    const profileIds: Array<{ type: string; id: string }> = [];
    if (userProfile) profileIds.push({ type: "user", id: userProfile.id });
    for (const pp of petProfiles) profileIds.push({ type: "pet", id: pp.id });

    if (profileIds.length === 0) return [];

    return prisma.profileComment.findMany({
        where: {
            approved: true,
            OR: profileIds.map((p) => ({
                profileType: p.type,
                profileId: p.id,
            })),
        },
        orderBy: { createdAt: "desc" },
    });
}
