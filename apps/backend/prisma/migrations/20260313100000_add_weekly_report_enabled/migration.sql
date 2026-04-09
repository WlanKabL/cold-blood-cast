-- Add weekly_report_enabled to users table
ALTER TABLE "users" ADD COLUMN "weekly_report_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Create unsubscribe_tokens table
CREATE TABLE "unsubscribe_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unsubscribe_tokens_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "unsubscribe_tokens_token_key" ON "unsubscribe_tokens"("token");
CREATE INDEX "unsubscribe_tokens_user_id_idx" ON "unsubscribe_tokens"("user_id");
CREATE INDEX "unsubscribe_tokens_token_idx" ON "unsubscribe_tokens"("token");

-- Add foreign key
ALTER TABLE "unsubscribe_tokens" ADD CONSTRAINT "unsubscribe_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
