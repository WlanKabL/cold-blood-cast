# KeeperLog — Roadmap

> Last updated: 2026-04-10
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
- ✅ Vitest test infrastructure (976+ tests)
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

- ✅ **1.19** EN + DE keys: pages.pets.photos.* (title, upload, empty, tags, setProfile, takenAt, etc.)

</details>

---

### Feature 2: Vet Visits (Tierarztbesuche) 🏥

> Tierarztbesuche pro Tier tracken. Tierarzt als eigenes Entity (wiederverwendbar). Erinnerungen für Folgetermine + Kostensummierung.

**Scope:** 2 backend modules (Vet + VetVisit) + frontend pages + dashboard widget + E2E

#### Backend

- 🔲 **2.1** Prisma schema: `Veterinarian` model (id, userId, name, clinicName, address, phone, email, notes, createdAt)
- 🔲 **2.2** Prisma schema: `VetVisit` model (id, petId, veterinarianId, userId, visitDate, reason, diagnosis, treatment, costCents, nextAppointment, notes, documents[], createdAt)
- 🔲 **2.3** `VetVisitDocument` model (id, vetVisitId, uploadId, label) — for PDF/image attachments
- 🔲 **2.4** Migration: `add_vet_visits`
- 🔲 **2.5** `veterinarians.service.ts`: CRUD with ownership checks
- 🔲 **2.6** `veterinarians.routes.ts`: standard REST (GET, POST, PUT, DELETE)
- 🔲 **2.7** `vet-visits.service.ts`: CRUD, cost aggregation per pet, cost aggregation per vet, upcoming appointments query
- 🔲 **2.8** `vet-visits.routes.ts`: REST + GET `/api/vet-visits/upcoming` + GET `/api/vet-visits/costs?petId=X`
- 🔲 **2.9** Vet visit reminder scheduler: daily check at 08:00, email when nextAppointment is tomorrow or today
- 🔲 **2.10** Email template: `vet-appointment-reminder.ts` (localized DE/EN)

#### Frontend

- 🔲 **2.11** `pages/veterinarians/index.vue`: Vet CRUD page (list, create, edit, delete)
- 🔲 **2.12** `pages/vet-visits/index.vue`: Visit list with pet filter, vet filter, date range
- 🔲 **2.13** Create/edit modal: date, vet selector, reason, diagnosis, treatment, cost, next appointment, document upload
- 🔲 **2.14** Cost overview: summary card showing total costs per pet, per vet, per year
- 🔲 **2.15** Pet detail page: section showing recent vet visits + total cost
- 🔲 **2.16** Dashboard widget: "Upcoming Vet Appointments" card
- 🔲 **2.17** Sidebar + topbar navigation entries

#### Testing

- 🔲 **2.18** Backend unit tests: veterinarians.service.ts, vet-visits.service.ts (CRUD, ownership, cost aggregation, upcoming query)
- 🔲 **2.19** Frontend unit tests: cost calculations, date formatting
- 🔲 **2.20** Playwright E2E: create vet, create visit, check cost summary, upcoming appointments

#### i18n

- 🔲 **2.21** EN + DE keys: pages.veterinarians.*, pages.vetVisits.*, dashboard vet widget

---

### Feature 3: Weight Charts 📈

> Gewichtsverlauf als Line-Chart pro Tier. Vergleich zwischen Tieren.

**Scope:** Chart library integration + frontend components + E2E

#### Setup

- 🔲 **3.1** Install chart library: `chart.js` + `vue-chartjs` (or `@unovis/vue` — evaluate)
- 🔲 **3.2** Chart wrapper component: `components/charts/LineChart.vue` (reusable for shedding later)

#### Frontend

- 🔲 **3.3** Pet detail page: weight chart section (line chart, x=date, y=grams)
- 🔲 **3.4** Date range selector: last 30d, 90d, 1y, all time
- 🔲 **3.5** `pages/weights/chart.vue`: multi-pet weight comparison page (select 2-5 pets, overlay lines)
- 🔲 **3.6** Growth rate indicator: show average growth per month, trend arrow (up/stable/down)
- 🔲 **3.7** Dashboard widget: mini sparkline charts for pets on dashboard (optional)

#### Testing

