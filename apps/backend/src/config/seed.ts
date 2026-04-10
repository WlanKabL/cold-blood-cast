import { PrismaClient, type Role, type FeatureFlag } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── Migration System ─────────────────────────────────────────────────────────
//
//  How it works:
//  • Each seed change is a numbered Migration with an idempotent `apply()`.
//  • The current DB version is stored in system_settings → "seed_version".
//  • On every deploy, seedDatabase() applies ALL migrations whose version
//    is greater than the stored DB version, in order.
//  • If the DB is 5 versions behind the code → all 5 migrations run.
//  • User data is NEVER touched by any migration.
//  • --reseed resets DB version to 0 and replays every migration.
//
//  Adding a new migration:
//  1. Add a new entry at the END of MIGRATIONS[].
//  2. Bump CURRENT_SEED_VERSION to match the new entry's version.
//  3. Deploy — it applies once, then never again until the next bump.

const CURRENT_SEED_VERSION = 4;

// ─── Shared Data ─────────────────────────────────────────────────────────────

const SYSTEM_ROLES = [
    {
        name: "ADMIN",
        displayName: "Administrator",
        description: "Full system access, user management, configuration",
        color: "#ef4444",
        priority: 100,
        showBadge: false,
    },
    {
        name: "MODERATOR",
        displayName: "Moderator",
        description: "Can manage sensors, alerts, and moderate content",
        color: "#f59e0b",
        priority: 50,
        showBadge: false,
    },
    {
        name: "PREMIUM",
        displayName: "Premium",
        description: "Full feature access via subscription",
        color: "#8b5cf6",
        priority: 30,
        showBadge: true,
    },
    {
        name: "PRO",
        displayName: "Pro",
        description: "Unlimited access, advanced monitoring, API, and integrations",
        color: "#f59e0b",
        priority: 40,
        showBadge: true,
    },
    {
        name: "BETA_TESTER",
        displayName: "Beta Tester",
        description: "Access to experimental features before release",
        color: "#06b6d4",
        priority: 20,
        showBadge: true,
    },
    {
        name: "FREE",
        displayName: "Free",
        description: "Basic feature access",
        color: "#6b7280",
        priority: 0,
        showBadge: false,
    },
] as const;

const DEFAULT_FEATURE_FLAGS = [
    // Core terrarium management
    {
        key: "enclosures",
        name: "Enclosures",
        category: "core",
        description: "Create and manage terrariums and vivariums",
    },
    {
        key: "pets",
        name: "Pets",
        category: "core",
        description: "Track reptiles and amphibians",
    },
    {
        key: "sensors",
        name: "Sensors",
        category: "core",
        description: "Sensor management and readings",
    },
    {
        key: "dashboard",
        name: "Dashboard",
        category: "core",
        description: "Main dashboard and overview",
    },
    // Care logging
    {
        key: "feedings",
        name: "Feedings",
        category: "care",
        description: "Log and track feeding schedules",
    },
    {
        key: "sheddings",
        name: "Sheddings",
        category: "care",
        description: "Track shedding cycles",
    },
    {
        key: "weights",
        name: "Weights",
        category: "care",
        description: "Monitor weight over time",
    },
    {
        key: "vet_visits",
        name: "Vet Visits",
        category: "care",
        description: "Track veterinary visits, appointments, and health checks",
    },
    {
        key: "photos",
        name: "Photos",
        category: "care",
        description: "Pet photo gallery with tags, lightbox, and profile pictures",
    },
    {
        key: "timeline",
        name: "Activity Timeline",
        category: "care",
        description: "Unified activity timeline across all pet events",
    },
    {
        key: "pet_documents",
        name: "Pet Documents",
        category: "care",
        description: "Upload and organize pet documents (CITES, receipts, vet reports)",
    },
    // Alerts & monitoring
    {
        key: "alerts",
        name: "Alerts",
        category: "monitoring",
        description: "Automated sensor alert rules and Telegram notifications",
    },
    // Organization
    {
        key: "tags",
        name: "Tags",
        category: "organization",
        description: "Tag management for entries",
    },
    // Integration
    {
        key: "api_access",
        name: "API Access",
        category: "integration",
        description: "External API access via API keys",
    },
];

