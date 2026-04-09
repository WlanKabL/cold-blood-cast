// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
    {
        ignores: ["coverage/**"],
    },
    {
        rules: {
            "vue/no-multiple-template-root": "off",
            eqeqeq: ["error", "always", { null: "ignore" }],
            "no-var": "error",
            "prefer-const": "error",
            "no-throw-literal": "error",
            "prefer-template": "warn",
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "vue/component-name-in-template-casing": ["error", "PascalCase"],
            "vue/define-macros-order": [
                "warn",
                { order: ["defineProps", "defineEmits", "defineSlots"] },
            ],
            "vue/no-unused-refs": "warn",
            "vue/no-useless-v-bind": "warn",
            "vue/prefer-true-attribute-shorthand": "warn",
        },
    },
);
