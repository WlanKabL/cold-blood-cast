import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: {
        findUnique: vi.fn(),
    },
    petDocument: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
};

const mockUploadFile = vi.fn();
const mockDeleteUpload = vi.fn();

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));
vi.mock("@/modules/uploads/uploads.service.js", () => ({
    uploadFile: mockUploadFile,
    deleteUpload: mockDeleteUpload,
    ALLOWED_MIME_DOCUMENTS: new Set([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/avif",
    ]),
}));

const {
    listPetDocuments,
    addPetDocument,
    updatePetDocument,
    deletePetDocument,
} = await import("../pet-documents.service.js");

const USER_ID = "user_123";
const PET_ID = "pet_456";
const DOC_ID = "doc_789";
const UPLOAD_ID = "upload_abc";

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listPetDocuments ──────────────────────────────────

describe("listPetDocuments", () => {
    it("returns documents for an owned pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        const docs = [
            { id: "d1", petId: PET_ID, category: "CITES" },
            { id: "d2", petId: PET_ID, category: "OTHER" },
        ];
        mockPrisma.petDocument.findMany.mockResolvedValue(docs);

        const result = await listPetDocuments(PET_ID, USER_ID);

        expect(mockPrisma.pet.findUnique).toHaveBeenCalledWith({
            where: { id: PET_ID },
            select: { userId: true },
        });
        expect(mockPrisma.petDocument.findMany).toHaveBeenCalledWith({
            where: { petId: PET_ID },
            include: { upload: { select: { id: true, url: true, originalName: true } } },
            orderBy: { createdAt: "desc" },
        });
        expect(result).toEqual(docs);
    });

    it("filters by category when provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.petDocument.findMany.mockResolvedValue([]);

        await listPetDocuments(PET_ID, USER_ID, { category: "CITES" });

        expect(mockPrisma.petDocument.findMany).toHaveBeenCalledWith({
            where: { petId: PET_ID, category: "CITES" },
            include: { upload: { select: { id: true, url: true, originalName: true } } },
            orderBy: { createdAt: "desc" },
        });
    });

    it("throws notFound for non-owned pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(listPetDocuments(PET_ID, USER_ID)).rejects.toThrow("Pet not found");
    });

    it("throws notFound for non-existent pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);

        await expect(listPetDocuments(PET_ID, USER_ID)).rejects.toThrow("Pet not found");
    });
});

// ─── addPetDocument ────────────────────────────────────

describe("addPetDocument", () => {
    const mockFile = {} as Parameters<typeof addPetDocument>[2];

    it("uploads file and creates document record", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockUploadFile.mockResolvedValue({ id: UPLOAD_ID });
        const createdDoc = {
            id: DOC_ID,
            petId: PET_ID,
            userId: USER_ID,
            uploadId: UPLOAD_ID,
            category: "CITES",
            label: "CITES certificate",
            notes: null,
            documentDate: null,
        };
        mockPrisma.petDocument.create.mockResolvedValue(createdDoc);

        const result = await addPetDocument(PET_ID, USER_ID, mockFile, {
            category: "CITES",
            label: "CITES certificate",
        });

        expect(mockUploadFile).toHaveBeenCalledWith(
            USER_ID,
            mockFile,
            { caption: "CITES certificate", subDir: "petDocs", allowedMime: expect.any(Set) },
            undefined,
        );
        expect(mockPrisma.petDocument.create).toHaveBeenCalledWith({
            data: {
                petId: PET_ID,
                userId: USER_ID,
                uploadId: UPLOAD_ID,
                category: "CITES",
                label: "CITES certificate",
                notes: null,
                documentDate: null,
            },
            include: { upload: { select: { id: true, url: true, originalName: true } } },
        });
        expect(result).toEqual(createdDoc);
    });

    it("defaults category to OTHER when not provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockUploadFile.mockResolvedValue({ id: UPLOAD_ID });
        mockPrisma.petDocument.create.mockResolvedValue({ id: DOC_ID });

        await addPetDocument(PET_ID, USER_ID, mockFile, {});

        expect(mockPrisma.petDocument.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ category: "OTHER" }),
            }),
        );
    });

    it("stores documentDate when provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockUploadFile.mockResolvedValue({ id: UPLOAD_ID });
        mockPrisma.petDocument.create.mockResolvedValue({ id: DOC_ID });
        const iso = "2025-01-15T00:00:00.000Z";

        await addPetDocument(PET_ID, USER_ID, mockFile, { documentDate: iso });

        expect(mockPrisma.petDocument.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ documentDate: new Date(iso) }),
            }),
        );
    });

    it("throws for non-owned pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(addPetDocument(PET_ID, USER_ID, mockFile, {})).rejects.toThrow("Pet not found");
        expect(mockUploadFile).not.toHaveBeenCalled();
    });
});

// ─── updatePetDocument ─────────────────────────────────

