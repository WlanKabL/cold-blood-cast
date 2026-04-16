-- Tags table and indexes already created in 20260415173717_add_pet_tags_relation.
-- This migration is kept as a no-op to preserve migration history consistency.

-- Idempotent re-creation (IF NOT EXISTS) — safe on both fresh and existing DBs.
CREATE TABLE IF NOT EXISTS "tags" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "user_id" TEXT,
    "category" VARCHAR(30) NOT NULL,
    "color" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tags_category_idx" ON "tags"("category");
CREATE INDEX IF NOT EXISTS "tags_user_id_idx" ON "tags"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "tags_user_id_name_category_key" ON "tags"("user_id", "name", "category");

-- FK is idempotent: will fail silently if constraint already exists, so wrap in DO block
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tags_user_id_fkey'
    ) THEN
        ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
