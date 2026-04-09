-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "ghost_reason" TEXT,
ADD COLUMN     "ghosted_at" TIMESTAMP(3);
