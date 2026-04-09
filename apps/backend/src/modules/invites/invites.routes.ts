import { type FastifyInstance } from "fastify";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { env } from "@/config/env.js";
import {
    createInviteCode,
    listInviteCodes,
    revokeInviteCode,
    deleteInviteCode,
    checkInviteCode,
} from "./invites.service.js";
import { sendMail, inviteCodeTemplate } from "@/modules/mail/index.js";

export async function inviteRoutes(app: FastifyInstance) {
    // ── Public: validate a code (no auth needed) ──────────
    app.get("/check/:code", async (request, reply) => {
        const { code } = request.params as { code: string };
        const result = await checkInviteCode(code);
        return reply.send({ success: true, data: result });
    });

    // ── Admin routes ───────────────────────────────────────
    app.register(async (adminApp) => {
        adminApp.addHook("onRequest", authGuard);
        adminApp.addHook("onRequest", emailVerifiedGuard);
        adminApp.addHook("onRequest", adminGuard);

        // List all invite codes
        adminApp.get("/", async (_request, reply) => {
            const codes = await listInviteCodes();
            return reply.send({ success: true, data: codes });
        });

        // Create a new invite code
        adminApp.post("/", async (request, reply) => {
            const userId = (request as { userId?: string }).userId;
            const username = (request as { username?: string }).username;
            const body = request.body as {
                label?: string;
                maxUses?: number;
                expiresAt?: string | null;
                email?: string;
            };

            const code = await createInviteCode({
                createdBy: userId ?? "system",
                label: body.label,
                maxUses: body.maxUses,
                expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            });

            if (body.email) {
                const registerUrl = `${env().CORS_ORIGIN}/register?invite=${code.code}&email=${encodeURIComponent(body.email)}`;
                void sendMail({
                    to: body.email,
                    subject: "You've been invited to KeeperLog!",
                    html: inviteCodeTemplate({
                        inviteCode: code.code,
                        registerUrl,
                        invitedBy: username,
                        maxUses: code.maxUses > 1 ? code.maxUses : undefined,
                        expiresAt: code.expiresAt?.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }),
                    }),
                    log: { template: "invite_code", sentBy: userId },
                });
            }

            return reply.status(201).send({ success: true, data: code });
        });

        // Revoke (soft-disable) a code
        adminApp.patch("/:id/revoke", async (request, reply) => {
            const { id } = request.params as { id: string };
            const code = await revokeInviteCode(id);
            return reply.send({ success: true, data: code });
        });

        // Delete a code permanently
        adminApp.delete("/:id", async (request) => {
            const { id } = request.params as { id: string };
            await deleteInviteCode(id);
            return { success: true, data: null };
        });
    });
}
