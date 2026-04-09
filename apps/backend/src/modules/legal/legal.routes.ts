import { type FastifyInstance } from "fastify";
import { authGuard, adminGuard, emailVerifiedGuard } from "@/middleware/index.js";
import { auditLog } from "@/modules/audit/audit.service.js";
import {
    getPublishedLegalLinks,
    getPublishedLegalDocument,
    listLegalDocuments,
    getLegalDocument,
    updateLegalDocument,
    toggleLegalDocumentPublished,
} from "./legal.service.js";

export async function legalRoutes(app: FastifyInstance) {
    // ══════════════════════════════════════════════
    // Public Routes (no auth required)
    // ══════════════════════════════════════════════

    /** List all published legal document links (for footer) */
    app.get("/api/legal", async () => {
        const links = await getPublishedLegalLinks();
        return { success: true, data: links };
    });

    /** Get a single published legal document by key */
    app.get("/api/legal/:key", async (request) => {
        const { key } = request.params as { key: string };
        const locale = (request.query as Record<string, string>).locale || "en";
        const doc = await getPublishedLegalDocument(key, locale);
        return { success: true, data: doc };
    });

    // ══════════════════════════════════════════════
    // Admin Routes (auth + admin required)
    // ══════════════════════════════════════════════

    app.register(async (adminApp) => {
        adminApp.addHook("onRequest", authGuard);
        adminApp.addHook("onRequest", emailVerifiedGuard);
        adminApp.addHook("onRequest", adminGuard);

        /** List all legal documents (admin view) */
        adminApp.get("/api/admin/legal", async () => {
            const docs = await listLegalDocuments();
            return { success: true, data: docs };
        });

        /** Get single legal document for editing */
        adminApp.get("/api/admin/legal/:key", async (request) => {
            const { key } = request.params as { key: string };
            const doc = await getLegalDocument(key);
            return { success: true, data: doc };
        });

        /** Update a legal document */
        adminApp.put("/api/admin/legal/:key", async (request) => {
            const { key } = request.params as { key: string };
            const body = request.body as Record<string, unknown>;
            const doc = await updateLegalDocument(
                key,
                {
                    title: body.title as string | undefined,
                    titleDe: body.titleDe as string | undefined,
                    content: body.content as string | undefined,
                    contentDe: body.contentDe as string | undefined,
                    metadata: body.metadata as Record<string, unknown> | null | undefined,
                    sortOrder: body.sortOrder as number | undefined,
                },
                request.userId,
            );
            await auditLog(
                request.userId,
                "legal.update",
                "LegalDocument",
                doc.id,
                { key },
                request.ip,
            );
            return { success: true, data: doc };
        });

        /** Toggle published state */
        adminApp.post("/api/admin/legal/:key/toggle", async (request) => {
            const { key } = request.params as { key: string };
            const doc = await toggleLegalDocumentPublished(key, request.userId);
            await auditLog(
                request.userId,
                doc.isPublished ? "legal.publish" : "legal.unpublish",
                "LegalDocument",
                doc.id,
                { key, isPublished: doc.isPublished },
                request.ip,
            );
            return { success: true, data: doc };
        });
    });
}
