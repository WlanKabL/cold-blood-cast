import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    vetVisit: {
        findUnique: vi.fn(),
    },
    vetVisitDocument: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
    },
};

const mockUploadFile = vi.fn();
const mockDeleteUpload = vi.fn();

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));
vi.mock("@/modules/uploads/uploads.service.js", () => ({
    uploadFile: mockUploadFile,
    deleteUpload: mockDeleteUpload,
    ALLOWED_MIME_DOCUMENTS: new Set([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/avif",
        "application/pdf",
    ]),
}));

const {
    listVetVisitDocuments,
    addVetVisitDocument,
    updateVetVisitDocument,
    deleteVetVisitDocument,
} = await import("../vet-visit-documents.service.js");

const USER_ID = "user_123";
const VISIT_ID = "visit_456";
const DOC_ID = "doc_789";
const UPLOAD_ID = "upload_abc";

const DOCUMENT_INCLUDE = {
    upload: { select: { id: true, url: true, originalName: true } },
} as const;

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listVetVisitDocuments ─────────────────────────────

describe("listVetVisitDocuments", () => {
    it("returns documents for an owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue({ userId: USER_ID });
        const docs = [
            {
                id: "d1",
                vetVisitId: VISIT_ID,
                label: "Invoice",
                upload: { id: "u1", url: "/uploads/vetDocs/a.pdf" },
            },
            {
                id: "d2",
                vetVisitId: VISIT_ID,
                label: null,
                upload: { id: "u2", url: "/uploads/vetDocs/b.jpg" },
            },
        ];
        mockPrisma.vetVisitDocument.findMany.mockResolvedValue(docs);

        const result = await listVetVisitDocuments(VISIT_ID, USER_ID);

        expect(mockPrisma.vetVisit.findUnique).toHaveBeenCalledWith({
            where: { id: VISIT_ID },
            select: { userId: true },
        });
        expect(mockPrisma.vetVisitDocument.findMany).toHaveBeenCalledWith({
            where: { vetVisitId: VISIT_ID },
            include: DOCUMENT_INCLUDE,
            orderBy: { createdAt: "desc" },
        });
        expect(result).toEqual(docs);
    });

    it("throws notFound for non-owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(listVetVisitDocuments(VISIT_ID, USER_ID)).rejects.toThrow(
            "Vet visit not found",
        );
    });

    it("throws notFound for non-existent visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(null);

        await expect(listVetVisitDocuments(VISIT_ID, USER_ID)).rejects.toThrow(
            "Vet visit not found",
        );
    });
});

// ─── addVetVisitDocument ───────────────────────────────

describe("addVetVisitDocument", () => {
    const mockFile = {} as Parameters<typeof addVetVisitDocument>[2];

    it("uploads file to vetDocs and creates document record", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue({ userId: USER_ID });
        mockUploadFile.mockResolvedValue({ id: UPLOAD_ID });
        const createdDoc = {
            id: DOC_ID,
            vetVisitId: VISIT_ID,
            uploadId: UPLOAD_ID,
            label: "Blood test",
            upload: { id: UPLOAD_ID, url: "/uploads/vetDocs/test.pdf" },
        };
        mockPrisma.vetVisitDocument.create.mockResolvedValue(createdDoc);

        const result = await addVetVisitDocument(VISIT_ID, USER_ID, mockFile, {
            label: "Blood test",
        });

        expect(mockUploadFile).toHaveBeenCalledWith(
            USER_ID,
            mockFile,
            {
                caption: "Blood test",
                subDir: "vetDocs",
                allowedMime: expect.any(Set),
            },
            undefined,
        );
        expect(mockPrisma.vetVisitDocument.create).toHaveBeenCalledWith({
            data: {
                vetVisitId: VISIT_ID,
                uploadId: UPLOAD_ID,
                label: "Blood test",
            },
            include: DOCUMENT_INCLUDE,
        });
        expect(result).toEqual(createdDoc);
    });

    it("creates document with null label when not provided", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue({ userId: USER_ID });
        mockUploadFile.mockResolvedValue({ id: UPLOAD_ID });
        mockPrisma.vetVisitDocument.create.mockResolvedValue({
            id: DOC_ID,
            label: null,
        });

        await addVetVisitDocument(VISIT_ID, USER_ID, mockFile, {});

        expect(mockUploadFile).toHaveBeenCalledWith(
            USER_ID,
            mockFile,
            {
                caption: undefined,
                subDir: "vetDocs",
                allowedMime: expect.any(Set),
            },
            undefined,
        );
        expect(mockPrisma.vetVisitDocument.create).toHaveBeenCalledWith({
            data: {
                vetVisitId: VISIT_ID,
                uploadId: UPLOAD_ID,
                label: null,
            },
            include: DOCUMENT_INCLUDE,
        });
    });

    it("throws for non-owned visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(
            addVetVisitDocument(VISIT_ID, USER_ID, mockFile, { label: "Test" }),
        ).rejects.toThrow("Vet visit not found");
        expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it("throws for non-existent visit", async () => {
        mockPrisma.vetVisit.findUnique.mockResolvedValue(null);

        await expect(addVetVisitDocument(VISIT_ID, USER_ID, mockFile, {})).rejects.toThrow(
            "Vet visit not found",
        );
        expect(mockUploadFile).not.toHaveBeenCalled();
    });
});

