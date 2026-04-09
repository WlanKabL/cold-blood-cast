-- CreateTable
CREATE TABLE "cookie_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cookie_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cookie_consents_user_id_idx" ON "cookie_consents"("user_id");

-- AddForeignKey
ALTER TABLE "cookie_consents" ADD CONSTRAINT "cookie_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