// ─── Type helpers ─────────────────────────────────────────────────────────────

type MigrationContext = {
    prisma: PrismaClient;
    roles: Role[];
    flags: FeatureFlag[];
};

type Migration = {
    version: number;
    description: string;
    apply: (ctx: MigrationContext) => Promise<void>;
};

// ─── Helper: apply role→flag mapping ─────────────────────────────────────────

async function applyRoleFlagMapping(
    ctx: MigrationContext,
    mapping: Record<string, Record<string, boolean>>,
    mode: "upsert-update" | "create-only",
) {
    for (const [roleName, flagMap] of Object.entries(mapping)) {
        const role = ctx.roles.find((r) => r.name === roleName);
        if (!role) continue;

        for (const [flagKey, enabled] of Object.entries(flagMap)) {
            const flag = ctx.flags.find((f) => f.key === flagKey);
            if (!flag) continue;

            await ctx.prisma.roleFeatureFlag.upsert({
                where: { roleId_featureFlagId: { roleId: role.id, featureFlagId: flag.id } },
                update: mode === "upsert-update" ? { enabled } : {},
                create: { roleId: role.id, featureFlagId: flag.id, enabled },
            });
        }
    }
}

async function applyRoleLimits(
    ctx: MigrationContext,
    limits: Record<string, Record<string, number>>,
    mode: "upsert-update" | "create-only",
) {
    for (const [roleName, roleLimits] of Object.entries(limits)) {
        const role = ctx.roles.find((r) => r.name === roleName);
        if (!role) continue;

        for (const [key, value] of Object.entries(roleLimits)) {
            await ctx.prisma.roleLimit.upsert({
                where: { roleId_key: { roleId: role.id, key } },
                update: mode === "upsert-update" ? { value } : {},
                create: { roleId: role.id, key, value },
            });
        }
    }
}

// ─── Migrations ───────────────────────────────────────────────────────────────
//
//  Version 1: Foundation (CBC)
//    • System roles (create-only, never overwrite)
//    • Feature flags (create-only)
//    • System settings (create-only)
//    • Role limits — CBC defaults
//    • Role→feature flag mappings — CBC defaults
//    • Legal documents (from markdown files)
//

