-- ─── CookieConsent: add marketing flag ──────────────────────
ALTER TABLE "cookie_consents" ADD COLUMN "marketing" BOOLEAN NOT NULL DEFAULT false;

-- ─── LandingAttribution ─────────────────────────────────────
CREATE TABLE "landing_attributions" (
    "id" TEXT NOT NULL,
    "landing_session_id" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "fbclid" TEXT,
    "fbc" TEXT,
    "fbp" TEXT,
    "referrer" TEXT,
    "landing_path" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_attributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "landing_attributions_landing_session_id_key" ON "landing_attributions"("landing_session_id");
CREATE INDEX "landing_attributions_utm_source_utm_campaign_utm_content_idx" ON "landing_attributions"("utm_source", "utm_campaign", "utm_content");
CREATE INDEX "landing_attributions_first_seen_at_idx" ON "landing_attributions"("first_seen_at");
CREATE INDEX "landing_attributions_expires_at_idx" ON "landing_attributions"("expires_at");

-- ─── UserAttribution ────────────────────────────────────────
CREATE TABLE "user_attributions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "landing_attribution_id" TEXT NOT NULL,
    "attribution_model" TEXT NOT NULL DEFAULT 'first_touch',
    "bound_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_attributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_attributions_user_id_key" ON "user_attributions"("user_id");
CREATE INDEX "user_attributions_landing_attribution_id_idx" ON "user_attributions"("landing_attribution_id");
CREATE INDEX "user_attributions_bound_at_idx" ON "user_attributions"("bound_at");

ALTER TABLE "user_attributions" ADD CONSTRAINT "user_attributions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_attributions" ADD CONSTRAINT "user_attributions_landing_attribution_id_fkey"
    FOREIGN KEY ("landing_attribution_id") REFERENCES "landing_attributions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── MarketingEvent ─────────────────────────────────────────
CREATE TABLE "marketing_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "landing_session_id" TEXT,
    "event_name" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_source" TEXT NOT NULL,
    "meta_enabled" BOOLEAN NOT NULL DEFAULT false,
    "consent_state" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "last_error_code" TEXT,
    "provider_response_code" INTEGER,
    "failure_reason" TEXT,
    "processing_started_at" TIMESTAMP(3),
    "lock_token" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_events_event_name_event_id_event_source_key"
    ON "marketing_events"("event_name", "event_id", "event_source");
CREATE INDEX "marketing_events_status_next_retry_at_idx" ON "marketing_events"("status", "next_retry_at");
CREATE INDEX "marketing_events_user_id_idx" ON "marketing_events"("user_id");
CREATE INDEX "marketing_events_landing_session_id_idx" ON "marketing_events"("landing_session_id");
CREATE INDEX "marketing_events_created_at_idx" ON "marketing_events"("created_at");
CREATE INDEX "marketing_events_event_name_status_idx" ON "marketing_events"("event_name", "status");

ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── UserActivationEvent ────────────────────────────────────
CREATE TABLE "user_activation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activation_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_activation_events_user_id_activation_type_idx" ON "user_activation_events"("user_id", "activation_type");
CREATE INDEX "user_activation_events_occurred_at_idx" ON "user_activation_events"("occurred_at");

ALTER TABLE "user_activation_events" ADD CONSTRAINT "user_activation_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
