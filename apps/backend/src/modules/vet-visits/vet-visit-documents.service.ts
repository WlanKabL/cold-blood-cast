import type { MultipartFile } from "@fastify/multipart";
import type { FastifyBaseLogger } from "fastify";
import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";
import { uploadFile, deleteUpload, ALLOWED_MIME_DOCUMENTS } from "@/modules/uploads/uploads.service.js";

const DOCUMENT_INCLUDE = {
    upload: { select: { id: true, url: true } },
} as const;

// ─── Helpers ─────────────────────────────────────────────

async function assertVisitOwnership(visitId: string, userId: string) {
    const visit = await prisma.vetVisit.findUnique({
        where: { id: visitId },
        select: { userId: true },
    });
    if (!visit || visit.userId !== userId) {
        throw notFound(ErrorCodes.E_VET_VISIT_NOT_FOUND, "Vet visit not found");
    }
}

async function getDocumentWithOwnershipCheck(docId: string, userId: string) {
    const doc = await prisma.vetVisitDocument.findUnique({
        where: { id: docId },
        include: {
            vetVisit: { select: { userId: true } },
            ...DOCUMENT_INCLUDE,
        },
    });
    if (!doc || doc.vetVisit.userId !== userId) {
        throw notFound(ErrorCodes.E_VET_VISIT_DOCUMENT_NOT_FOUND, "Document not found");
    }
    return doc;
}

// ─── List Documents ──────────────────────────────────────

export async function listVetVisitDocuments(visitId: string, userId: string) {
    await assertVisitOwnership(visitId, userId);

    return prisma.vetVisitDocument.findMany({
        where: { vetVisitId: visitId },
        include: DOCUMENT_INCLUDE,
        orderBy: { createdAt: "desc" },
    });
}

// ─── Add Document ────────────────────────────────────────

export async function addVetVisitDocument(
    visitId: string,
    userId: string,
    file: MultipartFile,
    opts: { label?: string },
    log?: FastifyBaseLogger,
) {
    await assertVisitOwnership(visitId, userId);

    const upload = await uploadFile(
        userId,
        file,
        { caption: opts.label, subDir: "vetDocs", allowedMime: ALLOWED_MIME_DOCUMENTS },
        log,
    );

    return prisma.vetVisitDocument.create({
        data: {
            vetVisitId: visitId,
            uploadId: upload.id,
            label: opts.label ?? null,
        },
        include: DOCUMENT_INCLUDE,
    });
}

// ─── Update Document Label ───────────────────────────────

export async function updateVetVisitDocument(
    docId: string,
    userId: string,
    data: { label?: string },
) {
    await getDocumentWithOwnershipCheck(docId, userId);

    return prisma.vetVisitDocument.update({
        where: { id: docId },
        data: {
            ...(data.label !== undefined ? { label: data.label } : {}),
        },
        include: DOCUMENT_INCLUDE,
    });
}

// ─── Delete Document ─────────────────────────────────────

export async function deleteVetVisitDocument(docId: string, userId: string) {
    const doc = await getDocumentWithOwnershipCheck(docId, userId);

    await deleteUpload(userId, doc.upload.id);
    await prisma.vetVisitDocument.delete({ where: { id: docId } });
}
