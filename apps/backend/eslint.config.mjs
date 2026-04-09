import js from "@eslint/js";
import tsPlugin from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tsPlugin.config(
    js.configs.recommended,
    ...tsPlugin.configs.recommended,
    prettierConfig,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
        },
        rules: {
            // Relax rules that fight Fastify/Prisma patterns
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "no-console": ["warn", { allow: ["warn", "error"] }],

            // Enforce code quality
            eqeqeq: ["error", "always", { null: "ignore" }],
            "no-var": "error",
            "prefer-const": "error",
            "no-throw-literal": "error",
            "prefer-template": "warn",
            "@typescript-eslint/consistent-type-imports": [
                "warn",
                { prefer: "type-imports", fixStyle: "inline-type-imports" },
            ],
        },
    },
    // Seed/CLI scripts: console.log is the intended output channel
    {
        files: ["src/config/seed*.ts", "src/scripts/**/*.ts"],
        rules: {
            "no-console": "off",
        },
    },
    {
        ignores: ["dist/**", "node_modules/**", "prisma/**"],
    },
);
