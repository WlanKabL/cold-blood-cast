import { type FastifyInstance, type FastifyRequest } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    toggleLike,
    getLikeStatus,
    addComment,
    getApprovedComments,
    getPendingComments,
    moderateComment,
} from "./community.service.js";

// ─── Validation ──────────────────────────────────────────────

const AddCommentSchema = z.object({
    authorName: z.string().min(1).max(50).trim(),
    content: z.string().min(1).max(500).trim(),
});

const ModerateCommentSchema = z.object({
    approved: z.boolean(),
});

// ─── Public Routes (no auth) ─────────────────────────────────

export async function communityPublicRoutes(app: FastifyInstance) {
    // ── User Profile Likes ──────────────────────────────────
    app.post(
        "/user/:slug/like",
        async (request: FastifyRequest<{ Params: { slug: string } }>) => {
            const data = await toggleLike("user", request.params.slug, request.ip);
            return { success: true, data };
        },
    );

    app.get(
        "/user/:slug/like",
        async (request: FastifyRequest<{ Params: { slug: string } }>) => {
            const data = await getLikeStatus("user", request.params.slug, request.ip);
            return { success: true, data };
        },
    );

    // ── Pet Profile Likes (requires userSlug for disambiguation) ──
    app.post(
        "/pet/:userSlug/:petSlug/like",
        async (
            request: FastifyRequest<{ Params: { userSlug: string; petSlug: string } }>,
        ) => {
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
        async (
            request: FastifyRequest<{ Params: { userSlug: string; petSlug: string } }>,
        ) => {
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
    app.post(
        "/user/:slug/comments",
        async (request: FastifyRequest<{ Params: { slug: string } }>) => {
            const bodyResult = AddCommentSchema.safeParse(request.body);
            if (!bodyResult.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Invalid comment data",
                    bodyResult.error.flatten(),
                );
            }

            const data = await addComment(
                "user",
                request.params.slug,
                bodyResult.data.authorName,
                bodyResult.data.content,
                request.ip,
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

    // ── Pet Profile Comments (requires userSlug) ─────────────
    app.post(
        "/pet/:userSlug/:petSlug/comments",
        async (
            request: FastifyRequest<{ Params: { userSlug: string; petSlug: string } }>,
        ) => {
            const bodyResult = AddCommentSchema.safeParse(request.body);
            if (!bodyResult.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Invalid comment data",
                    bodyResult.error.flatten(),
                );
            }

            const data = await addComment(
                "pet",
                request.params.petSlug,
                bodyResult.data.authorName,
                bodyResult.data.content,
                request.ip,
                request.params.userSlug,
            );
            return { success: true, data };
        },
    );

    app.get(
        "/pet/:userSlug/:petSlug/comments",
        async (
            request: FastifyRequest<{ Params: { userSlug: string; petSlug: string } }>,
        ) => {
            const data = await getApprovedComments(
                "pet",
                request.params.petSlug,
                request.params.userSlug,
            );
            return { success: true, data };
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
}
