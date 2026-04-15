import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { AppError, ErrorCodes, badRequest, notFound } from "@/helpers/errors.js";
import type Stripe from "stripe";

type SubscriptionPlan =
    | "free"
    | "premium_monthly"
    | "premium_yearly"
    | "pro_monthly"
    | "pro_yearly"
    | "pro_lifetime";

const PLAN_PRICE_MAP: Record<Exclude<SubscriptionPlan, "free">, () => string | undefined> = {
    premium_monthly: () => env().STRIPE_PRICE_PREMIUM_MONTHLY,
    premium_yearly: () => env().STRIPE_PRICE_PREMIUM_YEARLY,
    pro_monthly: () => env().STRIPE_PRICE_PRO_MONTHLY,
    pro_yearly: () => env().STRIPE_PRICE_PRO_YEARLY,
    pro_lifetime: () => env().STRIPE_PRICE_PRO_LIFETIME,
};

const PLAN_ROLE_MAP: Record<string, string> = {
    premium_monthly: "PREMIUM",
    premium_yearly: "PREMIUM",
    pro_monthly: "PRO",
    pro_yearly: "PRO",
    pro_lifetime: "PRO",
};

const SUBSCRIPTION_ROLES = ["PREMIUM", "PRO"];

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
    if (_stripe) return _stripe;
    const key = env().STRIPE_SECRET_KEY;
    if (!key) {
        throw badRequest(ErrorCodes.E_FEATURE_DISABLED, "Stripe is not configured");
    }
    // Dynamic import avoided — stripe is a peer dep
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StripeConstructor = require("stripe").default || require("stripe");
    _stripe = new StripeConstructor(key, { apiVersion: "2025-05-28.basil" }) as Stripe;
    return _stripe;
}

export function isStripeEnabled(): boolean {
    const e = env();
    return e.STRIPE_PAYMENT_ACTIVE && !!e.STRIPE_SECRET_KEY && !!e.STRIPE_WEBHOOK_SECRET;
}

export async function getSubscriptionAvailability(): Promise<{ paymentsActive: boolean }> {
    return { paymentsActive: isStripeEnabled() };
}

export async function getUserSubscription(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return { plan: "free", status: "active" };

    // If Stripe is enabled and there's a subscription ID, sync status from Stripe
    if (isStripeEnabled() && sub.stripeSubscriptionId) {
        try {
            const stripe = getStripe();
            const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
            const firstItem = stripeSub.items.data[0];
            const currentPeriodStart = firstItem?.current_period_start
                ? new Date(firstItem.current_period_start * 1000)
                : null;
            const currentPeriodEnd = firstItem?.current_period_end
                ? new Date(firstItem.current_period_end * 1000)
                : null;
            if (
                stripeSub.status !== sub.status ||
                stripeSub.cancel_at_period_end !== sub.cancelAtPeriodEnd ||
                (currentPeriodStart?.getTime() ?? null) !==
                    (sub.currentPeriodStart?.getTime() ?? null) ||
                (currentPeriodEnd?.getTime() ?? null) !== (sub.currentPeriodEnd?.getTime() ?? null)
            ) {
                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: {
                        status: stripeSub.status,
                        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                        currentPeriodStart,
                        currentPeriodEnd,
                    },
                });
            }
        } catch {
            // Stripe not reachable — use cached data
        }
    }

    return {
        plan: sub.plan,
        status: sub.status,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        currentPeriodEnd: sub.currentPeriodEnd,
    };
}

async function ensureStripeCustomer(userId: string): Promise<string> {
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing?.stripeCustomerId) return existing.stripeCustomerId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
    });
    if (!user) throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");

    const stripe = getStripe();
    const customer = await stripe.customers.create({
        email: user.email,
        metadata: { keeperlog_user_id: userId, username: user.username },
    });

    await prisma.subscription.upsert({
        where: { userId },
        create: { userId, stripeCustomerId: customer.id, plan: "free", status: "active" },
        update: { stripeCustomerId: customer.id },
    });

    return customer.id;
}

export async function createCheckoutSession(
    userId: string,
    plan: SubscriptionPlan,
): Promise<string> {
    if (plan === "free") {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Cannot checkout for free plan");
    }

    const priceGetter = PLAN_PRICE_MAP[plan];
    if (!priceGetter) throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid plan");
    const priceId = priceGetter();
    if (!priceId) throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Plan not configured");

    // Check for existing active paid subscription
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing && existing.plan !== "free" && existing.status === "active") {
        throw new AppError(
            ErrorCodes.E_SUBSCRIPTION_ALREADY_EXISTS,
            409,
            "You already have an active subscription. Manage it from Settings.",
        );
    }

    const customerId = await ensureStripeCustomer(userId);
    const stripe = getStripe();
    const isLifetime = plan === "pro_lifetime";

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: isLifetime ? "payment" : "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env().FRONTEND_URL}/pricing?subscription=success`,
        cancel_url: `${env().FRONTEND_URL}/pricing?subscription=canceled`,
        metadata: { keeperlog_user_id: userId, keeperlog_plan: plan },
    });

    if (!session.url) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Failed to create checkout session");
    }
    return session.url;
}

