import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { badRequest, notFound, ErrorCodes } from "@/helpers/errors.js";
import {
    sendMail,
    accessRequestTemplate,
    inviteCodeTemplate,
    accessRequestRejectedTemplate,
} from "@/modules/mail/index.js";
import { createInviteCode } from "@/modules/invites/invites.service.js";

export async function createAccessRequest(email: string, reason?: string) {
    // Check for existing pending request from this email
    const existing = await prisma.accessRequest.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, status: "pending" },
    });
    if (existing) {
        throw badRequest(
            ErrorCodes.E_VALIDATION_ERROR,
            "A request from this email is already pending",
        );
    }

    const request = await prisma.accessRequest.create({
        data: {
            email: email.toLowerCase(),
            reason: reason || null,
        },
    });

    // Notify admins via email (fire-and-forget)
    const adminUrl = `${env().CORS_ORIGIN}/admin/access-requests`;
    void sendMail({
        to: "access@cold-blood-cast.app",
        subject: `New access request from ${email}`,
        html: accessRequestTemplate({ email, reason, adminUrl }),
        log: { template: "access_request" },
    });

    return request;
}

export async function listAccessRequests(status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    return prisma.accessRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
}

export async function reviewAccessRequest(
    requestId: string,
    action: "approved" | "rejected",
    reviewedBy: string,
) {
    const request = await prisma.accessRequest.findUnique({ where: { id: requestId } });
    if (!request) throw notFound(ErrorCodes.E_NOT_FOUND, "Access request not found");
    if (request.status !== "pending") {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "This request has already been reviewed");
    }

    const updated = await prisma.accessRequest.update({
        where: { id: requestId },
        data: {
            status: action,
            reviewedBy,
            reviewedAt: new Date(),
        },
    });

    if (action === "approved") {
        // Generate a single-use invite code and send it to the requester
        const code = await createInviteCode({
            createdBy: reviewedBy,
            label: `Access request: ${request.email}`,
            maxUses: 1,
        });

        const registerUrl = `${env().CORS_ORIGIN}/register?invite=${code.code}&email=${encodeURIComponent(request.email)}`;
        void sendMail({
            to: request.email,
            subject: "Your KeeperLog invite code",
            html: inviteCodeTemplate({
                inviteCode: code.code,
                registerUrl,
            }),
            log: { template: "invite_code", userId: reviewedBy },
        });
    } else {
        // Notify the requester that their request was declined
        void sendMail({
            to: request.email,
            subject: "Your KeeperLog access request",
            html: accessRequestRejectedTemplate({
                email: request.email,
                supportEmail: "support@cold-blood-cast.app",
            }),
            log: { template: "access_request_rejected" },
        });
    }

    return updated;
}

export async function deleteAccessRequest(requestId: string) {
    const request = await prisma.accessRequest.findUnique({ where: { id: requestId } });
    if (!request) throw notFound(ErrorCodes.E_NOT_FOUND, "Access request not found");
    return prisma.accessRequest.delete({ where: { id: requestId } });
}
