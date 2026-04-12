# Public Profile Feature — Kompletter Spec

> User-Level öffentliche Profilseite mit Tier-Galerie, Social Links, Statistiken, Badges und Community-Features.
> URL: `/keeper/{userSlug}` (z.B. `keeperlog.wlankabl.com/keeper/WlanKabL`)
> Pet URL: `/keeper/{userSlug}/p/{petSlug}` (z.B. `keeperlog.wlankabl.com/keeper/WlanKabL/p/byte`)

---

## Übersicht

Ein User kann ein öffentliches Profil erstellen, das als persönliche Landingpage fungiert. Darauf sieht man:

- Wer der Keeper ist (Bio, Avatar, Tagline, Social Links)
- Welche Tiere er hält (Masonry-Grid mit Click → Pet Public Profile)
- Statistiken, Badges, und Community-Features (Likes/Kommentare)

Das Profil existiert **erst nach expliziter Aktivierung** (Opt-in).

### URL-Struktur

```
/keeper/{userSlug}                    → User Profil-Landingpage
/keeper/{userSlug}/p/{petSlug}        → Pet Public Profile
/keeper/{userSlug}/p/{petSlug}/embed  → Pet Embed Widget
/keeper/{userSlug}/embed              → User Embed Widget
```

**Wichtig:** Pet-Slugs sind **pro User unique**, nicht global.
Jeder User kann `/keeper/alice/p/byte` und `/keeper/bob/p/byte` haben.

**Pet Profile ohne User Profile:** `/keeper/WlanKabL/p/byte` funktioniert auch wenn
der User kein aktives User Public Profile hat. In dem Fall liefert `/keeper/WlanKabL`
ein 404 / "Kein öffentliches Profil", aber `/keeper/WlanKabL/p/byte` ist erreichbar
wenn das Pet ein aktives Public Profile hat.

### Slug-Uniqueness

- **DB:** `PublicProfile.slug` wird von `@@unique` (global) zu `@@unique([userId, slug])` (per-user)
- **Slug-Check:** Prüft nur innerhalb des eigenen Users auf Duplikate
- Die alte Route `/p/[slug]` wird **entfernt** (kein Redirect)

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

#### Geändertes Model: `PublicProfile` (Pet Public Profile)

Das bestehende `PublicProfile` Model wird angepasst — **Pet-Slugs werden per-User unique statt global**:

```prisma
model PublicProfile {
    id            String  @id @default(cuid())
    petId         String  @unique @map("pet_id")
    userId        String  @map("user_id")
    slug          String                              // ← nicht mehr @unique allein!
    active        Boolean @default(false)
    bio           String?

    // ── Visibility Toggles (bleiben gleich) ──────
    showPhotos    Boolean @default(true) @map("show_photos")
    showWeight    Boolean @default(true) @map("show_weight")
    showAge       Boolean @default(true) @map("show_age")
    showFeedings  Boolean @default(true) @map("show_feedings")
    showSheddings Boolean @default(true) @map("show_sheddings")
    showSpecies   Boolean @default(true) @map("show_species")
    showMorph     Boolean @default(true) @map("show_morph")

    views         Int      @default(0)
    createdAt     DateTime @default(now()) @map("created_at")
    updatedAt     DateTime @updatedAt @map("updated_at")

    pet           Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
    user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([userId, slug])      // ← NEU: Slug nur pro User unique
    @@index([userId])
    @@map("public_profiles")
}
```

**Migration-Schritte:**

1. Drop unique constraint auf `slug` allein
2. Add composite unique constraint `@@unique([userId, slug])`
3. Bestehende Slugs bleiben — sie sind de facto bereits per-user unique (jeder User hat eigene Tiere)

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

| Method   | Route               | Beschreibung                                                                    |
| -------- | ------------------- | ------------------------------------------------------------------------------- |
| `GET`    | `/`                 | Eigenes Profil laden (config view)                                              |
| `POST`   | `/`                 | Profil erstellen (slug optional, sonst auto-generate aus username)              |
| `PATCH`  | `/`                 | Profil updaten (bio, tagline, location, keeperSince, visibility toggles, theme) |
| `DELETE` | `/`                 | Profil löschen                                                                  |
| `POST`   | `/avatar`           | Avatar hochladen (multipart, in `uploads/userAvatars/`)                         |
| `DELETE` | `/avatar`           | Avatar löschen                                                                  |
| `GET`    | `/slug-check/:slug` | Slug-Verfügbarkeit prüfen                                                       |
| `PUT`    | `/social-links`     | Social Links setzen (Array, ersetzt alle)                                       |
| `PUT`    | `/pet-order`        | Tier-Reihenfolge setzen (Array von `{ petId, sortOrder }`)                      |