export async function createPortalSession(userId: string): Promise<string> {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.stripeCustomerId) {
        throw notFound(ErrorCodes.E_SUBSCRIPTION_NOT_FOUND, "No subscription found");
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${env().FRONTEND_URL}/settings`,
    });

    return session.url;
}

export async function syncSubscriptionRole(userId: string, plan: string): Promise<void> {
    const roleName = PLAN_ROLE_MAP[plan];

    // Remove all subscription-related roles first
    const subRoles = await prisma.role.findMany({
        where: { name: { in: SUBSCRIPTION_ROLES } },
        select: { id: true },
    });

    await prisma.userRole.deleteMany({
        where: { userId, roleId: { in: subRoles.map((r) => r.id) } },
    });

    // Assign new role if applicable
    if (roleName) {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (role) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId, roleId: role.id } },
                create: { userId, roleId: role.id, grantedBy: "stripe" },
                update: {},
            });
        }
    }
}

export async function handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
    const stripe = getStripe();
    const webhookSecret = env().STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw badRequest(ErrorCodes.E_FEATURE_DISABLED, "Webhook secret not configured");
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
        case "checkout.session.completed":
            await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
            break;
        case "customer.subscription.updated":
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
            break;
        case "customer.subscription.deleted":
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
            break;
        case "invoice.paid":
            await handleInvoicePaid(event.data.object as Stripe.Invoice);
            break;
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.keeperlog_user_id;
    const plan = session.metadata?.keeperlog_plan;
    if (!userId || !plan) return;

    const updateData: Record<string, unknown> = {
        plan,
        status: "active",
        stripePriceId: null as string | null,
    };

    // For recurring subscriptions, store the subscription ID
    if (session.subscription) {
        const subId =
            typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;
        const stripe = getStripe();
        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const firstItem = stripeSub.items.data[0];
        updateData.stripeSubscriptionId = subId;
        updateData.stripePriceId = stripeSub.items.data[0]?.price.id ?? null;
        updateData.currentPeriodStart = firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000)
            : null;
        updateData.currentPeriodEnd = firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : null;
    }

    await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            stripeCustomerId: session.customer as string,
            ...(updateData as Record<string, string | boolean | Date | null>),
        },
        update: updateData,
    });

    await syncSubscriptionRole(userId, plan);

    // Send confirmation email
    try {
        const { sendMail } = await import("@/modules/mail/mail.service.js");
        const { subscriptionConfirmedTemplate } =
            await import("@/modules/mail/templates/subscription-confirmed.js");
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, username: true },
        });
        if (user?.email) {
            await sendMail({
                to: user.email,
                subject: "Subscription Confirmed 🎉",
                html: subscriptionConfirmedTemplate({
                    username: user.username,
                    plan,
                    baseUrl: env().FRONTEND_URL,
                }),
                log: { userId, template: "subscription-confirmed" },
            });
        }
    } catch {
        // Mail is best-effort
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
    });
    if (!sub) return;

    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start
        ? new Date(firstItem.current_period_start * 1000)
        : null;
    const currentPeriodEnd = firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000)
        : null;

    await prisma.subscription.update({
        where: { id: sub.id },
        data: {
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodStart,
            currentPeriodEnd,
        },
    });

    if (subscription.cancel_at_period_end) {
        try {
            const { sendMail } = await import("@/modules/mail/mail.service.js");
            const { subscriptionCanceledTemplate } =
                await import("@/modules/mail/templates/subscription-canceled.js");
            const user = await prisma.user.findUnique({
                where: { id: sub.userId },
                select: { email: true, username: true },
            });
            if (user?.email) {
                await sendMail({
                    to: user.email,
                    subject: "Subscription Canceled",
                    html: subscriptionCanceledTemplate({
                        username: user.username,
                        endDate: currentPeriodEnd ? currentPeriodEnd.toLocaleDateString() : "N/A",
                        baseUrl: env().FRONTEND_URL,
                    }),
                    log: { userId: sub.userId, template: "subscription-canceled" },
                });
            }
        } catch {
            // Mail is best-effort
        }
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
    });
    if (!sub) return;

    await prisma.subscription.update({
        where: { id: sub.id },
        data: {
            plan: "free",
            status: "canceled",
            stripeSubscriptionId: null,
            stripePriceId: null,
        },
    });

    await syncSubscriptionRole(sub.userId, "free");
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subRef = invoice.parent?.subscription_details?.subscription;
    const subId = typeof subRef === "string" ? subRef : subRef?.id;
    if (!subId) return;

    const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subId },
    });
    if (!sub) return;

    await prisma.subscription.update({
        where: { id: sub.id },
        data: {
            status: "active",
            currentPeriodStart: invoice.period_start
                ? new Date(invoice.period_start * 1000)
                : undefined,
            currentPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
        },
    });
}
