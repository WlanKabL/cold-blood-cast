-- AlterTable
ALTER TABLE "trade_screenshots" ADD COLUMN     "knowledge_entry_id" TEXT;

-- AddForeignKey
ALTER TABLE "trade_screenshots" ADD CONSTRAINT "trade_screenshots_knowledge_entry_id_fkey" FOREIGN KEY ("knowledge_entry_id") REFERENCES "knowledge_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
