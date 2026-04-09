-- Add email verification fields
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "verification_code" TEXT;
ALTER TABLE "users" ADD COLUMN "verification_code_expires_at" TIMESTAMP(3);

-- Add password reset fields
ALTER TABLE "users" ADD COLUMN "reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_token_expires_at" TIMESTAMP(3);

-- Mark all existing users as verified (no disruption for current users)
UPDATE "users" SET "email_verified" = true;
