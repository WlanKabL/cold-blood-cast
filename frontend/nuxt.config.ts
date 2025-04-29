import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2024-11-01",
    devtools: { enabled: true },
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
        lazy: true,
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
        plugins: [
            tailwindcss(),
        ]
    },
    runtimeConfig: {
        public: {
            apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
        },
    }
});