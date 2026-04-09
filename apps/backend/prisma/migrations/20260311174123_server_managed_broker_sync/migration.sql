-- CreateEnum
CREATE TYPE "AccountSource" AS ENUM ('MANUAL', 'SYNCED');

-- CreateEnum
CREATE TYPE "BrokerPlatform" AS ENUM ('MT5', 'CTRADER', 'TRADELOCKER');

-- CreateEnum
CREATE TYPE "BrokerConnectionStatus" AS ENUM ('ACTIVE', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('QUEUED', 'CONNECTING', 'SYNCING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "source" "AccountSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "broker_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "platform" "BrokerPlatform" NOT NULL,
    "broker_login" TEXT NOT NULL,
    "broker_server" TEXT NOT NULL,
    "status" "BrokerConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "encrypted_password" TEXT NOT NULL,
    "password_iv" TEXT NOT NULL,
    "password_tag" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "sync_counter" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" TEXT,
    "trades_synced" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "worker_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broker_connections_user_id_idx" ON "broker_connections"("user_id");

-- CreateIndex
CREATE INDEX "broker_connections_account_id_idx" ON "broker_connections"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_connections_user_id_broker_login_broker_server_key" ON "broker_connections"("user_id", "broker_login", "broker_server");

-- CreateIndex
CREATE INDEX "sync_jobs_connection_id_idx" ON "sync_jobs"("connection_id");

-- CreateIndex
CREATE INDEX "sync_jobs_user_id_idx" ON "sync_jobs"("user_id");

-- AddForeignKey
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "broker_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
