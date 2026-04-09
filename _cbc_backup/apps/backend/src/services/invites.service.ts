import { prisma } from "../db/client.js";
import { notFound, badRequest } from "../helpers/errors.js";

export async function listInviteCodes() {
    return prisma.inviteCode.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { usages: true } } },
    });
}

export async function createInviteCode(data: {
    code: string;
    createdBy: string;
    label?: string;
    maxUses?: number;
    expiresAt?: Date;
}) {
    const existing = await prisma.inviteCode.findUnique({ where: { code: data.code } });
    if (existing) throw badRequest("Invite code already exists");

    return prisma.inviteCode.create({
        data: {
            code: data.code,
            createdBy: data.createdBy,
            label: data.label,
            maxUses: data.maxUses ?? 1,
            expiresAt: data.expiresAt,
        },
    });
}

export async function deactivateInviteCode(id: string) {
    const code = await prisma.inviteCode.findUnique({ where: { id } });
    if (!code) throw notFound("Invite code not found");
    return prisma.inviteCode.update({ where: { id }, data: { active: false } });
}

export async function deleteInviteCode(id: string) {
    const code = await prisma.inviteCode.findUnique({ where: { id } });
    if (!code) throw notFound("Invite code not found");
    await prisma.inviteCode.delete({ where: { id } });
}

export async function validateAndUseInviteCode(code: string, userId: string): Promise<boolean> {
    const invite = await prisma.inviteCode.findUnique({ where: { code } });
    if (!invite || !invite.active) return false;
    if (invite.expiresAt && invite.expiresAt < new Date()) return false;
    if (invite.uses >= invite.maxUses) return false;

    await prisma.$transaction([
        prisma.inviteCode.update({
            where: { id: invite.id },
            data: { uses: { increment: 1 } },
        }),
        prisma.inviteCodeUse.create({
            data: { inviteCodeId: invite.id, userId },
        }),
    ]);

    return true;
}
