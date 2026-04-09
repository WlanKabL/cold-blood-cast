import { prisma } from "../db/client.js";
import { notFound } from "../helpers/errors.js";
import type { Prisma } from "../generated/prisma/client.js";

export async function listLegalDocuments() {
    return prisma.legalDocument.findMany({
        orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
    });
}

export async function getLegalDocumentByKey(key: string) {
    const doc = await prisma.legalDocument.findUnique({ where: { key } });
    if (!doc) throw notFound("Legal document not found");
    return doc;
}

export async function getLegalDocument(id: string) {
    const doc = await prisma.legalDocument.findUnique({ where: { id } });
    if (!doc) throw notFound("Legal document not found");
    return doc;
}

export async function upsertLegalDocument(data: {
    key: string;
    title: string;
    titleDe: string;
    content: string;
    contentDe: string;
    isPublished?: boolean;
    sortOrder?: number;
    metadata?: Prisma.InputJsonValue;
    updatedBy: string;
}) {
    return prisma.legalDocument.upsert({
        where: { key: data.key },
        update: {
            title: data.title,
            titleDe: data.titleDe,
            content: data.content,
            contentDe: data.contentDe,
            isPublished: data.isPublished,
            sortOrder: data.sortOrder,
            metadata: data.metadata,
            updater: { connect: { id: data.updatedBy } },
        },
        create: {
            key: data.key,
            title: data.title,
            titleDe: data.titleDe,
            content: data.content,
            contentDe: data.contentDe,
            isPublished: data.isPublished ?? false,
            sortOrder: data.sortOrder ?? 0,
            metadata: data.metadata,
            updater: { connect: { id: data.updatedBy } },
        },
    });
}

export async function updateLegalDocument(
    id: string,
    data: {
        title?: string;
        titleDe?: string;
        content?: string;
        contentDe?: string;
        isPublished?: boolean;
        sortOrder?: number;
        metadata?: Prisma.InputJsonValue;
        updatedBy?: string;
    },
) {
    const existing = await prisma.legalDocument.findUnique({ where: { id } });
    if (!existing) throw notFound("Legal document not found");

    const { updatedBy, ...rest } = data;
    return prisma.legalDocument.update({
        where: { id },
        data: {
            ...rest,
            ...(updatedBy ? { updater: { connect: { id: updatedBy } } } : {}),
        },
    });
}

export async function getPublishedLegalDocuments() {
    return prisma.legalDocument.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
    });
}
