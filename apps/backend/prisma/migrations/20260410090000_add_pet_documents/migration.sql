-- CreateEnum
CREATE TYPE "PetDocumentCategory" AS ENUM ('PURCHASE_RECEIPT', 'CITES', 'ORIGIN_CERTIFICATE', 'VET_REPORT', 'INSURANCE', 'OTHER');

-- CreateTable
CREATE TABLE "pet_documents" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "category" "PetDocumentCategory" NOT NULL DEFAULT 'OTHER',
    "label" TEXT,
    "notes" TEXT,
    "document_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pet_documents_pet_id_idx" ON "pet_documents"("pet_id");

-- CreateIndex
CREATE INDEX "pet_documents_pet_id_category_idx" ON "pet_documents"("pet_id", "category");

-- AddForeignKey
ALTER TABLE "pet_documents" ADD CONSTRAINT "pet_documents_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_documents" ADD CONSTRAINT "pet_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_documents" ADD CONSTRAINT "pet_documents_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
