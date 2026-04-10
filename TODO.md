# KeeperLog — Roadmap

> Last updated: 2025-07-14
> Status legend: 🔲 Planned · 🧩 Scaffolded (schema exists, no routes/pages) · 🔨 In Progress · ✅ Done

---

## Core Infrastructure

- ✅ Monorepo restructure (pnpm workspaces: `apps/backend`, `apps/frontend`, `packages/shared`)
- ✅ Prisma 6 + PostgreSQL 16 (Docker)
- ✅ Docker Compose (postgres, redis)
- ✅ GitHub Actions CI (quality + test pipelines)
- ✅ JWT auth (access 15min + refresh 7d HTTP-only cookie)
- ✅ Shared TypeScript types + constants package (`@cold-blood-cast/shared`)
- ✅ Vitest test infrastructure (854 tests — 441 frontend + 413 backend)
- ✅ Redis (ioredis for BullMQ)
- ✅ WebSocket server (JWT-authenticated, per-user connection tracking)
- ✅ Rate limiting (global + per-route overrides)
- ✅ Maintenance scheduler (daily cron — file encryption, orphan cleanup, retention)
- ✅ Swagger/OpenAPI docs (auto-generated, dev only)
- ✅ Maintenance mode (global hook with admin bypass)
- ✅ Encrypted file uploads (AES at-rest via `file-crypto.ts`)
- 🔲 Prisma migrations workflow (currently using `db push`, switch to `migrate` for production)
- 🔲 Database backup/restore strategy
- 🔲 Graceful shutdown (SIGTERM/SIGINT → close DB, WS, bot)

---

## Authentication & User System

- ✅ Login / Register / Refresh / Logout (email or username)
- ✅ Registration modes (open, invite_only, approval)
- ✅ Invite code system (full CRUD, max uses, expiration, email sending)
- ✅ Access request system (submit, admin review, email on approve/reject)
- ✅ Role-based permissions (RBAC with role-level feature flags + limits)
- ✅ User profile / settings page (change password, display name, theme, language, account deletion)
- ✅ Email verification (6-digit code, resend)
- ✅ Password reset via email (forgot + reset flow)
- ✅ Session tracking (LoginSession model — IP, user agent, fingerprint)
- ✅ Account deletion (request + confirmation with password)

---

## Admin Panel (13 pages)

- ✅ Admin dashboard (stats, pending reviews banner, version info)
- ✅ User management (search, filter, ban/unban, approve/reject, bulk role assign)
- ✅ User detail page
- ✅ Roles CRUD (with feature flag + limit assignment per role)
- ✅ Feature flags (grouped by category, toggle switches)
- ✅ System settings (registration mode, maintenance mode, email retention, etc.)
- ✅ Announcements CRUD (type badges, active/inactive toggle)
- ✅ Audit log (filterable, paginated)
- ✅ Notification channels (Telegram/Discord setup, per-event toggles)
- ✅ Invite codes CRUD
- ✅ Access requests (status filter tabs, approve/reject)
- ✅ Email management (send email + email log, user search, template preview)
- ✅ Legal documents (DE+EN, markdown, publish flow)

---

## Landing Page & Public UI

- ✅ Landing page (hero, features, monitoring, alerts, care log sections, i18n, dark/light)
- ✅ Dark / light theme toggle (with system preference detection)
- ✅ i18n (German + English, all UI text)
- ✅ Legal document public viewer (`/legal/[slug]`)
- ✅ Unsubscribe page
- ✅ Cookie consent tracking
- 🔲 Public status page (system online status, last sensor reading timestamp)

---

## Enclosures & Pets

- ✅ Enclosure CRUD (backend routes + frontend pages — list, detail, create, update, delete)
- ✅ Pet CRUD (name, species, morph, gender, birth date, enclosure link, notes)
- ✅ Enclosure detail with linked pets + sensors
- ✅ Dashboard with enclosure cards and stats (enclosures, pets, sensors, recent feedings)
- 🔲 Pet health timeline (all events per pet chronologically)
- 🔲 Pet photo upload (link to upload system)

---

## Sensors & Readings

- ✅ Sensor CRUD (backend routes + frontend pages — list, detail, create, update, delete)
- ✅ Sensor readings CRUD (get + create)
- 🧩 Alert rules (Prisma schema exists — `AlertRule` model — no routes/service)
- 🧩 Presets (Prisma schema exists — `Preset` model — no routes/service)
- 🔲 Sensor reading charts (historical data visualization per sensor)
- 🔲 Alert rule management UI (set min/max thresholds per sensor type)
- 🔲 Alert history page (triggered alerts, timestamps, sensor values)

---

## Tracking & Care Journal

- ✅ Feeding tracker (date, prey type, size, accepted/refused, notes — full CRUD with pet filter)
- ✅ Shedding tracker (date, completeness, problems, notes — full CRUD with pet filter)
- ✅ Weight tracker (date, weight in grams — full CRUD with pet filter)
- 🧩 Husbandry notes (Prisma schema exists — `HusbandryNote` model — no routes/service)
- 🔲 Vet visit log (date, reason, findings, next appointment)
- 🔲 Defecation tracker (date, consistency, notes)
- 🔲 Watering tracker (date, water change, cleaning, notes)
- 🔲 Weight trend chart (graph over time per pet)
- 🔲 Timeline view per pet (all events chronologically)
- 🔲 Calendar view (upcoming feedings, reminders)