const MIGRATIONS: Migration[] = [
    // ─────────────────────────────────────── v1: Foundation (KeeperLog)
    {
        version: 1,
        description: "Foundation: roles, flags, settings, limits, legal documents",
        apply: async (ctx) => {
            const { prisma } = ctx;

            // Roles (create-only — never force-update live admin changes)
            for (const role of SYSTEM_ROLES) {
                await prisma.role.upsert({
                    where: { name: role.name },
                    update: {},
                    create: { ...role, isSystem: true },
                });
            }

            // Feature flags (create-only)
            for (const flag of DEFAULT_FEATURE_FLAGS) {
                await prisma.featureFlag.upsert({
                    where: { key: flag.key },
                    update: {},
                    create: { ...flag, enabled: true },
                });
            }

            // System settings (create-only — NEVER overwrite live settings)
            const defaultSettings: Record<string, string> = {
                platform_name: '"KeeperLog"',
                registration_mode: '"open"',
                maintenance_mode: "false",
                default_role: '"FREE"',
                telegram_enabled: "false",
                discord_enabled: "false",
                notify_on_register: "true",
                notify_on_login: "false",
                notify_on_first_login: "true",
                notify_on_pending: "true",
                notify_on_breach: "true",
                notify_on_server_error: "true",
                notify_on_sensor_alert: "true",
            };
            for (const [key, value] of Object.entries(defaultSettings)) {
                await prisma.systemSetting.upsert({
                    where: { key },
                    update: {},
                    create: { key, value },
                });
            }

            // Rebuild context — roles & flags were just created above but ctx was
            // snapshotted BEFORE this migration ran, so ctx.roles/flags are stale.
            const freshRoles = await prisma.role.findMany();
            const freshFlags = await prisma.featureFlag.findMany();
            ctx.roles = freshRoles;
            ctx.flags = freshFlags;

            // Role limits — CBC defaults
            await applyRoleLimits(
                ctx,
                {
                    FREE: {
                        max_enclosures: 2,
                        max_pets: 5,
                        max_sensors_per_enclosure: 4,
                        max_alert_rules: 5,
                        max_uploads: 50,
                    },
                    BETA_TESTER: {
                        max_enclosures: 10,
                        max_pets: 20,
                        max_sensors_per_enclosure: 8,
                        max_alert_rules: 20,
                        max_uploads: 200,
                    },
                    PREMIUM: {
                        max_enclosures: 10,
                        max_pets: 30,
                        max_sensors_per_enclosure: 10,
                        max_alert_rules: 50,
                        max_uploads: -1,
                    },
                    PRO: {
                        max_enclosures: -1,
                        max_pets: -1,
                        max_sensors_per_enclosure: -1,
                        max_alert_rules: -1,
                        max_uploads: -1,
                    },
                    MODERATOR: {
                        max_enclosures: -1,
                        max_pets: -1,
                        max_sensors_per_enclosure: -1,
                        max_alert_rules: -1,
                        max_uploads: -1,
                    },
                    ADMIN: {
                        max_enclosures: -1,
                        max_pets: -1,
                        max_sensors_per_enclosure: -1,
                        max_alert_rules: -1,
                        max_uploads: -1,
                    },
                },
                "create-only",
            );

            // Role→feature flag mappings
            //   ALL roles get core + care + monitoring + organization flags
            //   api_access: PRO + ADMIN only
            const allFlags = {
                enclosures: true,
                pets: true,
                sensors: true,
                feedings: true,
                sheddings: true,
                weights: true,
                alerts: true,
                dashboard: true,
                tags: true,
            };
            await applyRoleFlagMapping(
                ctx,
                {
                    FREE: { ...allFlags, api_access: false },
                    BETA_TESTER: { ...allFlags, api_access: false },
                    PREMIUM: { ...allFlags, api_access: false },
                    PRO: { ...allFlags, api_access: true },
                    MODERATOR: { ...allFlags, api_access: false },
                    ADMIN: { ...allFlags, api_access: true },
                },
                "create-only",
            );

            // Legal documents (create-only, unpublished — admin publishes manually)
            const legalDocs = [
                {
                    key: "privacy_policy",
                    title: "Privacy Policy",
                    titleDe: "Datenschutzerklärung",
                    sortOrder: 0,
                },
                {
                    key: "terms_of_service",
                    title: "Terms of Service",
                    titleDe: "Nutzungsbedingungen",
                    sortOrder: 1,
                },
                {
                    key: "impressum",
                    title: "Legal Notice",
                    titleDe: "Impressum",
                    sortOrder: 2,
                },
                {
                    key: "cookie_policy",
                    title: "Cookie Policy",
                    titleDe: "Cookie-Richtlinie",
                    sortOrder: 3,
                },
                {
                    key: "acceptable_use_policy",
                    title: "Acceptable Use Policy",
                    titleDe: "Nutzungsrichtlinie",
                    sortOrder: 4,
                },
                {
                    key: "refund_policy",
                    title: "Refund Policy",
                    titleDe: "Widerrufsbelehrung",
                    sortOrder: 5,
                },
            ];

            // dist/config/seed.js → ../../legal = <backend>/legal
            const legalDir = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "legal");

            const keyToFile: Record<string, string> = {
                privacy_policy: "privacy-policy.md",
                terms_of_service: "terms-of-service.md",
                impressum: "impressum.md",
                cookie_policy: "cookie-policy.md",
                acceptable_use_policy: "acceptable-use-policy.md",
                refund_policy: "refund-policy.md",
            };

            for (const doc of legalDocs) {
                const file = keyToFile[doc.key];
                const enPath = resolve(legalDir, "en", file);
                const dePath = resolve(legalDir, "de", file);

                const contentEn = readFileSync(enPath, "utf-8");
                const contentDe = readFileSync(dePath, "utf-8");

                await prisma.legalDocument.upsert({
                    where: { key: doc.key },
                    update: {},
                    create: {
                        key: doc.key,
                        title: doc.title,
                        titleDe: doc.titleDe,
                        content: contentEn,
                        contentDe: contentDe,
                        metadata: doc.key === "impressum" ? {} : undefined,
                        isPublished: false,
                        sortOrder: doc.sortOrder,
                    },
                });
            }

            console.log("  → Foundation complete: roles, flags, settings, limits, legal docs");
        },
    },

    // ─────────────────────────────────────── v2: Vet Visits feature flag
    {
        version: 2,
        description: "Add vet_visits feature flag to all roles",
        apply: async (ctx) => {
            await applyRoleFlagMapping(
                ctx,
                {
                    FREE: { vet_visits: true },
                    BETA_TESTER: { vet_visits: true },
                    PREMIUM: { vet_visits: true },
                    PRO: { vet_visits: true },
                    MODERATOR: { vet_visits: true },
                    ADMIN: { vet_visits: true },
                },
                "create-only",
            );
            console.log("  → vet_visits flag assigned to all roles");
        },
    },

    // ─────────────────────────────────────── v3: photos + timeline feature flags
    {
        version: 3,
        description: "Add photos and timeline feature flags to all roles",
        apply: async (ctx) => {
            // Ensure the new flags exist in the DB (they were added to DEFAULT_FEATURE_FLAGS
            // but existing installations may not have them yet)
            for (const flag of DEFAULT_FEATURE_FLAGS.filter((f) =>
                ["photos", "timeline"].includes(f.key),
            )) {
                await ctx.prisma.featureFlag.upsert({
                    where: { key: flag.key },
                    update: {},
                    create: { ...flag, enabled: true },
                });
            }

            // Refresh flags in context
            ctx.flags = await ctx.prisma.featureFlag.findMany();

            await applyRoleFlagMapping(
                ctx,
                {
                    FREE: { photos: true, timeline: true },
                    BETA_TESTER: { photos: true, timeline: true },
                    PREMIUM: { photos: true, timeline: true },
                    PRO: { photos: true, timeline: true },
                    MODERATOR: { photos: true, timeline: true },
                    ADMIN: { photos: true, timeline: true },
                },
                "create-only",
            );
            console.log("  → photos + timeline flags assigned to all roles");
        },
    },

    // ─────────────────────────────────────── v4: pet_documents feature flag
    {
        version: 4,
        description: "Add pet_documents feature flag to all roles",
        apply: async (ctx) => {
            for (const flag of DEFAULT_FEATURE_FLAGS.filter((f) =>
                ["pet_documents"].includes(f.key),
            )) {
                await ctx.prisma.featureFlag.upsert({
                    where: { key: flag.key },
                    update: {},
                    create: { ...flag, enabled: true },
                });
            }

            ctx.flags = await ctx.prisma.featureFlag.findMany();

            await applyRoleFlagMapping(
                ctx,
                {
                    FREE: { pet_documents: true },
                    BETA_TESTER: { pet_documents: true },
                    PREMIUM: { pet_documents: true },
                    PRO: { pet_documents: true },
                    MODERATOR: { pet_documents: true },
                    ADMIN: { pet_documents: true },
                },
                "create-only",
            );
            console.log("  → pet_documents flag assigned to all roles");
        },
    },

    // ─── Add new migrations here ───────────────────────────────────────────
];

