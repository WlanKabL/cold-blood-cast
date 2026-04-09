-- AlterTable — add encrypted broker login columns (nullable during transition)
ALTER TABLE "broker_connections" ADD COLUMN "encrypted_broker_login" TEXT;
ALTER TABLE "broker_connections" ADD COLUMN "broker_login_iv" TEXT;
ALTER TABLE "broker_connections" ADD COLUMN "broker_login_tag" TEXT;
