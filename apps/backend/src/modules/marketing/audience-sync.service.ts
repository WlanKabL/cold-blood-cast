// ─── Audience sync provider abstraction (V3) ────────────────
// Plan v1.7 §23 — pure architecture stub. The real Meta Custom Audience
// upload flow is not implemented yet; we expose a typed interface so a
// future provider can plug in without touching the export pipeline.
//
// Pattern: an export file lives on disk + DB; a sync invocation hands
// the export to a provider and stores the provider response. A provider
// MUST return synchronously — the queue-based delivery (if needed)
// belongs inside the provider implementation, not here.

import type { AudienceSyncProvider } from "@cold-blood-cast/shared";

export interface AudienceSyncRequest {
    exportId: string;
    filePath: string;
    format: "csv" | "json";
    rowCount: number;
    /** Provider-specific options (e.g. Meta audience id, key). */
    options?: Record<string, unknown>;
}

export interface AudienceSyncResult {
    delivered: boolean;
    providerName: AudienceSyncProvider;
    providerJobId?: string;
    statusCode?: number;
    errorCode?: string;
    errorMessage?: string;
}

export interface AudienceSyncProviderHandler {
    name: AudienceSyncProvider;
    sync(request: AudienceSyncRequest): Promise<AudienceSyncResult>;
}

const handlers = new Map<AudienceSyncProvider, AudienceSyncProviderHandler>();

export function registerAudienceSyncProvider(handler: AudienceSyncProviderHandler): void {
    handlers.set(handler.name, handler);
}

export function getAudienceSyncProvider(
    name: AudienceSyncProvider,
): AudienceSyncProviderHandler | null {
    return handlers.get(name) ?? null;
}

// ─── Stub provider: Meta Custom Audience ────────────────────
// Returns "not_implemented" until the real upload flow lands.
// Kept here so the surface area is visible to admins via an obvious
// error code rather than a silent 404.

registerAudienceSyncProvider({
    name: "meta_custom_audience",
    async sync(_request: AudienceSyncRequest): Promise<AudienceSyncResult> {
        return {
            delivered: false,
            providerName: "meta_custom_audience",
            errorCode: "NOT_IMPLEMENTED",
            errorMessage:
                "Meta Custom Audience sync is not implemented yet. " +
                "Use the CSV download and upload manually via Meta Ads Manager for now.",
        };
    },
});