// ─── Version Helpers ──────────────────────────────────────────────────────────

async function getDbSeedVersion(prisma: PrismaClient): Promise<number> {
    const row = await prisma.systemSetting.findUnique({ where: { key: "seed_version" } });
    if (!row) return 0;
    const parsed = JSON.parse(row.value);
    return typeof parsed === "number" ? parsed : parseInt(parsed, 10) || 0;
}

async function setDbSeedVersion(prisma: PrismaClient, version: number): Promise<void> {
    await prisma.systemSetting.upsert({
        where: { key: "seed_version" },
        update: { value: JSON.stringify(version) },
        create: { key: "seed_version", value: JSON.stringify(version) },
    });
}

async function buildContext(prisma: PrismaClient): Promise<MigrationContext> {
    const [roles, flags] = await Promise.all([
        prisma.role.findMany(),
        prisma.featureFlag.findMany(),
    ]);
    return { prisma, roles, flags };
}

// ─── seedDatabase ─────────────────────────────────────────────────────────────

export async function seedDatabase(
    prisma: PrismaClient,
    opts?: { adminEmail?: string; adminUsername?: string },
) {
    console.log("��� Seeding database...");

    const dbVersion = await getDbSeedVersion(prisma);
    const pending = MIGRATIONS.filter((m) => m.version > dbVersion).sort(
        (a, b) => a.version - b.version,
    );

    if (pending.length === 0) {
        console.log(`  ✅ Already at seed version ${dbVersion} — nothing to apply`);
    } else {
        console.log(
            `  ��� DB is at v${dbVersion}, code is at v${CURRENT_SEED_VERSION} — applying ${pending.length} migration(s)`,
        );

        for (const migration of pending) {
            console.log(`  → [v${migration.version}] ${migration.description}`);
            // Rebuild context before each migration (flags/roles may have been created in prior one)
            const ctx = await buildContext(prisma);
            await migration.apply(ctx);
            // Stamp version after each migration — safe partial progress
            await setDbSeedVersion(prisma, migration.version);
            console.log(`    ✅ v${migration.version} done`);
        }
    }

    // Always: ensure new feature flags exist (create-only — safe on every run)
    for (const flag of DEFAULT_FEATURE_FLAGS) {
        await prisma.featureFlag.upsert({
            where: { key: flag.key },
            update: {},
            create: { ...flag, enabled: true },
        });
    }

    // Always: assign FREE role to users without any role
    const freeRole = await prisma.role.findUnique({ where: { name: "FREE" } });
    if (freeRole) {
        const orphans = await prisma.user.findMany({
            where: { roles: { none: {} } },
            select: { id: true },
        });
        if (orphans.length > 0) {
            await prisma.userRole.createMany({
                data: orphans.map((u) => ({ userId: u.id, roleId: freeRole.id })),
                skipDuplicates: true,
            });
            console.log(`  ✅ FREE role assigned to ${orphans.length} user(s) without a role`);
        }
    }

    // Always: promote ADMIN_EMAIL user if set
    if (opts?.adminEmail) {
        const where = [
            { email: opts.adminEmail },
            ...(opts.adminUsername ? [{ username: opts.adminUsername }] : []),
        ];
        const user = await prisma.user.findFirst({ where: { OR: where as never } });

        if (user) {
            const [adminRole, premiumRole] = await Promise.all([
                prisma.role.findUnique({ where: { name: "ADMIN" } }),
                prisma.role.findUnique({ where: { name: "PREMIUM" } }),
            ]);
            for (const role of [adminRole, premiumRole]) {
                if (!role) continue;
                await prisma.userRole.upsert({
                    where: { userId_roleId: { userId: user.id, roleId: role.id } },
                    update: {},
                    create: { userId: user.id, roleId: role.id },
                });
            }

            // Ensure admin is always email-verified
            if (!user.emailVerified) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: true },
                });
            }

            console.log(`  ✅ Admin role ensured for ${user.email}`);
        } else {
            console.log(
                `  ⚠️  Admin user not found (${opts.adminEmail}) — register first, then re-run seed`,
            );
        }
    }

    console.log("��� Seed complete!");
}

