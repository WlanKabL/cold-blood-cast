/**
 * Admin Email Routes — send emails, preview templates, view email log
 *
 * All routes require auth + admin role.
 * Prefix: /api/admin/emails
 */

import { type FastifyInstance } from "fastify";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { badRequest, notFound, ErrorCodes } from "@/helpers/errors.js";
import { sendMail } from "./mail.service.js";
import {
    welcomeTemplate,
    accountApprovedTemplate,
    accountBannedTemplate,
    accountRejectedTemplate,
    pendingReviewTemplate,
    accessRequestTemplate,
    accessRequestRejectedTemplate,
    inviteCodeTemplate,
    verifyEmailTemplate,
    passwordResetTemplate,
    customMailTemplate,
    weeklyCareDigestTemplate,
} from "./templates/index.js";
import { getWeekEvents } from "@/modules/weekly-planner/weekly-planner.service.js";
import type { EmailTemplate } from "@cold-blood-cast/shared";

// ─── Template Registry ───────────────────────────────────────

interface TemplateField {
    key: string;
    label: string;
    required: boolean;
    defaultValue?: string;
    type?: "text" | "textarea";
}

interface TemplateRegistryEntry {
    label: string;
    defaultSubject: string;
    fields: TemplateField[];
    generate: (data: Record<string, string>) => string;
}

function frontendUrl(path = ""): string {
    return `${env().CORS_ORIGIN}${path}`;
}

// ─── Variable Interpolation ──────────────────────────────────

/** System-level variables available in every template via {{varName}} */
interface VariableInfo {
    key: string;
    label: string;
    description: string;
    example: string;
    category: "system" | "user";
}

const SYSTEM_VARIABLES: VariableInfo[] = [
    {
        key: "appName",
        label: "App Name",
        description: "Application name",
        example: "KeeperLog",
        category: "system",
    },
    {
        key: "frontendUrl",
        label: "Frontend URL",
        description: "Link to the web app",
        example: "https://cold-blood-cast.app",
        category: "system",
    },
    {
        key: "date",
        label: "Date",
        description: "Current date (localized)",
        example: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        category: "system",
    },
    {
        key: "year",
        label: "Year",
        description: "Current year",
        example: String(new Date().getFullYear()),
        category: "system",
    },
];

const USER_VARIABLES: VariableInfo[] = [
    {
        key: "username",
        label: "Username",
        description: "Recipient's username",
        example: "Keeper",
        category: "user",
    },
    {
        key: "email",
        label: "Email",
        description: "Recipient's email address",
        example: "joe@example.com",
        category: "user",
    },
];

function getSystemValues(): Record<string, string> {
    return {
        appName: "KeeperLog",
        frontendUrl: env().CORS_ORIGIN,
        date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        year: String(new Date().getFullYear()),
    };
}

/**
 * Replace {{variable}} placeholders in a string.
 * Variables come from: system values + template field data + optional user context.
 */
function interpolate(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
        return variables[key] ?? `{{${key}}}`;
    });
}

