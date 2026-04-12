# Public Profile Feature — Kompletter Spec

> User-Level öffentliche Profilseite mit Tier-Galerie, Social Links, Statistiken, Badges und Community-Features.
> URL: `/u/{slug}` (z.B. `keeperlog.wlankabl.com/u/WlanKabL`)

---

## Übersicht

Ein User kann ein öffentliches Profil erstellen, das als persönliche Landingpage fungiert. Darauf sieht man:
- Wer der Keeper ist (Bio, Avatar, Tagline, Social Links)
- Welche Tiere er hält (Masonry-Grid mit Click → Pet Public Profile)
- Statistiken, Badges, und Community-Features (Likes/Kommentare)

Das Profil existiert **erst nach expliziter Aktivierung** (Opt-in).

---

## Phase 1 — Core (Fundament)

### 1.1 Datenbank-Schema

#### Neues Model: `UserPublicProfile`

```prisma
model UserPublicProfile {
    id              String   @id @default(cuid())
    userId          String   @unique @map("user_id")
    slug            String   @unique
    active          Boolean  @default(false)

    // ── Profil-Infos ─────────────────────────────
    bio             String?  @db.VarChar(1000)
    tagline         String?  @db.VarChar(100)      // "Corn Snake Enthusiast"
    location        String?  @db.VarChar(100)      // "Berlin, Deutschland"
    keeperSince     DateTime? @map("keeper_since")  // Keeper seit...

    // ── Avatar ───────────────────────────────────
    avatarUploadId  String?  @unique @map("avatar_upload_id")

    // ── Visibility Toggles (Opt-in) ──────────────
    showStats       Boolean  @default(true) @map("show_stats")
    showPets        Boolean  @default(true) @map("show_pets")
    showSocialLinks Boolean  @default(true) @map("show_social_links")
    showLocation    Boolean  @default(true) @map("show_location")
    showKeeperSince Boolean  @default(true) @map("show_keeper_since")
    showBadges      Boolean  @default(true) @map("show_badges")

    // ── Theme ────────────────────────────────────
    themePreset     String   @default("default") @map("theme_preset") @db.VarChar(30)
    // Presets: "default", "ocean", "forest", "sunset", "midnight", "desert", "arctic"

    // ── Stats ────────────────────────────────────
    views           Int      @default(0)

    createdAt       DateTime @default(now()) @map("created_at")
    updatedAt       DateTime @updatedAt @map("updated_at")

    // ── Relations ────────────────────────────────
    user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
    avatarUpload    Upload?          @relation(fields: [avatarUploadId], references: [id], onDelete: SetNull)
    socialLinks     UserSocialLink[]
    petOrder        UserPetOrder[]

    @@map("user_public_profiles")
}
```

#### Neues Model: `UserSocialLink`

```prisma
model UserSocialLink {
    id              String  @id @default(cuid())
    profileId       String  @map("profile_id")
    platform        String  @db.VarChar(30)
    // Vordefiniert: "instagram", "youtube", "tiktok", "twitter", "facebook", "website", "discord"
    // Custom:  platform = "custom"
    url             String  @db.VarChar(500)
    label           String? @db.VarChar(50)  // Nur für custom links
    sortOrder       Int     @default(0) @map("sort_order")

    profile         UserPublicProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

    @@index([profileId])
    @@map("user_social_links")
}
```

#### Neues Model: `UserPetOrder`

```prisma
model UserPetOrder {
    id          String  @id @default(cuid())
    profileId   String  @map("profile_id")
    petId       String  @map("pet_id")
    sortOrder   Int     @default(0) @map("sort_order")

    profile     UserPublicProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
    pet         Pet               @relation(fields: [petId], references: [id], onDelete: Cascade)

    @@unique([profileId, petId])
    @@index([profileId])
    @@map("user_pet_order")
}
```

#### User Model — Neue Relation

```prisma
// In User model hinzufügen:
    userPublicProfile   UserPublicProfile?
```

#### Upload Model — Neue Relation

```prisma
// In Upload model hinzufügen:
    userPublicProfile   UserPublicProfile?
```

