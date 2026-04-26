-- Marketing V3: high-value events + audience exports
-- Plan v1.7 §23

-- AlterTable: add value/currency columns to marketing_events for ROI tracking
ALTER TABLE "marketing_events"
    ADD COLUMN IF NOT EXISTS "value" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3);

-- CreateTable: audience_exports (Custom Audience prep)
CREATE TABLE IF NOT EXISTS "audience_exports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "filter_json" JSONB NOT NULL,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "file_path" TEXT,
    "download_token" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "audience_exports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "audience_exports_download_token_key" ON "audience_exports"("download_token");
CREATE INDEX IF NOT EXISTS "audience_exports_created_by_id_idx" ON "audience_exports"("created_by_id");
CREATE INDEX IF NOT EXISTS "audience_exports_status_idx" ON "audience_exports"("status");
CREATE INDEX IF NOT EXISTS "audience_exports_created_at_idx" ON "audience_exports"("created_at");
