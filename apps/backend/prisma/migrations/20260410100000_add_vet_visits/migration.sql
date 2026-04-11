-- CreateEnum
CREATE TYPE "vet_visit_type" AS ENUM ('CHECKUP', 'EMERGENCY', 'SURGERY', 'VACCINATION', 'DEWORMING', 'FECAL_TEST', 'CONSULTATION', 'FOLLOW_UP', 'OTHER');

-- CreateTable
CREATE TABLE "veterinarians" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clinic_name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veterinarians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vet_visits" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "veterinarian_id" TEXT,
    "user_id" TEXT NOT NULL,
    "source_visit_id" TEXT,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "visit_type" "vet_visit_type" NOT NULL DEFAULT 'OTHER',
    "is_appointment" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "cost_cents" INTEGER,
    "weight_grams" DOUBLE PRECISION,
    "next_appointment" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vet_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vet_visit_documents" (
    "id" TEXT NOT NULL,
    "vet_visit_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vet_visit_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "veterinarians_user_id_idx" ON "veterinarians"("user_id");

-- CreateIndex
CREATE INDEX "vet_visits_pet_id_idx" ON "vet_visits"("pet_id");

-- CreateIndex
CREATE INDEX "vet_visits_user_id_idx" ON "vet_visits"("user_id");

-- CreateIndex
CREATE INDEX "vet_visits_veterinarian_id_idx" ON "vet_visits"("veterinarian_id");

-- CreateIndex
CREATE INDEX "vet_visits_source_visit_id_idx" ON "vet_visits"("source_visit_id");

-- CreateIndex
CREATE INDEX "vet_visits_user_id_next_appointment_idx" ON "vet_visits"("user_id", "next_appointment");

-- CreateIndex
CREATE INDEX "vet_visit_documents_vet_visit_id_idx" ON "vet_visit_documents"("vet_visit_id");

-- AddForeignKey
ALTER TABLE "veterinarians" ADD CONSTRAINT "veterinarians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_visits" ADD CONSTRAINT "vet_visits_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_visits" ADD CONSTRAINT "vet_visits_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_visits" ADD CONSTRAINT "vet_visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_visits" ADD CONSTRAINT "vet_visits_source_visit_id_fkey" FOREIGN KEY ("source_visit_id") REFERENCES "vet_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_visit_documents" ADD CONSTRAINT "vet_visit_documents_vet_visit_id_fkey" FOREIGN KEY ("vet_visit_id") REFERENCES "vet_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_visit_documents" ADD CONSTRAINT "vet_visit_documents_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
