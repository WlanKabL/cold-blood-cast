import { type FastifyInstance, type FastifyRequest } from "fastify";
import { z } from "zod";
import { authGuard, emailVerifiedGuard, requireFeature } from "@/middleware/index.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import {
    getProfileByPetId,
    createProfile,
    updateProfile,
    deleteProfile,
    checkSlugAvailability,
    getPublicPetDataByUserSlug,
    getPublicPhoto,
    resolvePublicPetSlug,
} from "./public-profiles.service.js";
import { resolve, join, normalize } from "node:path";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { env } from "@/config/env.js";
import { decryptFile } from "@/helpers/file-crypto.js";
import { resolveUserForPetProfile } from "@/modules/user-public-profiles/user-public-profiles.service.js";

// ─── Validation Schemas ──────────────────────────────────────

const CreateProfileSchema = z.object({
    petId: z.string().min(1),
    bio: z.string().max(500).optional(),
    customSlug: z
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
    bio: z.string().max(500).nullable().optional(),
    showPhotos: z.boolean().optional(),
    showWeight: z.boolean().optional(),
    showAge: z.boolean().optional(),
    showFeedings: z.boolean().optional(),
    showSheddings: z.boolean().optional(),
    showSpecies: z.boolean().optional(),
    showMorph: z.boolean().optional(),
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

export async function publicProfileRoutes(app: FastifyInstance) {
    // ── Authenticated CRUD (prefix: /api/public-profiles) ────
    app.register(async (authApp) => {
        authApp.addHook("preHandler", authGuard);
        authApp.addHook("preHandler", emailVerifiedGuard);
        authApp.addHook("preHandler", requireFeature("public_profiles"));

        // GET /:petId — get profile config for a pet
        authApp.get("/:petId", async (request: FastifyRequest<{ Params: { petId: string } }>) => {
            const data = await getProfileByPetId(request.params.petId, request.userId);
            return { success: true, data };
        });

        // POST / — create a public profile
        authApp.post("/", async (request, reply) => {
            const result = CreateProfileSchema.safeParse(request.body);
            if (!result.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Invalid profile data",
                    result.error.flatten(),
                );
            }
            const data = await createProfile(request.userId, result.data);
            return reply.status(201).send({ success: true, data });
        });

        // PATCH /:petId — update profile settings
        authApp.patch("/:petId", async (request: FastifyRequest<{ Params: { petId: string } }>) => {
            const result = UpdateProfileSchema.safeParse(request.body);
            if (!result.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    "Invalid profile data",
                    result.error.flatten(),
                );
            }
            const data = await updateProfile(request.params.petId, request.userId, result.data);
            return { success: true, data };
        });

        // DELETE /:petId — delete public profile
        authApp.delete(
            "/:petId",
            async (request: FastifyRequest<{ Params: { petId: string } }>, reply) => {
                await deleteProfile(request.params.petId, request.userId);
                return reply.status(204).send();
            },
        );

        // GET /slug-check/:slug — check slug availability
        authApp.get(
            "/slug-check/:slug",
            async (request: FastifyRequest<{ Params: { slug: string } }>) => {
                const data = await checkSlugAvailability(request.params.slug, request.userId);
                return { success: true, data };
            },
        );
    });
}

// ─── Public Routes (no auth, registered at root) ─────────────

export async function publicPetRoutes(app: FastifyInstance) {
    // GET /resolve/:petSlug — resolve pet slug to canonical keeper/pet URL
    app.get(
        "/resolve/:petSlug",
        async (request: FastifyRequest<{ Params: { petSlug: string } }>) => {
            const data = await resolvePublicPetSlug(request.params.petSlug);
            return { success: true, data };
        },
    );

    // GET /:userSlug/:petSlug — public pet profile data (new per-user URL)
    app.get(
        "/:userSlug/:petSlug",
        async (request: FastifyRequest<{ Params: { userSlug: string; petSlug: string } }>) => {
            // Resolve user from UserPublicProfile or username
            const userProfile = await resolveUserForPetProfile(request.params.userSlug);

            const data = await getPublicPetDataByUserSlug(userProfile.id, request.params.petSlug);
            return { success: true, data };
        },
    );

    // GET /:userSlug/:petSlug/photos/:photoId — serve photo publicly
    app.get(
        "/:userSlug/:petSlug/photos/:photoId",
        async (
            request: FastifyRequest<{
                Params: { userSlug: string; petSlug: string; photoId: string };
            }>,
            reply,
        ) => {
            const userProfile = await resolveUserForPetProfile(request.params.userSlug);

            const upload = await getPublicPhoto(
                userProfile.id,
                request.params.petSlug,
                request.params.photoId,
            );

            const uploadDir = resolve(env().UPLOAD_DIR);
            const relativePath = upload.url.replace(/^\/uploads\//, "");
            const absPath = normalize(join(uploadDir, relativePath));

            // Prevent directory traversal
            if (!absPath.startsWith(uploadDir)) {
                return reply.status(403).send({
                    success: false,
                    error: { code: "E_FORBIDDEN", message: "Access denied" },
                });
            }

            const ext = absPath.substring(absPath.lastIndexOf(".")).toLowerCase();
            const contentType = MIME_TYPES[ext] || "application/octet-stream";

            // Try encrypted first, fall back to plaintext
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
                    error: { code: "E_NOT_FOUND", message: "Photo file not found" },
                });
            }
        },
    );
}
