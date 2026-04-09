import { type FastifyInstance } from "fastify";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import {
    createAccessRequest,
    listAccessRequests,
    reviewAccessRequest,
    deleteAccessRequest,
} from "./access-requests.service.js";

export async function accessRequestRoutes(app: FastifyInstance) {
    // Public: submit an access request (no auth needed)
    app.post("/", async (request, reply) => {
        const body = request.body as { email?: string; reason?: string };

        if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            return reply.status(400).send({
                success: false,
                error: { code: "E_VALIDATION_ERROR", message: "A valid email is required" },
            });
        }

        const result = await createAccessRequest(body.email, body.reason);
        return reply.status(201).send({ success: true, data: { id: result.id } });
    });

    // Admin routes
    app.register(async (adminApp) => {
        adminApp.addHook("onRequest", authGuard);
        adminApp.addHook("onRequest", emailVerifiedGuard);
        adminApp.addHook("onRequest", adminGuard);

        adminApp.get("/", async (request) => {
            const { status } = request.query as { status?: string };
            const requests = await listAccessRequests(status);
            return { success: true, data: requests };
        });

        adminApp.post("/:id/review", async (request, reply) => {
            const { id } = request.params as { id: string };
            const { action } = request.body as { action: "approved" | "rejected" };

            if (!action || !["approved", "rejected"].includes(action)) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: "E_VALIDATION_ERROR",
                        message: "action must be 'approved' or 'rejected'",
                    },
                });
            }

            const result = await reviewAccessRequest(id, action, request.userId);
            return { success: true, data: result };
        });

        adminApp.delete("/:id", async (request) => {
            const { id } = request.params as { id: string };
            await deleteAccessRequest(id);
            return { success: true, data: null };
        });
    });
}
