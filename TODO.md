# KeeperLog — Roadmap

> Last updated: 2026-04-11
> Status legend: 🔲 Planned · 🧩 Scaffolded (schema exists, no routes/pages) · 🔨 In Progress · ✅ Done

---

## Already Completed ✅

<details>
<summary>Core Infrastructure (all done)</summary>

- ✅ Monorepo (pnpm workspaces)
- ✅ Prisma 6 + PostgreSQL 16 (Docker)
- ✅ Docker Compose (postgres, redis)
- ✅ GitHub Actions CI
- ✅ JWT auth (access 15min + refresh 7d)
- ✅ Shared TypeScript types package
- ✅ Vitest test infrastructure (1254+ tests)
- ✅ Redis (ioredis for BullMQ)
- ✅ WebSocket server (JWT-authenticated)
- ✅ Rate limiting
- ✅ Maintenance scheduler (daily 03:00 Berlin)
- ✅ Swagger/OpenAPI docs
- ✅ Maintenance mode
- ✅ Encrypted file uploads (AES at-rest)

</details>

<details>
<summary>Auth & User System (all done)</summary>

- ✅ Login / Register / Refresh / Logout
- ✅ Registration modes (open, invite_only, approval)
- ✅ Invite codes, access requests
- ✅ RBAC with feature flags + limits
- ✅ User profile / settings
- ✅ Email verification, password reset
- ✅ Session tracking, account deletion

</details>

<details>
<summary>Admin Panel — 13 pages (all done)</summary>

- ✅ Admin dashboard, user management, user detail
- ✅ Roles CRUD, feature flags, system settings
- ✅ Announcements, audit log, notification channels
- ✅ Invite codes, access requests
- ✅ Email management (send + log + preview)
- ✅ Legal documents

</details>

<details>
<summary>Landing Page & Public UI (all done)</summary>

- ✅ Landing page (hero, features, i18n, dark/light)
- ✅ Dark/light theme, i18n (DE + EN)
- ✅ Legal document viewer, unsubscribe, cookie consent

</details>

<details>
<summary>Enclosures, Pets, Sensors, Tracking (all done)</summary>

- ✅ Enclosure CRUD + detail with linked pets + sensors
- ✅ Pet CRUD (name, species, morph, gender, birth date, enclosure, notes)
- ✅ Sensor CRUD + readings
- ✅ Dashboard with enclosure cards + stats
- ✅ Feeding tracker (full CRUD with pet filter)
- ✅ Feed Items management (name, size, suitable pets, auto-fill on feedings)
- ✅ Feeding reminders (per-pet intervals, dashboard widget, daily email at 08:00 Berlin)
- ✅ Shedding tracker, Weight tracker
- ✅ Email notifications (SMTP, 21 templates)
- ✅ Telegram + Discord notification channels

</details>

---

## New Features — Ordered Roadmap

### Feature 1: Pet Photo Gallery 📸 ✅

> Fotos pro Tier hochladen, flache Liste mit Tags, Lightbox-Ansicht, Profilbild wählbar.

**Status: Complete** — Committed in `feat: pet photo gallery + feeding reminders + bug fixes`

<details>
<summary>Completed items (click to expand)</summary>

#### Backend

- ✅ **1.1** Prisma schema: `PetPhoto` model (id, petId, uploadId, tags[], caption, isProfilePicture, sortOrder, takenAt, createdAt)
- ✅ **1.2** Tags: free-text tags, comma-separated. Predefined suggestions: `shedding`, `feeding`, `portrait`, `enclosure`, `vet`
- ✅ **1.3** Schema pushed (takenAt added with EXIF support)
- ✅ **1.4** `pet-photos.service.ts`: create (upload + encrypt + link), list (by petId, with sort/filter), delete, setProfilePicture, update, getSuggestedTags
- ✅ **1.5** `pet-photos.routes.ts`: POST, GET, DELETE, PATCH, POST profile — all with auth + ownership
- ✅ **1.6** Serve encrypted images: existing `/uploads/*` route with `?t=` token auth

#### Frontend

