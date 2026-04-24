// ─── Marketing audience export service (V3) ─────────────────
// Plan v1.7 §23 — Custom Audience preparation.
//
// Generates a CSV (or JSON) file of users matching a filter, with
// SHA-256 hashed emails (Meta-compatible identifier format) plus
// attribution context. Files are stored under uploads/marketing-exports/
// and downloadable via tokenised admin endpoint until they expire.
//
// We never persist raw emails in the export file by default — only the
// hashed identifier — so accidentally leaking the file does not leak PII.

import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import pino from "pino";
import {
    type AudienceExportFilter,
    type AudienceExportFormat,
    type AudienceExportRow,
    type AudienceExportStatus,
    type CreateAudienceExportInput,
} from "@cold-blood-cast/shared";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { getMarketingConfig } from "./marketing-config.service.js";

const log = pino({ name: "marketing-audience-export" });

function getAudienceExportsDir(): string {
    return resolve(env().UPLOAD_DIR, "marketing-exports");
}

function sha256Hex(value: string): string {
    return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function escapeCsv(value: string | null | undefined): string {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

interface AudienceCandidate {
    userId: string;
    emailHash: string;
    externalIdHash: string;
    signedUpAt: Date;
    boundAt: Date | null;
    utmSource: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    activated: boolean;
    highValueRevenue: number;
    highValueCurrency: string | null;
}

async function collectCandidates(filter: AudienceExportFilter): Promise<AudienceCandidate[]> {
    const cfg = await getMarketingConfig();
    const windowMs = cfg.activationWindowDays * 24 * 60 * 60 * 1000;
    const now = new Date();

    const users = await prisma.user.findMany({
        where: {
            ...(filter.signedUpFrom ? { createdAt: { gte: new Date(filter.signedUpFrom) } } : {}),
            ...(filter.signedUpTo ? { createdAt: { lte: new Date(filter.signedUpTo) } } : {}),
        },
        select: {
            id: true,
            email: true,
            createdAt: true,
            activationEvents: { select: { occurredAt: true, activationType: true } },
            // userAttribution is the relation name on User → check schema; we use the inverse query
        },
        orderBy: { createdAt: "desc" },
        take: 50_000, // hard safety cap
    });

    const attributions = await prisma.userAttribution.findMany({
        where: { userId: { in: users.map((u) => u.id) } },
        include: { landingAttribution: true },
    });
    const attrByUser = new Map(attributions.map((a) => [a.userId, a]));

    const highValueRows = await prisma.marketingEvent.groupBy({
        by: ["userId", "currency"],
        where: {
            userId: { in: users.map((u) => u.id) },
            eventName: { in: ["Subscribe", "Purchase"] },
            status: "sent",
            value: { not: null },
        },
        _sum: { value: true },
    });
    const hvByUser = new Map<string, { value: number; currency: string | null }>();
    for (const row of highValueRows) {
        if (!row.userId) continue;
        const prev = hvByUser.get(row.userId) ?? { value: 0, currency: row.currency };
        prev.value += row._sum.value ?? 0;
        // First currency wins; mixed currencies are reported as-is per row.
        if (!prev.currency) prev.currency = row.currency;
        hvByUser.set(row.userId, prev);
    }

    const candidates: AudienceCandidate[] = [];
    for (const user of users) {
        const attr = attrByUser.get(user.id) ?? null;

        // Filter: utm_*
        if (filter.utmSource && attr?.landingAttribution.utmSource !== filter.utmSource) continue;
        if (filter.utmCampaign && attr?.landingAttribution.utmCampaign !== filter.utmCampaign)
            continue;
        if (filter.utmContent && attr?.landingAttribution.utmContent !== filter.utmContent)
            continue;

        const activationCutoff = attr ? new Date(attr.boundAt.getTime() + windowMs) : null;
        const activated =
            !!attr &&
            user.activationEvents.some(
                (a) =>
                    a.occurredAt >= attr.boundAt &&
                    (activationCutoff ? a.occurredAt <= activationCutoff : a.occurredAt <= now),
            );

        if (filter.activatedOnly && !activated) continue;

        const hv = hvByUser.get(user.id) ?? { value: 0, currency: null };
        if (filter.highValueOnly && hv.value <= 0) continue;

        candidates.push({
            userId: user.id,
            emailHash: sha256Hex(user.email),
            externalIdHash: sha256Hex(user.id),
            signedUpAt: user.createdAt,
            boundAt: attr?.boundAt ?? null,
            utmSource: attr?.landingAttribution.utmSource ?? null,
            utmCampaign: attr?.landingAttribution.utmCampaign ?? null,
            utmContent: attr?.landingAttribution.utmContent ?? null,
            activated,
            highValueRevenue: hv.value,
            highValueCurrency: hv.currency,
        });
    }

    return candidates;
}

function renderCsv(rows: AudienceCandidate[]): string {
    const header = [
        "email_sha256",
        "external_id_sha256",
        "signed_up_at",
        "bound_at",
        "utm_source",
        "utm_campaign",
        "utm_content",
        "activated",
        "high_value_revenue",
        "high_value_currency",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
        lines.push(
            [
                r.emailHash,
                r.externalIdHash,
                r.signedUpAt.toISOString(),
                r.boundAt?.toISOString() ?? "",
                escapeCsv(r.utmSource),
                escapeCsv(r.utmCampaign),
                escapeCsv(r.utmContent),
                r.activated ? "1" : "0",
                r.highValueRevenue || "",
                escapeCsv(r.highValueCurrency),
            ].join(","),
        );
    }
    return lines.join("\n") + "\n";
}

function renderJson(rows: AudienceCandidate[]): string {
    return JSON.stringify(
        rows.map((r) => ({
            email_sha256: r.emailHash,
            external_id_sha256: r.externalIdHash,
            signed_up_at: r.signedUpAt.toISOString(),
            bound_at: r.boundAt?.toISOString() ?? null,
            utm_source: r.utmSource,
            utm_campaign: r.utmCampaign,
            utm_content: r.utmContent,
            activated: r.activated,
            high_value_revenue: r.highValueRevenue,
            high_value_currency: r.highValueCurrency,
        })),
        null,
        2,
    );
}

/**
 * Build an audience export synchronously (small enough for a single request).
 * Returns the saved row. File is written to disk; downloadToken set when ready.
 */
export async function createAudienceExport(
    input: CreateAudienceExportInput,
    createdById: string,
): Promise<AudienceExportRow> {
    const dir = getAudienceExportsDir();
    await mkdir(dir, { recursive: true });

    const id = `aex_${randomBytes(8).toString("hex")}`;
    const downloadToken = randomBytes(24).toString("hex");
    const e = env();
    const expiresAt = new Date(Date.now() + e.TRACKING_AUDIENCE_EXPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    let candidates: AudienceCandidate[];
    try {
        candidates = await collectCandidates(input.filter);
    } catch (err) {
        log.error(
            { id, err: err instanceof Error ? err.message : String(err) },
            "audience export collection failed",
        );
        const failed = await prisma.audienceExport.create({
            data: {
                id,
                name: input.name,
                format: input.format,
                filterJson: input.filter as unknown as object,
                rowCount: 0,
                status: "failed",
                error: err instanceof Error ? err.message : String(err),
                createdById,
                expiresAt,
            },
        });
        return rowToResponse(failed);
    }

    const fileName = `${id}.${input.format}`;
    const absPath = join(dir, fileName);
    const content = input.format === "csv" ? renderCsv(candidates) : renderJson(candidates);
    await writeFile(absPath, content, "utf8");

    const row = await prisma.audienceExport.create({
        data: {
            id,
            name: input.name,
            format: input.format,
            filterJson: input.filter as unknown as object,
            rowCount: candidates.length,
            filePath: absPath,
            downloadToken,
            status: "ready",
            createdById,
            expiresAt,
        },
    });

    log.info(
        { id, rowCount: candidates.length, format: input.format },
        "audience export created",
    );
    return rowToResponse(row);
}

export async function listAudienceExports(): Promise<AudienceExportRow[]> {
    const rows = await prisma.audienceExport.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return rows.map(rowToResponse);
}

export async function findExportByToken(token: string): Promise<{
    filePath: string;
    fileName: string;
    format: AudienceExportFormat;
} | null> {
    const row = await prisma.audienceExport.findUnique({ where: { downloadToken: token } });
    if (!row || !row.filePath || row.status !== "ready") return null;
    if (row.expiresAt && row.expiresAt < new Date()) return null;
    return {
        filePath: row.filePath,
        fileName: `${row.name.replace(/[^A-Za-z0-9_.-]/g, "_")}.${row.format}`,
        format: row.format as AudienceExportFormat,
    };
}

export async function deleteAudienceExport(id: string): Promise<boolean> {
    const row = await prisma.audienceExport.findUnique({ where: { id } });
    if (!row) return false;
    if (row.filePath) await unlink(row.filePath).catch(() => undefined);
    await prisma.audienceExport.delete({ where: { id } });
    return true;
}

/** Mark exports past their expiry as expired and remove their files. */
export async function expireOldAudienceExports(): Promise<number> {
    const now = new Date();
    const expired = await prisma.audienceExport.findMany({
        where: { status: "ready", expiresAt: { lt: now } },
    });
    for (const row of expired) {
        if (row.filePath) await unlink(row.filePath).catch(() => undefined);
        await prisma.audienceExport.update({
            where: { id: row.id },
            data: { status: "expired", filePath: null, downloadToken: null },
        });
    }
    return expired.length;
}

function rowToResponse(row: {
    id: string;
    name: string;
    format: string;
    status: string;
    rowCount: number;
    filterJson: unknown;
    error: string | null;
    createdById: string;
    createdAt: Date;
    expiresAt: Date | null;
    downloadToken: string | null;
}): AudienceExportRow {
    return {
        id: row.id,
        name: row.name,
        format: row.format as AudienceExportFormat,
        status: row.status as AudienceExportStatus,
        rowCount: row.rowCount,
        filter: row.filterJson as AudienceExportFilter,
        error: row.error,
        createdById: row.createdById,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt?.toISOString() ?? null,
        downloadUrl:
            row.status === "ready" && row.downloadToken
                ? `/api/admin/marketing/audience-exports/download/${row.downloadToken}`
                : null,
    };
}
