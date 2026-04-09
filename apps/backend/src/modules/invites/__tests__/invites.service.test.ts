import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ─────────────────────────────────────────────
const mockPrisma = vi.hoisted(() => ({
    inviteCode: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    inviteCodeUse: {
        create: vi.fn(),
    },
    $transaction: vi.fn(),
}));

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));
vi.mock("@/helpers/errors.js", async () => {
    const actual =
        await vi.importActual<typeof import("@/helpers/errors.js")>("@/helpers/errors.js");
    return actual;
});

import {
    createInviteCode,
    listInviteCodes,
    revokeInviteCode,
    deleteInviteCode,
    validateAndConsumeInviteCode,
    checkInviteCode,
} from "../invites.service.js";

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks());

describe("invites.service", () => {
    describe("createInviteCode", () => {
        it("creates an invite code with collision check", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue(null);
            mockPrisma.inviteCode.create.mockResolvedValue({ id: "inv-1", code: "ABC123" });

            const result = await createInviteCode({ createdBy: "user-1", label: "Test" });

            expect(mockPrisma.inviteCode.findUnique).toHaveBeenCalled();
            expect(mockPrisma.inviteCode.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        createdBy: "user-1",
                        label: "Test",
                        maxUses: 1,
                        expiresAt: null,
                    }),
                }),
            );
            expect(result).toEqual({ id: "inv-1", code: "ABC123" });
        });

        it("uses provided maxUses and expiresAt", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue(null);
            mockPrisma.inviteCode.create.mockResolvedValue({ id: "inv-2" });

            const exp = new Date("2025-12-31");
            await createInviteCode({ createdBy: "user-1", maxUses: 5, expiresAt: exp });

            expect(mockPrisma.inviteCode.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ maxUses: 5, expiresAt: exp }),
                }),
            );
        });

        it("retries on code collision up to 5 attempts", async () => {
            // First 3 calls find existing codes, 4th is clean
            mockPrisma.inviteCode.findUnique
                .mockResolvedValueOnce({ id: "existing-1" })
                .mockResolvedValueOnce({ id: "existing-2" })
                .mockResolvedValueOnce({ id: "existing-3" })
                .mockResolvedValueOnce(null);
            mockPrisma.inviteCode.create.mockResolvedValue({ id: "inv-3" });

            await createInviteCode({ createdBy: "user-1" });

            expect(mockPrisma.inviteCode.findUnique).toHaveBeenCalledTimes(4);
            expect(mockPrisma.inviteCode.create).toHaveBeenCalled();
        });
    });

    describe("listInviteCodes", () => {
        it("returns all invite codes with usages", async () => {
            const codes = [{ id: "inv-1", code: "ABC", usages: [] }];
            mockPrisma.inviteCode.findMany.mockResolvedValue(codes);

            const result = await listInviteCodes();

            expect(result).toEqual(codes);
            expect(mockPrisma.inviteCode.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ orderBy: { createdAt: "desc" } }),
            );
        });
    });

    describe("revokeInviteCode", () => {
        it("deactivates an existing code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({ id: "inv-1" });
            mockPrisma.inviteCode.update.mockResolvedValue({ id: "inv-1", active: false });

            const result = await revokeInviteCode("inv-1");

            expect(mockPrisma.inviteCode.update).toHaveBeenCalledWith({
                where: { id: "inv-1" },
                data: { active: false },
            });
            expect(result.active).toBe(false);
        });

        it("throws notFound for non-existent code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue(null);

            await expect(revokeInviteCode("nope")).rejects.toThrow();
        });
    });

    describe("deleteInviteCode", () => {
        it("deletes an existing code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({ id: "inv-1" });
            mockPrisma.inviteCode.delete.mockResolvedValue({ id: "inv-1" });

            await deleteInviteCode("inv-1");

            expect(mockPrisma.inviteCode.delete).toHaveBeenCalledWith({ where: { id: "inv-1" } });
        });

        it("throws notFound for non-existent code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue(null);

            await expect(deleteInviteCode("nope")).rejects.toThrow();
        });
    });

    describe("validateAndConsumeInviteCode", () => {
        const activeCode = {
            id: "inv-1",
            code: "ABC12345AB",
            active: true,
            expiresAt: null,
            uses: 0,
            maxUses: 3,
        };

        it("consumes a valid code and increments uses", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({ ...activeCode });
            mockPrisma.$transaction.mockResolvedValue([]);

            await validateAndConsumeInviteCode("abc12345ab", "user-1");

            expect(mockPrisma.inviteCode.findUnique).toHaveBeenCalledWith({
                where: { code: "ABC12345AB" },
            });
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });

        it("throws for inactive code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({ ...activeCode, active: false });

            await expect(validateAndConsumeInviteCode("ABC", "user-1")).rejects.toThrow(
                "Invalid or expired invite code",
            );
        });

        it("throws for expired code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({
                ...activeCode,
                expiresAt: new Date("2020-01-01"),
            });

            await expect(validateAndConsumeInviteCode("ABC", "user-1")).rejects.toThrow("expired");
        });

        it("throws when max uses reached", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({
                ...activeCode,
                uses: 3,
                maxUses: 3,
            });

            await expect(validateAndConsumeInviteCode("ABC", "user-1")).rejects.toThrow(
                "fully used",
            );
        });

        it("case-insensitive code lookup", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({ ...activeCode });
            mockPrisma.$transaction.mockResolvedValue([]);

            await validateAndConsumeInviteCode("abc12345ab", "user-1");

            expect(mockPrisma.inviteCode.findUnique).toHaveBeenCalledWith({
                where: { code: "ABC12345AB" },
            });
        });
    });

    describe("checkInviteCode", () => {
        it("returns valid:true for active, non-expired, unused code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({
                active: true,
                expiresAt: null,
                uses: 0,
                maxUses: 5,
                label: "Beta",
            });

            const result = await checkInviteCode("CODE123");

            expect(result).toEqual({ valid: true, label: "Beta" });
        });

        it("returns valid:false for unknown code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue(null);

            const result = await checkInviteCode("NOPE");

            expect(result).toEqual({ valid: false });
        });

        it("returns valid:false for expired code", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({
                active: true,
                expiresAt: new Date("2020-01-01"),
                uses: 0,
                maxUses: 5,
            });

            const result = await checkInviteCode("EXPIRED");

            expect(result).toEqual({ valid: false });
        });

        it("returns valid:false when max uses reached", async () => {
            mockPrisma.inviteCode.findUnique.mockResolvedValue({
                active: true,
                expiresAt: null,
                uses: 5,
                maxUses: 5,
            });

            const result = await checkInviteCode("FULL");

            expect(result).toEqual({ valid: false });
        });
    });
});
