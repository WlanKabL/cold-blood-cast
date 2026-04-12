import { type FastifyInstance, type FastifyRequest } from "fastify";
import { z } from "zod";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { prisma } from "@/config/database.js";
import { notifyNewComment } from "@/modules/notifications/notification.service.js";
import { notifyCommentToOwner } from "./community.notify.js";
import {
    toggleLike,
    getLikeStatus,
    addComment,
    getApprovedComments,
    deleteOwnComment,
    getPendingComments,
    moderateComment,
    deleteApprovedComment,
    getApprovedCommentsForOwner,
    adminDeleteComment,
    adminListComments,
} from "./community.service.js";

// ─── Validation ──────────────────────────────────────────────

const AddCommentSchema = z.object({
    content: z.string().min(1).max(500).trim(),
});

const ModerateCommentSchema = z.object({
    approved: z.boolean(),
});

// ─── Public Routes (no auth) ─────────────────────────────────

export async function communityPublicRoutes(app: FastifyInstance) {
    // ── User Profile Likes ──────────────────────────────────
    app.post("/user/:slug/like", async (request: FastifyRequest<{ Params: { slug: string } }>) => {
        const data = await toggleLike("user", request.params.slug, request.ip);
        return { success: true, data };
    });

    app.get("/user/:slug/like", async (request: FastifyRequest<{ Params: { slug: string } }>) => {
        const data = await getLikeStatus("user", request.params.slug, request.ip);
        return { success: true, data };
    });

    // ── Pet Profile Likes (requires userSlug for disambiguation) ──
    app.post(
        "/pet/:userSlug/:petSlug/like",
        async (request: FastifyRequest<{ Params: { userSlug: string; petSlug: string } }>) => {
            const data = await toggleLike(
                "pet",
                request.params.petSlug,
                request.ip,
                request.params.userSlug,
            );
            return { success: true, data };
        },
    );

    app.get(
        "/pet/:userSlug/:petSlug/like",
        async (request: FastifyRequest<{ Params: { userSlug: string; petSlug: string } }>) => {
            const data = await getLikeStatus(
                "pet",
                request.params.petSlug,
                request.ip,
                request.params.userSlug,
            );
            return { success: true, data };
        },
    );

    // ── User Profile Comments ───────────────────────────────
    app.post<{ Params: { slug: string } }>(
        "/user/:slug/comments",
        { preHandler: [authGuard] },
        async (request) => {
            const bodyResult = AddCommentSchema.safeParse(request.body);
            if (!bodyResult.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Invalid comment data",
                    bodyResult.error.flatten(),
                );
            }

            const user = await prisma.user.findUniqueOrThrow({
                where: { id: request.userId },
                select: { displayName: true, username: true },
            });
            const authorName = user.displayName ?? user.username;

            const data = await addComment(
                "user",
                request.params.slug,
                request.userId,
                authorName,
                bodyResult.data.content,
            );

            notifyNewComment(request.params.slug, authorName);
            void notifyCommentToOwner(
                "user",
                request.params.slug,
                authorName,
                bodyResult.data.content,
            );

            return { success: true, data };
        },
    );

    app.get(
        "/user/:slug/comments",
        async (request: FastifyRequest<{ Params: { slug: string } }>) => {
            const data = await getApprovedComments("user", request.params.slug);
            return { success: true, data };
        },
    );

    // ── Delete Own Comment (user profile) ────────────────────
    app.delete<{ Params: { slug: string; commentId: string } }>(
        "/user/:slug/comments/:commentId",
        { preHandler: [authGuard] },
        async (request) => {
            await deleteOwnComment(request.userId, request.params.commentId);
            return { success: true };
        },
    );

    // ── Pet Profile Comments (requires userSlug) ─────────────
    app.post<{ Params: { userSlug: string; petSlug: string } }>(
        "/pet/:userSlug/:petSlug/comments",
        { preHandler: [authGuard] },
        async (request) => {
            const bodyResult = AddCommentSchema.safeParse(request.body);
            if (!bodyResult.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Invalid comment data",
                    bodyResult.error.flatten(),
                );
            }

            const user = await prisma.user.findUniqueOrThrow({
                where: { id: request.userId },
                select: { displayName: true, username: true },
            });
            const authorName = user.displayName ?? user.username;

            const data = await addComment(
                "pet",
                request.params.petSlug,
                request.userId,
                authorName,
                bodyResult.data.content,
                request.params.userSlug,
            );

            notifyNewComment(request.params.petSlug, authorName);
            void notifyCommentToOwner(
                "pet",
                request.params.petSlug,
                authorName,
                bodyResult.data.content,
                request.params.userSlug,
            );

            return { success: true, data };
        },
    );

    app.get(
        "/pet/:userSlug/:petSlug/comments",
        async (request: FastifyRequest<{ Params: { userSlug: string; petSlug: string } }>) => {
            const data = await getApprovedComments(
                "pet",
                request.params.petSlug,
                request.params.userSlug,
            );
            return { success: true, data };
        },
    );

    // ── Delete Own Comment (pet profile) ─────────────────────
    app.delete<{ Params: { userSlug: string; petSlug: string; commentId: string } }>(
        "/pet/:userSlug/:petSlug/comments/:commentId",
        { preHandler: [authGuard] },
        async (request) => {
            await deleteOwnComment(request.userId, request.params.commentId);
            return { success: true };
        },
    );
}

// ─── Authenticated Moderation Routes ─────────────────────────

export async function communityModerationRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);

    // GET /pending — get pending comments for own profiles
    app.get("/pending", async (request) => {
        const data = await getPendingComments(request.userId);
        return { success: true, data };
    });

    // PATCH /:commentId — approve or reject comment
    app.patch(
        "/:commentId",
        async (request: FastifyRequest<{ Params: { commentId: string } }>, reply) => {
            const result = ModerateCommentSchema.safeParse(request.body);
            if (!result.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Invalid moderation data",
                    result.error.flatten(),
                );
            }

            const data = await moderateComment(
                request.userId,
                request.params.commentId,
                result.data.approved,
            );

            if (data === null) {
                return reply.status(204).send();
            }

            return { success: true, data };
        },
    );

    // GET /approved — get approved comments for own profiles
    app.get("/approved", async (request) => {
        const data = await getApprovedCommentsForOwner(request.userId);
        return { success: true, data };
    });

    // DELETE /:commentId — delete an approved comment (owner)
    app.delete(
        "/:commentId",
        async (request: FastifyRequest<{ Params: { commentId: string } }>, reply) => {
            await deleteApprovedComment(request.userId, request.params.commentId);
            return reply.status(204).send();
        },
    );
}

// ─── Admin Comment Routes ────────────────────────────────────

export async function communityAdminRoutes(app: FastifyInstance) {
    app.addHook("onRequest", authGuard);
    app.addHook("onRequest", emailVerifiedGuard);
    app.addHook("onRequest", adminGuard);

    // GET / — list all comments (filterable)
    app.get("/", async (request) => {
        const q = request.query as Record<string, string>;
        const result = await adminListComments({
            approved: q.approved !== undefined ? q.approved === "true" : undefined,
            page: q.page ? Number(q.page) : undefined,
            limit: q.limit ? Number(q.limit) : undefined,
        });
        return {
            success: true,
            data: {
                items: result.items,
                meta: {
                    page: result.page,
                    perPage: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            },
        };
    });

    // DELETE /:commentId — admin delete any comment
    app.delete(
        "/:commentId",
        async (request: FastifyRequest<{ Params: { commentId: string } }>, reply) => {
            await adminDeleteComment(request.params.commentId);
            return reply.status(204).send();
        },
    );
}