#### Pet Model — Neue Relation

```prisma
// In Pet model hinzufügen:
    userPetOrders       UserPetOrder[]
```

---

### 1.2 Backend API

#### Modul: `user-public-profiles`

Verzeichnis: `apps/backend/src/modules/user-public-profiles/`

**Dateien:**
- `user-public-profiles.routes.ts`
- `user-public-profiles.service.ts`

#### Authentifizierte Routen (Prefix: `/api/user-profile`)

| Method | Route | Beschreibung |
|--------|-------|-------------|
| `GET` | `/` | Eigenes Profil laden (config view) |
| `POST` | `/` | Profil erstellen (slug optional, sonst auto-generate aus username) |
| `PATCH` | `/` | Profil updaten (bio, tagline, location, keeperSince, visibility toggles, theme) |
| `DELETE` | `/` | Profil löschen |
| `POST` | `/avatar` | Avatar hochladen (multipart, in `uploads/userAvatars/`) |
| `DELETE` | `/avatar` | Avatar löschen |
| `GET` | `/slug-check/:slug` | Slug-Verfügbarkeit prüfen |
| `PUT` | `/social-links` | Social Links setzen (Array, ersetzt alle) |
| `PUT` | `/pet-order` | Tier-Reihenfolge setzen (Array von `{ petId, sortOrder }`) |

#### Öffentliche Routen (Prefix: `/api/public/users`)

| Method | Route | Beschreibung |
|--------|-------|-------------|
| `GET` | `/:slug` | Öffentliches User-Profil laden (inkl. Tiere mit Public Profile) |
| `GET` | `/:slug/avatar` | Avatar-Bild servieren (decrypt + stream) |

#### Response: `GET /api/public/users/:slug`

```typescript
interface PublicUserData {
    slug: string;
    displayName: string | null;
    username: string;
    bio: string | null;
    tagline: string | null;
    location: string | null;        // nur wenn showLocation
    keeperSince: string | null;     // nur wenn showKeeperSince
    hasAvatar: boolean;
    themePreset: string;
    views: number;
    createdAt: string;

    socialLinks: Array<{            // nur wenn showSocialLinks
        platform: string;
        url: string;
        label: string | null;
    }>;

    stats: {                        // nur wenn showStats
        petCount: number;
        totalPhotos: number;
        totalFeedings: number;
        totalWeightRecords: number;
    } | null;

    badges: Array<{                 // nur wenn showBadges (Phase 3)
        key: string;
        label: string;
        icon: string;
        earnedAt: string;
    }>;

    pets: Array<{                   // nur wenn showPets
        id: string;
        name: string;
        species: string | null;
        morph: string | null;
        profilePhotoUrl: string | null;
        slug: string | null;        // Pet Public Profile slug (für Link)
        bio: string | null;         // Pet Public Profile bio
    }>;
}
```

#### Validierung

```typescript
const CreateProfileSchema = z.object({
    slug: z.string().min(3).max(60).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/).optional(),
});

const UpdateProfileSchema = z.object({
    bio: z.string().max(1000).optional(),
    tagline: z.string().max(100).optional(),
    location: z.string().max(100).optional(),
    keeperSince: z.string().datetime({ offset: true }).optional().nullable(),
    showStats: z.boolean().optional(),
    showPets: z.boolean().optional(),
    showSocialLinks: z.boolean().optional(),
    showLocation: z.boolean().optional(),
    showKeeperSince: z.boolean().optional(),
    showBadges: z.boolean().optional(),
    themePreset: z.enum(["default", "ocean", "forest", "sunset", "midnight", "desert", "arctic"]).optional(),
    active: z.boolean().optional(),
});

const SocialLinkSchema = z.object({
    platform: z.enum(["instagram", "youtube", "tiktok", "twitter", "facebook", "website", "discord", "custom"]),
    url: z.string().url().max(500),
    label: z.string().max(50).optional(),
});

const SocialLinksSchema = z.array(SocialLinkSchema).max(15);

const PetOrderSchema = z.array(z.object({
    petId: z.string(),
    sortOrder: z.number().int().min(0),
})).max(50);
```