- ✅ **1.9** `pages/pets/[id]/photos.vue`: Photo gallery page with grid view, tag filter, upload/edit/delete
- ✅ **1.10** `PhotoLightbox.vue`: full-screen viewer with prev/next, caption, tags, takenAt display
- ✅ **1.11** Upload modal: drag-and-drop + file picker, tag input, caption, takenAt (auto-filled from EXIF), profile pic toggle
- ✅ **1.12** Profile picture badge: star icon on profile pic, one-click set from overlay
- ✅ **1.13** Pet card update: profile picture on pet list + pet detail header
- ✅ **1.14** Photo count on pet list cards

#### QoL Improvements

- ✅ EXIF metadata extraction (exifr) — auto-fills takenAt from image DateTimeOriginal
- ✅ UiToggle bug fix — `type="button"` prevents form submission inside forms
- ✅ Sort by takenAt (desc) by default for proper chronological ordering

#### Testing

- ✅ **1.15** 25 backend unit tests: pet-photos.service.ts (CRUD, ownership, profile pic, takenAt, suggested tags)
- ✅ **1.16** 16 frontend unit tests: PhotoLightbox (render, navigation, props, takenAt display)
- ✅ **1.17** Playwright E2E: config + auth setup + pet-photos spec
- ✅ **1.18** Playwright setup: config, auth fixtures, base helpers

#### i18n

- ✅ **1.19** EN + DE keys: pages.pets.photos.\* (title, upload, empty, tags, setProfile, takenAt, etc.)

</details>

---

### Feature 2: Vet Visits (Tierarztbesuche) 🏥

> Tierarztbesuche pro Tier tracken. Tierarzt als eigenes Entity (wiederverwendbar). Erinnerungen für Folgetermine + Kostensummierung.

**Scope:** 2 backend modules (Vet + VetVisit) + frontend pages + dashboard widget + E2E

#### Backend

- ✅ **2.1** Prisma schema: `Veterinarian` model (id, userId, name, clinicName, address, phone, email, notes, createdAt)
- ✅ **2.2** Prisma schema: `VetVisit` model (id, petId, veterinarianId, userId, visitDate, reason, diagnosis, treatment, costCents, nextAppointment, notes, documents[], createdAt)
- ✅ **2.3** `VetVisitDocument` model (id, vetVisitId, uploadId, label) — for PDF/image attachments
- ✅ **2.4** Migration: `add_vet_visits`
- ✅ **2.5** `veterinarians.service.ts`: CRUD with ownership checks
- ✅ **2.6** `veterinarians.routes.ts`: standard REST (GET, POST, PUT, DELETE)
- ✅ **2.7** `vet-visits.service.ts`: CRUD, cost aggregation per pet, cost aggregation per vet, upcoming appointments query
- ✅ **2.8** `vet-visits.routes.ts`: REST + GET `/api/vet-visits/upcoming` + GET `/api/vet-visits/costs?petId=X`
- ✅ **2.9** Vet visit reminder scheduler: daily check at 08:00, email when nextAppointment is tomorrow or today
- ✅ **2.10** Email template: `vet-appointment-reminder.ts` (localized DE/EN)

#### Frontend

- ✅ **2.11** `pages/veterinarians/index.vue`: Vet CRUD page (list, create, edit, delete)
- ✅ **2.12** `pages/vet-visits/index.vue`: Visit list with pet filter, vet filter, date range
- ✅ **2.13** Create/edit modal: date, vet selector, reason, diagnosis, treatment, cost, next appointment, document upload
- ✅ **2.14** Cost overview: summary card showing total costs per pet, per vet, per year
- ✅ **2.15** Pet detail page: section showing recent vet visits + total cost
- ✅ **2.16** Dashboard widget: "Upcoming Vet Appointments" card
- ✅ **2.17** Sidebar + topbar navigation entries

#### Testing

- ✅ **2.18** Backend unit tests: veterinarians.service.ts, vet-visits.service.ts (CRUD, ownership, cost aggregation, upcoming query)
- ✅ **2.19** Frontend unit tests: cost calculations, date formatting
- ✅ **2.20** Playwright E2E: create vet, create visit, check cost summary, upcoming appointments

#### i18n

- ✅ **2.21** EN + DE keys: pages.veterinarians._, pages.vetVisits._, dashboard vet widget

