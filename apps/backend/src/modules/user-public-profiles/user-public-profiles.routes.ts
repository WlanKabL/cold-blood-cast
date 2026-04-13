import { type FastifyInstance, type FastifyRequest } from "fastify";
import { z } from "zod";
import type { ThemePreset, SocialPlatform } from "@cold-blood-cast/shared";
import { authGuard, emailVerifiedGuard, requireFeature } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    getOwnProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    setAvatar,
    removeAvatar,
    getOwnAvatar,
    setSocialLinks,
    setPetOrder,
    checkSlugAvailability,
    getPublicUserData,
    getPublicUserAvatar,
    THEME_PRESETS,
    SOCIAL_PLATFORMS,
} from "./user-public-profiles.service.js";
import { uploadFile } from "@/modules/uploads/uploads.service.js";
import { resolve, join, normalize } from "node:path";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { env } from "@/config/env.js";
import { decryptFile } from "@/helpers/file-crypto.js";

// ─── Validation Schemas ──────────────────────────────────────

const CreateProfileSchema = z.object({
    slug: z
        .string()
        .min(3)
        .max(60)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
        .optional(),
});

const UpdateProfileSchema = z.object({
    slug: z
        .string()
        .min(3)
        .max(60)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
        .optional(),
    active: z.boolean().optional(),
    bio: z.string().max(1000).nullable().optional(),
    tagline: z.string().max(100).nullable().optional(),
    location: z.string().max(100).nullable().optional(),
    keeperSince: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
        .nullable()
        .optional(),
    showStats: z.boolean().optional(),
    showPets: z.boolean().optional(),
    showSocialLinks: z.boolean().optional(),
    showLocation: z.boolean().optional(),
    showKeeperSince: z.boolean().optional(),
    showBadges: z.boolean().optional(),
    notifyOnComment: z.boolean().optional(),
    themePreset: z
        .enum(THEME_PRESETS as unknown as readonly [ThemePreset, ...ThemePreset[]])
        .optional(),
});

const SocialLinkSchema = z.object({
    platform: z.enum(SOCIAL_PLATFORMS as unknown as readonly [SocialPlatform, ...SocialPlatform[]]),
    url: z.string().url().max(500),
    label: z.string().max(50).optional(),
});

const SetSocialLinksSchema = z.object({
    links: z.array(SocialLinkSchema).max(10),
});

const PetOrderItemSchema = z.object({
    petId: z.string().min(1),
    sortOrder: z.number().int().min(0),
});

const SetPetOrderSchema = z.object({
    order: z.array(PetOrderItemSchema).max(50),
});

const MIME_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
};

// ─── Authenticated Routes ────────────────────────────────────