- 🔲 **3.8** Frontend unit tests: chart data transformation, date range filtering, growth rate calculation
- 🔲 **3.9** Playwright E2E: navigate to pet detail, verify chart renders, change date range, compare pets

#### i18n

- 🔲 **3.10** EN + DE keys: charts.*, weight comparison labels

---

### Feature 4: Medication Plans 💊

> Medikamenten-Katalog (wiederverwendbar) + individuelle Pläne pro Tier. Strenger als Fütterung: Mail + Dashboard-Alert.

**Scope:** 2 backend modules + frontend pages + scheduler + E2E

#### Backend

- 🔲 **4.1** Prisma schema: `Medication` model (id, userId, name, activeIngredient, unit, defaultDosage, notes) — reusable catalog
- 🔲 **4.2** Prisma schema: `MedicationPlan` model (id, petId, medicationId, userId, dosage, unit, intervalHours, startDate, endDate, notes, active, createdAt)
- 🔲 **4.3** Prisma schema: `MedicationLog` model (id, planId, petId, userId, administeredAt, dosage, notes, skipped, skipReason)
- 🔲 **4.4** Migration: `add_medications`
- 🔲 **4.5** `medications.service.ts`: CRUD for catalog (ownership checks)
- 🔲 **4.6** `medications.routes.ts`: standard REST
- 🔲 **4.7** `medication-plans.service.ts`: CRUD, active plan queries, overdue detection (`computeMedicationStatus`)
- 🔲 **4.8** `medication-plans.routes.ts`: REST + GET `/api/medication-plans/active` + GET `/api/medication-plans/overdue`
- 🔲 **4.9** `medication-logs.service.ts`: log administered dose, mark as skipped
- 🔲 **4.10** `medication-logs.routes.ts`: POST log, GET history per plan
- 🔲 **4.11** Medication reminder scheduler: runs every hour, checks active plans, sends email when dose is overdue
- 🔲 **4.12** Email template: `medication-reminder.ts` (localized DE/EN, stricter tone than feeding)

#### Frontend

- 🔲 **4.13** `pages/medications/index.vue`: Medication catalog CRUD
- 🔲 **4.14** `pages/medication-plans/index.vue`: Active plans list, create/edit with medication selector
- 🔲 **4.15** "Administer dose" quick action: one-click log from plan list
- 🔲 **4.16** Plan timeline: visual view of doses given vs. expected
- 🔲 **4.17** Pet detail page: active medication plans section
- 🔲 **4.18** Dashboard widget: "Medication Alerts" card with overdue plans (red highlight)
- 🔲 **4.19** Sidebar + topbar navigation entries

#### Testing

- 🔲 **4.20** Backend unit tests: all 3 services, overdue detection, scheduler logic
- 🔲 **4.21** Frontend unit tests: plan display, status badges, dose logging
- 🔲 **4.22** Playwright E2E: create medication, create plan, log dose, verify overdue alert

#### i18n

- 🔲 **4.23** EN + DE keys: pages.medications.*, pages.medicationPlans.*, dashboard medication widget

---

### Feature 5: Shedding Cycle Analysis 🐍

> Häutungszyklen analysieren, Durchschnitt + Trend, nächste Häutung vorhersagen, Warnung bei ungewöhnlichem Zyklus.

**Scope:** Backend service extension + frontend components + E2E

#### Backend

- 🔲 **5.1** `shedding-analysis.service.ts`: `computeSheddingCycle(sheddings[])` — average interval, trend (shortening/stable/lengthening), predicted next date, anomaly detection
- 🔲 **5.2** `shedding-analysis.routes.ts`: GET `/api/pets/:petId/shedding-analysis` (returns cycle stats + prediction)
- 🔲 **5.3** Shedding reminder: integrate into feeding-reminder scheduler — if predicted date is today or past, add to daily email

#### Frontend

- 🔲 **5.4** Pet detail page: "Shedding Cycle" card showing average interval, last shed, predicted next, trend indicator
- 🔲 **5.5** Shedding chart: timeline visualization of shedding intervals (bar chart, gap = interval)
- 🔲 **5.6** Dashboard widget: "Upcoming Sheddings" card (predicted within next 7 days)
- 🔲 **5.7** Warning badge: if cycle is >30% longer than average, show alert