---

### 1.3 Frontend — Management Page

**Neue Seite:** `apps/frontend/pages/settings/public-profile.vue`

#### Layout

```
┌─────────────────────────────────────────────────────┐
│ ← Zurück zu Settings                                │
│                                                     │
│ Dein öffentliches Profil                            │
│ Erstelle eine persönliche Landingpage...            │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Status: Aktiv / Inaktiv              [Toggle]   │ │
│ │ URL: keeperlog.wlankabl.com/u/WlanKabL [📋][↗] │ │
│ │ Custom Slug: [_____________] [Speichern]        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📷 Avatar                                       │ │
│ │ [Bild-Preview]  [Hochladen] [Entfernen]         │ │
│ │                                                 │ │
│ │ Tagline: [____________________________]         │ │
│ │ Bio:     [____________________________]         │ │
│ │          [____________________________]         │ │
│ │ Standort: [___________________________]         │ │
│ │ Keeper seit: [Datum-Picker]                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔗 Social Links                                 │ │
│ │ + Instagram: [_________________________] [✕]    │ │
│ │ + YouTube:   [_________________________] [✕]    │ │
│ │ + Custom:    [Label] [URL]             [✕]      │ │
│ │ [+ Link hinzufügen]                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🎨 Theme Preset                                 │ │
│ │ ○ Default  ○ Ocean  ○ Forest  ○ Sunset          │ │
│ │ ○ Midnight ○ Desert ○ Arctic                    │ │
│ │ (kleine Vorschau-Kacheln mit Farbpalette)       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 👁 Sichtbarkeit                                  │ │
│ │ Statistiken anzeigen          [Toggle]          │ │
│ │ Tiere anzeigen                [Toggle]          │ │
│ │ Social Links anzeigen         [Toggle]          │ │
│ │ Standort anzeigen             [Toggle]          │ │
│ │ Keeper-seit anzeigen          [Toggle]          │ │
│ │ Badges anzeigen               [Toggle]          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🐍 Tier-Reihenfolge                             │ │
│ │ (Drag & Drop sortierbare Liste)                 │ │
│ │ ≡ Korni         [🌐 Hat öffentliches Profil]    │ │
│ │ ≡ Slinky        [⚠ Kein Public Profile]         │ │
│ │ ≡ Monty         [🌐 Hat öffentliches Profil]    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📊 Statistiken                                  │ │
│ │ Aufrufe: 42  ·  Erstellt am: 12.04.2026         │ │
│ │                                                 │ │
│ │ [📋 Embed Code]  [📱 QR Code]                   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🗑 Danger Zone                                   │ │
│ │ [Profil löschen]                                │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

### 1.4 Frontend — Public Page `/u/[slug]`

**Neue Seite:** `apps/frontend/pages/u/[slug]/index.vue`

#### Layout

```
┌─────────────────────────────────────────────────────┐
│ [Theme-Colors vom Preset]                           │
│                                                     │
│         ┌────────┐                                  │
│         │ Avatar │                                  │
│         └────────┘                                  │
│         WlanKabL                                    │
│         "Corn Snake Enthusiast"                     │
│                                                     │
│         Berlin, Deutschland · Keeper seit 2020      │
│                                                     │
│         Bio-Text hier...                            │
│                                                     │
│         [🔗 IG] [🔗 YT] [🔗 TT] [🔗 Web]           │
│                                                     │
│   ┌──────────────────────────────────────────┐      │
│   │ 📊 Stats                                 │      │
│   │ 3 Tiere · 47 Fotos · 156 Fütterungen    │      │
│   └──────────────────────────────────────────┘      │
│                                                     │
│   🐍 Tiere                                          │
│   ┌─────────┐ ┌──────────────┐ ┌─────────┐         │
│   │ Korni   │ │   Slinky     │ │ Monty   │         │
│   │ [Foto]  │ │   [Foto]     │ │ [Foto]  │         │
│   │ Corn    │ │   Ball       │ │ Corn    │         │
│   │ Snake   │ │   Python     │ │ Snake   │         │
│   │ Amel    │ │   Pastel     │ │ Normal  │         │
│   └─────────┘ └──────────────┘ └─────────┘         │
│   (Masonry Grid — verschiedene Höhen)               │
│                                                     │
│   🏆 Badges (Phase 3)                               │
│   [🥇 Early Adopter] [📸 Photo Pro] [🐍 5 Pets]     │
│                                                     │
│   ──────────────────────────────                    │
│   Powered by KeeperLog                              │
└─────────────────────────────────────────────────────┘
```

---

### 1.5 Cross-Links

| Ort | Was zeigen |
|-----|-----------|
| **Sidebar** (`AppSidebar.vue`) | Neuer Nav-Eintrag "Public Profile" (icon: `lucide:globe`) unter General-Sektion |
| **Pet-Detail** (`/pets/[id]`) | Info-Banner "Erstelle ein öffentliches Profil für dieses Tier" wenn kein Public Profile existiert |
| **Tier-Liste** (`/pets`) | Badge-Icon (🌐) bei Tieren mit aktivem Public Profile |
| **Settings** (`/settings`) | Link-Card zu `/settings/public-profile` |

---

### 1.6 i18n Keys

Neue Keys unter `settings.publicProfile.*` und `publicUserProfile.*`:

**DE:**
```json
{
    "settings": {
        "publicProfile": {
            "title": "Öffentliches Profil",
            "subtitle": "Erstelle eine persönliche Landingpage für dich und deine Tiere",
            "createProfile": "Profil erstellen",
            "profileActive": "Profil aktiv",
            "profileInactive": "Profil inaktiv",
            "slug": "Profil-URL",
            "slugHint": "Deine persönliche URL — nur Kleinbuchstaben, Zahlen und Bindestriche",
            "tagline": "Tagline",
            "taglinePlaceholder": "z.B. Corn Snake Enthusiast",
            "bio": "Über mich",
            "bioPlaceholder": "Erzähle etwas über dich als Keeper...",
            "location": "Standort",
            "locationPlaceholder": "z.B. Berlin, Deutschland",
            "keeperSince": "Keeper seit",
            "avatar": "Profilbild",
            "uploadAvatar": "Bild hochladen",
            "removeAvatar": "Entfernen",
            "socialLinks": "Social Links",
            "addLink": "Link hinzufügen",
            "customLinkLabel": "Bezeichnung",
            "themePreset": "Theme",
            "themeDefault": "Standard",
            "themeOcean": "Ozean",
            "themeForest": "Wald",
            "themeSunset": "Sonnenuntergang",
            "themeMidnight": "Mitternacht",
            "themeDesert": "Wüste",
            "themeArctic": "Arktis",
            "visibility": "Sichtbarkeit",
            "showStats": "Statistiken anzeigen",
            "showPets": "Tiere anzeigen",
            "showSocialLinks": "Social Links anzeigen",
            "showLocation": "Standort anzeigen",
            "showKeeperSince": "Keeper-seit anzeigen",
            "showBadges": "Badges anzeigen",
            "petOrder": "Tier-Reihenfolge",
            "petHasProfile": "Hat öffentliches Profil",
            "petNoProfile": "Kein öffentliches Profil",
            "stats": "Statistiken",
            "embedCode": "Embed Code",
            "qrCode": "QR Code",
            "dangerZone": "Danger Zone",
            "deleteProfile": "Profil löschen",
            "confirmDelete": "Dein öffentliches Profil wirklich löschen?",
            "profileCreated": "Öffentliches Profil erstellt",
            "profileUpdated": "Profil aktualisiert",
            "profileDeleted": "Profil gelöscht",
            "avatarUpdated": "Profilbild aktualisiert",
            "avatarRemoved": "Profilbild entfernt",
            "slugTaken": "Diese URL ist bereits vergeben",
            "slugAvailable": "URL verfügbar"
        }
    },
    "publicUserProfile": {
        "pets": "Tiere",
        "stats": "Statistiken",
        "petCount": "{count} Tier | {count} Tiere",
        "photoCount": "{count} Foto | {count} Fotos",
        "feedingCount": "{count} Fütterung | {count} Fütterungen",
        "weightCount": "{count} Messung | {count} Messungen",
        "keeperSince": "Keeper seit {date}",
        "viewProfile": "Profil ansehen",
        "poweredBy": "Powered by",
        "notFound": "Profil nicht gefunden",
        "notFoundHint": "Dieses Profil existiert nicht oder ist nicht öffentlich.",
        "badges": "Badges"
    }
}
```

---

## Phase 2 — Theme Presets & Hintergründe

### 2.1 Theme System

Jeder Preset definiert:
- Primary Color
- Background Gradient (oder Bild)
- Card-Style (glass/solid)
- Accent Color

```typescript
const THEME_PRESETS = {
    default:  { primary: "#6366f1", bg: "bg-base", card: "glass-card" },
    ocean:    { primary: "#06b6d4", bg: "from-cyan-950 to-blue-950", card: "..." },
    forest:   { primary: "#22c55e", bg: "from-green-950 to-emerald-950", card: "..." },
    sunset:   { primary: "#f97316", bg: "from-orange-950 to-rose-950", card: "..." },
    midnight: { primary: "#8b5cf6", bg: "from-violet-950 to-slate-950", card: "..." },
    desert:   { primary: "#d97706", bg: "from-amber-950 to-stone-950", card: "..." },
    arctic:   { primary: "#38bdf8", bg: "from-sky-950 to-slate-950", card: "..." },
} as const;
```

### 2.2 Custom Hintergrundbilder

Spätere Erweiterung: AI-generierte Hintergrundbilder die man auswählen kann.
- Statische Assets unter `/public/backgrounds/`
- `backgroundImage` Feld in `UserPublicProfile` (nullable String)
- Galerie-Auswahl im Management UI

---

## Phase 3 — Badges & Achievements

### 3.1 Schema

```prisma
model Badge {
    id          String  @id @default(cuid())
    key         String  @unique          // "early_adopter", "photo_pro_50"
    nameKey     String  @map("name_key") // i18n key
    descKey     String  @map("desc_key") // i18n key
    icon        String                   // Lucide icon name
    category    String  @default("general") // "general", "photos", "feeding", "community"
    threshold   Int?                     // z.B. 50 für "50 Fotos"
    sortOrder   Int     @default(0) @map("sort_order")

    userBadges  UserBadge[]
    @@map("badges")
}