---

### Feature 3: Weight Charts 📈 ✅

> Gewichtsverlauf als Line-Chart pro Tier. Vergleich zwischen Tieren.

**Scope:** Chart library integration + frontend components + backend endpoints + E2E

#### Setup

- ✅ **3.1** Install chart library: `chart.js` + `vue-chartjs`
- ✅ **3.2** Chart wrapper component: `components/charts/WeightLineChart.vue` (reusable, sparkline + full mode)

#### Backend

- ✅ **3.B1** `GET /api/weights/chart` — grouped weight data by pet with date range filtering
- ✅ **3.B2** `GET /api/weights/growth-rate` — growth rate computation per pet (avg g/month, trend)
- ✅ **3.B3** Backend unit tests: 29 tests (computeGrowthRate, getWeightChartData, getGrowthRates, CRUD)

#### Frontend

- ✅ **3.3** Pet detail page: weight chart section (line chart, x=date, y=grams) + growth rate indicator
- ✅ **3.4** Date range selector: last 30d, 90d, 1y, all time
- ✅ **3.5** `pages/weights/chart.vue`: multi-pet weight comparison page (select pets, overlay lines, growth cards)
- ✅ **3.6** Growth rate indicator: show average growth per month, trend arrow (up/stable/down)
- ✅ **3.7** Dashboard widget: mini sparkline charts for pets on dashboard

#### Testing

- ✅ **3.8** Frontend unit tests: 19 tests (chart data transformation, date range, growth display, colors)
- ✅ **3.9** Playwright E2E: 16 tests (pet detail chart, comparison page, dashboard sparklines, weight index)

#### i18n

- ✅ **3.10** EN + DE keys: pages.weights.chart.\*, dashboard weight trends

---

### Feature 4: Shedding Cycle Analysis 🐍 ✅

> Häutungszyklen analysieren, Durchschnitt + Trend, nächste Häutung vorhersagen, Warnung bei ungewöhnlichem Zyklus.

**Status: Complete** — Committed in `feat: shedding cycle analysis`

<details>
<summary>Completed items (click to expand)</summary>

#### Backend

- ✅ **4.1** `shedding-analysis.service.ts`: `computeSheddingCycle(sheddings[])` — average interval, trend (shortening/stable/lengthening), predicted next date, anomaly detection
- ✅ **4.2** `shedding-analysis.routes.ts`: GET `/api/sheddings/analysis/:petId` + GET `/api/sheddings/upcoming`
- ✅ **4.3** Route registration in server.ts

#### Frontend

- ✅ **4.4** Pet detail page: "Shedding Cycle" card showing average interval, last shed, predicted next, trend indicator
- ✅ **4.5** `SheddingIntervalChart.vue`: bar chart visualization of shedding intervals
- ✅ **4.6** Dashboard widget: "Upcoming Sheddings" card (predicted within next 7 days)
- ✅ **4.7** Warning badge: if cycle is >30% longer than average, show alert

#### Testing

- ✅ **4.8** Backend unit tests: 22 tests (cycle computation, trend detection, anomaly, ownership, upcoming query)
- ✅ **4.9** Frontend unit tests: 15 tests (display computation, bar colors, trend labels, prediction formatting)
- ✅ **4.10** Playwright E2E: 11 tests (pet detail card, dashboard widget, anomaly warning)

#### i18n

- ✅ **4.11** EN + DE keys: sheddingAnalysis.\* (averageCycle, predicted, trend, warning, dashboard, pet detail)

</details>

---

### Feature 5: Activity Timeline 📅 ✅

> Chronologisches Tagebuch pro Tier. Alle Events (Fütterung, Häutung, Gewicht, Tierarzt, Medikamente, Fotos) auf einer Seite.

**Status: Complete** — Committed in `feat: activity timeline`

<details>
<summary>Completed items (click to expand)</summary>

#### Backend

- ✅ **5.1** `activity-timeline.service.ts`: query all event types for a pet, normalize into `TimelineEvent` type (id, type, date, title, detail, icon), paginated, sorted desc
- ✅ **5.2** `activity-timeline.routes.ts`: GET `/api/pets/:petId/timeline?page=1&limit=50&types=feeding,shedding,weight,vet_visit,photo`

