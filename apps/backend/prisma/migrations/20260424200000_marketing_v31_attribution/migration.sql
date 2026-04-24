-- v3.1: Extended attribution params (Meta utm_id, adset, gclid)
ALTER TABLE "landing_attributions"
    ADD COLUMN "utm_id" TEXT,
    ADD COLUMN "adset_id" TEXT,
    ADD COLUMN "adset_name" TEXT,
    ADD COLUMN "gclid" TEXT;

CREATE INDEX "landing_attributions_utm_id_idx" ON "landing_attributions" ("utm_id");
CREATE INDEX "landing_attributions_adset_id_idx" ON "landing_attributions" ("adset_id");
