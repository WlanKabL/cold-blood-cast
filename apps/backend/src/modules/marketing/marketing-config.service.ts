// ─── Dynamic marketing config service ───────────────────────
// Plan v1.7 §13.2 — operational toggles live in DB so non-developer
// admins can rotate them without redeploys. Secrets (CAPI access token)
// stay in env to keep the security boundary clean.

import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";

const SETTING_KEYS = [
    "marketing.metaPixelEnabled",
    "marketing.metaCapiEnabled",
    "marketing.metaCapiDryRun",
    "marketing.metaPixelId",
    "marketing.metaTestEventCode",
] as const;

export type MarketingSettingKey = (typeof SETTING_KEYS)[number];

export interface MarketingConfig {
    // ── Pixel (browser) ──
    metaPixelEnabled: boolean;
    metaPixelId: string | null;
    // ── CAPI (server) ──
    metaCapiEnabled: boolean;
    metaCapiDryRun: boolean;
    metaTestEventCode: string | null;
    // ── Secret (env-only, never returned via public endpoint) ──
    metaAccessToken: string | null;
    // ── Source bookkeeping for the admin UI ──
    overrides: Record<MarketingSettingKey, boolean>;
}

const TRUE_STRINGS = new Set(["true", "1", "yes", "on"]);
const FALSE_STRINGS = new Set(["false", "0", "no", "off"]);

function parseBool(raw: string | undefined, fallback: boolean): boolean {
    if (raw === undefined) return fallback;
    const v = raw.trim().toLowerCase();
    if (TRUE_STRINGS.has(v)) return true;
    if (FALSE_STRINGS.has(v)) return false;
    return fallback;
}

let cache: { value: MarketingConfig; loadedAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export function invalidateMarketingConfigCache(): void {
    cache = null;
}

export async function getMarketingConfig(opts?: { fresh?: boolean }): Promise<MarketingConfig> {
    if (!opts?.fresh && cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
        return cache.value;
    }

    const e = env();
    const rows = await prisma.systemSetting.findMany({
        where: { key: { in: [...SETTING_KEYS] } },
    });
    const dbMap = new Map<string, string>(rows.map((r) => [r.key, r.value]));

    const has = (k: MarketingSettingKey) => dbMap.has(k);

    const config: MarketingConfig = {
        metaPixelEnabled: parseBool(dbMap.get("marketing.metaPixelEnabled"), e.META_PIXEL_ENABLED),
        metaPixelId: dbMap.get("marketing.metaPixelId") ?? e.META_PIXEL_ID ?? null,
        metaCapiEnabled: parseBool(dbMap.get("marketing.metaCapiEnabled"), e.META_CAPI_ENABLED),
        metaCapiDryRun: parseBool(dbMap.get("marketing.metaCapiDryRun"), e.META_CAPI_DRY_RUN),
        metaTestEventCode:
            dbMap.get("marketing.metaTestEventCode") ?? e.META_TEST_EVENT_CODE ?? null,
        metaAccessToken: e.META_ACCESS_TOKEN ?? null,
        overrides: {
            "marketing.metaPixelEnabled": has("marketing.metaPixelEnabled"),
            "marketing.metaCapiEnabled": has("marketing.metaCapiEnabled"),
            "marketing.metaCapiDryRun": has("marketing.metaCapiDryRun"),
            "marketing.metaPixelId": has("marketing.metaPixelId"),
            "marketing.metaTestEventCode": has("marketing.metaTestEventCode"),
        },
    };

    cache = { value: config, loadedAt: Date.now() };
    return config;
}

export interface MarketingSettingsUpdate {
    metaPixelEnabled?: boolean | null;
    metaPixelId?: string | null;
    metaCapiEnabled?: boolean | null;
    metaCapiDryRun?: boolean | null;
    metaTestEventCode?: string | null;
}

const KEY_MAP: Record<keyof MarketingSettingsUpdate, MarketingSettingKey> = {
    metaPixelEnabled: "marketing.metaPixelEnabled",
    metaPixelId: "marketing.metaPixelId",
    metaCapiEnabled: "marketing.metaCapiEnabled",
    metaCapiDryRun: "marketing.metaCapiDryRun",
    metaTestEventCode: "marketing.metaTestEventCode",
};

/**
 * Apply a partial settings update.
 * - `null` clears the override (falls back to env).
 * - `undefined` leaves the existing override untouched.
 */
export async function updateMarketingSettings(
    update: MarketingSettingsUpdate,
): Promise<MarketingConfig> {
    const ops: Promise<unknown>[] = [];

    for (const [field, value] of Object.entries(update) as [
        keyof MarketingSettingsUpdate,
        MarketingSettingsUpdate[keyof MarketingSettingsUpdate],
    ][]) {
        if (value === undefined) continue;
        const key = KEY_MAP[field];
        if (value === null) {
            ops.push(prisma.systemSetting.deleteMany({ where: { key } }));
            continue;
        }
        const stringValue = typeof value === "boolean" ? String(value) : value.trim();
        if (stringValue.length === 0) {
            ops.push(prisma.systemSetting.deleteMany({ where: { key } }));
            continue;
        }
        ops.push(
            prisma.systemSetting.upsert({
                where: { key },
                create: { key, value: stringValue },
                update: { value: stringValue },
            }),
        );
    }

    await Promise.all(ops);
    invalidateMarketingConfigCache();
    return getMarketingConfig({ fresh: true });
}
