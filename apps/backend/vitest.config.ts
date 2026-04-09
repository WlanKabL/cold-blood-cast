import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        exclude: ["dist/**", "node_modules/**"],
        coverage: {
            provider: "v8",
            reporter: ["text", "text-summary"],
            include: ["src/modules/**/*.ts", "src/helpers/**/*.ts", "src/middleware/**/*.ts"],
            exclude: ["**/__tests__/**", "**/*.test.ts", "**/*.d.ts", "src/modules/**/index.ts"],
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
});