---

## Smart Home & Sensor Integration

- 🧩 Home Assistant config (Prisma schema exists — `HomeAssistantConfig` model — no routes/service)
- 🔲 Home Assistant integration routes (CRUD for HA configs, sensor data polling)
- 🔲 TP-Link Kasa/Tapo API integration (heating mats, lamps, foggers via smart plugs)
- 🔲 Device entity (plug, sensor, camera) linked to enclosure
- 🔲 Automation rules engine (if temp < X for Y min → turn on heater)

---

## Alerting & Notifications

- ✅ Email notifications (SMTP via nodemailer, 20 templates, EmailLog tracking)
- ✅ Telegram + Discord notification channels (event-based, DB-configurable per-event toggles)
- ✅ Notification events: register, login, first_login, pending, breach, server_error, sensor_alert
- 🧩 Telegram subscriber bot (schema exists — `TelegramSubscriber`, `TelegramRegistrationKey` — no service)
- 🔲 Alert history page (what triggered, when, sensor value at time)
- 🔲 Notification preferences per user (Telegram, email, or both)
- 🔲 Snooze / acknowledge alerts from dashboard
- 🔲 Escalation rules (if not acknowledged in X min → re-notify / notify admin)

---

## Mail & Communication

- ✅ SMTP integration (nodemailer, fire-and-forget with EmailLog)
- ✅ 20 email templates (olive/copper design): verify-email, password-reset, new-login, account-banned, account-approved, account-rejected, pending-review, account-deletion, account-deleted, access-request, access-request-rejected, invite-code, welcome, custom, data-export-ready, payment-failed, subscription-canceled, subscription-confirmed
- ✅ Admin email sending + log viewer
- 🧩 Weekly email reports (setting keys defined, no report generation service)

---

## Multi-User & Data Ownership

- ✅ User-owned data model (enclosures, pets, sensors all have `userId` foreign key)
- ✅ Feature flags + role-based limits (`max_enclosures`, `max_pets`, `max_sensors_per_enclosure`, `max_alert_rules`)
- ✅ Per-user limit overrides
- 🧩 Data export generation (Prisma model + download page exists — no export service)
- 🔲 Virtual environments (group enclosures + pets into a logical "setup")
- 🔲 Organization layer (breeders, shops, rescue orgs with org-level admin)
- 🔲 Sharing: invite another user to view (read-only) your environment
- 🔲 Data export per user/environment (CSV, JSON — GDPR Art. 15/20)

---

## Payments (Low Priority)

- 🧩 Stripe: Prisma `Subscription` model with all fields + env vars + 3 email templates
- 🔲 Stripe integration (checkout, webhook handler, subscription management)
- 🔲 Decide: SaaS hosted vs. self-hosted Raspberry Pi vs. hybrid

---

## Developer Experience & Quality

- ✅ Vitest unit tests (854 tests passing)
- ✅ OpenAPI / Swagger docs (auto-generated in dev)
- ✅ Seed script (migration-based, system settings defaults)
- 🔲 Seed with realistic demo data (enclosures, pets, sensor history for testing)
- 🔲 E2E tests (Playwright for frontend flows)
- 🔲 API integration tests (supertest against running backend)
- 🔲 Changelog automation (conventional-changelog from commits)
- 🔲 Dependabot / Renovate for dependency updates
- 🔲 PWA support (installable on phone for quick terrarium checks)

---

## Recommended: Build Next 🏗️

> Features with the highest user value that should be built first.
> Items marked 🧩 already have Prisma schemas — less work to complete.

### Priority 1 — Core Terrarium Experience
1. **🧩 Alert rules CRUD** — Users need to define min/max thresholds per sensor and get notified when breached. Schema exists, needs service + routes + frontend page.
2. **Sensor reading charts** — The sensor detail page exists but has no historical data visualization. Add a time-series chart (e.g., Chart.js or unovis) showing temperature/humidity over time.
3. **🧩 Husbandry notes CRUD** — General care log entries (supplements, observations, vet notes). Schema exists, needs service + routes + frontend page.
4. **Weight trend chart** — Weight data already exists. Add a simple line chart on the pet detail page showing weight over time.

### Priority 2 — Integration & Automation
5. **🧩 Home Assistant integration** — Connect actual sensor data from HA to the system. Schema exists, needs routes + polling service.
6. **Alert history page** — Show past triggered alerts and the sensor values that caused them.
7. **Timeline view per pet** — Merge feedings, sheddings, weights, and notes into one chronological timeline on the pet detail page.

### Priority 3 — Polish & Engagement
8. **Pet photo upload** — Link to existing upload system, show on pet cards.
9. **PWA support** — Nuxt PWA module, quick terrarium checks from phone.
10. **Realistic demo seed** — Generate demo data for screenshots, testing, and onboarding.

---

## Notes

- Frontend i18n: all UI text in German + English (`i18n/locales/de.json`, `en.json`)
- Shared package must be rebuilt after changes: `pnpm --filter @cold-blood-cast/shared build`
- Passwords: PBKDF2 + SHA-512 + pepper, timing-safe comparison
- Color system: Olive primary (`#8a9c4a`) + Warm Copper accent (`#d87533`)
- Git: `main` branch, latest commit `8921f65`