#### Frontend

- ✅ **5.3** `pages/pets/[id]/timeline.vue`: timeline view with type-colored icons, date headers, load more pagination
- ✅ **5.4** Type filter: toggle which event types to show (at least 1 must stay active)
- ✅ **5.5** Pet detail page: "View Timeline" link + "Recent Activity" card
- ✅ **5.6** Mini timeline on pet detail: last 5 events preview

#### Testing

- ✅ **5.7** Backend unit tests: 19 tests (normalizeEvents, getTimeline — pagination, type filtering, ownership, sorting)
- ✅ **5.8** Frontend unit tests: 13 tests (eventColorClass, groupEventsByDate, filterEventsByTypes)
- ✅ **5.9** Playwright E2E: 10 tests (timeline page, pet detail widget, empty states, filters, navigation)

#### i18n

- ✅ **5.10** EN + DE keys: pages.pets.timeline.\* (title, subtitle, viewTimeline, loadMore, empty, noMore, filters, recentActivity, eventCount)

</details>

---

### Feature 6: Pet Documents 📄 ✅

> Eigener Dokumente-Bereich pro Tier: Kaufbeleg, CITES, Herkunftsnachweis, Befunde als PDF/Bild.

**Scope:** Backend module + frontend page + E2E

#### Backend

- ✅ **6.1** Prisma schema: `PetDocument` model (id, petId, userId, uploadId, category, label, notes, documentDate, createdAt)
- ✅ **6.2** Categories enum: `PURCHASE_RECEIPT`, `CITES`, `ORIGIN_CERTIFICATE`, `VET_REPORT`, `INSURANCE`, `OTHER`
- ✅ **6.3** Migration: `add_pet_documents`
- ✅ **6.4** `pet-documents.service.ts`: CRUD with ownership checks, category filter, encrypted file handling
- ✅ **6.5** `pet-documents.routes.ts`: REST with multipart upload

#### Frontend

- ✅ **6.6** `pages/pets/[id]/documents.vue`: document list grouped by category, upload button, download/view actions
- ✅ **6.7** Upload modal: file picker (PDF/image), category selector, label, date, notes
- 🔲 **6.8** PDF viewer: inline preview for PDFs (or link to download)
- ✅ **6.9** Pet detail page: "Documents" section with count + link

#### Testing

- ✅ **6.10** Backend unit tests: CRUD, ownership, category filter
- ✅ **6.11** Frontend unit tests: category grouping, upload form validation
- ✅ **6.12** Playwright E2E: upload document, view by category, delete

#### i18n

- ✅ **6.13** EN + DE keys: pages.pets.documents.\* (title, categories, upload, empty)

---

### Feature 7: Enclosure Maintenance Log 🔧 ✅

> Terrarium-Wartung: Reinigung, Substrat-Wechsel, Lampen, Wassernapf. Wiederkehrende Erinnerungen.

**Status: Complete** — Full backend + frontend + scheduler + E2E

<details>
<summary>Completed items (click to expand)</summary>

#### Backend

- ✅ **7.1** Prisma schema: `MaintenanceTask` model (id, enclosureId, userId, type, description, completedAt, nextDueAt, intervalDays, recurring, notes, createdAt) + indexes
- ✅ **7.2** Types enum: `CLEANING`, `SUBSTRATE_CHANGE`, `LAMP_REPLACEMENT`, `WATER_CHANGE`, `FILTER_CHANGE`, `DISINFECTION`, `OTHER`
- ✅ **7.3** Migration: `20260411130000_add_enclosure_maintenance`
- ✅ **7.4** `enclosure-maintenance.service.ts`: CRUD with ownership checks, completeTask (auto-reschedule if recurring), overdue queries, grouped-by-user query for scheduler
- ✅ **7.5** `enclosure-maintenance.routes.ts`: REST + GET `/api/enclosure-maintenance/overdue` + POST `/:id/complete` — auth + emailVerified + feature gate
- ✅ **7.6** `maintenance-reminders.queue.ts`: daily 08:00 Berlin scheduler, emails overdue tasks grouped by user
- ✅ **7.7** Email template: `maintenance-reminder.ts` (localized DE/EN, type labels, overdue badge)
- ✅ **7.8** Feature flag: `enclosure_maintenance` in seed.ts (v5 migration, all roles)
- ✅ **7.9** Error code: `E_MAINTENANCE_TASK_NOT_FOUND` in errors.ts

