import crypto from "crypto";
import { prisma } from "../db/client.js";
import { badRequest, notFound, conflict } from "../helpers/errors.js";
import { sendMail } from "./mail.service.js";
import {
    accessRequestTemplate,
    accessRequestRejectedTemplate,
    inviteCodeTemplate,
} from "./mail/templates.js";
import { env } from "../config.js";

export async function createAccessRequest(email: string, reason?: string): Promise<{ id: string }> {
    const existing = await prisma.accessRequest.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, status: "pending" },
    });
    if (existing) {
        throw conflict("An access request for this email is already pending");
    }

    const request = await prisma.accessRequest.create({
        data: { email: email.toLowerCase(), reason },
    });

    // Notify admins (send to all admin users) - fire-and-forget
    const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { email: true },
    });
    for (const admin of admins) {
        void sendMail({
            to: admin.email,
            subject: "New access request — Cold Blood Cast",
            html: accessRequestTemplate({ email, reason }),
            log: { template: "access_request" },
        });
    }

    return { id: request.id };
}

export async function listAccessRequests(status?: string): Promise<
    Array<{
        id: string;
        email: string;
        reason: string | null;
        status: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        createdAt: Date;
    }>
> {
    return prisma.accessRequest.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
    });
}

export async function reviewAccessRequest(
    id: string,
    decision: "approved" | "rejected",
    reviewedBy: string,
): Promise<void> {
    const request = await prisma.accessRequest.findUnique({ where: { id } });
    if (!request) throw notFound("Access request not found");
    if (request.status !== "pending") throw badRequest("Access request has already been reviewed");

    await prisma.accessRequest.update({
        where: { id },
        data: {
            status: decision,
            reviewedBy,
            reviewedAt: new Date(),
        },
    });

    if (decision === "approved") {
        // Generate a single-use invite code for the approved user
        const code = crypto.randomBytes(6).toString("hex").toUpperCase();
        await prisma.inviteCode.create({
            data: {
                code,
                createdBy: reviewedBy,
                label: `Access request: ${request.email}`,
                maxUses: 1,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        const registerUrl = `${env().FRONTEND_URL}/register?invite=${code}`;

        void sendMail({
            to: request.email,
            subject: "Your access to Cold Blood Cast has been approved!",
            html: inviteCodeTemplate({
                email: request.email,
                inviteCode: code,
                registerUrl,
            }),
            log: { template: "invite_code" },
        });
    } else {
        void sendMail({
            to: request.email,
            subject: "Access request update — Cold Blood Cast",
            html: accessRequestRejectedTemplate({ email: request.email }),
            log: { template: "access_request_rejected" },
        });
    }
}
