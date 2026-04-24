# Marketing Tracking — Technical Design Note (v1)

> Companion to `marketing_tracking_plan.md` (v1.7).
> Decisions taken on `feature/marketing-attribution` after the repo audit.

---

## 1. Stack alignment

| Concern             | Decision                                                                |
| ------------------- | ----------------------------------------------------------------------- |
| Backend             | Fastify 5 + Prisma 6 (Postgres) + Pino                                  |
| Queue               | **BullMQ** (already installed; Redis configured via `getRedis()`)       |
| Frontend            | Nuxt 4 client-side plugins                                              |
| Consent storage     | Extend existing `CookieConsent` model with `marketing` boolean          |
| Existing identifier | `userId` (cuid) — used in event_id input string                         |
| Logger              | Pino — child loggers per module                                         |
| Auth                | Existing `authGuard` for capture endpoint, `adminGuard` for dashboard   |

## 2. Module layout

```
apps/backend/src/modules/marketing/
├── index.ts                       # Public exports + route registration
├── marketing.routes.ts            # POST /api/marketing/landing
├── admin-marketing.routes.ts      # GET /api/admin/marketing/{overview,users,events}
├── marketing.schemas.ts           # Zod for landing capture body
├── marketing.service.ts           # bindAttributionToUser, recordRegistrationEvent
├── attribution.ts                 # parsing + first-touch priority logic
├── event-id.ts                    # canonical UUIDv5 algorithm
├── consent-matrix.ts              # decision table
├── meta-capi.service.ts           # Meta Conversions API dispatcher
├── meta-payload.ts                # payload builder (browser + server)
├── marketing.queue.ts             # BullMQ Queue + Worker
└── __tests__/
    ├── event-id.test.ts
    ├── attribution.test.ts
    └── consent-matrix.test.ts
```

## 3. Data model decisions

Three new Prisma models + one field extension:

- `LandingAttribution` — first-touch landing snapshot per `landing_session_id`
- `UserAttribution` — link User → LandingAttribution (first-touch only in v1, unique per user)
- `MarketingEvent` — outgoing event record with status, retry, dedup
- `CookieConsent.marketing Boolean` — added without removing `analytics`

Consent backwards compat: existing rows default to `false`. The frontend banner now writes both flags; old clients only writing `analytics` will keep `marketing=false` (safe default).

## 4. Event ID strategy (binding)

```
namespace = '6f2c2d0e-9b6f-5a1c-9b3e-7e3a8b2c1d4a'  // fixed v1 UUID
input     = `${registration_transaction_id}:${user_id}:${event_name}`
event_id  = uuidv5(input, namespace)
```

`registration_transaction_id` = `user.id` (the cuid, generated inside the registration transaction).
This satisfies: stable, deterministic per successful registration, never replayed for the same logical signup.

## 5. Attribution binding flow

1. Client visits site → `plugins/01.marketing-attribution.client.ts` runs
2. Plugin parses URL, generates `landing_session_id` (uuidv4) if absent, persists `cbc-landing-attribution` cookie (90d) + localStorage
3. POST `/api/marketing/landing` (anonymous, rate-limited) → upserts `LandingAttribution`
4. On successful signup, frontend POSTs `landing_session_id` together with the registration body via existing register endpoint (extended Zod schema: optional `landingSessionId`)
5. `auth.service.registerUser` calls `bindAttributionToUser(user.id, landingSessionId)`:
   - Resolves `LandingAttribution`
   - Applies first-touch priority + TTL rules (`attribution.ts`)
   - Creates `UserAttribution` row
   - Calls `recordRegistrationEvent(user, consent)` → enqueues BullMQ job
6. Response includes `marketingEventId` (canonical event_id) so frontend can fire Pixel with same id

## 6. Consent decision matrix (centralized)

`consent-matrix.ts` exports a single pure function:

```ts
decide(consentState, eventName) =>
  { storeAttribution, browserDispatch, serverDispatch, persistEvent, status }
```

This is the only place that decides what happens per consent state.
Used by both the landing endpoint and the registration hook.

## 7. Queue / retry

- Queue name: `marketing-events`
- Job data: `{ marketingEventId }`
- Worker processes one row, calls `meta-capi.service.dispatch()`, updates row.
- Retry: BullMQ `attempts: 5`, exponential backoff (`type: 'exponential', delay: 5000`)
- Status mapping: pending → processing → sent | failed
- `next_retry_at` is mirrored to DB on retry-eligible failure

## 8. Admin endpoints + pages

Backend (admin-only):

- `GET /api/admin/marketing/overview` — signups grouped by source/campaign/content
- `GET /api/admin/marketing/users` — paginated list with filters
- `GET /api/admin/marketing/events` — recent events with status/retry info

Frontend:

- `pages/admin/marketing/index.vue` — overview KPIs
- `pages/admin/marketing/users.vue` — table
- `pages/admin/marketing/events.vue` — events with payload preview

## 9. Env vars (added to `apps/backend/src/config/env.ts`)

| Var                              | Default              | Purpose                          |
| -------------------------------- | -------------------- | -------------------------------- |
| `META_PIXEL_ENABLED`             | `false`              | Toggle browser Pixel             |
| `META_CAPI_ENABLED`              | `false`              | Toggle server CAPI               |
| `META_CAPI_DRY_RUN`              | `false`              | Build payload but skip POST      |
| `META_PIXEL_ID`                  | (optional)           | Pixel ID                         |
| `META_ACCESS_TOKEN`              | (optional, redacted) | CAPI token                       |
| `META_TEST_EVENT_CODE`           | (optional)           | Meta test events                 |
| `TRACKING_ATTRIBUTION_TTL_DAYS`  | `30`                 | First-touch TTL                  |
| `TRACKING_MAX_RETRY_COUNT`       | `5`                  | Worker retries                   |
| `TRACKING_RETRY_BASE_DELAY_MS`   | `5000`               | Backoff base                     |
| `TRACKING_DISPATCH_TIMEOUT_MS`   | `5000`               | HTTP timeout to Meta             |
| `TRACKING_EVENT_RETENTION_DAYS`  | `180`                | (informational; cleanup later)   |

`META_PIXEL_ID` exposed to frontend via `runtimeConfig.public.metaPixelId` only when `META_PIXEL_ENABLED=true`.

## 10. Anti-patterns avoided

- Pixel snippet not embedded in `app.vue` blindly — gated by consent + env
- No alternate frontend-generated event_id fallback
- Meta logic isolated to `marketing/` — controllers don't touch fbq
- All consent gating funnels through `decide()`

## 11. Out of scope for v1

- Activation events (Phase 2)
- Multi-touch / last-touch
- Audience export
- Retroactive backfill
- Cleanup/retention worker (env var documented, job deferred)

