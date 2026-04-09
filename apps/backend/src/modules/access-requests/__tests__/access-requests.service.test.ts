import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────
const mockPrisma = vi.hoisted(() => ({
    accessRequest: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockCreateInviteCode = vi.hoisted(() => vi.fn());
const mockSendMail = vi.hoisted(() => vi.fn());

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));
vi.mock("@/config/env.js", () => ({
    env: () => ({ CORS_ORIGIN: "https://cold-blood-cast.app" }),
}));
vi.mock("@/helpers/errors.js", async () => {
    const actual =
        await vi.importActual<typeof import("@/helpers/errors.js")>("@/helpers/errors.js");
    return actual;
});
vi.mock("@/modules/mail/index.js", () => ({
    sendMail: mockSendMail,
    accessRequestTemplate: vi.fn(() => "<html>access</html>"),
    inviteCodeTemplate: vi.fn(() => "<html>invite</html>"),
    accessRequestRejectedTemplate: vi.fn(() => "<html>rejected</html>"),
}));
vi.mock("@/modules/invites/invites.service.js", () => ({
    createInviteCode: mockCreateInviteCode,
}));

import {
    createAccessRequest,
    listAccessRequests,
    reviewAccessRequest,
    deleteAccessRequest,
} from "../access-requests.service.js";

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks());

describe("access-requests.service", () => {
    describe("createAccessRequest", () => {
        it("creates a request and notifies admins", async () => {
            mockPrisma.accessRequest.findFirst.mockResolvedValue(null);
            mockPrisma.accessRequest.create.mockResolvedValue({
                id: "ar-1",
                email: "user@test.com",
            });

            const result = await createAccessRequest("User@Test.com", "I keep corn snakes");

            expect(mockPrisma.accessRequest.create).toHaveBeenCalledWith({
                data: { email: "user@test.com", reason: "I keep corn snakes" },
            });
            expect(mockSendMail).toHaveBeenCalled();
            expect(result.id).toBe("ar-1");
        });

        it("throws when a pending request from same email exists", async () => {
            mockPrisma.accessRequest.findFirst.mockResolvedValue({ id: "existing" });

            await expect(createAccessRequest("user@test.com")).rejects.toThrow("already pending");
        });

        it("stores null when no reason provided", async () => {
            mockPrisma.accessRequest.findFirst.mockResolvedValue(null);
            mockPrisma.accessRequest.create.mockResolvedValue({ id: "ar-2" });

            await createAccessRequest("user@test.com");

            expect(mockPrisma.accessRequest.create).toHaveBeenCalledWith({
                data: { email: "user@test.com", reason: null },
            });
        });
    });

    describe("listAccessRequests", () => {
        it("returns all requests when no filter", async () => {
            mockPrisma.accessRequest.findMany.mockResolvedValue([{ id: "ar-1" }]);

            const result = await listAccessRequests();

            expect(result).toHaveLength(1);
            expect(mockPrisma.accessRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: {} }),
            );
        });

        it("filters by status", async () => {
            mockPrisma.accessRequest.findMany.mockResolvedValue([]);

            await listAccessRequests("pending");

            expect(mockPrisma.accessRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { status: "pending" } }),
            );
        });
    });

    describe("reviewAccessRequest", () => {
        const pendingRequest = { id: "ar-1", status: "pending", email: "user@test.com" };

        it("approves a request, creates invite code, and sends email", async () => {
            mockPrisma.accessRequest.findUnique.mockResolvedValue(pendingRequest);
            mockPrisma.accessRequest.update.mockResolvedValue({
                ...pendingRequest,
                status: "approved",
            });
            mockCreateInviteCode.mockResolvedValue({ code: "INVITE123" });

            const result = await reviewAccessRequest("ar-1", "approved", "admin-1");

            expect(result.status).toBe("approved");
            expect(mockCreateInviteCode).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdBy: "admin-1",
                    maxUses: 1,
                }),
            );
            expect(mockSendMail).toHaveBeenCalled();
        });

        it("rejects a request and sends rejection email", async () => {
            mockPrisma.accessRequest.findUnique.mockResolvedValue(pendingRequest);
            mockPrisma.accessRequest.update.mockResolvedValue({
                ...pendingRequest,
                status: "rejected",
            });

            const result = await reviewAccessRequest("ar-1", "rejected", "admin-1");

            expect(result.status).toBe("rejected");
            expect(mockCreateInviteCode).not.toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalled();
        });

        it("throws when request not found", async () => {
            mockPrisma.accessRequest.findUnique.mockResolvedValue(null);

            await expect(reviewAccessRequest("nope", "approved", "admin-1")).rejects.toThrow(
                "not found",
            );
        });

        it("throws when request is already reviewed", async () => {
            mockPrisma.accessRequest.findUnique.mockResolvedValue({
                ...pendingRequest,
                status: "approved",
            });

            await expect(reviewAccessRequest("ar-1", "approved", "admin-1")).rejects.toThrow(
                "already been reviewed",
            );
        });
    });

    describe("deleteAccessRequest", () => {
        it("deletes an existing request", async () => {
            mockPrisma.accessRequest.findUnique.mockResolvedValue({ id: "ar-1" });
            mockPrisma.accessRequest.delete.mockResolvedValue({ id: "ar-1" });

            await deleteAccessRequest("ar-1");

            expect(mockPrisma.accessRequest.delete).toHaveBeenCalledWith({
                where: { id: "ar-1" },
            });
        });

        it("throws notFound for non-existent request", async () => {
            mockPrisma.accessRequest.findUnique.mockResolvedValue(null);

            await expect(deleteAccessRequest("nope")).rejects.toThrow("not found");
        });
    });
});