#### Öffentliche Routen (Prefix: `/api/public/users`)

| Method | Route                                      | Beschreibung                                                    |
| ------ | ------------------------------------------ | --------------------------------------------------------------- |
| `GET`  | `/:userSlug`                               | Öffentliches User-Profil laden (inkl. Tiere mit Public Profile) |
| `GET`  | `/:userSlug/avatar`                        | Avatar-Bild servieren (decrypt + stream)                        |
| `GET`  | `/:userSlug/pets/:petSlug`                 | Öffentliches Pet-Profil laden                                   |
| `GET`  | `/:userSlug/pets/:petSlug/photos/:photoId` | Pet-Foto servieren                                              |

#### Response: `GET /api/public/users/:userSlug`

```typescript
interface PublicUserData {
    slug: string;
    displayName: string | null;
    username: string;
    bio: string | null;
    tagline: string | null;
    location: string | null; // nur wenn showLocation
    keeperSince: string | null; // nur wenn showKeeperSince
    hasAvatar: boolean;
    themePreset: string;
    views: number;
    createdAt: string;

    socialLinks: Array<{
        // nur wenn showSocialLinks
        platform: string;
        url: string;
        label: string | null;
    }>;

    stats: {
        // nur wenn showStats
        petCount: number;
        totalPhotos: number;
        totalFeedings: number;
        totalWeightRecords: number;
    } | null;

    badges: Array<{
        // nur wenn showBadges (Phase 3)
        key: string;
        label: string;
        icon: string;
        earnedAt: string;
    }>;

    pets: Array<{
        // nur wenn showPets
        id: string;
        name: string;
        species: string | null;
        morph: string | null;
        profilePhotoUrl: string | null;
        petSlug: string | null; // Pet Public Profile slug → Link: /keeper/{userSlug}/p/{petSlug}
        bio: string | null; // Pet Public Profile bio
    }>;
}
```

#### Response: `GET /api/public/users/:userSlug/pets/:petSlug`

Gleiche Struktur wie das bisherige `GET /api/public/pets/:slug`, aber resolved über
`userId` (via `User.username`) + `slug` (unique per user). Liefert Pet-Daten, Fotos,
Fütterungen, Häutungen, Gewichte — genau wie bisher.

#### Validierung

```typescript
const CreateProfileSchema = z.object({
    slug: z
        .string()
        .min(3)
        .max(60)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
        .optional(),
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
    themePreset: z
        .enum(["default", "ocean", "forest", "sunset", "midnight", "desert", "arctic"])
        .optional(),
    active: z.boolean().optional(),
});

const SocialLinkSchema = z.object({
    platform: z.enum([
        "instagram",
        "youtube",
        "tiktok",
        "twitter",
        "facebook",
        "website",
        "discord",
        "custom",
    ]),
    url: z.string().url().max(500),
    label: z.string().max(50).optional(),
});

const SocialLinksSchema = z.array(SocialLinkSchema).max(15);

const PetOrderSchema = z
    .array(
        z.object({
            petId: z.string(),
            sortOrder: z.number().int().min(0),
        }),
    )
    .max(50);
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
│ │ URL: keeperlog.wlankabl.com/keeper/WlanKabL [📋][↗] │ │
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

### 1.4 Frontend — Public Pages

**Neue Seiten:**

- `apps/frontend/pages/keeper/[slug]/index.vue` → User Profil
- `apps/frontend/pages/keeper/[slug]/p/[petSlug]/index.vue` → Pet Profil
- `apps/frontend/pages/keeper/[slug]/p/[petSlug]/embed.vue` → Pet Embed Widget
- `apps/frontend/pages/keeper/[slug]/embed.vue` → User Embed Widget

**Pet Profile Card:** `PetPublicProfileCard.vue` zeigt die URL an:
`keeperlog.wlankabl.com/keeper/{username}/p/{petSlug}` und der Slug-Check prüft nur pro User.

#### Layout User Page `/keeper/[slug]`

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

| Ort                            | Was zeigen                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Sidebar** (`AppSidebar.vue`) | Neuer Nav-Eintrag "Public Profile" (icon: `lucide:globe`) unter General-Sektion                   |
| **Pet-Detail** (`/pets/[id]`)  | Info-Banner "Erstelle ein öffentliches Profil für dieses Tier" wenn kein Public Profile existiert |
| **Tier-Liste** (`/pets`)       | Badge-Icon (🌐) bei Tieren mit aktivem Public Profile                                             |
| **Settings** (`/settings`)     | Link-Card zu `/settings/public-profile`                                                           |

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
    default: { primary: "#6366f1", bg: "bg-base", card: "glass-card" },
    ocean: { primary: "#06b6d4", bg: "from-cyan-950 to-blue-950", card: "..." },
    forest: { primary: "#22c55e", bg: "from-green-950 to-emerald-950", card: "..." },
    sunset: { primary: "#f97316", bg: "from-orange-950 to-rose-950", card: "..." },
    midnight: { primary: "#8b5cf6", bg: "from-violet-950 to-slate-950", card: "..." },
    desert: { primary: "#d97706", bg: "from-amber-950 to-stone-950", card: "..." },
    arctic: { primary: "#38bdf8", bg: "from-sky-950 to-slate-950", card: "..." },
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

| Key                 | Name (DE)         | Bedingung                                |
| ------------------- | ----------------- | ---------------------------------------- |
| `early_adopter`     | Frühstarter       | Account vor v1.0 erstellt                |
| `photo_pro_10`      | Fotograf          | 10 Fotos hochgeladen                     |
| `photo_pro_50`      | Profi-Fotograf    | 50 Fotos hochgeladen                     |
| `pet_parent_1`      | Tierhalter        | 1 Tier registriert                       |
| `pet_parent_5`      | Rudel-Keeper      | 5 Tiere registriert                      |
| `consistent_feeder` | Regelmäßig        | 30 Tage am Stück Fütterungen eingetragen |
| `weight_tracker_50` | Datensammler      | 50 Gewichtsmessungen                     |
| `public_star`       | Öffentlicher Star | Public Profile hat 100+ Aufrufe          |
| `social_butterfly`  | Social Butterfly  | 5+ Social Links verknüpft                |
| `vet_diligent`      | Tierarzt-Profi    | 5 Tierarztbesuche dokumentiert           |

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

### 5.1 Embed Pages

**User Embed:** `/keeper/[slug]/embed`

- Kompakte Version des User-Profils für iframes
- `width="400" height="600"` Standard

**Pet Embed:** `/keeper/[slug]/p/[petSlug]/embed`

- Gleiche Embed-Logik wie bisher, nur neue URL

### 5.2 QR Code

- Canvas-basiert wie bei Pet Public Profile
- Download als PNG
- User QR: `https://keeperlog.wlankabl.com/keeper/{slug}`
- Pet QR: `https://keeperlog.wlankabl.com/keeper/{userSlug}/p/{petSlug}`