// ─── updateVetVisitDocument ────────────────────────────

describe("updateVetVisitDocument", () => {
    it("updates label on owned document", async () => {
        mockPrisma.vetVisitDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            vetVisit: { userId: USER_ID },
            upload: { id: UPLOAD_ID, url: "/uploads/vetDocs/test.pdf" },
        });
        const updated = {
            id: DOC_ID,
            label: "Updated label",
            upload: { id: UPLOAD_ID, url: "/uploads/vetDocs/test.pdf" },
        };
        mockPrisma.vetVisitDocument.update.mockResolvedValue(updated);

        const result = await updateVetVisitDocument(DOC_ID, USER_ID, { label: "Updated label" });

        expect(mockPrisma.vetVisitDocument.findUnique).toHaveBeenCalledWith({
            where: { id: DOC_ID },
            include: {
                vetVisit: { select: { userId: true } },
                ...DOCUMENT_INCLUDE,
            },
        });
        expect(mockPrisma.vetVisitDocument.update).toHaveBeenCalledWith({
            where: { id: DOC_ID },
            data: { label: "Updated label" },
            include: DOCUMENT_INCLUDE,
        });
        expect(result).toEqual(updated);
    });

    it("skips label update when not provided", async () => {
        mockPrisma.vetVisitDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            vetVisit: { userId: USER_ID },
            upload: { id: UPLOAD_ID, url: "/uploads/vetDocs/test.pdf" },
        });
        mockPrisma.vetVisitDocument.update.mockResolvedValue({ id: DOC_ID });

        await updateVetVisitDocument(DOC_ID, USER_ID, {});

        expect(mockPrisma.vetVisitDocument.update).toHaveBeenCalledWith({
            where: { id: DOC_ID },
            data: {},
            include: DOCUMENT_INCLUDE,
        });
    });

    it("throws for non-owned document", async () => {
        mockPrisma.vetVisitDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            vetVisit: { userId: "other_user" },
            upload: { id: UPLOAD_ID, url: "/uploads/vetDocs/test.pdf" },
        });

        await expect(updateVetVisitDocument(DOC_ID, USER_ID, { label: "x" })).rejects.toThrow(
            "Document not found",
        );
    });

    it("throws for non-existent document", async () => {
        mockPrisma.vetVisitDocument.findUnique.mockResolvedValue(null);

        await expect(updateVetVisitDocument(DOC_ID, USER_ID, { label: "x" })).rejects.toThrow(
            "Document not found",
        );
    });
});

// ─── deleteVetVisitDocument ────────────────────────────

describe("deleteVetVisitDocument", () => {
    it("deletes document record first, then upload (avoids cascade conflict)", async () => {
        mockPrisma.vetVisitDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            vetVisit: { userId: USER_ID },
            upload: { id: UPLOAD_ID, url: "/uploads/vetDocs/test.pdf" },
        });
        mockDeleteUpload.mockResolvedValue(undefined);
        mockPrisma.vetVisitDocument.delete.mockResolvedValue({ id: DOC_ID });

        await deleteVetVisitDocument(DOC_ID, USER_ID);

        expect(mockPrisma.vetVisitDocument.delete).toHaveBeenCalledWith({
            where: { id: DOC_ID },
        });
        expect(mockDeleteUpload).toHaveBeenCalledWith(USER_ID, UPLOAD_ID);

        // Verify order: document.delete called before upload.delete
        const deleteOrder = mockPrisma.vetVisitDocument.delete.mock.invocationCallOrder[0];
        const uploadOrder = mockDeleteUpload.mock.invocationCallOrder[0];
        expect(deleteOrder).toBeLessThan(uploadOrder);
    });

    it("throws for non-owned document", async () => {
        mockPrisma.vetVisitDocument.findUnique.mockResolvedValue({
            id: DOC_ID,
            vetVisit: { userId: "other_user" },
            upload: { id: UPLOAD_ID, url: "/uploads/vetDocs/test.pdf" },
        });

        await expect(deleteVetVisitDocument(DOC_ID, USER_ID)).rejects.toThrow("Document not found");
        expect(mockDeleteUpload).not.toHaveBeenCalled();
    });

    it("throws for non-existent document", async () => {
        mockPrisma.vetVisitDocument.findUnique.mockResolvedValue(null);

        await expect(deleteVetVisitDocument(DOC_ID, USER_ID)).rejects.toThrow("Document not found");
        expect(mockDeleteUpload).not.toHaveBeenCalled();
    });
});