#### Frontend

- ✅ **7.10** `pages/maintenance/index.vue`: full task list with glass-card grid, type icons/colors, search + type/enclosure filters, create/edit modal, mark-done, delete confirmation
- ✅ **7.11** Dashboard widget: "Overdue Maintenance" section on dashboard page with linked task cards
- ✅ **7.12** Enclosure detail page: "Maintenance Tasks" section with overdue count badge, task list
- ✅ **7.13** Sidebar nav entry: feature-gated wrench icon in care section
- ✅ **7.14** Feature gate: `definePageMeta({ middleware: ["feature-gate"], requiredFeature: "enclosure_maintenance" })`

#### Testing

- ✅ **7.15** Backend unit tests: 27 tests (CRUD, ownership, recurring auto-schedule, overdue detection, complete with/without interval)
- ✅ **7.16** Playwright E2E: 13 tests (list page, task display, create modal, mark-done, empty state, dashboard widget, enclosure detail section)

#### i18n

- ✅ **7.17** EN + DE keys: nav.maintenance, pages.maintenance.\* (50+ keys — title, types, fields, status, CRUD messages), dashboard overdue keys, enclosure detail maintenance keys

</details>

---

### Feature 8: Weekly Care Planner ✅

> Sonntag-Abend-Mail mit Wochenüberblick: was steht an, was ist überfällig, was kommt auf dich zu. Dazu ein Kalender im Frontend für die Wochenplanung.

**Scope:** Backend email scheduler + calendar endpoint + frontend calendar page + E2E

#### Backend

- ✅ **8.1** `weekly-planner.service.ts`: aggregate upcoming tasks per user for next 7 days (feedings due, vet appointments, predicted sheddings, maintenance overdue)
- ✅ **8.2** `weekly-planner.queue.ts`: scheduler runs Sunday 18:00 Berlin time, sends weekly digest email
- ✅ **8.3** Email template: `weekly-care-digest.ts` (localized DE/EN) — grouped by day, color-coded by type
- ✅ **8.4** `weekly-planner.routes.ts`: GET `/api/planner/week?from=DATE` — returns day-by-day event list for calendar view
- ✅ **8.5** User preference: `weeklyReportEnabled` flag (opt-in via settings page, already on User model)
- ✅ **8.6** Feature flag: `weekly_planner` in seed.ts v6, assigned to all roles
- ✅ **8.7** Auth schema: `weeklyReportEnabled` added to updateProfileSchema + service + /me endpoint
- ✅ **8.8** Shared types: `weeklyReportEnabled` added to AuthUser interface
- ✅ **8.9** Server registration: routes at `/api/planner`, scheduler start/stop in lifecycle

#### Frontend

- ✅ **8.10** `pages/planner/index.vue`: weekly calendar view — 7-day glass-card grid with event cards per day (feeding, vet, shedding, maintenance), color-coded, legend, event count badges
- ✅ **8.11** Week navigation: prev/next buttons, "today" quick-jump, formatted week label
- ✅ **8.12** Settings page: weekly digest toggle in Notifications section (enable/disable via PATCH /api/auth/profile)
- ✅ **8.13** Sidebar navigation entry: `lucide:calendar-days` icon in Overview section, feature-gated

#### Testing

- ✅ **8.14** Backend unit tests: 16 tests for aggregation service (all event types, empty states, opt-in filtering, overdue handling)
- ✅ **8.15** Auth schema tests: weeklyReportEnabled boolean validation
- ✅ **8.16** Playwright E2E: 12 tests — page rendering, event types, empty state, navigation, legend

#### i18n

- ✅ **8.17** EN + DE keys: nav.planner, pages.planner._, pages.settings.weeklyDigest_, email template strings

---

### Feature 9: Public Pet Profile / Image Sharing 🌐 ✅