// ─── reseedDefaults ───────────────────────────────────────────────────────────
// Resets DB version to 0 and replays ALL migrations from the start.
// Safe to call on a live DB — user data is never touched.

export async function reseedDefaults(prisma: PrismaClient) {
    console.log("��� Force-reseeding: replaying all migrations from v0...");
    await setDbSeedVersion(prisma, 0);
    await seedDatabase(prisma);
    console.log("��� Force-reseed complete!");
}

// ─── CLI Runner ───────────────────────────────────────────────────────────────
// pnpm db:seed           → apply pending migrations only
// pnpm db:reseed         → reset to v0 and replay all migrations
// node dist/config/seed.js          → same as pnpm db:seed (production)
// node dist/config/seed.js --reseed → same as pnpm db:reseed

const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
    // Load and validate env vars (needed by migrations that use encryption etc.)
    const { loadEnv } = await import("@/config/env.js");
    loadEnv();

    const prisma = new PrismaClient();
    const isReseed = process.argv.includes("--reseed");

    try {
        if (isReseed) {
            await reseedDefaults(prisma);
        } else {
            await seedDatabase(prisma, {
                adminEmail: process.env.ADMIN_EMAIL,
                adminUsername: process.env.ADMIN_USERNAME,
            });
        }
    } catch (err) {
        console.error("❌ Seed failed:", err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}
