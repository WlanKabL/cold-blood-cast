# Cold Blood Cast — Roadmap

> Last updated: 2025-07-05
> Status legend: 🔲 Planned · 🔨 In Progress · ✅ Done

---

## Core Infrastructure

- ✅ Monorepo restructure (pnpm workspaces)
- ✅ Prisma 7 + PostgreSQL
- ✅ Docker Compose (postgres, backend, frontend)
- ✅ GitHub Actions CI (quality + test pipelines)
- ✅ JWT auth (access + refresh tokens)
- ✅ Shared Zod schema package
- ✅ Vitest test infrastructure (95 tests)
- 🔲 Prisma migrations workflow (currently using `db push`, switch to `migrate` for production)
- 🔲 Database backup/restore strategy

---

## Authentication & User System

- ✅ Login / Register / Refresh / Logout
- ✅ Registration key system
- ✅ Role-based permissions (admin, viewer, etc.)
- 🔲 User profile page (change password, display name)
- 🔲 User management admin panel (list users, change roles, revoke access)
- 🔲 Email verification on registration (Mailcow integration)
- 🔲 Password reset via email
- 🔲 Session management (list active sessions, revoke individual tokens)

---

## Landing Page & Public UI

- 🔲 Landing page design (what is Cold Blood Cast, features, screenshots)
- 🔲 Public status page (is the system online, last sensor reading timestamp)

---

## Enclosures & Pets

- 🔲 Enclosure entity (name, type, description, assigned sensors)
- 🔲 Pet entity (name, species, morph, date of birth, photo, assigned enclosure)
- 🔲 Enclosure list page with sensor status overview
- 🔲 Pet profile page (details, linked tracking events, health timeline)
- 🔲 Multi-enclosure dashboard (overview cards per enclosure)

---

## Tracking & Journal

- 🔲 Feeding tracker (date, prey type, size, accepted/refused, notes)
- 🔲 Shedding tracker (date, completeness, problems, notes)
- 🔲 Defecation tracker (date, consistency, notes)
- 🔲 Watering tracker (date, water change, cleaning, notes)
- 🔲 Weight tracker (date, weight in grams, trend chart)
- 🔲 Vet visit log (date, reason, findings, next appointment)
- 🔲 Custom event type (user-defined tracking categories)
- 🔲 Timeline view per pet (all events chronologically)
- 🔲 Calendar view (upcoming feedings, reminders)

---

## Smart Home Integration

- ✅ Home Assistant sensor polling (via REST API)
- 🔲 TP-Link Kasa/Tapo API integration (direct, without Home Assistant)
    - Control heating mats, lamps, foggers via smart plugs
    - Schedule-based on/off with override from dashboard
    - Energy monitoring per device
- 🔲 Device entity (smart plug, sensor, camera) linked to enclosure
- 🔲 Automation rules engine (if temp < X for Y minutes → turn on heater)

---

## Alerting & Notifications

- ✅ Telegram bot with subscriber management
- ✅ Threshold-based sensor alerts
- 🔲 Email notifications (Mailcow SMTP integration)
- 🔲 Alert history page (what triggered, when, what was the value)
- 🔲 Notification preferences per user (Telegram, email, or both)
- 🔲 Snooze/acknowledge alerts from the dashboard
- 🔲 Escalation rules (if not acknowledged in X minutes → notify again / notify admin)

---

## Multi-User & Multi-Environment

- 🔲 Data model: each user owns their enclosures, pets, and sensor configs
- 🔲 Virtual environments (group enclosures + pets into a logical "setup")
- 🔲 Meta/organization layer (for breeders, shops, rescue orgs)
    - Org admin can see all environments under their org
    - Individual users still own their own data
- 🔲 Sharing: invite another user to view (read-only) your environment
- 🔲 Data export per user/environment (CSV, JSON)

---

## Feature Flags & Deployment Model

- 🔲 Feature flag system (enable/disable features per instance or per user)
- 🔲 Role-based feature access (free tier vs. premium, if SaaS)
- 🔲 Decide: SaaS hosted vs. self-hosted Raspberry Pi vs. hybrid
    - SaaS: central server, multi-tenant, subscription model
    - Raspberry Pi: local install, single-tenant, free
    - Hybrid: local Pi sends data to central server for remote access
- 🔲 Licensing / activation key system (if self-hosted + paid features)

---

## Developer Experience & Quality

- 🔲 E2E tests (Playwright for frontend flows)
- 🔲 API integration tests (supertest against running backend)
- 🔲 OpenAPI / Swagger docs auto-generated from routes
- 🔲 Seed script with realistic demo data (multiple enclosures, pets, history)
- 🔲 Storybook or similar for component documentation
- 🔲 Changelog automation (conventional-changelog from commits)
- 🔲 Dependabot / Renovate for dependency updates

---

## My Suggestions (Agent)

> Things I noticed while working on the codebase that would be valuable.

- 🔲 **Rate limiting** on auth endpoints (login, register) — currently no brute-force protection
- 🔲 **Request logging middleware** (structured, not console.log — e.g., pino or winston)
- 🔲 **Database connection pooling config** — currently using default PrismaPg adapter settings, should tune for Pi's limited resources
- 🔲 **Graceful shutdown** — handle SIGTERM/SIGINT to close DB connections, WebSocket server, and Telegram bot cleanly
- 🔲 **Health check endpoint** — already exists but should include DB connectivity check
- 🔲 **Frontend error boundary** — global error handler for unhandled Vue errors (Nuxt error page + Sentry/similar)
- 🔲 **WebSocket reconnection** — frontend live page should auto-reconnect on connection drop with exponential backoff
- 🔲 **Sensor data retention policy** — auto-archive or prune old sensor logs to prevent DB bloat on Pi
- 🔲 **PWA support** — installable on phone for quick terrarium checks (Nuxt PWA module)
- 🔲 **Dark/light theme toggle** — the UI currently has one theme, reptile keepers often check at night
- 🔲 **Species per Pet** — define the exact species per animal and birthday, everything important for reselling or other things

---

## Notes

- Frontend i18n: all UI text in German + English (`i18n/locales/de.json`, `en.json`)
- Shared package must be rebuilt after changes: `pnpm --filter @cold-blood-cast/shared build`
- Branch naming: `feature/`, `fix/`, `chore/` prefixes
- Current branch: `feature/expaned-frontend` (typo in name — consider renaming when convenient)