#### Testing

- 🔲 **5.8** Backend unit tests: cycle computation (happy path, edge cases: single shedding, no history, irregular intervals)
- 🔲 **5.9** Frontend unit tests: trend display, prediction formatting
- 🔲 **5.10** Playwright E2E: navigate to pet detail, verify shedding analysis renders

#### i18n

- 🔲 **5.11** EN + DE keys: sheddingAnalysis.* (averageCycle, predicted, trend, warning)

---

### Feature 6: Activity Timeline 📅

> Chronologisches Tagebuch pro Tier. Alle Events (Fütterung, Häutung, Gewicht, Tierarzt, Medikamente, Fotos) auf einer Seite.

**Scope:** Backend aggregation endpoint + frontend page + E2E

#### Backend

- 🔲 **6.1** `activity-timeline.service.ts`: query all event types for a pet, normalize into `TimelineEvent` type (id, type, date, title, detail, icon), paginated, sorted desc
- 🔲 **6.2** `activity-timeline.routes.ts`: GET `/api/pets/:petId/timeline?page=1&limit=50&types=feeding,shedding,weight,vet,medication,photo`

#### Frontend

- 🔲 **6.3** `pages/pets/[id]/timeline.vue`: infinite-scroll timeline view with type-colored icons, date headers, expandable detail
- 🔲 **6.4** Type filter: toggle which event types to show
- 🔲 **6.5** Pet detail page: "View Timeline" link/button
- 🔲 **6.6** Mini timeline on pet detail: last 5 events preview

#### Testing

- 🔲 **6.7** Backend unit tests: timeline aggregation, pagination, type filtering
- 🔲 **6.8** Frontend unit tests: timeline rendering, filter toggles
- 🔲 **6.9** Playwright E2E: navigate to timeline, filter by type, scroll pagination

#### i18n

- 🔲 **6.10** EN + DE keys: pages.pets.timeline.* (title, types, empty, loadMore)

---

### Feature 7: Pet Documents 📄

> Eigener Dokumente-Bereich pro Tier: Kaufbeleg, CITES, Herkunftsnachweis, Befunde als PDF/Bild.

**Scope:** Backend module + frontend page + E2E

#### Backend

- 🔲 **7.1** Prisma schema: `PetDocument` model (id, petId, userId, uploadId, category, label, notes, documentDate, createdAt)
- 🔲 **7.2** Categories enum: `PURCHASE_RECEIPT`, `CITES`, `ORIGIN_CERTIFICATE`, `VET_REPORT`, `INSURANCE`, `OTHER`
- 🔲 **7.3** Migration: `add_pet_documents`
- 🔲 **7.4** `pet-documents.service.ts`: CRUD with ownership checks, category filter, encrypted file handling
- 🔲 **7.5** `pet-documents.routes.ts`: REST with multipart upload

#### Frontend

- 🔲 **7.6** `pages/pets/[id]/documents.vue`: document list grouped by category, upload button, download/view actions
- 🔲 **7.7** Upload modal: file picker (PDF/image), category selector, label, date, notes
- 🔲 **7.8** PDF viewer: inline preview for PDFs (or link to download)
- 🔲 **7.9** Pet detail page: "Documents" section with count + link

#### Testing

- 🔲 **7.10** Backend unit tests: CRUD, ownership, category filter
- 🔲 **7.11** Frontend unit tests: category grouping, upload form validation
- 🔲 **7.12** Playwright E2E: upload document, view by category, delete

#### i18n

- 🔲 **7.13** EN + DE keys: pages.pets.documents.* (title, categories, upload, empty)

---

### Feature 8: Enclosure Maintenance Log 🔧

> Terrarium-Wartung: Reinigung, Substrat-Wechsel, Lampen, Wassernapf. Wiederkehrende Erinnerungen.

**Scope:** Backend module + frontend page + scheduler + E2E

#### Backend

