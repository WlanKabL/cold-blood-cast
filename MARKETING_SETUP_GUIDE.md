# Marketing & Attribution — Operator Setup Guide

> Audience: you (the operator running Cold Blood Cast).
> Purpose: end-to-end walkthrough of what the marketing system does, how to configure it, how to wire Meta correctly, and how to validate it in production.
> Read this before turning Pixel/CAPI on with a real ad budget.

---

## Part A — What this system does

Cold Blood Cast ships with an attribution + Meta Conversions system that runs on three layers:

1. **Browser layer (Pixel)**
    - When a visitor accepts marketing consent, the Meta Pixel is initialised in the browser.
    - The Pixel auto-fires `PageView` and reports browser-side signup conversions (`CompleteRegistration`).
    - Without consent the Pixel is **not** initialised at all (no `fbq("init", ...)`), and any tracking call is recorded as `consentState=denied / status=skipped` in the audit log.

2. **Server layer (CAPI — Conversions API)**
    - Every important conversion (signup, activation, paid event) is enqueued as a server-side event with a stable `event_id`.
    - A BullMQ worker hashes user identifiers (email, IP, user-agent) with SHA-256 and POSTs the event to Meta's `/events` endpoint.
    - Browser + server events with the **same `event_id`** are deduplicated by Meta so one signup does not count twice.
    - In dry-run mode the worker logs the payload but does not actually call Meta.

3. **Attribution layer (database)**
    - On the very first landing of an anonymous visitor the frontend captures all UTM / click-id parameters and POSTs them to `/api/marketing/landing`. The backend stores a `LandingAttribution` row + sets a `cbc-landing-attribution` localStorage entry.
    - When that visitor later signs up, the open landing session is bound to the new user (`UserAttribution`), so every conversion is permanently attributable to a campaign.
    - Re-landings without new marketing markers are **not** re-recorded (dedup), so direct return visits do not overwrite paid attribution.

On top of that there is:

- **Activation tracking** — a "first meaningful use" event (e.g. first sensor connected, first journal entry) recorded inside an `activationWindowDays` window after signup. Used to compute conversion-quality metrics, not just raw signups.
- **High-value events** — signal endpoint for conversion events that map to revenue (Subscribe, Purchase). These flow into the ROI report.
- **ROI report** — per-campaign aggregation of signups → activated → high-value events → revenue.
- **Audience export** — admin can export an attributed-and-filtered user list (CSV) for offline use or to seed Custom Audiences. The download URL is single-use, tokenised, and expires.
- **Live vs prepared** — Pixel/CAPI can independently be enabled/disabled and CAPI can run in dry-run mode (logs payloads, does not call Meta) so you can inspect everything before going live.

---

## Part B — What you need to configure

### B.1 Required environment variables

Set these in `apps/backend/.env` (or your deployment env):

| Variable                                  | Required when               | Default | Meaning                                                                                                                                                       |
| ----------------------------------------- | --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `META_PIXEL_ENABLED`                      | always                      | `false` | Master switch for the browser Pixel                                                                                                                           |
| `META_PIXEL_ID`                           | Pixel enabled               | —       | Your numeric Meta Pixel ID                                                                                                                                    |
| `META_CAPI_ENABLED`                       | always                      | `false` | Master switch for the server CAPI worker                                                                                                                      |
| `META_CAPI_DRY_RUN`                       | recommended on first deploy | `true`  | If true, payloads are logged but not sent to Meta                                                                                                             |
| `META_ACCESS_TOKEN`                       | CAPI live                   | —       | System-user CAPI access token (NOT the page token)                                                                                                            |
| `META_TEST_EVENT_CODE`                    | optional                    | —       | Set during validation so events show up in Meta's "Test Events" tab without polluting prod metrics                                                            |
| `TRACKING_ATTRIBUTION_TTL_DAYS`           | always                      | `90`    | How long an unbound landing session stays valid (must match the frontend localStorage TTL of 90d)                                                             |
| `TRACKING_PENDING_RESCUE_AFTER_SECONDS`   | always                      | `120`   | Server events stuck in `pending` longer than this are re-enqueued on startup and via `POST /api/admin/marketing/rescue-pending` (recovery from Redis outages) |
| `TRACKING_ACTIVATION_WINDOW_DAYS`         | always                      | `7`     | Window after signup in which activation events count                                                                                                          |
| `TRACKING_AUDIENCE_EXPORT_RETENTION_DAYS` | always                      | `30`    | How long generated audience CSVs remain downloadable                                                                                                          |
| `TRACKING_DISPATCH_TIMEOUT_MS`            | always                      | `8000`  | HTTP timeout per Meta CAPI call                                                                                                                               |
| `TRACKING_MAX_RETRY_COUNT`                | always                      | `5`     | BullMQ retry budget per event                                                                                                                                 |
| `REDIS_URL`                               | always                      | —       | Required by BullMQ worker. **Without Redis the CAPI queue cannot run.**                                                                                       |

