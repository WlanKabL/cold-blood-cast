import type { FastifyInstance } from "fastify";
import { authGuard, emailVerifiedGuard } from "@/middleware/auth.js";
import {
    getSubscriptionAvailability,
    getUserSubscription,
    createCheckoutSession,
    createPortalSession,
    handleWebhookEvent,
    isStripeEnabled,
} from "./subscription.service.js";
import { badRequest, ErrorCodes } from "@/helpers/errors.js";

export async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
    // Public: check if payments are enabled
    app.get("/availability", async () => {
        const result = await getSubscriptionAvailability();
        return { success: true, data: result };
    });

    // Authenticated: get current user subscription
    app.get("/me", { preHandler: [authGuard] }, async (request) => {
        const data = await getUserSubscription(request.userId);
        return { success: true, data };
    });

    // Authenticated: create Stripe Checkout Session
    app.post("/checkout", { preHandler: [authGuard, emailVerifiedGuard] }, async (request) => {
        if (!isStripeEnabled()) {
            throw badRequest(ErrorCodes.E_FEATURE_DISABLED, "Payments are not currently available");
        }

        const { plan } = request.body as { plan: string };
        if (!plan) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Plan is required");
        }

        const checkoutUrl = await createCheckoutSession(
            request.userId,
            plan as
                | "premium_monthly"
                | "premium_yearly"
                | "pro_monthly"
                | "pro_yearly"
                | "pro_lifetime",
        );
        return { success: true, data: { checkoutUrl } };
    });

    // Authenticated: create Stripe Customer Portal session
    app.post("/portal", { preHandler: [authGuard, emailVerifiedGuard] }, async (request) => {
        if (!isStripeEnabled()) {
            throw badRequest(ErrorCodes.E_FEATURE_DISABLED, "Payments are not currently available");
        }

        const portalUrl = await createPortalSession(request.userId);
        return { success: true, data: { portalUrl } };
    });

    // Stripe Webhook — no auth, raw body required
    app.post("/webhook", { config: { rawBody: true } }, async (request, reply) => {
        const signature = request.headers["stripe-signature"] as string;
        if (!signature) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Missing stripe-signature header");
        }

        // Fastify rawBody support
        const rawBody = (request as unknown as { rawBody: Buffer }).rawBody;
        if (!rawBody) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Missing raw body");
        }

        await handleWebhookEvent(rawBody, signature);
        return reply.code(200).send({ received: true });
    });
}
