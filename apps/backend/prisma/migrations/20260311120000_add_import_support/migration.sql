-- AlterEnum: Add MT5_IMPORT to TradeSource
ALTER TYPE "TradeSource" ADD VALUE IF NOT EXISTS 'MT5_IMPORT';

-- AlterTable: Add platform metadata columns to accounts
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "external_account_id" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "server" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "platform" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "hedging_mode" TEXT;

-- AlterTable: Add external_id and import_session_id to trades
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "external_id" TEXT;
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "import_session_id" TEXT;

-- CreateTable: import_sessions (audit trail for imports)
CREATE TABLE IF NOT EXISTS "import_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "file_name" TEXT,
    "broker_name" TEXT,
    "account_number" TEXT,
    "server_name" TEXT,
    "report_currency" TEXT,
    "report_date_from" TIMESTAMP(3),
    "report_date_to" TIMESTAMP(3),
    "trader_name" TEXT,
    "net_profit" DOUBLE PRECISION,
    "profit_factor" DOUBLE PRECISION,
    "sharpe_ratio" DOUBLE PRECISION,
    "max_drawdown" DOUBLE PRECISION,
    "max_drawdown_pct" DOUBLE PRECISION,
    "win_rate" DOUBLE PRECISION,
    "total_deposit" DOUBLE PRECISION,
    "final_balance" DOUBLE PRECISION,
    "trades_imported" INTEGER NOT NULL DEFAULT 0,
    "trades_skipped" INTEGER NOT NULL DEFAULT 0,
    "trades_merged" INTEGER NOT NULL DEFAULT 0,
    "trades_total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: import_sessions indexes
CREATE INDEX IF NOT EXISTS "import_sessions_user_id_idx" ON "import_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "import_sessions_account_id_idx" ON "import_sessions"("account_id");

-- CreateIndex: unique constraint on trades (accountId, externalId)
-- Only create if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trades_account_id_external_id_key'
    ) THEN
        ALTER TABLE "trades" ADD CONSTRAINT "trades_account_id_external_id_key" UNIQUE ("account_id", "external_id");
    END IF;
END $$;

-- AddForeignKey: import_sessions → users
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: import_sessions → accounts
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