> **Important:** _every_ one of these must be added to `apps/backend/src/config.ts` — never read `process.env.X` ad-hoc.

### B.2 Admin runtime overrides

Several settings can be overridden at runtime in the admin UI (`/admin/marketing` → Settings tab) **without redeploying**:

- `metaPixelEnabled`, `metaPixelId`
- `metaCapiEnabled`, `metaCapiDryRun`, `metaTestEventCode`
- `activationWindowDays`

The Settings tab shows an **override badge** next to each setting that has a DB override, so you can always tell whether a value is coming from `.env` or from the admin override.

### B.3 Consent

- The Pixel never initialises and CAPI never sends real PII without `marketing` consent in the cookie banner.
- Denied events still produce an audit row (`consentState=denied / status=skipped`) so you can prove your consent matrix is enforced.

### B.4 Worker / queue

- The CAPI dispatch is a BullMQ queue → it requires a running Redis.
- The worker runs inside the backend process. If you horizontally scale, only one process should be the worker; others can stay producers.

---

## Part C — What you need to set up in Meta

1. **Create a Pixel**
   Meta Business Manager → Events Manager → Connect Data Sources → Web → Meta Pixel.
   Save the numeric Pixel ID into `META_PIXEL_ID`.

2. **Generate a CAPI access token**
   Same Pixel → Settings → Conversions API → Generate access token.
   Store as `META_ACCESS_TOKEN`. Treat it like a password — never commit, never log.
   (Recommended: use a System User token, not your personal token.)

3. **Test Events**
   Events Manager → your Pixel → Test Events tab. Copy the test event code there into `META_TEST_EVENT_CODE` while validating. Remove it for production.

4. **Verify in Event Manager**
   After your first real visitor (with consent), Events Manager should show:
    - `PageView` (browser)
    - `CompleteRegistration` (browser **and** server, deduplicated by `event_id`)
    - `Subscribe` / `Purchase` (server only, fires from the high-value endpoint)
    - Optional custom activation events

5. **Deduplication**
   Meta deduplicates by `(event_name, event_id)`. The system always sends the same UUID `event_id` from browser and server for the same conversion, so one signup counts once even though it fires twice.

6. **Common pitfalls**
    - Page token instead of system-user token → CAPI 403s.
    - Different `event_id` between browser and server → double counting.
    - Pixel initialised before consent granted → privacy violation. **Do not do this.**
    - Forgetting `META_TEST_EVENT_CODE` is set in production → events go to test bucket, never to real attribution.

---

## Part D — Recommended ad URL structure

Use this pattern in **every** Meta ad creative URL:

```
https://coldbloodcast.com/?utm_source={{site_source_name}}&utm_medium={{placement}}&utm_campaign={{campaign.id}}&utm_content={{ad.id}}&utm_id={{campaign.id}}&adset_id={{adset.id}}&adset_name={{adset.name}}
```

Param-by-param:

| Param          | Meta dynamic value     | Why                                                                                                     |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `utm_source`   | `{{site_source_name}}` | Real source (`fb`, `ig`, `an`, `msg`) — better than hard-coding `facebook`                              |
| `utm_medium`   | `{{placement}}`        | Surface (`Facebook_Feed`, `Instagram_Stories`, `Audience_Network`) — tells you what creative is winning |
| `utm_campaign` | `{{campaign.id}}`      | Stable Meta campaign identifier — survives renames                                                      |
| `utm_content`  | `{{ad.id}}`            | The actual ad row — finest aggregation level the ROI report uses                                        |
| `utm_id`       | `{{campaign.id}}`      | Meta's canonical campaign id slot — populates Reporting API joins                                       |
| `adset_id`     | `{{adset.id}}`         | Adset-level granularity for audience analysis                                                           |
| `adset_name`   | `{{adset.name}}`       | Human-readable adset name in the admin UI                                                               |

