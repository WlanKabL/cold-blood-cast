-- CreateTable
CREATE TABLE "public_profiles" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "show_photos" BOOLEAN NOT NULL DEFAULT true,
    "show_weight" BOOLEAN NOT NULL DEFAULT true,
    "show_age" BOOLEAN NOT NULL DEFAULT true,
    "show_feedings" BOOLEAN NOT NULL DEFAULT true,
    "show_sheddings" BOOLEAN NOT NULL DEFAULT true,
    "show_species" BOOLEAN NOT NULL DEFAULT true,
    "show_morph" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "public_profiles_pet_id_key" ON "public_profiles"("pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "public_profiles_slug_key" ON "public_profiles"("slug");

-- CreateIndex
CREATE INDEX "public_profiles_user_id_idx" ON "public_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "public_profiles" ADD CONSTRAINT "public_profiles_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_profiles" ADD CONSTRAINT "public_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
