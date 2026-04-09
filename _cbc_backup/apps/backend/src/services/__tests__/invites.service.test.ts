import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();
const update = vi.fn();
const deleteFn = vi.fn();
const transaction = vi.fn();

vi.mock("../../db/client.js", () => ({
    prisma: {
        inviteCode: {
            findMany,
            findUnique,
            create,
            update,
            delete: deleteFn,
        },
        inviteCodeUse: {
            create: vi.fn(),
        },
        $transaction: (...args: unknown[]) => transaction(...args),
    },
}));

vi.mock("../../helpers/errors.js", () => ({
    notFound: (msg: string) => Object.assign(new Error(msg), { statusCode: 404 }),
    badRequest: (msg: string) => Object.assign(new Error(msg), { statusCode: 400 }),
}));

const {
    listInviteCodes,
    createInviteCode,
    deactivateInviteCode,
    deleteInviteCode,
    validateAndUseInviteCode,
} = await import("../invites.service.js");

describe("invites.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("listInviteCodes", () => {
        it("returns all invite codes ordered by createdAt desc", async () => {
            const mockCodes = [
                { id: "1", code: "ABC123", active: true },
                { id: "2", code: "DEF456", active: false },
            ];
            findMany.mockResolvedValueOnce(mockCodes);

            const result = await listInviteCodes();

            expect(result).toEqual(mockCodes);
            expect(findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
                include: { _count: { select: { usages: true } } },
            });
        });

        it("returns empty array when no codes exist", async () => {
            findMany.mockResolvedValueOnce([]);

            const result = await listInviteCodes();

            expect(result).toEqual([]);
        });
    });

    describe("createInviteCode", () => {
        it("creates a new invite code with defaults", async () => {
            findUnique.mockResolvedValueOnce(null);
            const created = { id: "1", code: "NEWCODE", maxUses: 1, uses: 0, active: true };
            create.mockResolvedValueOnce(created);

            const result = await createInviteCode({
                code: "NEWCODE",
                createdBy: "user1",
            });

            expect(result).toEqual(created);
            expect(create).toHaveBeenCalledWith({
                data: {
                    code: "NEWCODE",
                    createdBy: "user1",
                    label: undefined,
                    maxUses: 1,
                    expiresAt: undefined,
                },
            });
        });

        it("creates with label, maxUses, and expiresAt", async () => {
            findUnique.mockResolvedValueOnce(null);
            const expiresAt = new Date("2025-12-31");
            create.mockResolvedValueOnce({ id: "1", code: "LABELED", label: "Test", maxUses: 5 });

            await createInviteCode({
                code: "LABELED",
                createdBy: "admin1",
                label: "Test",
                maxUses: 5,
                expiresAt,
            });

            expect(create).toHaveBeenCalledWith({
                data: {
                    code: "LABELED",
                    createdBy: "admin1",
                    label: "Test",
                    maxUses: 5,
                    expiresAt,
                },
            });
        });

        it("throws when code already exists", async () => {
            findUnique.mockResolvedValueOnce({ id: "existing", code: "DUP" });

            await expect(
                createInviteCode({ code: "DUP", createdBy: "user1" }),
            ).rejects.toThrow("Invite code already exists");
        });
    });

    describe("deactivateInviteCode", () => {
        it("deactivates an existing code", async () => {
            findUnique.mockResolvedValueOnce({ id: "1", active: true });
            update.mockResolvedValueOnce({ id: "1", active: false });

            const result = await deactivateInviteCode("1");

            expect(result.active).toBe(false);
            expect(update).toHaveBeenCalledWith({
                where: { id: "1" },
                data: { active: false },
            });
        });

        it("throws notFound for non-existent code", async () => {
            findUnique.mockResolvedValueOnce(null);

            await expect(deactivateInviteCode("nonexistent")).rejects.toThrow("Invite code not found");
        });
    });

    describe("deleteInviteCode", () => {
        it("deletes an existing code", async () => {
            findUnique.mockResolvedValueOnce({ id: "1" });
            deleteFn.mockResolvedValueOnce({});

            await deleteInviteCode("1");

            expect(deleteFn).toHaveBeenCalledWith({ where: { id: "1" } });
        });

        it("throws notFound for non-existent code", async () => {
            findUnique.mockResolvedValueOnce(null);

            await expect(deleteInviteCode("missing")).rejects.toThrow("Invite code not found");
        });
    });

    describe("validateAndUseInviteCode", () => {
        it("returns false when code does not exist", async () => {
            findUnique.mockResolvedValueOnce(null);

            const result = await validateAndUseInviteCode("BADCODE", "user1");

            expect(result).toBe(false);
        });

        it("returns false when code is inactive", async () => {
            findUnique.mockResolvedValueOnce({ id: "1", code: "INACTIVE", active: false, maxUses: 5, uses: 0 });

            const result = await validateAndUseInviteCode("INACTIVE", "user1");

            expect(result).toBe(false);
        });

        it("returns false when code is expired", async () => {
            findUnique.mockResolvedValueOnce({
                id: "1",
                code: "EXPIRED",
                active: true,
                expiresAt: new Date("2020-01-01"),
                maxUses: 5,
                uses: 0,
            });

            const result = await validateAndUseInviteCode("EXPIRED", "user1");

            expect(result).toBe(false);
        });

        it("returns false when all uses are consumed", async () => {
            findUnique.mockResolvedValueOnce({
                id: "1",
                code: "FULL",
                active: true,
                expiresAt: null,
                maxUses: 2,
                uses: 2,
            });

            const result = await validateAndUseInviteCode("FULL", "user1");

            expect(result).toBe(false);
        });

        it("consumes a valid code and returns true", async () => {
            findUnique.mockResolvedValueOnce({
                id: "inv1",
                code: "VALID",
                active: true,
                expiresAt: null,
                maxUses: 5,
                uses: 2,
            });
            transaction.mockResolvedValueOnce([{}, {}]);

            const result = await validateAndUseInviteCode("VALID", "user1");

            expect(result).toBe(true);
            expect(transaction).toHaveBeenCalledTimes(1);
        });

        it("validates code with future expiry", async () => {
            const futureDate = new Date(Date.now() + 86400000); // tomorrow
            findUnique.mockResolvedValueOnce({
                id: "inv2",
                code: "FUTURE",
                active: true,
                expiresAt: futureDate,
                maxUses: 10,
                uses: 0,
            });
            transaction.mockResolvedValueOnce([{}, {}]);

            const result = await validateAndUseInviteCode("FUTURE", "user2");

            expect(result).toBe(true);
        });
    });
});
