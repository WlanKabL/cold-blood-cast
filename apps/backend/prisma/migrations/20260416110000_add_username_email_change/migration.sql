-- AlterTable
ALTER TABLE "users" ADD COLUMN "username_changed_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "pending_email" TEXT;
ALTER TABLE "users" ADD COLUMN "email_change_code" TEXT;
ALTER TABLE "users" ADD COLUMN "email_change_code_expires_at" TIMESTAMP(3);