const TEMPLATE_REGISTRY: Record<EmailTemplate, TemplateRegistryEntry> = {
    welcome: {
        label: "Welcome",
        defaultSubject: "Welcome to KeeperLog",
        fields: [{ key: "username", label: "Username", required: true }],
        generate: (data) =>
            welcomeTemplate({
                username: data.username ?? "Keeper",
                loginUrl: frontendUrl("/login"),
            }),
    },
    account_approved: {
        label: "Account Approved",
        defaultSubject: "Your KeeperLog account has been approved",
        fields: [{ key: "username", label: "Username", required: true }],
        generate: (data) =>
            accountApprovedTemplate({
                username: data.username ?? "Keeper",
                loginUrl: frontendUrl("/login"),
            }),
    },
    account_banned: {
        label: "Account Banned",
        defaultSubject: "Your KeeperLog account has been suspended",
        fields: [
            { key: "username", label: "Username", required: true },
            { key: "reason", label: "Reason", required: false },
            {
                key: "supportEmail",
                label: "Support Email",
                required: false,
                defaultValue: "support@cold-blood-cast.app",
            },
        ],
        generate: (data) =>
            accountBannedTemplate({
                username: data.username ?? "Keeper",
                reason: data.reason || undefined,
                supportEmail: data.supportEmail || undefined,
            }),
    },
    invite_code: {
        label: "Invite Code",
        defaultSubject: "Your KeeperLog invite code",
        fields: [
            { key: "inviteCode", label: "Invite Code", required: true },
            { key: "invitedBy", label: "Invited By", required: false },
            { key: "maxUses", label: "Max Uses", required: false },
            { key: "expiresAt", label: "Expires At", required: false },
        ],
        generate: (data) => {
            const code = data.inviteCode ?? "XXXX-XXXX";
            const registerUrl = `${frontendUrl("/register")}?invite=${encodeURIComponent(code)}&email={{email}}`;
            return inviteCodeTemplate({
                inviteCode: code,
                registerUrl,
                invitedBy: data.invitedBy || undefined,
                maxUses: data.maxUses ? parseInt(data.maxUses, 10) : undefined,
                expiresAt: data.expiresAt || undefined,
            });
        },
    },
    verify_email: {
        label: "Verify Email",
        defaultSubject: "Verify your KeeperLog email",
        fields: [
            { key: "username", label: "Username", required: true },
            { key: "code", label: "Verification Code", required: false },
            {
                key: "expiresInMinutes",
                label: "Expires (minutes)",
                required: false,
                defaultValue: "30",
            },
        ],
        generate: (data) =>
            verifyEmailTemplate({
                username: data.username ?? "Keeper",
                verifyUrl: frontendUrl("/verify"),
                code: data.code || undefined,
                expiresInMinutes: parseInt(data.expiresInMinutes ?? "30", 10) || 30,
            }),
    },
    password_reset: {
        label: "Password Reset",
        defaultSubject: "Reset your KeeperLog password",
        fields: [
            { key: "username", label: "Username", required: true },
            {
                key: "expiresInMinutes",
                label: "Expires (minutes)",
                required: false,
                defaultValue: "15",
            },
        ],
        generate: (data) =>
            passwordResetTemplate({
                username: data.username ?? "Keeper",
                resetUrl: frontendUrl("/reset-password"),
                expiresInMinutes: parseInt(data.expiresInMinutes ?? "15", 10) || 15,
            }),
    },
    custom: {
        label: "Custom Mail",
        defaultSubject: "Message from KeeperLog",
        fields: [
            { key: "heading", label: "Heading", required: false },
            { key: "body", label: "Body", required: true, type: "textarea" },
        ],
        generate: (data) =>
            customMailTemplate({
                heading: data.heading || undefined,
                body: data.body ?? "",
            }),
    },
    account_rejected: {
        label: "Account Rejected",
        defaultSubject: "Your KeeperLog registration has been declined",
        fields: [
            { key: "username", label: "Username", required: true },
            {
                key: "supportEmail",
                label: "Support Email",
                required: false,
                defaultValue: "support@cold-blood-cast.app",
            },
        ],
        generate: (data) =>
            accountRejectedTemplate({
                username: data.username ?? "Keeper",
                supportEmail: data.supportEmail || undefined,
            }),
    },
    pending_review: {
        label: "Pending Review",
        defaultSubject: "Your KeeperLog registration is under review",
        fields: [{ key: "username", label: "Username", required: true }],
        generate: (data) =>
            pendingReviewTemplate({
                username: data.username ?? "Keeper",
            }),
    },
    access_request: {
        label: "Access Request",
        defaultSubject: "New access request for KeeperLog",
        fields: [
            { key: "email", label: "Requester Email", required: true },
            { key: "reason", label: "Reason", required: false },
        ],
        generate: (data) =>
            accessRequestTemplate({
                email: data.email ?? "unknown@example.com",
                reason: data.reason || undefined,
                adminUrl: frontendUrl("/admin/access-requests"),
            }),
    },
    access_request_rejected: {
        label: "Access Request Rejected",
        defaultSubject: "Your KeeperLog access request",
        fields: [
            { key: "email", label: "Requester Email", required: true },
            {
                key: "supportEmail",
                label: "Support Email",
                required: false,
                defaultValue: "support@cold-blood-cast.app",
            },
        ],
        generate: (data) =>
            accessRequestRejectedTemplate({
                email: data.email ?? "unknown@example.com",
                supportEmail: data.supportEmail || undefined,
            }),
    },
};

