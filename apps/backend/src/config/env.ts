import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3001),
    HOST: z.string().default("0.0.0.0"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRY: z.string().default("15m"),
    JWT_REFRESH_EXPIRY: z.string().default("7d"),

    HASH_PEPPER: z.string().min(32),
    HASH_ITERATIONS: z.coerce.number().default(100000),

    CORS_ORIGIN: z.string().default("http://localhost:3000"),

    // Frontend URL for email links
    FRONTEND_URL: z.string().url().default("https://cold-blood-cast.app"),

    COOKIE_SECRET: z.string().min(32),

    UPLOAD_DIR: z.string().default("./uploads"),
    MAX_FILE_SIZE: z.coerce.number().default(10_485_760), // 10MB

    // Admin seed — used by `pnpm db:seed` to promote an existing user to ADMIN
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_USERNAME: z.string().optional(),

    // Stripe
    STRIPE_PAYMENT_ACTIVE: z
        .enum(["true", "false"])
        .default("false")
        .transform((v) => v === "true"),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_PREMIUM_MONTHLY: z.string().optional(),
    STRIPE_PRICE_PREMIUM_YEARLY: z.string().optional(),
    STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
    STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
    STRIPE_PRICE_PRO_LIFETIME: z.string().optional(),

    // Telegram notifications
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),

    // Discord notifications
    DISCORD_WEBHOOK_URL: z.string().url().optional(),

    // Redis (for BullMQ job queue)
    REDIS_URL: z.string().default("redis://localhost:6379"),

    // Encryption key (AES-256 — for sensitive data at rest)
    // Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ENCRYPTION_KEY: z.string().min(32),

    // SMTP Mail (Mailcow or any SMTP server)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(465),
    SMTP_SECURE: z
        .enum(["true", "false"])
        .default("true")
        .transform((v) => v === "true"),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default("KeeperLog <noreply@cold-blood-cast.app>"),

    // Marketing tracking — Meta Pixel / Conversions API
    META_PIXEL_ENABLED: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
    META_CAPI_ENABLED: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
    META_CAPI_DRY_RUN: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
    META_PIXEL_ID: z.string().optional(),
    META_ACCESS_TOKEN: z.string().optional(),
    META_TEST_EVENT_CODE: z.string().optional(),

    // Marketing tracking — attribution & queue tuning
    TRACKING_ATTRIBUTION_TTL_DAYS: z.coerce.number().int().positive().default(30),
    TRACKING_MAX_RETRY_COUNT: z.coerce.number().int().min(0).default(5),
    TRACKING_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(100).default(5000),
    TRACKING_DISPATCH_TIMEOUT_MS: z.coerce.number().int().min(500).default(5000),
    TRACKING_EVENT_RETENTION_DAYS: z.coerce.number().int().positive().default(180),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function loadEnv(): Env {
    if (_env) return _env;

    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("❌ Invalid environment variables:");
        console.error(result.error.format());
        process.exit(1);
    }

    _env = result.data;
    return _env;
}

export function env(): Env {
    if (!_env) throw new Error("Environment not loaded. Call loadEnv() first.");
    return _env;
}
