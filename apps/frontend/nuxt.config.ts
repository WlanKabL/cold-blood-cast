import tailwindcss from "@tailwindcss/vite";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

// Workaround: https://github.com/nuxt/nuxt/issues/33579
function ensurePrecomputedFile(buildDir: string) {
    const file = resolve(buildDir, "dist/server/client.precomputed.mjs");
    if (!existsSync(file)) {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, "export default {}");
    }
}

export default defineNuxtConfig({
    compatibilityDate: "2025-07-07",
    devtools: { enabled: true },
    future: {
        compatibilityVersion: 4,
    },
    hooks: {
        "nitro:build:before": () => {
            ensurePrecomputedFile(resolve(".nuxt"));
            ensurePrecomputedFile(resolve("node_modules/.cache/nuxt/.nuxt"));
        },
    },
    devServer: {
        port: parseInt(process.env.PORT ?? "3001"),
        // host: "0.0.0.0"
    },
    css: ["./assets/tailwind.css"],
    modules: [
        "@nuxt/eslint",
        "@nuxt/icon",
        "@nuxt/ui",
        "@nuxt/scripts",
        "@nuxt/fonts",
        "@nuxtjs/i18n",
        "@pinia/nuxt",
    ],
    i18n: {
        strategy: "no_prefix",
        defaultLocale: "de",
        locales: [
            {
                code: "de",
                file: "de.json",
                name: "Deutsch",
            },
            {
                code: "en",
                file: "en.json",
                name: "English",
            },
        ],
    },
    vite: {
        define: {
            "process.env.DEBUG": false,
            "process.env.PORT": process.env.PORT || 3001,
        },
        build: {
            minify: true,
        },
        plugins: [tailwindcss()],
    },
    runtimeConfig: {
        public: {
            apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
        },
    },
});
