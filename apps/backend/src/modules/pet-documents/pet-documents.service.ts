import type { MultipartFile } from "@fastify/multipart";
import type { FastifyBaseLogger } from "fastify";
import type { PetDocumentCategory } from "@prisma/client";
import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";
import {
    uploadFile,
    deleteUpload,
    ALLOWED_MIME_DOCUMENTS,
} from "@/modules/uploads/uploads.service.js";

const DOCUMENT_INCLUDE = {
    upload: { select: { id: true, url: true, originalName: true } },
} as const;

// ─── Helpers ─────────────────────────────────────────────

async function assertPetOwnership(petId: string, userId: string) {
    const pet = await prisma.pet.findUnique({
        where: { id: petId },
        select: { userId: true },
    });
    if (!pet || pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_NOT_FOUND, "Pet not found");
    }
}

async function getDocumentWithOwnershipCheck(docId: string, userId: string) {
    const doc = await prisma.petDocument.findUnique({
        where: { id: docId },
        include: {
            pet: { select: { userId: true } },
            ...DOCUMENT_INCLUDE,
        },
    });
    if (!doc || doc.pet.userId !== userId) {
        throw notFound(ErrorCodes.E_PET_DOCUMENT_NOT_FOUND, "Document not found");
    }
    return doc;
}

// ─── List Documents ──────────────────────────────────────

export async function listPetDocuments(
    petId: string,
    userId: string,
    opts?: { category?: PetDocumentCategory },
) {
    await assertPetOwnership(petId, userId);

    const where: { petId: string; category?: PetDocumentCategory } = { petId };
    if (opts?.category) {
        where.category = opts.category;
    }

    return prisma.petDocument.findMany({
        where,
        include: DOCUMENT_INCLUDE,
        orderBy: { createdAt: "desc" },
    });
}

// ─── Add Document ────────────────────────────────────────

export async function addPetDocument(
    petId: string,
    userId: string,
    file: MultipartFile,
    opts: { category?: PetDocumentCategory; label?: string; notes?: string; documentDate?: string },
    log?: FastifyBaseLogger,
) {
    await assertPetOwnership(petId, userId);

    const upload = await uploadFile(
        userId,
        file,
        { caption: opts.label, subDir: "petDocs", allowedMime: ALLOWED_MIME_DOCUMENTS },
        log,
    );

    return prisma.petDocument.create({
        data: {
            petId,
            userId,
            uploadId: upload.id,
            category: opts.category ?? "OTHER",
            label: opts.label ?? null,
            notes: opts.notes ?? null,
            documentDate: opts.documentDate ? new Date(opts.documentDate) : null,
        },
        include: DOCUMENT_INCLUDE,
    });
}

// ─── Update Document ─────────────────────────────────────

export async function updatePetDocument(
    docId: string,
    userId: string,
    data: { category?: PetDocumentCategory; label?: string; notes?: string; documentDate?: string },
) {
    await getDocumentWithOwnershipCheck(docId, userId);

    return prisma.petDocument.update({
        where: { id: docId },
        data: {
            ...(data.category !== undefined ? { category: data.category } : {}),
            ...(data.label !== undefined ? { label: data.label } : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
            ...(data.documentDate !== undefined
                ? { documentDate: data.documentDate ? new Date(data.documentDate) : null }
                : {}),
        },
        include: DOCUMENT_INCLUDE,
    });
}

// ─── Delete Document ─────────────────────────────────────

export async function deletePetDocument(docId: string, userId: string) {
    const doc = await getDocumentWithOwnershipCheck(docId, userId);

    // Delete document record first to remove FK, then delete Upload.
    // Reversing this causes a 500: Upload's onDelete:Cascade would
    // cascade-delete the document, making the subsequent delete() fail.
    await prisma.petDocument.delete({ where: { id: docId } });
    await deleteUpload(userId, doc.upload.id);
}
