-- Add locale preference to users (defaults to German)
ALTER TABLE "users" ADD COLUMN "locale" VARCHAR(5) NOT NULL DEFAULT 'de';
