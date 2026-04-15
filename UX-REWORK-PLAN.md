# Cold Blood Cast — UX Rework Plan

> Stand 2026-04-15 (Ratelimit-Pause): Pricing, 404, Onboarding, Dashboard-CTAs, Care-Log-Infinite-Scroll, API-Keys-Fix, Shortcut-Remap und Public-Profile-Redirects umgesetzt; Rest offen

---

## Status Quo

- **45 Seiten**, alle mit Loading-/Error-States und Empty-States
- CRUD-Patterns sind konsistent (List + Create Modal + Edit Modal + Delete Confirm)
- Sidebar deckt alle Features ab, Feature-Gate-System funktioniert
- 934 Backend + 593 Frontend Unit Tests + 502 E2E = **2029 Tests**

---

## Arbeitsstand (Zwischenstand wegen Ratelimit)

### Bereits umgesetzt

- [x] #1 Fehlende `/pricing` Seite
- [x] #2 404-Seite
- [x] #3 Onboarding / Getting Started (als Fullscreen-Wizard mit Skip)
- [x] #4 Dashboard Empty States mit CTAs
- [x] #5 Paginierung Care-Log Listen (Backend Cursor + Frontend Infinite Scroll)
- [x] #6 API Keys Dokumentation auf KeeperLog-Endpoints korrigiert
- [x] #7 Keyboard Shortcut Kollisionen aufgeloest (`S` fuer Settings, Sensors umgelegt)
- [x] #8 Public Profile Routen aufraeumen (Legacy `/p/[slug]` auf kanonische Keeper-Route umgeleitet)

### Noch offen

- [ ] #9 Max-Width standardisieren
- [ ] #10 Button-Komponenten standardisieren
- [ ] #11 Breadcrumbs fuer tiefe Seiten
- [ ] #12 Weight Chart & Vet Costs prominenter machen
- [ ] #13 Planner Leere-Woche-State
- [ ] #14 Filter-Pattern vereinheitlichen

### Vor dem Weitermachen noch absichern

- [ ] i18n fuer alle neu hinzugefuegten Texte vollstaendig in `de/en` nachziehen
- [ ] Tests + Lint + Typecheck komplett laufen lassen und gruene Basis herstellen

---

## 🔴 Kritisch — sofort fixen

### 1. Fehlende `/pricing` Seite

**Problem:** Sidebar-Items hinter Feature-Gate leiten auf `/pricing` weiter — die Seite existiert nicht. Jeder User der ein gesperrtes Feature klickt sieht einen Fehler.

**Lösung:**

- `pages/pricing.vue` erstellen mit Tier-Vergleichstabelle (Free / Pro / etc.)
- Features pro Tier auflisten
- CTA je nach aktuellem Plan: "Upgrade" oder "Aktueller Plan"
- Alternativ: Modal statt eigener Seite, wenn kein echter Zahlungsflow existiert

**Aufwand:** Klein

---

### 2. 404-Seite fehlt

**Problem:** Navigieren auf nicht-existierende Routen zeigt einen rohen Nuxt-Fehler statt einer freundlichen 404-Seite.

**Lösung:**

- `pages/[...notFound].vue` erstellen (oder `error.vue` erweitern)
- "Seite nicht gefunden" + Link zurück zum Dashboard
- Passt in die bestehende `error.vue` — prüfen ob 404 dort schon gehandelt wird

**Aufwand:** Minimal

---

## 🟠 Hoch — macht die App nutzbar für neue User

### 3. Onboarding / Getting Started

**Problem:** Neue User landen auf dem Dashboard mit 0 Daten und 0 Anleitung. Kein Wizard, keine Tooltips, keine "Getting Started"-Karte.

**Lösung:**

- Dashboard-Karte "Getting Started" anzeigen wenn `user.onboardingCompleted === false`
- Schritte mit Fortschrittsanzeige:
    1. Terrarium anlegen → `/enclosures`
    2. Tier hinzufügen → `/pets`
    3. Erste Fütterung loggen → `/feedings`
    4. (Optional) Sensoren einrichten
- Karte ausblendbar ("Nicht mehr anzeigen") über `onboardingCompleted` Flag
- Jeder Schritt hat einen direkten Link + grünen Haken wenn erledigt

**Aufwand:** Mittel

---

### 4. Dashboard Empty States mit CTAs

**Problem:** Dashboard-Widgets (Feeding Reminders, Weight Trends, Shedding Alerts) zeigen bei fehlenden Daten nur "Keine Daten" — kein Hinweis was zu tun ist.

**Lösung:**

- Feeding Reminders leer → "Richte einen Fütterungsplan ein" → Link zu `/pets`
- Weight Trends leer → "Trage das erste Gewicht ein" → Link zu `/weights`
- Shedding Alerts leer → "Noch keine Häutungen erfasst" → Link zu `/sheddings`
- Planner komplett leer → "Richte Fütterungspläne und Wartungsaufgaben ein"

**Aufwand:** Klein

---

### 5. Paginierung für Care-Log Listen

**Problem:** Feedings, Sheddings, Weights, Husbandry Notes laden ALLE Einträge auf einmal. Bei wachsenden Daten wird das zum Performance-Problem.

**Lösung:**

