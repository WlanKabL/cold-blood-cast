-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('CLEANING', 'SUBSTRATE_CHANGE', 'LAMP_REPLACEMENT', 'WATER_CHANGE', 'FILTER_CHANGE', 'DISINFECTION', 'OTHER');

-- CreateTable
CREATE TABLE "maintenance_tasks" (
    "id" TEXT NOT NULL,
    "enclosure_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "completed_at" TIMESTAMP(3),
    "next_due_at" TIMESTAMP(3),
    "interval_days" INTEGER,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_tasks_enclosure_id_idx" ON "maintenance_tasks"("enclosure_id");

-- CreateIndex
CREATE INDEX "maintenance_tasks_user_id_idx" ON "maintenance_tasks"("user_id");

-- CreateIndex
CREATE INDEX "maintenance_tasks_user_id_next_due_at_idx" ON "maintenance_tasks"("user_id", "next_due_at");

-- AddForeignKey
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_enclosure_id_fkey" FOREIGN KEY ("enclosure_id") REFERENCES "enclosures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