> Öffentliches Tier-Profil mit ausgewählten Bildern, Art, Morph, Alter, Gewicht. Share-Link für Verkaufsseiten.

**Status: Complete** — Full backend + frontend + OG middleware + embed + E2E

<details>
<summary>Completed items (click to expand)</summary>

#### Backend

- ✅ **9.1** Prisma schema: `PublicProfile` model (id, petId, userId, slug, active, bio, showPhotos, showWeight, showAge, showFeedings, showSheddings, showSpecies, showMorph, views, createdAt, updatedAt)
- ✅ **9.2** Migration: `20260411140000_add_public_profiles`
- ✅ **9.3** `public-profiles.service.ts`: create (auto-slug from pet name), update (slug, bio, toggles), delete, toggle active, check slug availability, public data query with view counter increment, public photo serving
- ✅ **9.4** `public-profiles.routes.ts`: authenticated CRUD at `/api/public-profiles` + public endpoints at `/api/public/pets/:slug` (no auth)
- ✅ **9.5** Feature flag: `public_profiles` in seed.ts, assigned to all roles

#### Frontend

- ✅ **9.6** `PetPublicProfileCard.vue`: full management card on pet detail — create/delete profile, slug editor, bio textarea, 7 visibility toggles, active/inactive badge, view counter, embed code modal with copy, QR code generation, share link
- ✅ **9.7** `pages/p/[slug]/index.vue`: public-facing pet profile — photo gallery with lightbox, weight sparkline chart, recent feedings list, shedding history, age calculation, "Powered by KeeperLog" branding
- ✅ **9.8** `pages/p/[slug]/embed.vue`: compact embeddable card (400×600 iframe) — header, bio, photo strip, stat grid, "View Full Profile" link
- ✅ **9.9** `server/middleware/og-bot.ts`: OG meta tags for social media bots (title, description, image from profile photo)
- ✅ **9.10** Auth middleware: `/p/` prefix added to public routes (no auth required)

#### Testing

- ✅ **9.11** Backend unit tests: 37 tests (CRUD, ownership, slug generation/collision, public data query, visibility toggles, view counter, photo serving, error cases)
- ✅ **9.12** Playwright E2E: 49 tests across 3 spec files:
    - `public-profile.spec.ts` (19 tests): full profile page, photo gallery, lightbox, weight chart, feedings, sheddings, SEO, not-found, minimal profile
    - `public-profile-embed.spec.ts` (14 tests): compact card, stats, photo strip, links, branding, not-found, minimal
    - `public-profile-management.spec.ts` (16 tests): create/delete flow, slug, badges, toggles, embed modal, QR, view counter

#### i18n

- ✅ **9.13** EN + DE keys: publicProfile.\* (50+ keys — title, share, configure, slug, embed, visibility toggles, powered by, not found, stats, feedings, sheddings, weight)

</details>

---

### Feature 10: Medication Plans 💊

> Medikamenten-Katalog (wiederverwendbar) + individuelle Pläne pro Tier. Strenger als Fütterung: Mail + Dashboard-Alert.

**Scope:** 2 backend modules + frontend pages + scheduler + E2E

#### Backend

- 🔲 **10.1** Prisma schema: `Medication` model (id, userId, name, activeIngredient, unit, defaultDosage, notes) — reusable catalog
- 🔲 **10.2** Prisma schema: `MedicationPlan` model (id, petId, medicationId, userId, dosage, unit, intervalHours, startDate, endDate, notes, active, createdAt)
- 🔲 **10.3** Prisma schema: `MedicationLog` model (id, planId, petId, userId, administeredAt, dosage, notes, skipped, skipReason)
- 🔲 **10.4** Migration: `add_medications`
- 🔲 **10.5** `medications.service.ts`: CRUD for catalog (ownership checks)
- 🔲 **10.6** `medications.routes.ts`: standard REST
- 🔲 **10.7** `medication-plans.service.ts`: CRUD, active plan queries, overdue detection (`computeMedicationStatus`)
- 🔲 **10.8** `medication-plans.routes.ts`: REST + GET `/api/medication-plans/active` + GET `/api/medication-plans/overdue`
- 🔲 **10.9** `medication-logs.service.ts`: log administered dose, mark as skipped
- 🔲 **10.10** `medication-logs.routes.ts`: POST log, GET history per plan
- 🔲 **10.11** Medication reminder scheduler: runs every hour, checks active plans, sends email when dose is overdue
- 🔲 **10.12** Email template: `medication-reminder.ts` (localized DE/EN, stricter tone than feeding)