// ─── Routes ──────────────────────────────────────────────────

export async function emailAdminRoutes(app: FastifyInstance): Promise<void> {
    app.addHook("onRequest", authGuard);
    app.addHook("onRequest", emailVerifiedGuard);
    app.addHook("onRequest", adminGuard);

    // ── GET /templates — list available templates + fields ────
    app.get("/templates", async () => {
        const templates = Object.entries(TEMPLATE_REGISTRY).map(([key, entry]) => ({
            key,
            label: entry.label,
            defaultSubject: entry.defaultSubject,
            fields: entry.fields,
        }));
        return { success: true, data: { templates } };
    });

    // ── GET /variables — list all available interpolation variables
    app.get("/variables", async () => {
        return {
            success: true,
            data: {
                system: SYSTEM_VARIABLES,
                user: USER_VARIABLES,
            },
        };
    });

    // ── GET / — paginated email log ──────────────────────────
    app.get("/", async (request) => {
        const query = request.query as {
            page?: string;
            limit?: string;
            template?: string;
            status?: string;
            search?: string;
        };

        const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "25", 10) || 25));
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (query.template) where.template = query.template;
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { to: { contains: query.search, mode: "insensitive" } },
                { subject: { contains: query.search, mode: "insensitive" } },
                { user: { username: { contains: query.search, mode: "insensitive" } } },
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.emailLog.findMany({
                where,
                orderBy: { sentAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, username: true, email: true } },
                },
            }),
            prisma.emailLog.count({ where }),
        ]);

        return {
            success: true,
            data: {
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        };
    });

    // ── POST /preview — render template without sending ──────
    app.post("/preview", async (request) => {
        const body = request.body as {
            template: string;
            templateData?: Record<string, string>;
            subject?: string;
        };

        if (!body.template) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "template is required");
        }

        const entry = TEMPLATE_REGISTRY[body.template as EmailTemplate];
        if (!entry) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, `Unknown template: ${body.template}`);
        }

        // Merge defaults into templateData
        const data: Record<string, string> = {};
        for (const field of entry.fields) {
            if (field.defaultValue) data[field.key] = field.defaultValue;
        }
        Object.assign(data, body.templateData ?? {});

        const rawHtml = entry.generate(data);
        const rawSubject = body.subject || entry.defaultSubject;

        // Interpolate {{variables}} in both HTML and subject
        // For preview, use template data values or placeholders for user vars
        const vars: Record<string, string> = {
            ...getSystemValues(),
            ...data,
            username: data.username || "Username",
            email: data.email || "user@example.com",
        };
        const html = interpolate(rawHtml, vars);
        const subject = interpolate(rawSubject, vars);

        return { success: true, data: { html, subject } };
    });

    // ── POST /send — send email(s), supports multi-user ──────
    app.post("/send", async (request) => {
        const body = request.body as {
            to?: string;
            userId?: string;
            userIds?: string[];
            template: string;
            subject?: string;
            templateData?: Record<string, string>;
        };

        if (!body.template) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "template is required");
        }

        const entry = TEMPLATE_REGISTRY[body.template as EmailTemplate];
        if (!entry) {
            throw badRequest(ErrorCodes.E_VALIDATION_ERROR, `Unknown template: ${body.template}`);
        }

        const emailSubject = body.subject || entry.defaultSubject;
        const hasUsernameField = entry.fields.some((f) => f.key === "username");

        // Helper: merge defaults + caller data, optionally override username
        function buildTemplateData(username?: string): Record<string, string> {
            const data: Record<string, string> = {};
            for (const field of entry.fields) {
                if (field.defaultValue) data[field.key] = field.defaultValue;
            }
            Object.assign(data, body.templateData ?? {});
            if (username && hasUsernameField && !body.templateData?.username) {
                data.username = username;
            }
            return data;
        }

        // ── Multi-user send ──────────────────────────────────
        if (body.userIds && body.userIds.length > 0) {
            const users = await prisma.user.findMany({
                where: { id: { in: body.userIds } },
                select: { id: true, email: true, username: true },
            });

            const results: Array<{ to: string; username: string; sent: boolean }> = [];

            for (const user of users) {
                const data = buildTemplateData(user.username);
                const vars = {
                    ...getSystemValues(),
                    ...data,
                    username: user.username,
                    email: user.email,
                };
                const html = interpolate(entry.generate(data), vars);
                const finalSubject = interpolate(emailSubject, vars);
                const sent = await sendMail({
                    to: user.email,
                    subject: finalSubject,
                    html,
                    log: {
                        userId: user.id,
                        template: body.template,
                        sentBy: request.userId,
                    },
                });
                results.push({ to: user.email, username: user.username, sent });
            }

            const totalSent = results.filter((r) => r.sent).length;
            return {
                success: true,
                data: { results, totalSent, totalFailed: results.length - totalSent },
            };
        }

        // ── Single recipient ─────────────────────────────────
        let recipientEmail: string;
        let recipientUserId: string | undefined;
        let recipientUsername: string | undefined;

        if (body.userId) {
            const user = await prisma.user.findUnique({
                where: { id: body.userId },
                select: { id: true, email: true, username: true },
            });
            if (!user) {
                throw notFound(ErrorCodes.E_USER_NOT_FOUND, "User not found");
            }
            recipientEmail = user.email;
            recipientUserId = user.id;
            recipientUsername = user.username;
        } else if (body.to) {
            recipientEmail = body.to;
        } else {
            throw badRequest(
                ErrorCodes.E_VALIDATION_ERROR,
                "Either 'to', 'userId', or 'userIds' is required",
            );
        }

        const data = buildTemplateData(recipientUsername);
        const vars = {
            ...getSystemValues(),
            ...data,
            ...(recipientUsername ? { username: recipientUsername } : {}),
            ...(recipientEmail ? { email: recipientEmail } : {}),
        };
        const html = interpolate(entry.generate(data), vars);
        const finalSubject = interpolate(emailSubject, vars);

        const sent = await sendMail({
            to: recipientEmail,
            subject: finalSubject,
            html,
            log: {
                userId: recipientUserId,
                template: body.template,
                sentBy: request.userId,
            },
        });

        return {
            success: true,
            data: {
                results: [
                    { to: recipientEmail, username: recipientUsername ?? recipientEmail, sent },
                ],
                totalSent: sent ? 1 : 0,
                totalFailed: sent ? 0 : 1,
            },
        };
    });

    // ── POST /test-digest — send weekly digest preview to admin ──
    app.post("/test-digest", async (request) => {
        const admin = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { id: true, email: true, username: true, locale: true },
        });

        if (!admin) {
            throw notFound(ErrorCodes.E_USER_NOT_FOUND, "Admin user not found");
        }

        const now = new Date();
        const day = now.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setUTCDate(monday.getUTCDate() + diff);
        monday.setUTCHours(0, 0, 0, 0);

        const days = await getWeekEvents(admin.id, monday);

        const locale = admin.locale || "en";
        const start = monday;
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
        const loc = locale === "de" ? "de-DE" : "en-US";
        const weekLabel = `${start.toLocaleDateString(loc, opts)} – ${end.toLocaleDateString(loc, opts)}`;

        const html = weeklyCareDigestTemplate({
            username: admin.username,
            days,
            weekLabel,
            plannerUrl: `${env().CORS_ORIGIN}/planner`,
            locale,
        });

        const subject =
            locale === "de"
                ? `[Test] Wochenplaner – ${weekLabel}`
                : `[Test] Weekly Digest – ${weekLabel}`;

        const sent = await sendMail({
            to: admin.email,
            subject,
            html,
            log: {
                userId: admin.id,
                template: "weekly_care_digest",
                sentBy: request.userId,
            },
        });

        return {
            success: true,
            data: { sent, to: admin.email },
        };
    });
}