For Google Ads add the auto-tagged `gclid` (Google appends it; you don't have to template it). The system stores it and treats its presence as a paid touch.

The ROI report aggregates per `(utm_source, utm_campaign, utm_content)` — i.e. campaign × ad. Adset is available per user (admin Users tab + raw export) but **not** in the per-campaign aggregation table. That is intentional: it keeps the canonical revenue grouping simple.

---

## Part E — Validation checklist

Run through this before pointing real ad spend at the system.

1. **Granted flow**
    - Open the site in a clean browser, accept marketing in the consent banner.
    - DevTools → Network → confirm `POST /api/marketing/landing` fires once with your UTMs.
    - Confirm `fbq("init", ...)` is called exactly once and a `PageView` is emitted.
    - Sign up a test account.
    - In Meta Events Manager → Test Events: see a `CompleteRegistration` event appear (browser + server, deduplicated).

2. **Denied flow**
    - Clean browser, decline marketing.
    - Confirm `fbq` is **never** initialised (search the page for `fbq(` — should not appear).
    - Sign up.
    - Check `/admin/marketing` → Events tab: a row with `consentState=denied / status=skipped` must exist.

3. **Activation**
    - With your test account, perform the activating action (configured per project) within the activation window.
    - Confirm `/admin/marketing` → Reports tab shows `activated` increment for the campaign.

4. **High-value event**
    - Trigger a purchase / subscription via the high-value endpoint (e.g. Stripe webhook in production, manual admin POST during validation).
    - Confirm Reports tab shows revenue + `revenuePerSignup` for the right campaign.

5. **Audience export**
    - `/admin/marketing` → Audiences tab → create an export with a filter (e.g. `utmSource=meta`, `activatedOnly=true`).
    - Click download — the URL must be tokenised (`/audience-exports/download/<token>`), single-use, and the CSV should contain only attributed users matching the filter.

6. **Re-landing dedup**
    - Re-open the site (no UTMs in URL) with localStorage already containing a `cbc-landing-attribution`.
    - Confirm `/api/marketing/landing` is **not** POSTed again.

---

## Part E2 — Operating the queue (failures & recovery)

The CAPI worker is BullMQ-backed and depends on Redis. The system is built so that no marketing failure can block registration, and so that any transient outage is recoverable.

**Failure semantics on the `marketing_events` row:**

| Status       | Meaning                                                             | Action                                                                                                     |
| ------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pending`    | enqueued, not yet processed (or stuck because Redis was down)       | recovered on next worker start, or via rescue endpoint                                                     |
| `processing` | a worker picked it up                                               | wait                                                                                                       |
| `sent`       | delivered to Meta (HTTP 2xx)                                        | none                                                                                                       |
| `failed`     | hard failure after BullMQ retry budget exhausted                    | inspect `lastErrorCode`/`failureReason`, fix root cause, then `POST /api/admin/marketing/events/:id/retry` |
| `skipped`    | deliberate non-dispatch (consent denied, channel disabled, dry-run) | none — informational only                                                                                  |

**Recovery: stuck `pending` events (Redis was unreachable when the row was created)**

The backend automatically calls `rescueStuckPendingEvents()` on startup. It re-enqueues every server event with `status=pending` older than `TRACKING_PENDING_RESCUE_AFTER_SECONDS` (default 120s). BullMQ uses the marketing-event id as `jobId`, so re-enqueueing the same event is a no-op — the sweep is **idempotent and safe to run repeatedly**.

You can also trigger it manually:

```bash
curl -XPOST -H 'Authorization: Bearer <admin-jwt>' \
  https://your-host/api/admin/marketing/rescue-pending \
  -H 'content-type: application/json' \
  -d '{"olderThanSeconds": 60, "limit": 1000}'
```

Response: `{ scanned, reEnqueued, skipped }`.

**Recovery: events failed because of `MISSING_CREDENTIALS`**

If `META_CAPI_ENABLED=true` and `META_CAPI_DRY_RUN=false` but `META_PIXEL_ID` or `META_ACCESS_TOKEN` were not set, the worker marks affected events as `failed` (not `skipped`). This is intentional: it is a misconfiguration, not a deliberate skip. After setting the credentials:

1. restart the backend (so the env reload applies), or update via the admin settings UI
2. for each affected row, `POST /api/admin/marketing/events/:id/retry` (or batch this from the admin UI)

---

## Part F — Known limitations (be honest about these)

- **No real Meta Custom Audience upload.** The "sync to Meta" action on an audience export is a **stub** — it marks the export as synced in the DB but does not actually push to Meta's Custom Audiences API. You currently use audience exports as CSVs you upload manually in Ads Manager. A real upload integration is on the roadmap, not in this build.
- **No Stripe webhook wiring.** The high-value events service is implemented and tested, but it is not yet hooked to a payment provider in production. You either POST to the admin endpoint manually or wire it yourself in the payment integration step.
- **No scheduled cleanup job for expired audience exports.** Expired tokens stop accepting downloads (enforced on the route), but the rows + CSV files are not automatically deleted yet. Add a cron / BullMQ repeatable job before this becomes a disk-space problem in long-running production.
- **Reports aggregation stops at `utm_content` (ad).** Per-adset revenue is not pre-aggregated. Use the audience export for adset-level analysis.
- **Single-region Meta CAPI.** No regional routing. If you serve multiple Meta business accounts you need to extend the worker to pick the right pixel/token per event.

---

If anything in this guide doesn't match your environment, the source of truth is `apps/backend/src/config.ts` for env vars and the `LandingAttribution` model in `apps/backend/prisma/schema.prisma` for what is actually stored. Trust those over any third-party doc.