#### Frontend

- 🔲 **10.13** `pages/medications/index.vue`: Medication catalog CRUD
- 🔲 **10.14** `pages/medication-plans/index.vue`: Active plans list, create/edit with medication selector
- 🔲 **10.15** "Administer dose" quick action: one-click log from plan list
- 🔲 **10.16** Plan timeline: visual view of doses given vs. expected
- 🔲 **10.17** Pet detail page: active medication plans section
- 🔲 **10.18** Dashboard widget: "Medication Alerts" card with overdue plans (red highlight)
- 🔲 **10.19** Sidebar + topbar navigation entries

#### Testing

- 🔲 **10.20** Backend unit tests: all 3 services, overdue detection, scheduler logic
- 🔲 **10.21** Frontend unit tests: plan display, status badges, dose logging
- 🔲 **10.22** Playwright E2E: create medication, create plan, log dose, verify overdue alert

#### i18n

- 🔲 **10.23** EN + DE keys: pages.medications._, pages.medicationPlans._, dashboard medication widget

---

### Feature 11: Data Export / Reports 📊

> PDF-Report pro Tier (für Tierarzt/Käufer) + CSV-Export aller Daten (Backup).

**Scope:** Backend export service + frontend UI + E2E

#### Backend

- 🔲 **11.1** Install PDF library: `@react-pdf/renderer` or `pdfmake` or `puppeteer` (evaluate)
- 🔲 **11.2** `data-export.service.ts`: generate pet report PDF (info, weight chart, feeding history, vet visits, photos)
- 🔲 **11.3** `data-export.service.ts`: generate CSV per data type (feedings, sheddings, weights, vet visits)
- 🔲 **11.4** `data-export.routes.ts`: GET `/api/exports/pet/:petId/pdf`, GET `/api/exports/pet/:petId/csv`, GET `/api/exports/all/csv` (full backup)
- 🔲 **11.5** Rate limiting: max 5 exports per hour per user
- 🔲 **11.6** Background generation: for large exports, queue via BullMQ + notify when ready

#### Frontend

- 🔲 **11.7** Pet detail page: "Export" dropdown (PDF Report, CSV Data)
- 🔲 **11.8** Settings page: "Export All Data" button (GDPR compliance)
- 🔲 **11.9** Download progress / notification when export is ready

#### Testing

- 🔲 **11.10** Backend unit tests: PDF generation (verify structure), CSV generation (verify headers + rows)
- 🔲 **11.11** Playwright E2E: trigger export, verify download

#### i18n

- 🔲 **11.12** EN + DE keys: export.\* (generatePdf, generateCsv, exportAll, processing, ready)

---

### Feature 12: Breeding Management 🥚

> Verpaarungen, Gelege/Clutches, Schlupfdaten, Offspring mit Eltern-Verknüpfung. Nice-to-have, aber vollständig wenn umgesetzt.

**Scope:** Backend modules + frontend pages + E2E

#### Backend

- 🔲 **12.1** Prisma schema: `Pairing` model (id, userId, maleId, femaleId, pairingDate, notes, createdAt)
- 🔲 **12.2** Prisma schema: `Clutch` model (id, pairingId, userId, layDate, eggCount, fertileCount, hatchDate, hatchCount, notes, createdAt)
- 🔲 **12.3** Extend Pet model: `motherId`, `fatherId` optional FK → Pet (self-referencing for lineage)
- 🔲 **12.4** Migration: `add_breeding`
- 🔲 **12.5** `pairings.service.ts`: CRUD, gender validation (male/female), history per pet
- 🔲 **12.6** `clutches.service.ts`: CRUD, link offspring as new pets with parent refs
- 🔲 **12.7** `pairings.routes.ts` + `clutches.routes.ts`: standard REST