- 🔲 **8.1** Prisma schema: `MaintenanceTask` model (id, enclosureId, userId, type, description, completedAt, nextDueAt, intervalDays, recurring, notes, createdAt)
- 🔲 **8.2** Types enum: `CLEANING`, `SUBSTRATE_CHANGE`, `LAMP_REPLACEMENT`, `WATER_CHANGE`, `FILTER_CHANGE`, `DISINFECTION`, `OTHER`
- 🔲 **8.3** Migration: `add_enclosure_maintenance`
- 🔲 **8.4** `enclosure-maintenance.service.ts`: CRUD, recurring task auto-calculation (next due = lastCompleted + intervalDays), overdue query
- 🔲 **8.5** `enclosure-maintenance.routes.ts`: REST + GET `/api/enclosure-maintenance/overdue` + POST `/:id/complete` (mark done, auto-schedule next)
- 🔲 **8.6** Maintenance reminder: integrate into 08:00 scheduler — email for overdue tasks

#### Frontend

- 🔲 **8.7** `pages/enclosures/[id]/maintenance.vue`: task list with type badges, due dates, "mark done" button
- 🔲 **8.8** Create/edit modal: type, description, interval (optional for non-recurring), notes
- 🔲 **8.9** Enclosure detail page: "Maintenance" section showing overdue count + next due
- 🔲 **8.10** Dashboard widget: "Overdue Maintenance" card

#### Testing

- 🔲 **8.11** Backend unit tests: CRUD, recurring auto-schedule, overdue detection
- 🔲 **8.12** Frontend unit tests: due date formatting, overdue badge logic
- 🔲 **8.13** Playwright E2E: create task, complete task, verify rescheduling

#### i18n

- 🔲 **8.14** EN + DE keys: pages.enclosures.maintenance.* (title, types, due, overdue, complete)

---

### Feature 9: Data Export / Reports 📊

> PDF-Report pro Tier (für Tierarzt/Käufer) + CSV-Export aller Daten (Backup).

**Scope:** Backend export service + frontend UI + E2E

#### Backend

- 🔲 **9.1** Install PDF library: `@react-pdf/renderer` or `pdfmake` or `puppeteer` (evaluate)
- 🔲 **9.2** `data-export.service.ts`: generate pet report PDF (info, weight chart, feeding history, vet visits, photos)
- 🔲 **9.3** `data-export.service.ts`: generate CSV per data type (feedings, sheddings, weights, vet visits)
- 🔲 **9.4** `data-export.routes.ts`: GET `/api/exports/pet/:petId/pdf`, GET `/api/exports/pet/:petId/csv`, GET `/api/exports/all/csv` (full backup)
- 🔲 **9.5** Rate limiting: max 5 exports per hour per user
- 🔲 **9.6** Background generation: for large exports, queue via BullMQ + notify when ready

#### Frontend

- 🔲 **9.7** Pet detail page: "Export" dropdown (PDF Report, CSV Data)
- 🔲 **9.8** Settings page: "Export All Data" button (GDPR compliance)
- 🔲 **9.9** Download progress / notification when export is ready

#### Testing

- 🔲 **9.10** Backend unit tests: PDF generation (verify structure), CSV generation (verify headers + rows)
- 🔲 **9.11** Playwright E2E: trigger export, verify download

#### i18n

- 🔲 **9.12** EN + DE keys: export.* (generatePdf, generateCsv, exportAll, processing, ready)

---

### Feature 10: Public Pet Profile / Image Sharing 🌐

> Öffentliches Tier-Profil mit ausgewählten Bildern, Art, Morph, Alter, Gewicht. Share-Link für Verkaufsseiten.

**Scope:** Backend public endpoint + frontend public page + E2E

#### Backend

- 🔲 **10.1** Prisma schema: `PublicProfile` model (id, petId, userId, slug, active, showPhotos, showWeight, showAge, showFeedings, bio, createdAt)
- 🔲 **10.2** Migration: `add_public_profiles`
- 🔲 **10.3** `public-profiles.service.ts`: create/update/toggle profile, generate unique slug, public data query (no auth required)
- 🔲 **10.4** `public-profiles.routes.ts`: authenticated CRUD + GET `/public/pets/:slug` (no auth — public endpoint)
- 🔲 **10.5** Rate limiting on public endpoint (prevent scraping)

#### Frontend

