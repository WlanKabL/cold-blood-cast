/*
  Warnings:

  - A unique constraint covering the columns `[user_id,slug]` on the table `public_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public_profiles_slug_key";

-- CreateTable
CREATE TABLE "user_public_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "bio" VARCHAR(1000),
    "tagline" VARCHAR(100),
    "location" VARCHAR(100),
    "keeper_since" TIMESTAMP(3),
    "avatar_upload_id" TEXT,
    "show_stats" BOOLEAN NOT NULL DEFAULT true,
    "show_pets" BOOLEAN NOT NULL DEFAULT true,
    "show_social_links" BOOLEAN NOT NULL DEFAULT true,
    "show_location" BOOLEAN NOT NULL DEFAULT true,
    "show_keeper_since" BOOLEAN NOT NULL DEFAULT true,
    "show_badges" BOOLEAN NOT NULL DEFAULT true,
    "theme_preset" VARCHAR(30) NOT NULL DEFAULT 'default',
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_public_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_links" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "platform" VARCHAR(30) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "label" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pet_order" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_pet_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name_key" TEXT NOT NULL,
    "desc_key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "threshold" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_likes" (
    "id" TEXT NOT NULL,
    "profile_type" VARCHAR(10) NOT NULL,
    "profile_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_comments" (
    "id" TEXT NOT NULL,
    "profile_type" VARCHAR(10) NOT NULL,
    "profile_id" TEXT NOT NULL,
    "author_name" VARCHAR(50) NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_public_profiles_user_id_key" ON "user_public_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_public_profiles_slug_key" ON "user_public_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_public_profiles_avatar_upload_id_key" ON "user_public_profiles"("avatar_upload_id");

-- CreateIndex
CREATE INDEX "user_social_links_profile_id_idx" ON "user_social_links"("profile_id");

-- CreateIndex
CREATE INDEX "user_pet_order_profile_id_idx" ON "user_pet_order"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_pet_order_profile_id_pet_id_key" ON "user_pet_order"("profile_id", "pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_key_key" ON "badges"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "profile_likes_profile_type_profile_id_idx" ON "profile_likes"("profile_type", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_likes_profile_type_profile_id_ip_hash_key" ON "profile_likes"("profile_type", "profile_id", "ip_hash");

-- CreateIndex
CREATE INDEX "profile_comments_profile_type_profile_id_idx" ON "profile_comments"("profile_type", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "public_profiles_user_id_slug_key" ON "public_profiles"("user_id", "slug");

-- AddForeignKey
ALTER TABLE "user_public_profiles" ADD CONSTRAINT "user_public_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_public_profiles" ADD CONSTRAINT "user_public_profiles_avatar_upload_id_fkey" FOREIGN KEY ("avatar_upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_links" ADD CONSTRAINT "user_social_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_public_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pet_order" ADD CONSTRAINT "user_pet_order_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_public_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pet_order" ADD CONSTRAINT "user_pet_order_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
