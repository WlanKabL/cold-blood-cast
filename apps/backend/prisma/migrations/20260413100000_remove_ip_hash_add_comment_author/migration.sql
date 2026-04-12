-- AlterTable: Remove ip_hash from profile_comments, add author_id FK
ALTER TABLE "profile_comments" DROP COLUMN IF EXISTS "ip_hash";
ALTER TABLE "profile_comments" ADD COLUMN "author_id" TEXT;

-- AlterTable: Remove ip_hash from content_reports
ALTER TABLE "content_reports" DROP COLUMN IF EXISTS "ip_hash";

-- CreateIndex
CREATE INDEX "profile_comments_author_id_idx" ON "profile_comments"("author_id");

-- AddForeignKey
ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
