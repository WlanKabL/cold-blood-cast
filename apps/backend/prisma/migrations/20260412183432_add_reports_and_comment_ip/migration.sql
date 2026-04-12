-- AlterTable
ALTER TABLE "profile_comments" ADD COLUMN     "ip_hash" VARCHAR(64);

-- AlterTable
ALTER TABLE "user_public_profiles" ADD COLUMN     "notify_on_comment" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_url" VARCHAR(500),
    "reason" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "reporter_name" VARCHAR(50),
    "ip_hash" VARCHAR(64),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "admin_note" VARCHAR(1000),
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