- 🔲 **10.6** Pet detail page: "Share" button → toggle public profile on/off, configure visible data, copy share link
- 🔲 **10.7** `pages/public/pets/[slug].vue`: public-facing pet profile (no layout chrome, clean design for embedding)
- 🔲 **10.8** OG meta tags: image, title, description for social media embeds
- 🔲 **10.9** Embed code generator: HTML snippet for external sites

#### Testing

- 🔲 **10.10** Backend unit tests: profile CRUD, slug generation, public query (no private data leak)
- 🔲 **10.11** Playwright E2E: enable profile, access public link, verify data shown matches config

#### i18n

- 🔲 **10.12** EN + DE keys: pages.pets.publicProfile.* (enable, share, configure, slug, embed)

---

### Feature 11: Breeding Management 🥚

> Verpaarungen, Gelege/Clutches, Schlupfdaten, Offspring mit Eltern-Verknüpfung. Nice-to-have, aber vollständig wenn umgesetzt.

**Scope:** Backend modules + frontend pages + E2E

#### Backend

- 🔲 **11.1** Prisma schema: `Pairing` model (id, userId, maleId, femaleId, pairingDate, notes, createdAt)
- 🔲 **11.2** Prisma schema: `Clutch` model (id, pairingId, userId, layDate, eggCount, fertileCount, hatchDate, hatchCount, notes, createdAt)
- 🔲 **11.3** Extend Pet model: `motherId`, `fatherId` optional FK → Pet (self-referencing for lineage)
- 🔲 **11.4** Migration: `add_breeding`
- 🔲 **11.5** `pairings.service.ts`: CRUD, gender validation (male/female), history per pet
- 🔲 **11.6** `clutches.service.ts`: CRUD, link offspring as new pets with parent refs
- 🔲 **11.7** `pairings.routes.ts` + `clutches.routes.ts`: standard REST

#### Frontend

- 🔲 **11.8** `pages/breeding/index.vue`: pairings list with clutch counts
- 🔲 **11.9** Pairing detail: clutch history, offspring list
- 🔲 **11.10** Create pairing: select male + female pets
- 🔲 **11.11** Create clutch: link to pairing, egg counts, hatch results
- 🔲 **11.12** "Create offspring" from clutch: pre-fill species, morph, parents
- 🔲 **11.13** Pet detail page: "Parents" + "Offspring" sections (family tree)
- 🔲 **11.14** Simple lineage visualization (parent → child tree, 2-3 generations)

#### Testing

- 🔲 **11.15** Backend unit tests: pairing validation, clutch lifecycle, parent linking
- 🔲 **11.16** Frontend unit tests: family tree rendering
- 🔲 **11.17** Playwright E2E: create pairing, add clutch, create offspring, verify lineage

#### i18n

- 🔲 **11.18** EN + DE keys: pages.breeding.*, pages.clutches.*

---

### Feature 12: Dashboard Widgets Hub 🏠

> Dashboard als Zentrale: alle Widgets zusammenführen. Modular, jedes Feature liefert ein Widget.

**Scope:** Dashboard refactor + widget system + E2E

#### Architecture

- 🔲 **12.1** Widget component pattern: each widget is a standalone component (`components/dashboard/FeedingWidget.vue`, `VetWidget.vue`, etc.)
- 🔲 **12.2** Widget grid: responsive layout, 2-3 columns, auto-collapse on mobile

#### Widgets (depends on features above)

- ✅ **12.3** Feeding reminders widget (already done)
- 🔲 **12.4** Upcoming vet appointments widget (from Feature 2)
- 🔲 **12.5** Medication alerts widget (from Feature 4)
- 🔲 **12.6** Shedding predictions widget (from Feature 5)
- 🔲 **12.7** Overdue maintenance widget (from Feature 8)
- 🔲 **12.8** Recent activity feed widget (from Feature 6 — last 10 events across all pets)
- 🔲 **12.9** Pet quick stats widget (pet count with profile pics, click to navigate)
- 🔲 **12.10** Weight trend sparklines widget (mini charts per pet)

#### Testing

- 🔲 **12.11** Frontend unit tests: each widget component
- 🔲 **12.12** Playwright E2E: dashboard loads all widgets, verify data displayed

#### i18n

- 🔲 **12.13** EN + DE keys: pages.dashboard.* (widget-specific labels)

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
