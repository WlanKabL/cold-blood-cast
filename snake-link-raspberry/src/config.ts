// src/config.ts

/**
 * @file config.ts
 * @description Validates environment variables and builds a typed config object.
 */

import { z } from "zod";
import type { CorsOptions } from "cors";

/**
 * Zod schema for raw environment variables (all strings).
 */
export const EnvSchema = z.object({
    PORT: z.string().regex(/^\d+$/, "PORT must be a number").optional().default("3000"),
    DATA_DIR: z.string().default("./data"),
    CORS_ORIGINS: z.string().default("*"),
    USE_MOCK: z
        .string()
        .regex(/^(true|false)$/i, "USE_MOCK must be 'true' or 'false'")
        .optional()
        .default("false"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET must be set"),
    PEPPER: z.string().min(1, "PEPPER must be set"),
    TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN must be set"),
    TAPO_EMAIL: z.string().min(1, "TAPO_EMAIL must be set"),
    TAPO_PASSWORD: z.string().min(1, "TAPO_PASSWORD must be set"),
});

/**
 * Raw (string‑based) env var type inferred from EnvSchema.
 */
export type RawEnv = z.infer<typeof EnvSchema>;

/**
 * Final application config with correctly typed fields.
 */
export interface AppEnv {
    /** Port number to listen on */
    PORT: number;
    /** Use Mock Data on development */
    USE_MOCK: boolean;
    /** Base directory for data storage */
    DATA_DIR: string;
    /** Comma‑separated list of allowed CORS origins */
    CORS_ORIGINS: string;
    /** Parsed CORS options for Express middleware */
    CORS_OPTIONS: CorsOptions;

    JWT_SECRET: string;
    PEPPER: string;

    TELEGRAM_BOT_TOKEN: string;

    TAPO_EMAIL: string;
    TAPO_PASSWORD: string;
}

/**
 * Parses and validates process.env, then returns a fully‑typed AppEnv.
 *
 * @param env - The Node.js process.env
 * @returns AppEnv with PORT as number and CORS_OPTIONS built
 */
export function validateEnv(env: NodeJS.ProcessEnv): AppEnv {
    // 1) Validate raw strings
    const parsed: RawEnv = EnvSchema.parse(env);

    // 2) Cast PORT to number
    const port = parseInt(parsed.PORT, 10);

    // 3) Build CORS options
    const origins =
        parsed.CORS_ORIGINS.trim() === "*"
            ? "*"
            : parsed.CORS_ORIGINS.split(",").map((s) => s.trim());
    const corsOptions: CorsOptions = { origin: origins };

    const useMock = process.env.USE_MOCK === "true";

    // 4) Return final config
    return {
        PORT: port,
        USE_MOCK: useMock,
        DATA_DIR: parsed.DATA_DIR,
        CORS_ORIGINS: parsed.CORS_ORIGINS,
        CORS_OPTIONS: corsOptions,
        JWT_SECRET: parsed.JWT_SECRET,
        PEPPER: parsed.PEPPER,
        TELEGRAM_BOT_TOKEN: parsed.TELEGRAM_BOT_TOKEN,
        TAPO_EMAIL: parsed.TAPO_EMAIL,
        TAPO_PASSWORD: parsed.TAPO_PASSWORD,
    };
}
