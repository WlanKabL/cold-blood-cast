-- AlterTable
ALTER TABLE "users" ADD COLUMN "delete_token" TEXT,
ADD COLUMN "delete_token_expires_at" TIMESTAMP(3);