export async function userPublicProfileRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authGuard);
    app.addHook("preHandler", emailVerifiedGuard);
    app.addHook("preHandler", requireFeature("user_public_profiles"));

    // GET / — get own profile
    app.get("/", async (request) => {
        const data = await getOwnProfile(request.userId);
        return { success: true, data };
    });

    // POST / — create profile
    app.post("/", async (request, reply) => {
        const result = CreateProfileSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid profile data",
                result.error.flatten(),
            );
        }
        const data = await createProfile(request.userId, request.username, result.data);
        return reply.status(201).send({ success: true, data });
    });

    // PATCH / — update profile
    app.patch("/", async (request) => {
        const result = UpdateProfileSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid profile data",
                result.error.flatten(),
            );
        }
        const data = await updateProfile(request.userId, result.data);
        return { success: true, data };
    });

    // DELETE / — delete profile
    app.delete("/", async (request, reply) => {
        await deleteProfile(request.userId);
        return reply.status(204).send();
    });

    // POST /avatar — upload avatar
    app.post("/avatar", async (request, reply) => {
        const file = await request.file();
        if (!file) {
            throw badRequest(ErrorCodes.E_UPLOAD_FAILED, "No file provided");
        }

        const upload = await uploadFile(
            request.userId,
            file,
            {
                subDir: "avatars",
                caption: "Profile avatar",
            },
            request.log,
        );

        const data = await setAvatar(request.userId, upload.id);
        return reply.status(201).send({ success: true, data });
    });

    // DELETE /avatar — remove avatar
    app.delete("/avatar", async (request) => {
        await removeAvatar(request.userId);
        return { success: true };
    });

    // GET /avatar — serve own avatar (no active/feature check)
    app.get("/avatar", async (request, reply) => {
        const upload = await getOwnAvatar(request.userId);

        const uploadDir = resolve(env().UPLOAD_DIR);
        const relativePath = upload.url.replace(/^\/uploads\//, "");
        const absPath = normalize(join(uploadDir, relativePath));

        if (!absPath.startsWith(uploadDir)) {
            return reply.status(403).send({
                success: false,
                error: { code: "E_FORBIDDEN", message: "Access denied" },
            });
        }

        const ext = absPath.substring(absPath.lastIndexOf(".")).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const encPath = `${absPath}.enc`;

        try {
            await stat(encPath);
            const decrypted = await decryptFile(encPath);
            return reply
                .header("Content-Type", contentType)
                .header("Cache-Control", "private, no-cache")
                .header("X-Content-Type-Options", "nosniff")
                .send(decrypted);
        } catch {
            // Not encrypted — try plaintext
        }

        try {
            const fileStat = await stat(absPath);
            const stream = createReadStream(absPath);
            return reply
                .header("Content-Type", contentType)
                .header("Content-Length", fileStat.size)
                .header("Cache-Control", "private, no-cache")
                .header("X-Content-Type-Options", "nosniff")
                .send(stream);
        } catch {
            return reply.status(404).send({
                success: false,
                error: { code: "E_NOT_FOUND", message: "Avatar file not found" },
            });
        }
    });

    // PUT /social-links — replace all social links
    app.put("/social-links", async (request) => {
        const result = SetSocialLinksSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid social links",
                result.error.flatten(),
            );
        }
        const data = await setSocialLinks(request.userId, result.data.links);
        return { success: true, data };
    });

    // PUT /pet-order — replace pet display order
    app.put("/pet-order", async (request) => {
        const result = SetPetOrderSchema.safeParse(request.body);
        if (!result.success) {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Invalid pet order",
                result.error.flatten(),
            );
        }
        const data = await setPetOrder(request.userId, result.data.order);
        return { success: true, data };
    });

    // GET /slug-check/:slug — check slug availability
    app.get("/slug-check/:slug", async (request: FastifyRequest<{ Params: { slug: string } }>) => {
        const data = await checkSlugAvailability(request.params.slug);
        return { success: true, data };
    });

    // GET /themes — list available theme presets
    app.get("/themes", async () => {
        return { success: true, data: THEME_PRESETS };
    });
}

// ─── Public Routes (no auth) ─────────────────────────────────

export async function publicUserRoutes(app: FastifyInstance) {
    // GET /:slug — public user profile
    app.get("/:slug", async (request: FastifyRequest<{ Params: { slug: string } }>) => {
        const data = await getPublicUserData(request.params.slug);
        return { success: true, data };
    });

    // GET /:slug/avatar — serve avatar image
    app.get(
        "/:slug/avatar",
        async (request: FastifyRequest<{ Params: { slug: string } }>, reply) => {
            const upload = await getPublicUserAvatar(request.params.slug);

            const uploadDir = resolve(env().UPLOAD_DIR);
            const relativePath = upload.url.replace(/^\/uploads\//, "");
            const absPath = normalize(join(uploadDir, relativePath));

            if (!absPath.startsWith(uploadDir)) {
                return reply.status(403).send({
                    success: false,
                    error: { code: "E_FORBIDDEN", message: "Access denied" },
                });
            }

            const ext = absPath.substring(absPath.lastIndexOf(".")).toLowerCase();
            const contentType = MIME_TYPES[ext] || "application/octet-stream";

            const encPath = `${absPath}.enc`;

            try {
                await stat(encPath);
                const decrypted = await decryptFile(encPath);
                return reply
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "public, max-age=86400, immutable")
                    .header("X-Content-Type-Options", "nosniff")
                    .send(decrypted);
            } catch {
                // Not encrypted — try plaintext
            }

            try {
                const fileStat = await stat(absPath);
                const stream = createReadStream(absPath);
                return reply
                    .header("Content-Type", contentType)
                    .header("Content-Length", fileStat.size)
                    .header("Cache-Control", "public, max-age=86400, immutable")
                    .header("X-Content-Type-Options", "nosniff")
                    .send(stream);
            } catch {
                return reply.status(404).send({
                    success: false,
                    error: { code: "E_NOT_FOUND", message: "Avatar file not found" },
                });
            }
        },
    );
}
