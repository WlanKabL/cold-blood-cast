/*
  Warnings:

  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `backtest_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `backtest_trades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `broker_connections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `daily_summaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `import_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `journal_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knowledge_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prop_firm_template_suggestions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prop_firm_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prop_firms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `risk_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `symbol_suggestions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `symbols` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_jobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trade_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trade_screenshots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trades` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EnclosureType" AS ENUM ('TERRARIUM', 'VIVARIUM', 'AQUARIUM', 'PALUDARIUM', 'RACK', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('TEMPERATURE', 'HUMIDITY', 'PRESSURE', 'WATER');

-- CreateEnum
CREATE TYPE "AlertCondition" AS ENUM ('ABOVE', 'BELOW', 'OUTSIDE_RANGE');

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_prop_firm_id_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "backtest_sessions" DROP CONSTRAINT "backtest_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "backtest_trades" DROP CONSTRAINT "backtest_trades_session_id_fkey";

-- DropForeignKey
ALTER TABLE "backtest_trades" DROP CONSTRAINT "backtest_trades_user_id_fkey";

-- DropForeignKey
ALTER TABLE "broker_connections" DROP CONSTRAINT "broker_connections_account_id_fkey";

-- DropForeignKey
ALTER TABLE "broker_connections" DROP CONSTRAINT "broker_connections_user_id_fkey";

-- DropForeignKey
ALTER TABLE "daily_summaries" DROP CONSTRAINT "daily_summaries_account_id_fkey";

-- DropForeignKey
ALTER TABLE "daily_summaries" DROP CONSTRAINT "daily_summaries_user_id_fkey";

-- DropForeignKey
ALTER TABLE "import_sessions" DROP CONSTRAINT "import_sessions_account_id_fkey";

-- DropForeignKey
ALTER TABLE "import_sessions" DROP CONSTRAINT "import_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "journal_entries" DROP CONSTRAINT "journal_entries_user_id_fkey";

-- DropForeignKey
ALTER TABLE "knowledge_entries" DROP CONSTRAINT "knowledge_entries_user_id_fkey";

-- DropForeignKey
ALTER TABLE "prop_firm_template_suggestions" DROP CONSTRAINT "prop_firm_template_suggestions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "prop_firms" DROP CONSTRAINT "prop_firms_user_id_fkey";

-- DropForeignKey
ALTER TABLE "risk_profiles" DROP CONSTRAINT "risk_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "symbol_suggestions" DROP CONSTRAINT "symbol_suggestions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_jobs" DROP CONSTRAINT "sync_jobs_connection_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_jobs" DROP CONSTRAINT "sync_jobs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_user_id_fkey";

-- DropForeignKey
ALTER TABLE "trade_plans" DROP CONSTRAINT "trade_plans_user_id_fkey";

-- DropForeignKey
ALTER TABLE "trade_screenshots" DROP CONSTRAINT "trade_screenshots_backtest_trade_id_fkey";

-- DropForeignKey
ALTER TABLE "trade_screenshots" DROP CONSTRAINT "trade_screenshots_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "trade_screenshots" DROP CONSTRAINT "trade_screenshots_knowledge_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "trade_screenshots" DROP CONSTRAINT "trade_screenshots_trade_id_fkey";

-- DropForeignKey
ALTER TABLE "trade_screenshots" DROP CONSTRAINT "trade_screenshots_user_id_fkey";

-- DropForeignKey
ALTER TABLE "trades" DROP CONSTRAINT "trades_account_id_fkey";

-- DropForeignKey
ALTER TABLE "trades" DROP CONSTRAINT "trades_user_id_fkey";

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "backtest_sessions";

-- DropTable
DROP TABLE "backtest_trades";

-- DropTable
DROP TABLE "broker_connections";

-- DropTable
DROP TABLE "daily_summaries";

-- DropTable
DROP TABLE "import_sessions";

-- DropTable
DROP TABLE "journal_entries";

-- DropTable
DROP TABLE "knowledge_entries";

-- DropTable
DROP TABLE "prop_firm_template_suggestions";

-- DropTable
DROP TABLE "prop_firm_templates";

-- DropTable
DROP TABLE "prop_firms";

-- DropTable
DROP TABLE "risk_profiles";

-- DropTable
DROP TABLE "symbol_suggestions";

-- DropTable
DROP TABLE "symbols";

-- DropTable
DROP TABLE "sync_jobs";

-- DropTable
DROP TABLE "tags";

-- DropTable
DROP TABLE "trade_plans";

-- DropTable
DROP TABLE "trade_screenshots";

-- DropTable
DROP TABLE "trades";

-- DropEnum
DROP TYPE "AccountSource";

-- DropEnum
DROP TYPE "AccountStatus";

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "BacktestOutcome";

-- DropEnum
DROP TYPE "BrokerConnectionStatus";

-- DropEnum
DROP TYPE "BrokerPlatform";

-- DropEnum
DROP TYPE "Currency";

-- DropEnum
DROP TYPE "Market";

-- DropEnum
DROP TYPE "SyncJobStatus";

-- DropEnum
DROP TYPE "TradeDirection";

-- DropEnum
DROP TYPE "TradeSource";

-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "allowed_user_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enclosures" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EnclosureType" NOT NULL DEFAULT 'TERRARIUM',
    "species" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "length_cm" INTEGER,
    "width_cm" INTEGER,
    "height_cm" INTEGER,
    "room" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enclosures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enclosure_id" TEXT,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "morph" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "birth_date" TIMESTAMP(3),
    "acquisition_date" TIMESTAMP(3),
    "notes" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedings" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "feed_item_id" TEXT,
    "fed_at" TIMESTAMP(3) NOT NULL,
    "food_type" TEXT NOT NULL,
    "food_size" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT,
    "weight_grams" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheddings" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "quality" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sheddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_records" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "weight_grams" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "husbandry_notes" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "husbandry_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enclosure_id" TEXT,
    "name" TEXT NOT NULL,
    "type" "SensorType" NOT NULL,
    "unit" TEXT NOT NULL,
    "ha_entity_id" TEXT,
    "limits_json" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL,
    "sensor_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_assistant_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_assistant_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sensor_id" TEXT NOT NULL,
    "condition" "AlertCondition" NOT NULL,
    "threshold" DOUBLE PRECISION,
    "threshold_low" DOUBLE PRECISION,
    "threshold_high" DOUBLE PRECISION,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "description" TEXT,
    "sensors_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_subscribers" (
    "id" TEXT NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_registration_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_registration_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PetFeedItems" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PetFeedItems_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "enclosures_user_id_idx" ON "enclosures"("user_id");

-- CreateIndex
CREATE INDEX "pets_user_id_idx" ON "pets"("user_id");

-- CreateIndex
CREATE INDEX "pets_enclosure_id_idx" ON "pets"("enclosure_id");

-- CreateIndex
CREATE INDEX "feedings_pet_id_fed_at_idx" ON "feedings"("pet_id", "fed_at");

-- CreateIndex
CREATE INDEX "feedings_feed_item_id_idx" ON "feedings"("feed_item_id");

-- CreateIndex
CREATE INDEX "feed_items_user_id_idx" ON "feed_items"("user_id");

-- CreateIndex
CREATE INDEX "sheddings_pet_id_started_at_idx" ON "sheddings"("pet_id", "started_at");

-- CreateIndex
CREATE INDEX "weight_records_pet_id_measured_at_idx" ON "weight_records"("pet_id", "measured_at");

-- CreateIndex
CREATE INDEX "husbandry_notes_pet_id_idx" ON "husbandry_notes"("pet_id");

-- CreateIndex
CREATE INDEX "sensors_user_id_idx" ON "sensors"("user_id");

-- CreateIndex
CREATE INDEX "sensors_enclosure_id_idx" ON "sensors"("enclosure_id");

-- CreateIndex
CREATE INDEX "sensor_readings_sensor_id_recorded_at_idx" ON "sensor_readings"("sensor_id", "recorded_at");

-- CreateIndex
CREATE INDEX "home_assistant_configs_user_id_idx" ON "home_assistant_configs"("user_id");

-- CreateIndex
CREATE INDEX "alert_rules_sensor_id_idx" ON "alert_rules"("sensor_id");

-- CreateIndex
CREATE UNIQUE INDEX "presets_name_key" ON "presets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_subscribers_chat_id_key" ON "telegram_subscribers"("chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_registration_keys_key_key" ON "telegram_registration_keys"("key");

-- CreateIndex
CREATE INDEX "_PetFeedItems_B_index" ON "_PetFeedItems"("B");

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enclosures" ADD CONSTRAINT "enclosures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_enclosure_id_fkey" FOREIGN KEY ("enclosure_id") REFERENCES "enclosures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedings" ADD CONSTRAINT "feedings_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedings" ADD CONSTRAINT "feedings_feed_item_id_fkey" FOREIGN KEY ("feed_item_id") REFERENCES "feed_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheddings" ADD CONSTRAINT "sheddings_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "husbandry_notes" ADD CONSTRAINT "husbandry_notes_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_enclosure_id_fkey" FOREIGN KEY ("enclosure_id") REFERENCES "enclosures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_assistant_configs" ADD CONSTRAINT "home_assistant_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetFeedItems" ADD CONSTRAINT "_PetFeedItems_A_fkey" FOREIGN KEY ("A") REFERENCES "feed_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetFeedItems" ADD CONSTRAINT "_PetFeedItems_B_fkey" FOREIGN KEY ("B") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