---

## Implementierungs-Reihenfolge

### Sprint 1: Fundament

1. Prisma Migration: `UserPublicProfile`, `UserSocialLink`, `UserPetOrder` Models
2. Prisma Migration: `PublicProfile.slug` von global-unique → per-user-unique (`@@unique([userId, slug])`)
3. Backend Service + Routes (CRUD, Avatar Upload, Social Links, Pet Order)
4. Backend: Neue öffentliche Routen unter `/api/public/users/:slug/pets/:petSlug`
5. Shared Types / Zod Schemas

### Sprint 2: Frontend Management

7. `/settings/public-profile` — Management Page (alle Sections)
8. Avatar Upload Component
9. Social Links Editor
10. Drag & Drop Tier-Sortierung

### Sprint 3: Public Pages

11. `/keeper/[slug]` — Public User Page
12. `/keeper/[slug]/p/[petSlug]` — Pet Public Profile
13. Theme Preset CSS/Styles
14. Masonry Grid für Tiere
15. Responsive Design + Mobile

### Sprint 4: Cross-Links & Polish

16. Sidebar Nav-Eintrag
17. Pet-Detail CTA Banner
18. /pets Badge-Icons
19. Settings Link Card
20. QR Code + Embed Code (neue URLs)
21. PetPublicProfileCard.vue — URL-Anzeige + Slug-Check updaten

### Sprint 5: Badges

22. Badge Models + Migration
23. Badge-Check Service
24. Badge-Anzeige auf Public Profile
25. Badge-Verwaltung (Admin)

### Sprint 6: Community

26. Likes + Kommentare Models
27. Public API Endpoints
28. Moderation UI
29. Rate Limiting + Spam Protection

---

## Offene Fragen / Entscheidungen

1. ~~**Soll die User-URL `/u/slug` oder `/keeper/slug` heißen?**~~ → **Entschieden: `/keeper/slug`** — passt perfekt zum Branding "KeeperLog"
2. **Masonry-Library:** `vue-masonry-wall` oder CSS `columns`? → CSS columns ist dependency-frei
3. **Avatar-Größe:** Max 2MB? 5MB? Crop auf Upload oder serverseitig?
4. **Kommentar-Spam:** CAPTCHA, Honeypot, oder Owner-Approval-Only?
5. **Badge-Icons:** Lucide Icons oder eigene SVGs/Emojis?
6. **SEO:** Soll die User-Page auch OG-Meta-Tags für Social Sharing haben?
