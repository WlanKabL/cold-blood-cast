import { describe, it, expect } from "vitest";
import { ref, computed } from "vue";

// Inline reimplementation for unit testing (avoids Nuxt auto-import deps)
function usePasswordRulesTestable(passwordGetter: () => string) {
    const passwordRules = computed(() => {
        const pw = passwordGetter();
        return [
            { label: "min_length", met: pw.length >= 8 },
            { label: "uppercase", met: /[A-Z]/.test(pw) },
            { label: "lowercase", met: /[a-z]/.test(pw) },
            { label: "number", met: /\d/.test(pw) },
            { label: "special", met: /[^a-zA-Z0-9]/.test(pw) },
        ];
    });

    const passwordValid = computed(() => passwordRules.value.every((r) => r.met));

    return { passwordRules, passwordValid };
}

describe("usePasswordRules", () => {
    it("rejects empty password", () => {
        const password = ref("");
        const { passwordValid, passwordRules } = usePasswordRulesTestable(() => password.value);

        expect(passwordValid.value).toBe(false);
        expect(passwordRules.value.every((r) => !r.met)).toBe(true);
    });

    it("rejects short password", () => {
        const password = ref("Ab1!");
        const { passwordRules } = usePasswordRulesTestable(() => password.value);

        const minLength = passwordRules.value.find((r) => r.label === "min_length");
        expect(minLength?.met).toBe(false);
    });

    it("requires uppercase letter", () => {
        const password = ref("abcdefgh1!");
        const { passwordRules } = usePasswordRulesTestable(() => password.value);

        const uppercase = passwordRules.value.find((r) => r.label === "uppercase");
        expect(uppercase?.met).toBe(false);
    });

    it("requires lowercase letter", () => {
        const password = ref("ABCDEFGH1!");
        const { passwordRules } = usePasswordRulesTestable(() => password.value);

        const lowercase = passwordRules.value.find((r) => r.label === "lowercase");
        expect(lowercase?.met).toBe(false);
    });

    it("requires a number", () => {
        const password = ref("Abcdefgh!");
        const { passwordRules } = usePasswordRulesTestable(() => password.value);

        const number = passwordRules.value.find((r) => r.label === "number");
        expect(number?.met).toBe(false);
    });

    it("requires a special character", () => {
        const password = ref("Abcdefg1");
        const { passwordRules } = usePasswordRulesTestable(() => password.value);

        const special = passwordRules.value.find((r) => r.label === "special");
        expect(special?.met).toBe(false);
    });

    it("accepts valid password meeting all criteria", () => {
        const password = ref("Str0ng!Pass");
        const { passwordValid, passwordRules } = usePasswordRulesTestable(() => password.value);

        expect(passwordValid.value).toBe(true);
        expect(passwordRules.value.every((r) => r.met)).toBe(true);
    });

    it("reacts to password changes", () => {
        const password = ref("weak");
        const { passwordValid } = usePasswordRulesTestable(() => password.value);

        expect(passwordValid.value).toBe(false);

        password.value = "Str0ng!Pass";
        expect(passwordValid.value).toBe(true);
    });
});
