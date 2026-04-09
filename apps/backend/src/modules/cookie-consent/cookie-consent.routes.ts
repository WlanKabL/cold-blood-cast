import type { FastifyInstance } from "fastify";
import { prisma } from "@/config/database.js";
import { authGuard } from "@/middleware/auth.js";

export async function cookieConsentRoutes(fastify: FastifyInstance) {
    fastify.post(
        "/api/users/me/cookie-consent",
        {
            preHandler: [authGuard],
            schema: {
                tags: ["Users"],
                summary: "Record cookie consent decision (GDPR audit trail)",
                body: {
                    type: "object",
                    required: ["analytics", "version"],
                    properties: {
                        analytics: { type: "boolean" },
                        version: { type: "integer", minimum: 1 },
                    },
                    additionalProperties: false,
                },
                response: {
                    201: {
                        type: "object",
                        properties: {
                            success: { type: "boolean" },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { analytics, version } = request.body as {
                analytics: boolean;
                version: number;
            };

            await prisma.cookieConsent.create({
                data: {
                    userId: request.userId,
                    analytics,
                    version,
                },
            });

            return reply.status(201).send({ success: true });
        },
    );
}
