import tailwindcss from "@tailwindcss/vite";
import istanbul from "vite-plugin-istanbul";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    ssr: false,
    spaLoadingTemplate: resolve(__dirname, "./app/spa-loading-template.html"),
    css: ["~/assets/tailwind.css"],
    devtools: { enabled: process.env.NODE_ENV !== "production" },
    experimental: {
        typedPages: true,
    },
    app: {
        head: {
            htmlAttrs: { lang: "en" },
            title: "KeeperLog",
            titleTemplate: "%s | KeeperLog",
            meta: [
                { charset: "utf-8" },
                { name: "viewport", content: "width=device-width, initial-scale=1" },
                {
                    name: "description",
                    content:
                        "Real-time terrarium monitoring, automated alerts, and care journal for reptile keepers.",
                },
                { name: "theme-color", content: "#202510" },
                { property: "og:type", content: "website" },
                { property: "og:site_name", content: "KeeperLog" },
                {
                    property: "og:title",
                    content: "KeeperLog — Terrarium Monitoring & Alerts",
                },
                {
                    property: "og:description",
                    content:
                        "Real-time terrarium monitoring, automated alerts, and care journal for reptile keepers.",
                },
                {
                    property: "og:image",
                    content: `${process.env.SITE_URL || "https://cold-blood-cast.app"}/cbc.png`,
                },
                {
                    property: "og:url",
                    content: process.env.SITE_URL || "https://cold-blood-cast.app",
                },
                { name: "twitter:card", content: "summary_large_image" },
                {
                    name: "twitter:title",
                    content: "KeeperLog — Terrarium Monitoring & Alerts",
                },
                {
                    name: "twitter:description",
                    content:
                        "Real-time terrarium monitoring, automated alerts, and care journal for reptile keepers.",
                },
                {
                    name: "twitter:image",
                    content: `${process.env.SITE_URL || "https://cold-blood-cast.app"}/cbc.png`,
                },
            ],
            link: [
                { rel: "icon", type: "image/png", href: "/cbc.png" },
                { rel: "apple-touch-icon", sizes: "180x180", href: "/cbc.png" },
                { rel: "canonical", href: process.env.SITE_URL || "https://cold-blood-cast.app" },
            ],
            script: [
                {
                    innerHTML: `(function(){try{const t=localStorage.getItem('kl_theme');const v=t?JSON.parse(t):null;if(v==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`,
                    type: "text/javascript",
                },
            ],
        },
    },
    modules: [
        "@nuxt/eslint",
        "@nuxt/hints",
        "@nuxt/image",
        "@vueuse/nuxt",
        "@pinia/nuxt",
        "@nuxtjs/i18n",
        "nuxt-typed-router",
        "@nuxt/icon",
        "@nuxtjs/sitemap",
    ],
    typescript: {
        strict: true,
        // tsConfig: { include: ["../.eslintrc.*"] },
        typeCheck: false,
    },
    i18n: {
        locales: [
            {
                code: "en",
                language: "en-US",
                name: "English",
                files: ["en.json"],
            },
            {
                code: "de",
                language: "de-DE",
                name: "Deutsch",
                files: ["de.json"],
            },
        ],
        defaultLocale: "en",
        detectBrowserLanguage: false,
        strategy: "no_prefix",
    },
    runtimeConfig: {
        public: {
            baseURL: process.env.BASE_URL || "http://localhost:3000",
            apiBaseURL: process.env.API_BASE_URL || "http://localhost:3001",
            showPricingNav: process.env.SHOW_PRICING_NAV === "true",
            appVersion: process.env.APP_VERSION || "dev",
        },
    },
    sitemap: {
        exclude: [
            "/admin/**",
            "/settings",
            "/accounts/**",
            "/dashboard/**",
            "/enclosures/**",
            "/pets/**",
            "/sensors/**",
            "/feedings/**",
            "/sheddings/**",
            "/weights/**",
            "/tags/**",
            "/api-keys/**",
        ],
    },
    site: {
        url: process.env.SITE_URL || "https://cold-blood-cast.app",
    },
    alias: {
        "@": resolve(__dirname, "."),
        "~": resolve(__dirname, "."),
    },
    vite: {
        build: {
            minify: true,
        },
        plugins: [
            tailwindcss(),
            ...(process.env.E2E_COVERAGE
                ? [
                      istanbul({
                          include: [
                              "components/**",
                              "composables/**",
                              "stores/**",
                              "middleware/**",
                              "utils/**",
                              "pages/**",
                              "layouts/**",
                          ],
                          exclude: ["node_modules/**", "**/__tests__/**", "**/*.test.ts", "e2e/**"],
                          extension: [".ts", ".vue"],
                          requireEnv: false,
                      }),
                  ]
                : []),
        ],
    },
});
