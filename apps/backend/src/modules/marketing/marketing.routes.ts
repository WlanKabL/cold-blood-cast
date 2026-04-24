// ─── Public marketing routes ────────────────────────────────
// Plan v1.7 §5.

import type { FastifyInstance } from "fastify";
import {
    landingAttributionInputSchema,
    type MarketingLandingResponse,
    type MarketingPublicConfig,
} from "@cold-blood-cast/shared";
import { authGuard } from "@/middleware/auth.js";
import { ErrorCodes, badRequest } from "@/helpers/errors.js";
import { markBrowserEventDelivered, recordLandingAttribution } from "./marketing.service.js";
import { getMarketingConfig } from "./marketing-config.service.js";

export async function marketingRoutes(fastify: FastifyInstance) {
    // ── GET /api/marketing/config — public, used by Pixel plugin ──
    fastify.get(
        "/config",
        {
            schema: {
                tags: ["Marketing"],
                summary: "Public marketing config (Pixel ID + enabled flag)",
            },
        },
        async (_request, reply) => {
            const cfg = await getMarketingConfig();
            const payload: MarketingPublicConfig = {
                metaPixelEnabled: cfg.metaPixelEnabled,
                metaPixelId: cfg.metaPixelId,
            };
            return reply.send({ success: true, data: payload });
        },
    );

    // ── POST /api/marketing/landing — anonymous, capture first-touch ──
    fastify.post(
        "/landing",
        {
            schema: {
                tags: ["Marketing"],
                summary: "Record landing attribution (first-touch)",
                body: { type: "object", additionalProperties: true },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            success: { type: "boolean" },
                            data: {
                                type: "object",
                                properties: {
                                    landingSessionId: { type: "string" },
                                    expiresAt: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const parsed = landingAttributionInputSchema.safeParse(request.body);
            if (!parsed.success) {
                throw badRequest(
                    ErrorCodes.E_VALIDATION_ERROR,
                    parsed.error.issues[0]?.message ?? "Invalid landing payload",
                );
            }
            const result = await recordLandingAttribution(parsed.data);
            const payload: MarketingLandingResponse = {
                landingSessionId: result.landingSessionId,
                expiresAt: result.expiresAt.toISOString(),
            };
            return reply.send({ success: true, data: payload });
        },
    );

    // ── POST /api/marketing/events/:eventId/browser-delivered ──
    // Client confirms the Pixel call was actually fired.
    fastify.post(
        "/events/:eventId/browser-delivered",
        {
            preHandler: [authGuard],
            schema: {
                tags: ["Marketing"],
                summary: "Confirm browser-side Pixel delivery",
                params: {
                    type: "object",
                    required: ["eventId"],
                    properties: { eventId: { type: "string" } },
                },
                response: {
                    200: { type: "object", properties: { success: { type: "boolean" } } },
                },
            },
        },
        async (request, reply) => {
            const { eventId } = request.params as { eventId: string };
            await markBrowserEventDelivered(eventId, request.userId);
            return reply.send({ success: true });
        },
    );
}
