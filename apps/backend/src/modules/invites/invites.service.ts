import { prisma } from "@/config/database.js";
import { randomBytes } from "node:crypto";
import { badRequest, notFound, ErrorCodes } from "@/helpers/errors.js";

// ─── Generate a unique random code ──────────────────────────

function generateCode(length = 10): string {
    return randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length)
        .toUpperCase();
}

// ─── Create invite code ───────────────────────────────────────

export async function createInviteCode(data: {
    createdBy: string;
    label?: string;
    maxUses?: number;
    expiresAt?: Date | null;
}) {
    let code: string;
    let attempts = 0;

    // Collision-safe generation
    do {
        code = generateCode(10);
        const existing = await prisma.inviteCode.findUnique({ where: { code } });
        if (!existing) break;
        attempts++;
    } while (attempts < 5);

    return prisma.inviteCode.create({
        data: {
            code: code!,
            createdBy: data.createdBy,
            label: data.label,
            maxUses: data.maxUses ?? 1,
            expiresAt: data.expiresAt ?? null,
        },
    });
}

// ─── List all invite codes ────────────────────────────────────

export async function listInviteCodes() {
    const codes = await prisma.inviteCode.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            usages: {
                select: { userId: true, usedAt: true },
            },
        },
    });

    return codes;
}

// ─── Revoke invite code ──────────────────────────────────────

export async function revokeInviteCode(id: string) {
    const code = await prisma.inviteCode.findUnique({ where: { id } });
    if (!code) throw notFound(ErrorCodes.E_NOT_FOUND, "Invite code not found");

    return prisma.inviteCode.update({
        where: { id },
        data: { active: false },
    });
}

// ─── Delete invite code ───────────────────────────────

export async function deleteInviteCode(id: string) {
    const code = await prisma.inviteCode.findUnique({ where: { id } });
    if (!code) throw notFound(ErrorCodes.E_NOT_FOUND, "Invite code not found");

    return prisma.inviteCode.delete({ where: { id } });
}

// ─── Validate & consume invite code (used during registration) ─

export async function validateAndConsumeInviteCode(rawCode: string, userId: string): Promise<void> {
    const code = await prisma.inviteCode.findUnique({ where: { code: rawCode.toUpperCase() } });

    if (!code || !code.active) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid or expired invite code");
    }

    if (code.expiresAt && code.expiresAt < new Date()) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "This invite code has expired");
    }

    if (code.uses >= code.maxUses) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, "This invite code has been fully used");
    }

    await prisma.$transaction([
        prisma.inviteCode.update({
            where: { id: code.id },
            data: {
                uses: { increment: 1 },
                // Auto-deactivate when max uses reached
                active: code.uses + 1 < code.maxUses,
            },
        }),
        prisma.inviteCodeUse.create({
            data: {
                inviteCodeId: code.id,
                userId,
            },
        }),
    ]);
}

// ─── Public: check if code is (still) valid ──────────────────

export async function checkInviteCode(
    rawCode: string,
): Promise<{ valid: boolean; label?: string | null }> {
    const code = await prisma.inviteCode.findUnique({
        where: { code: rawCode.toUpperCase() },
    });

    if (!code || !code.active) return { valid: false };
    if (code.expiresAt && code.expiresAt < new Date()) return { valid: false };
    if (code.uses >= code.maxUses) return { valid: false };

    return { valid: true, label: code.label };
}
