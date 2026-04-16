-- CreateTable (tags — must exist before the relation table)
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tags_category_idx" ON "tags"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tags_user_id_idx" ON "tags"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tags_user_id_name_category_key" ON "tags"("user_id", "name", "category");

-- AddForeignKey (idempotent)
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

-- CreateTable
CREATE TABLE IF NOT EXISTS "_PetTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PetTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_PetTags_B_index" ON "_PetTags"("B");

-- AddForeignKey (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_PetTags_A_fkey'
    ) THEN
        ALTER TABLE "_PetTags" ADD CONSTRAINT "_PetTags_A_fkey"
            FOREIGN KEY ("A") REFERENCES "pets"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_PetTags_B_fkey'
    ) THEN
        ALTER TABLE "_PetTags" ADD CONSTRAINT "_PetTags_B_fkey"
            FOREIGN KEY ("B") REFERENCES "tags"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
