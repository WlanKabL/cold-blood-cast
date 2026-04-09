import { prisma } from "@/config/database.js";
import { Prisma } from "@prisma/client";
import { ErrorCodes, notFound, badRequest } from "@/helpers/errors.js";
import {
    LEGAL_DOCUMENT_KEYS,
    type LegalDocumentKeyConst,
    type ImpressumMetadata,
} from "@cold-blood-cast/shared";

// ─── Variable Replacement ────────────────────────────────────

/** Replace {{KEY}} placeholders using impressum metadata as the variable source. */
async function replaceLegalVariables(content: string): Promise<string> {
    const impressum = await prisma.legalDocument.findUnique({
        where: { key: "impressum" },
        select: { metadata: true },
    });

    const meta = (impressum?.metadata ?? {}) as Partial<ImpressumMetadata>;
    const address = [meta.street, `${meta.zip ?? ""} ${meta.city ?? ""}`.trim(), meta.country]
        .filter(Boolean)
        .join("\n");

    const vars: Record<string, string> = {
        OPERATOR_NAME: meta.ownerName || meta.companyName || "",
        OPERATOR_ADDRESS: address,
        CONTACT_EMAIL: meta.email || "",
        PHONE_NUMBER: meta.phone || "",
        VAT_ID: meta.vatId || "",
        WEBSITE_URL: meta.websiteUrl || "https://cold-blood-cast.app",
    };

    return content.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => vars[key] ?? `{{${key}}}`);
}

// ─── Public Queries ──────────────────────────────────────────

/** Get all published legal document links (key + titles only) */
export async function getPublishedLegalLinks() {
    return prisma.legalDocument.findMany({
        where: { isPublished: true },
        select: { key: true, title: true, titleDe: true },
        orderBy: { sortOrder: "asc" },
    });
}

/** Get a single published legal document by key */
export async function getPublishedLegalDocument(key: string, locale: string) {
    const doc = await prisma.legalDocument.findUnique({
        where: { key },
        select: {
            key: true,
            title: true,
            titleDe: true,
            content: true,
            contentDe: true,
            metadata: true,
            isPublished: true,
            updatedAt: true,
        },
    });

    if (!doc || !doc.isPublished) {
        throw notFound(ErrorCodes.E_NOT_FOUND, "Legal document not found");
    }

    const isGerman = locale === "de" || locale === "de-DE";
    const rawContent = isGerman ? doc.contentDe : doc.content;
    return {
        key: doc.key,
        title: isGerman ? doc.titleDe : doc.title,
        content: rawContent ? await replaceLegalVariables(rawContent) : rawContent,
        metadata: doc.metadata,
        updatedAt: doc.updatedAt.toISOString(),
    };
}

// ─── Admin Queries ───────────────────────────────────────────

/** Get all legal documents (admin — includes unpublished) */
export async function listLegalDocuments() {
    return prisma.legalDocument.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
            updater: { select: { username: true } },
        },
    });
}

/** Get single legal document for admin editing */
export async function getLegalDocument(key: string) {
    const doc = await prisma.legalDocument.findUnique({
        where: { key },
        include: {
            updater: { select: { username: true } },
        },
    });

    if (!doc) {
        throw notFound(ErrorCodes.E_NOT_FOUND, `Legal document "${key}" not found`);
    }

    return doc;
}

/** Update a legal document's content/metadata */
export async function updateLegalDocument(
    key: string,
    data: {
        title?: string;
        titleDe?: string;
        content?: string;
        contentDe?: string;
        metadata?: Record<string, unknown> | null;
        sortOrder?: number;
    },
    updatedBy: string,
) {
    if (!LEGAL_DOCUMENT_KEYS.includes(key as LegalDocumentKeyConst)) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, `Invalid legal document key: ${key}`);
    }

    const existing = await prisma.legalDocument.findUnique({ where: { key } });
    if (!existing) {
        throw notFound(ErrorCodes.E_NOT_FOUND, `Legal document "${key}" not found`);
    }

    const updateData: Prisma.LegalDocumentUncheckedUpdateInput = { updatedBy };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.titleDe !== undefined) updateData.titleDe = data.titleDe;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.contentDe !== undefined) updateData.contentDe = data.contentDe;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.metadata !== undefined) {
        updateData.metadata =
            data.metadata === null ? Prisma.JsonNull : (data.metadata as Prisma.InputJsonValue);
    }

    return prisma.legalDocument.update({
        where: { key },
        data: updateData,
    });
}

/** Toggle published status */
export async function toggleLegalDocumentPublished(key: string, updatedBy: string) {
    if (!LEGAL_DOCUMENT_KEYS.includes(key as LegalDocumentKeyConst)) {
        throw badRequest(ErrorCodes.E_VALIDATION_ERROR, `Invalid legal document key: ${key}`);
    }

    const doc = await prisma.legalDocument.findUnique({ where: { key } });
    if (!doc) {
        throw notFound(ErrorCodes.E_NOT_FOUND, `Legal document "${key}" not found`);
    }

    return prisma.legalDocument.update({
        where: { key },
        data: {
            isPublished: !doc.isPublished,
            updatedBy,
        },
    });
}
