import { z } from "zod";
import type { CorsOptions } from "cors";

const envSchema = z.object({
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL must be set"),
    CORS_ORIGINS: z.string().default("*"),
    FRONTEND_URL: z.string().default("http://localhost:3000"),
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRY: z.string().default("15m"),
    JWT_REFRESH_EXPIRY: z.string().default("7d"),
    PEPPER: z.string().min(32, "PEPPER must be at least 32 characters"),

    // Encryption
    ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters").optional(),

    // SMTP (optional — mail features disabled when absent)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_SECURE: z
        .string()
        .transform((v) => v === "true")
        .default("false"),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),

    // File uploads
    UPLOAD_DIR: z.string().default("./uploads"),
    MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB

    // Telegram notifications (optional)
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),

    // Discord notifications (optional)
    DISCORD_WEBHOOK_URL: z.string().optional(),
});

type RawEnv = z.infer<typeof envSchema>;

export interface AppEnv {
    PORT: number;
    NODE_ENV: string;
    DATABASE_URL: string;
    CORS_ORIGINS: string;
    CORS_OPTIONS: CorsOptions;
    FRONTEND_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    PEPPER: string;
    ENCRYPTION_KEY?: string;
    SMTP_HOST?: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    SMTP_FROM?: string;
    UPLOAD_DIR: string;
    MAX_FILE_SIZE: number;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
    DISCORD_WEBHOOK_URL?: string;
}

let _env: AppEnv | null = null;

export function loadEnv(): AppEnv {
    if (_env) return _env;

    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("Invalid environment variables:");
        console.error(result.error.format());
        process.exit(1);
    }

    const parsed: RawEnv = result.data;

    const origins =
        parsed.CORS_ORIGINS.trim() === "*"
            ? "*"
            : parsed.CORS_ORIGINS.split(",").map((s) => s.trim());
    const corsOptions: CorsOptions = { origin: origins };

    _env = {
        PORT: parsed.PORT,
        NODE_ENV: parsed.NODE_ENV,
        DATABASE_URL: parsed.DATABASE_URL,
        CORS_ORIGINS: parsed.CORS_ORIGINS,
        CORS_OPTIONS: corsOptions,
        FRONTEND_URL: parsed.FRONTEND_URL,
        JWT_ACCESS_SECRET: parsed.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: parsed.JWT_REFRESH_SECRET,
        JWT_ACCESS_EXPIRY: parsed.JWT_ACCESS_EXPIRY,
        JWT_REFRESH_EXPIRY: parsed.JWT_REFRESH_EXPIRY,
        PEPPER: parsed.PEPPER,
        ENCRYPTION_KEY: parsed.ENCRYPTION_KEY,
        SMTP_HOST: parsed.SMTP_HOST,
        SMTP_PORT: parsed.SMTP_PORT,
        SMTP_SECURE: parsed.SMTP_SECURE,
        SMTP_USER: parsed.SMTP_USER,
        SMTP_PASS: parsed.SMTP_PASS,
        SMTP_FROM: parsed.SMTP_FROM,
        UPLOAD_DIR: parsed.UPLOAD_DIR,
        MAX_FILE_SIZE: parsed.MAX_FILE_SIZE,
        TELEGRAM_BOT_TOKEN: parsed.TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID: parsed.TELEGRAM_CHAT_ID,
        DISCORD_WEBHOOK_URL: parsed.DISCORD_WEBHOOK_URL,
    };

    return _env;
}

export function env(): AppEnv {
    if (!_env) throw new Error("Environment not loaded. Call loadEnv() first.");
    return _env;
}
