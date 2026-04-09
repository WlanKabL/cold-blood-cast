-- Change default from TRUE to FALSE (UWG §7: opt-in required)
ALTER TABLE "users" ALTER COLUMN "weekly_report_enabled" SET DEFAULT false;

-- Track when the user actively decided (null = undecided → show banner)
ALTER TABLE "users" ADD COLUMN "weekly_report_decided_at" TIMESTAMP(3);

-- Mark existing users who had it enabled as decided (they actively had it on)
UPDATE "users" SET "weekly_report_decided_at" = NOW() WHERE "weekly_report_enabled" = true;
