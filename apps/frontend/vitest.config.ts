import { defineConfig } from "vitest/config";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "~": resolve(__dirname, "."),
            "@": resolve(__dirname, "."),
            "/cbc.png": resolve(__dirname, "public/cbc.png"),
        },
    },
    test: {
        environment: "happy-dom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        include: ["**/__tests__/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "text-summary"],
            include: [
                "components/**/*.vue",
                "composables/**/*.ts",
                "stores/**/*.ts",
                "utils/**/*.ts",
                "middleware/**/*.ts",
            ],
            exclude: ["**/__tests__/**", "**/*.test.ts", "**/*.d.ts"],
        },
    },
});
