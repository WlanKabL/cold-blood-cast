import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

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

const CURRENT_SEED_VERSION = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

type MigrationContext = {
    prisma: PrismaClient;
};

type Migration = {
    version: number;
    description: string;
    apply: (ctx: MigrationContext) => Promise<void>;
};

// ─── Hashing ──────────────────────────────────────────────────────────────────

const ITERATIONS = 100_000;
const KEY_LENGTH = 128;
const DIGEST = "sha512";

function hashWithPepper(password: string, salt: string, pepper: string): string {
    const derivedKey = crypto.pbkdf2Sync(password + pepper, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    return derivedKey.toString("hex");
}

// ─── Shared Data ──────────────────────────────────────────────────────────────

const DEFAULT_ROLES = [
    {
        name: "ADMIN",
        displayName: "Administrator",
        description: "Full platform access",
        color: "#ef4444",
        isSystem: true,
        priority: 1000,
        showBadge: true,
    },
    {
        name: "MODERATOR",
        displayName: "Moderator",
        description: "Can moderate users and content",
        color: "#f59e0b",
        isSystem: true,
        priority: 500,
        showBadge: true,
    },
    {
        name: "FREE",
        displayName: "Free",
        description: "Default free tier",
        color: "#6b7280",
        isSystem: true,
        priority: 0,
        showBadge: false,
    },
] as const;

const DEFAULT_FEATURE_FLAGS = [
    {
        key: "dashboard",
        name: "Dashboard",
        description: "Access to the main dashboard",
        category: "core",
        enabled: true,
    },
    {
        key: "sensors",
        name: "Sensors",
        description: "Sensor management",
        category: "core",
        enabled: true,
    },
    {
        key: "enclosures",
        name: "Enclosures",
        description: "Enclosure management",
        category: "core",
        enabled: true,
    },
    { key: "pets", name: "Pets", description: "Pet management", category: "core", enabled: true },
    {
        key: "alerts",
        name: "Alerts",
        description: "Alert rules and notifications",
        category: "notifications",
        enabled: true,
    },
    {
        key: "data_export",
        name: "Data Export",
        description: "GDPR data export",
        category: "gdpr",
        enabled: true,
    },
    {
        key: "api_access",
        name: "API Access",
        description: "Direct API access",
        category: "advanced",
        enabled: false,
    },
] as const;

const DEFAULT_SETTINGS: ReadonlyArray<{ key: string; value: string }> = [
    { key: "registration_mode", value: "open" },
    { key: "maintenance_mode", value: "false" },
    { key: "require_email_verification", value: "false" },
    { key: "require_approval", value: "false" },
    { key: "max_enclosures_per_user", value: "10" },
    { key: "max_sensors_per_enclosure", value: "20" },
    { key: "platform_name", value: "Cold Blood Cast" },
];

const DEFAULT_LEGAL_DOCS = [
    {
        key: "privacy-policy",
        title: "Privacy Policy",
        titleDe: "Datenschutzerklärung",
        content: "Privacy policy content goes here.",
        contentDe: "Datenschutzerklärung Inhalt kommt hier hin.",
        sortOrder: 1,
        isPublished: true,
    },
    {
        key: "terms-of-service",
        title: "Terms of Service",
        titleDe: "Nutzungsbedingungen",
        content: "Terms of service content goes here.",
        contentDe: "Nutzungsbedingungen Inhalt kommt hier hin.",
        sortOrder: 2,
        isPublished: true,
    },
    {
        key: "imprint",
        title: "Imprint",
        titleDe: "Impressum",
        content: "Imprint content goes here.",
        contentDe: "Impressum Inhalt kommt hier hin.",
        sortOrder: 3,
        isPublished: true,
    },
] as const;

// ─── Migrations ───────────────────────────────────────────────────────────────

const MIGRATIONS: Migration[] = [
    // ────────────────────────────────────────────────────── v1: Foundation
    {
        version: 1,
        description: "Foundation: admin user, roles, feature flags, settings, legal docs",
        apply: async ({ prisma }) => {
            const pepper = process.env.PEPPER;
            if (!pepper) {
                throw new Error("PEPPER environment variable is required for seeding");
            }

            // Admin user (create-only)
            const existingAdmin = await prisma.user.findUnique({ where: { username: "WlanKabL" } });
            let adminUserId: string;

            if (existingAdmin) {
                console.log("    admin user already exists, skipping");
                adminUserId = existingAdmin.id;
            } else {
                const salt = crypto.randomBytes(64).toString("hex");
                const passwordHash = hashWithPepper("Password01!", salt, pepper);

                const admin = await prisma.user.create({
                    data: {
                        email: "stecher.phi@gmail.com",
                        username: "WlanKabL",
                        displayName: "Philipp",
                        passwordHash,
                        salt,
                        isAdmin: true,
                        emailVerified: true,
                        approved: true,
                    },
                });
                console.log(`    admin user created: ${admin.username}`);
                adminUserId = admin.id;
            }

            // Roles (create-only — never overwrite live changes)
            for (const role of DEFAULT_ROLES) {
                await prisma.role.upsert({
                    where: { name: role.name },
                    update: {},
                    create: { ...role },
                });
            }

            // Assign admin role
            const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
            if (adminRole) {
                await prisma.userRole.upsert({
                    where: { userId_roleId: { userId: adminUserId, roleId: adminRole.id } },
                    update: {},
                    create: { userId: adminUserId, roleId: adminRole.id, grantedBy: adminUserId },
                });
            }
            console.log(`    roles: ${DEFAULT_ROLES.length} seeded`);

            // Feature flags (create-only)
            for (const flag of DEFAULT_FEATURE_FLAGS) {
                await prisma.featureFlag.upsert({
                    where: { key: flag.key },
                    update: {},
                    create: { ...flag },
                });
            }
            console.log(`    feature flags: ${DEFAULT_FEATURE_FLAGS.length} seeded`);

            // System settings (create-only — NEVER overwrite live settings)
            for (const setting of DEFAULT_SETTINGS) {
                await prisma.systemSetting.upsert({
                    where: { key: setting.key },
                    update: {},
                    create: setting,
                });
            }
            console.log(`    system settings: ${DEFAULT_SETTINGS.length} seeded`);

            // Legal documents (create-only)
            for (const doc of DEFAULT_LEGAL_DOCS) {
                await prisma.legalDocument.upsert({
                    where: { key: doc.key },
                    update: {},
                    create: { ...doc, updatedBy: adminUserId },
                });
            }
            console.log(`    legal docs: ${DEFAULT_LEGAL_DOCS.length} seeded`);
        },
    },

    // ─── Add new migrations here ───────────────────────────────────────────

    // ────────────────────────────────────────────────────── v2: default_role setting
    {
        version: 2,
        description: "Add default_role system setting",
        apply: async ({ prisma }) => {
            await prisma.systemSetting.upsert({
                where: { key: "default_role" },
                update: {},
                create: { key: "default_role", value: "FREE" },
            });
            console.log("    default_role setting added");
        },
    },

    // ────────────────────────────────────────────────────── v3: ZentraX infrastructure defaults
    {
        version: 3,
        description:
            "Add ZentraX infrastructure: new feature flags + system settings for mail, uploads, maintenance",
        apply: async ({ prisma }) => {
            // New feature flags
            const newFlags = [
                {
                    key: "api_keys",
                    name: "API Keys",
                    description: "Allow users to create API keys",
                    category: "advanced",
                    enabled: true,
                },
                {
                    key: "uploads",
                    name: "File Uploads",
                    description: "Allow file uploads for enclosures, pets, sensors",
                    category: "advanced",
                    enabled: true,
                },
                {
                    key: "email_notifications",
                    name: "Email Notifications",
                    description: "Send email notifications for account events",
                    category: "notifications",
                    enabled: true,
                },
            ];
            for (const flag of newFlags) {
                await prisma.featureFlag.upsert({
                    where: { key: flag.key },
                    update: {},
                    create: { ...flag },
                });
            }
            console.log(`    feature flags: ${newFlags.length} new flags seeded`);

            // New system settings
            const newSettings = [
                { key: "max_api_keys_per_user", value: "5" },
                { key: "max_upload_size_mb", value: "10" },
                { key: "max_uploads_per_entity", value: "10" },
                { key: "maintenance_schedule", value: "daily" },
                { key: "email_retention_days", value: "180" },
            ];
            for (const setting of newSettings) {
                await prisma.systemSetting.upsert({
                    where: { key: setting.key },
                    update: {},
                    create: setting,
                });
            }
            console.log(`    system settings: ${newSettings.length} new settings seeded`);
        },
    },
];

// ─── Version Helpers ──────────────────────────────────────────────────────────

async function getDbSeedVersion(prisma: PrismaClient): Promise<number> {
    const row = await prisma.systemSetting.findUnique({ where: { key: "seed_version" } });
    if (!row) return 0;
    const parsed = parseInt(row.value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function setDbSeedVersion(prisma: PrismaClient, version: number): Promise<void> {
    await prisma.systemSetting.upsert({
        where: { key: "seed_version" },
        update: { value: String(version) },
        create: { key: "seed_version", value: String(version) },
    });
}

// ─── seedDatabase ─────────────────────────────────────────────────────────────

export async function seedDatabase(prisma: PrismaClient) {
    console.log("🌱 Seeding database...");

    const dbVersion = await getDbSeedVersion(prisma);
    const pending = MIGRATIONS.filter((m) => m.version > dbVersion).sort(
        (a, b) => a.version - b.version,
    );

    if (pending.length === 0) {
        console.log(`  ✅ Already at seed version ${dbVersion} — nothing to apply`);
    } else {
        console.log(
            `  📦 DB is at v${dbVersion}, code is at v${CURRENT_SEED_VERSION} — applying ${pending.length} migration(s)`,
        );

        for (const migration of pending) {
            console.log(`  → [v${migration.version}] ${migration.description}`);
            await migration.apply({ prisma });
            await setDbSeedVersion(prisma, migration.version);
            console.log(`    ✅ v${migration.version} done`);
        }
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

    console.log("🌱 Seed complete!");
}

// ─── reseedDefaults ───────────────────────────────────────────────────────────
// Resets DB version to 0 and replays ALL migrations from the start.
// Safe to call on a live DB — user data is never touched.

export async function reseedDefaults(prisma: PrismaClient) {
    console.log("🔄 Force-reseeding: replaying all migrations from v0...");
    await setDbSeedVersion(prisma, 0);
    await seedDatabase(prisma);
    console.log("🔄 Force-reseed complete!");
}

// ─── CLI Runner ───────────────────────────────────────────────────────────────
// pnpm db:seed           → apply pending migrations only
// pnpm db:reseed         → reset to v0 and replay all migrations

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const isReseed = process.argv.includes("--reseed");

(async () => {
    try {
        if (isReseed) {
            await reseedDefaults(prisma);
        } else {
            await seedDatabase(prisma);
        }
    } catch (err) {
        console.error("❌ Seed failed:", err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
})();