model UserBadge {
    id        String   @id @default(cuid())
    userId    String   @map("user_id")
    badgeId   String   @map("badge_id")
    earnedAt  DateTime @default(now()) @map("earned_at")

    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    badge     Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)

    @@unique([userId, badgeId])
    @@map("user_badges")
}
```

### 3.2 Badge-Definitionen

| Key | Name (DE) | Bedingung |
|-----|-----------|-----------|
| `early_adopter` | Frühstarter | Account vor v1.0 erstellt |
| `photo_pro_10` | Fotograf | 10 Fotos hochgeladen |
| `photo_pro_50` | Profi-Fotograf | 50 Fotos hochgeladen |
| `pet_parent_1` | Tierhalter | 1 Tier registriert |
| `pet_parent_5` | Rudel-Keeper | 5 Tiere registriert |
| `consistent_feeder` | Regelmäßig | 30 Tage am Stück Fütterungen eingetragen |
| `weight_tracker_50` | Datensammler | 50 Gewichtsmessungen |
| `public_star` | Öffentlicher Star | Public Profile hat 100+ Aufrufe |
| `social_butterfly` | Social Butterfly | 5+ Social Links verknüpft |
| `vet_diligent` | Tierarzt-Profi | 5 Tierarztbesuche dokumentiert |

### 3.3 Badge-Check Service

- Wird nach relevanten Aktionen getriggert (Upload, Feeding, etc.)
- Async/Background — nie im Request-Path blockieren
- `checkAndAwardBadges(userId, context)` Funktion
- Optional: Push-Notification wenn neuer Badge verdient

---

## Phase 4 — Community-Features (Likes & Kommentare)

### 4.1 Schema

```prisma
model ProfileLike {
    id        String   @id @default(cuid())
    profileId String   @map("profile_id")  // UserPublicProfile oder PublicProfile ID
    visitorIp String   @map("visitor_ip")   // IP-basiert (kein Login nötig)
    createdAt DateTime @default(now()) @map("created_at")

    @@unique([profileId, visitorIp])
    @@map("profile_likes")
}

