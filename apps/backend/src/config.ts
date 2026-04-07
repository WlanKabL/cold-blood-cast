import { z } from "zod";
import type { CorsOptions } from "cors";

export const EnvSchema = z.object({
    PORT: z.string().regex(/^\d+$/, "PORT must be a number").optional().default("3000"),
    NODE_ENV: z
        .string()
        .regex(/^(development|production|test)$/)
        .optional()
        .default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL must be set"),
    DATA_DIR: z.string().default("./data"),
    CORS_ORIGINS: z.string().default("*"),
    USE_MOCK: z
        .string()
        .regex(/^(true|false)$/i, "USE_MOCK must be 'true' or 'false'")
        .optional()
        .default("false"),
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRY: z.string().optional().default("15m"),
    JWT_REFRESH_EXPIRY: z.string().optional().default("7d"),
    PEPPER: z.string().min(32, "PEPPER must be at least 32 characters"),
    TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN must be set"),
    DISABLE_TELEGRAM_BOT: z.string().default("false"),
    HOME_ASSISTANT_URL: z.string().min(1, "HOME_ASSISTANT_URL must be set"),
    HOME_ASSISTANT_TOKEN: z.string().min(1, "HOME_ASSISTANT_TOKEN must be set"),
});

export type RawEnv = z.infer<typeof EnvSchema>;

export interface AppEnv {
    PORT: number;
    NODE_ENV: string;
    DATABASE_URL: string;
    USE_MOCK: boolean;
    DATA_DIR: string;
    CORS_ORIGINS: string;
    CORS_OPTIONS: CorsOptions;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    PEPPER: string;
    TELEGRAM_BOT_TOKEN: string;
    DISABLE_TELEGRAM_BOT: boolean;
    HOME_ASSISTANT_URL: string;
    HOME_ASSISTANT_TOKEN: string;
}

export function validateEnv(env: NodeJS.ProcessEnv): AppEnv {
    const parsed: RawEnv = EnvSchema.parse(env);

    const port = parseInt(parsed.PORT, 10);

    const origins =
        parsed.CORS_ORIGINS.trim() === "*"
            ? "*"
            : parsed.CORS_ORIGINS.split(",").map((s) => s.trim());
    const corsOptions: CorsOptions = { origin: origins };

    return {
        PORT: port,
        NODE_ENV: parsed.NODE_ENV,
        DATABASE_URL: parsed.DATABASE_URL,
        USE_MOCK: parsed.USE_MOCK.toLowerCase() === "true",
        DATA_DIR: parsed.DATA_DIR,
        CORS_ORIGINS: parsed.CORS_ORIGINS,
        CORS_OPTIONS: corsOptions,
        JWT_ACCESS_SECRET: parsed.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: parsed.JWT_REFRESH_SECRET,
        JWT_ACCESS_EXPIRY: parsed.JWT_ACCESS_EXPIRY,
        JWT_REFRESH_EXPIRY: parsed.JWT_REFRESH_EXPIRY,
        PEPPER: parsed.PEPPER,
        TELEGRAM_BOT_TOKEN: parsed.TELEGRAM_BOT_TOKEN,
        DISABLE_TELEGRAM_BOT: parsed.DISABLE_TELEGRAM_BOT.toLowerCase() === "true",
        HOME_ASSISTANT_URL: parsed.HOME_ASSISTANT_URL,
        HOME_ASSISTANT_TOKEN: parsed.HOME_ASSISTANT_TOKEN,
    };
}