#### Frontend

- 🔲 **12.8** `pages/breeding/index.vue`: pairings list with clutch counts
- 🔲 **12.9** Pairing detail: clutch history, offspring list
- 🔲 **12.10** Create pairing: select male + female pets
- 🔲 **12.11** Create clutch: link to pairing, egg counts, hatch results
- 🔲 **12.12** "Create offspring" from clutch: pre-fill species, morph, parents
- 🔲 **12.13** Pet detail page: "Parents" + "Offspring" sections (family tree)
- 🔲 **12.14** Simple lineage visualization (parent → child tree, 2-3 generations)

#### Testing

- 🔲 **12.15** Backend unit tests: pairing validation, clutch lifecycle, parent linking
- 🔲 **12.16** Frontend unit tests: family tree rendering
- 🔲 **12.17** Playwright E2E: create pairing, add clutch, create offspring, verify lineage

#### i18n

- 🔲 **12.18** EN + DE keys: pages.breeding._, pages.clutches._

---

### Feature 13: Dashboard Widgets Hub 🏠

> Dashboard als Zentrale: alle Widgets zusammenführen. Modular, jedes Feature liefert ein Widget.

**Scope:** Dashboard refactor + widget system + E2E

#### Architecture

- 🔲 **13.1** Widget component pattern: each widget is a standalone component (`components/dashboard/FeedingWidget.vue`, `VetWidget.vue`, etc.)
- 🔲 **13.2** Widget grid: responsive layout, 2-3 columns, auto-collapse on mobile

#### Widgets (depends on features above)

- ✅ **13.3** Feeding reminders widget (already done)
- 🔲 **13.4** Upcoming vet appointments widget (from Feature 2)
- 🔲 **13.5** Medication alerts widget (from Feature 10)
- 🔲 **13.6** Shedding predictions widget (from Feature 4)
- 🔲 **13.7** Overdue maintenance widget (from Feature 7)
- 🔲 **13.8** Recent activity feed widget (from Feature 5 — last 10 events across all pets)
- 🔲 **13.9** Pet quick stats widget (pet count with profile pics, click to navigate)
- 🔲 **13.10** Weight trend sparklines widget (mini charts per pet)

#### Testing

- 🔲 **13.11** Frontend unit tests: each widget component
- 🔲 **13.12** Playwright E2E: dashboard loads all widgets, verify data displayed

#### i18n

- 🔲 **13.13** EN + DE keys: pages.dashboard.\* (widget-specific labels)

---

## E2E Test Infrastructure (Setup with Feature 1) ✅

- ✅ Playwright config (`playwright.config.ts`)
- ✅ Auth fixtures (login helper, test user seeding)
- ✅ Base page helpers (navigation, toast assertion, modal helpers)
- 🔲 CI integration (GitHub Actions Playwright job)
- 🔲 Test data seeding (reset DB + seed before E2E suite)

---

## Backlog (Lower Priority)

- 🔲 Prisma migrations workflow (switch from `db push` to `migrate` for production)
- 🔲 Database backup/restore strategy
- 🔲 Graceful shutdown improvements
- 🔲 Sensor reading charts (time-series per sensor)
- 🔲 Alert rules CRUD (min/max thresholds per sensor)
- 🔲 Home Assistant integration
- 🔲 PWA support (installable on phone)
- 🔲 Realistic demo seed data
- 🔲 Public status page
- 🔲 Stripe payments (if SaaS)
- 🔲 Organization layer (multi-user sharing)
- 🔲 Calendar view (upcoming feedings, reminders)

---

## Notes

- Frontend i18n: all UI text in German + English (`i18n/locales/de.json`, `en.json`)
- Shared package must be rebuilt after changes: `pnpm --filter @cold-blood-cast/shared build`
- Passwords: PBKDF2 + SHA-512 + pepper, timing-safe comparison
- Color system: Olive primary (`#8a9c4a`) + Warm Copper accent (`#d87533`)
- **Test requirements:** Every feature gets full Vitest (frontend + backend) + Playwright E2E coverage
- **Implementation rule:** Features 100% fertig, kein halbes Zeug. Selbstoptimierend arbeiten.