model ProfileComment {
    id          String   @id @default(cuid())
    profileId   String   @map("profile_id")
    authorName  String   @map("author_name") @db.VarChar(50)
    content     String   @db.VarChar(500)
    approved    Boolean  @default(false)      // Owner muss freischalten
    createdAt   DateTime @default(now()) @map("created_at")

    @@index([profileId])
    @@map("profile_comments")
}
```

### 4.2 Features

- **Likes:** IP-basiert, kein Login nötig, 1 Like pro IP pro Profil
- **Kommentare:** Name + Text, Owner muss freischalten (Spam-Protection)
- **Rate Limiting:** Max 10 Likes/Kommentare pro IP pro Stunde
- **Moderation UI:** Im Management-Panel sieht der Owner pending Kommentare und kann approve/reject

### 4.3 Überlegungen

- Kommentare brauchen Spam-Protection: CAPTCHA oder Honeypot-Feld
- Eventuell optional: Owner kann Kommentare komplett deaktivieren
- IP-Hashing für DSGVO (speichere SHA-256 Hash statt raw IP)

---

## Phase 5 — Embed & QR

### 5.1 Embed Page

**Route:** `/u/[slug]/embed`
- Kompakte Version des Profils für iframes
- Ähnlich wie `/p/[slug]/embed` für Pet-Profile
- `width="400" height="600"` Standard

### 5.2 QR Code

- Canvas-basiert wie bei Pet Public Profile
- Download als PNG
- Enthält URL `https://keeperlog.wlankabl.com/u/{slug}`