describe("updatePetDocument", () => {
    it("updates label and notes", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
            upload: { id: UPLOAD_ID, url: "/uploads/petDocs/test.pdf" },
        });
        const updated = { id: DOC_ID, label: "Updated label", notes: "Some notes" };
        mockPrisma.petDocument.update.mockResolvedValue(updated);

        const result = await updatePetDocument(DOC_ID, USER_ID, {
            label: "Updated label",
            notes: "Some notes",
        });

        expect(mockPrisma.petDocument.update).toHaveBeenCalledWith({
            where: { id: DOC_ID },
            data: { label: "Updated label", notes: "Some notes" },
            include: { upload: { select: { id: true, url: true, originalName: true } } },
        });
        expect(result).toEqual(updated);
    });

    it("updates category", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
            upload: { id: UPLOAD_ID, url: "/uploads/petDocs/test.pdf" },
        });
        mockPrisma.petDocument.update.mockResolvedValue({ id: DOC_ID, category: "INSURANCE" });

        await updatePetDocument(DOC_ID, USER_ID, { category: "INSURANCE" });

        expect(mockPrisma.petDocument.update).toHaveBeenCalledWith({
            where: { id: DOC_ID },
            data: { category: "INSURANCE" },
            include: { upload: { select: { id: true, url: true, originalName: true } } },
        });
    });

    it("updates documentDate", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
            upload: { id: UPLOAD_ID, url: "/uploads/petDocs/test.pdf" },
        });
        const iso = "2025-06-15T00:00:00.000Z";
        mockPrisma.petDocument.update.mockResolvedValue({ id: DOC_ID });

        await updatePetDocument(DOC_ID, USER_ID, { documentDate: iso });

        expect(mockPrisma.petDocument.update).toHaveBeenCalledWith({
            where: { id: DOC_ID },
            data: { documentDate: new Date(iso) },
            include: { upload: { select: { id: true, url: true, originalName: true } } },
        });
    });

    it("only updates provided fields", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
            upload: { id: UPLOAD_ID, url: "/uploads/petDocs/test.pdf" },
        });
        mockPrisma.petDocument.update.mockResolvedValue({ id: DOC_ID });

        await updatePetDocument(DOC_ID, USER_ID, { label: "Only label" });

        expect(mockPrisma.petDocument.update).toHaveBeenCalledWith({
            where: { id: DOC_ID },
            data: { label: "Only label" },
            include: { upload: { select: { id: true, url: true, originalName: true } } },
        });
    });

    it("throws for non-owned document", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            pet: { userId: "other_user" },
            upload: { id: UPLOAD_ID, url: "/uploads/petDocs/test.pdf" },
        });

        await expect(
            updatePetDocument(DOC_ID, USER_ID, { label: "x" }),
        ).rejects.toThrow("Document not found");
    });

    it("throws for non-existent document", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue(null);

        await expect(
            updatePetDocument(DOC_ID, USER_ID, { label: "x" }),
        ).rejects.toThrow("Document not found");
    });
});

// ─── deletePetDocument ─────────────────────────────────

describe("deletePetDocument", () => {
    it("deletes document record first, then upload", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            petId: PET_ID,
            uploadId: UPLOAD_ID,
            pet: { userId: USER_ID },
            upload: { id: UPLOAD_ID, url: "/uploads/petDocs/test.pdf" },
        });
        mockPrisma.petDocument.delete.mockResolvedValue({ id: DOC_ID });
        mockDeleteUpload.mockResolvedValue(undefined);

        await deletePetDocument(DOC_ID, USER_ID);

        // Verify delete order: document FIRST, then upload
        const deleteCallOrder = mockPrisma.petDocument.delete.mock.invocationCallOrder[0];
        const uploadCallOrder = mockDeleteUpload.mock.invocationCallOrder[0];
        expect(deleteCallOrder).toBeLessThan(uploadCallOrder);

        expect(mockPrisma.petDocument.delete).toHaveBeenCalledWith({ where: { id: DOC_ID } });
        expect(mockDeleteUpload).toHaveBeenCalledWith(USER_ID, UPLOAD_ID);
    });

    it("throws for non-owned document", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            pet: { userId: "other_user" },
            upload: { id: UPLOAD_ID, url: "/uploads/petDocs/test.pdf" },
        });

        await expect(deletePetDocument(DOC_ID, USER_ID)).rejects.toThrow("Document not found");
        expect(mockPrisma.petDocument.delete).not.toHaveBeenCalled();
        expect(mockDeleteUpload).not.toHaveBeenCalled();
    });

    it("throws for non-existent document", async () => {
        mockPrisma.petDocument.findUnique.mockResolvedValue(null);

        await expect(deletePetDocument(DOC_ID, USER_ID)).rejects.toThrow("Document not found");
        expect(mockPrisma.petDocument.delete).not.toHaveBeenCalled();
    });
});