- Cursor-basierte Paginierung im Backend (bereits bei Admin-Pages vorhanden)
- "Load More" Button oder Infinite Scroll am Frontend
- Standardlimit: 50 Einträge, dann nachladen
- Bestehendes Pattern von `admin/audit-log` übernehmen

**Aufwand:** Mittel (betrifft 4+ Seiten + Backend)

---

### 6. API Keys Dokumentation fixen

**Problem:** cURL-Beispiel referenziert `/api/trades` — das ist aus einem anderen Projekt (Zentrax) kopiert.

**Lösung:**

- Beispiel auf echten KeeperLog-Endpoint ändern (z.B. `/api/pets`)
- Response-Beispiel anpassen

**Aufwand:** Minimal

---

## 🟡 Mittel — UX-Konsistenz & Polish

### 7. Keyboard Shortcut Kollisionen

**Problem:** Sensors und Settings beanspruchen beide `S`. Wer gewinnt hängt von der Render-Reihenfolge ab.

**Lösung:**

- Settings → eigenen Shortcut (z.B. `,` wie VS Code) oder entfernen
- Shortcut-Zuordnung zentral prüfen und dokumentieren

**Aufwand:** Minimal

---

### 8. Public Profile Routen aufräumen

**Problem:** `/p/[slug]` und `/keeper/[slug]/p/[petSlug]` — zwei Systeme für Pet-Profiles. Unklar welches kanonisch ist.

**Lösung:**

- Entscheiden welches Pattern bleibt
- Das andere via Redirect umleiten
- Sitemap entsprechend anpassen

**Aufwand:** Klein

---

### 9. Max-Width standardisieren

**Problem:** Manche Seiten nutzen `max-w-5xl`, andere `max-w-7xl`. Nicht nach Content-Dichte ausgerichtet.

**Lösung:**

- Grid/Dashboard-Seiten: `max-w-7xl`
- Detail/Listen-Seiten: `max-w-5xl`
- Konsistent über alle Seiten durchziehen

**Aufwand:** Klein (nur CSS-Klassen-Änderungen)

---

### 10. Button-Komponenten standardisieren

**Problem:** API Keys und Public Profile nutzen raw `<button>` statt `<UiButton>`. Inkonsistentes Look & Feel.

**Lösung:**

- Alle `<button>` durch `<UiButton>` ersetzen
- Custom-gradient-Buttons durch UiButton-Varianten ersetzen

**Aufwand:** Klein

---

## 🟢 Nice-to-have — langfristige Verbesserungen

### 11. Breadcrumbs für tiefe Seiten

Seiten wie `/pets/[id]/photos`, `/vet-visits/[id]`, `/enclosures/[id]` zeigen nur einen Zurück-Pfeil. Breadcrumbs geben mehr Kontext.

---

### 12. Weight Chart & Vet Costs prominenter machen

Die sind aktuell 2 Klicks tief versteckt. Optionen:

- Sidebar Sub-Links
- Dashboard-Widget mit "Zur Übersicht" Link
- Tabs auf der jeweiligen Elternseite sichtbarer machen

---

### 13. Planner: Leere-Woche-State

Wenn der Planner komplett leer ist, fehlt ein Hinweis. Lösung: Motivations-Text + Links zu Fütterungsplänen und Wartungsaufgaben.

---

### 14. Filter-Pattern vereinheitlichen

Feedings/Sheddings/Weights: Filter als separate Zeile unter dem Header.
Enclosures/Pets/Sensors: Filter integriert mit Suchfeld.

Langfristig: Ein Pattern für alle Listen wählen.

---

## Empfohlene Reihenfolge

| Phase               | Items                                              | Aufwand  |
| ------------------- | -------------------------------------------------- | -------- |
| **A — Sofort**      | #1 Pricing, #2 404-Page, #6 API Docs Fix           | ~2-3h    |
| **B — Neue User**   | #3 Onboarding, #4 Dashboard CTAs                   | ~4-5h    |
| **C — Performance** | #5 Paginierung                                     | ~6-8h    |
| **D — Polish**      | #7 Shortcuts, #8 Routes, #9 Max-Width, #10 Buttons | ~3-4h    |
| **E — Langfristig** | #11-#14                                            | Iterativ |

---

## Was diese Session gefixt hat (Zusammenfassung)

| Fix                | Was vorher fehlte                          | Was jetzt da ist                                        |
| ------------------ | ------------------------------------------ | ------------------------------------------------------- |
| Husbandry Notes    | Kein UI, Feature unsichtbar                | Vollständige CRUD-Seite + Sidebar-Link + i18n           |
| Feeding Retry      | Kein Retry-Datum bei abgelehnter Fütterung | `retryAt` Feld + Datetime-Picker + Planner-Event        |
| Planner Shed-Pause | Häutungspause nicht im Planner sichtbar    | "Paused (Shedding)" Badge + isPaused Meta               |
| Tags Redesign      | Tags nur admin-seitig, keine Zuordnung     | M2M Pet↔Tag Relation + Tag-Manager Modal auf Pet Detail |
| Quick-Complete     | Blindes Erstellen ohne Kontrolle           | Proper Modal mit vorausgefüllten Feldern                |
| Username→Slug      | Slug nicht synchronisiert                  | Automatische Slug-Aktualisierung bei Username-Änderung  |