---

## Implementierungs-Reihenfolge

### Sprint 1: Fundament
1. ✅ Prisma Migration: `UserPublicProfile`, `UserSocialLink`, `UserPetOrder` Models
2. ✅ Backend Service + Routes (CRUD, Avatar Upload, Social Links, Pet Order)
3. ✅ Shared Types / Zod Schemas

### Sprint 2: Frontend Management
4. ✅ `/settings/public-profile` — Management Page (alle Sections)
5. ✅ Avatar Upload Component
6. ✅ Social Links Editor
7. ✅ Drag & Drop Tier-Sortierung

### Sprint 3: Public Page
8. ✅ `/u/[slug]` — Public User Page
9. ✅ Theme Preset CSS/Styles
10. ✅ Masonry Grid für Tiere
11. ✅ Responsive Design + Mobile

### Sprint 4: Cross-Links & Polish
12. ✅ Sidebar Nav-Eintrag
13. ✅ Pet-Detail CTA Banner
14. ✅ /pets Badge-Icons
15. ✅ Settings Link Card
16. ✅ QR Code + Embed Code

### Sprint 5: Badges
17. Badge Models + Migration
18. Badge-Check Service
19. Badge-Anzeige auf Public Profile
20. Badge-Verwaltung (Admin)

### Sprint 6: Community
21. Likes + Kommentare Models
22. Public API Endpoints
23. Moderation UI
24. Rate Limiting + Spam Protection

---

## Offene Fragen / Entscheidungen

1. **Soll die User-URL `/u/slug` oder `/keeper/slug` heißen?** → `/u/` ist kürzer und QR-freundlicher
2. **Masonry-Library:** `vue-masonry-wall` oder CSS `columns`? → CSS columns ist dependency-frei
3. **Avatar-Größe:** Max 2MB? 5MB? Crop auf Upload oder serverseitig?
4. **Kommentar-Spam:** CAPTCHA, Honeypot, oder Owner-Approval-Only?
5. **Badge-Icons:** Lucide Icons oder eigene SVGs/Emojis?
6. **SEO:** Soll die User-Page auch OG-Meta-Tags für Social Sharing haben?
