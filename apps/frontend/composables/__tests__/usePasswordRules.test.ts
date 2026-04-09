import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";

import { usePasswordRules } from "../usePasswordRules";

vi.stubGlobal("useI18n", () => ({
    t: (key: string) => key,
}));

describe("usePasswordRules", () => {
    describe("with Ref<string>", () => {
        it("all rules unmet for empty password", () => {
            const pw = ref("");
            const { passwordRules, passwordValid } = usePasswordRules(pw);
            expect(passwordValid.value).toBe(false);
            expect(passwordRules.value.every((r) => !r.met)).toBe(true);
        });

        it("all rules met for strong password", () => {
            const pw = ref("Str0ng!Pass");
            const { passwordRules, passwordValid } = usePasswordRules(pw);
            expect(passwordValid.value).toBe(true);
            expect(passwordRules.value.every((r) => r.met)).toBe(true);
        });

        it("reacts to password changes", () => {
            const pw = ref("");
            const { passwordValid } = usePasswordRules(pw);
            expect(passwordValid.value).toBe(false);

            pw.value = "MyStr0ng!Pass";
            expect(passwordValid.value).toBe(true);
        });

        it("checks minimum length (8 chars)", () => {
            const pw = ref("Aa1!567");
            const { passwordRules } = usePasswordRules(pw);
            expect(passwordRules.value[0].met).toBe(false); // length rule

            pw.value = "Aa1!5678";
            expect(passwordRules.value[0].met).toBe(true);
        });

        it("checks uppercase requirement", () => {
            const pw = ref("nouppercase1!");
            const { passwordRules } = usePasswordRules(pw);
            expect(passwordRules.value[1].met).toBe(false);
        });

        it("checks lowercase requirement", () => {
            const pw = ref("NOLOWERCASE1!");
            const { passwordRules } = usePasswordRules(pw);
            expect(passwordRules.value[2].met).toBe(false);
        });

        it("checks digit requirement", () => {
            const pw = ref("NoDigitHere!");
            const { passwordRules } = usePasswordRules(pw);
            expect(passwordRules.value[3].met).toBe(false);
        });

        it("checks special character requirement", () => {
            const pw = ref("NoSpecial1x");
            const { passwordRules } = usePasswordRules(pw);
            expect(passwordRules.value[4].met).toBe(false);
        });
    });

    describe("with getter function", () => {
        it("works with () => string", () => {
            const pw = "Str0ng!Pass";
            const { passwordValid } = usePasswordRules(() => pw);
            expect(passwordValid.value).toBe(true);
        });
    });

    describe("i18n labels", () => {
        it("uses correct i18n keys for labels", () => {
            const pw = ref("");
            const { passwordRules } = usePasswordRules(pw);
            const labels = passwordRules.value.map((r) => r.label);
            expect(labels).toContain("auth.register.passwordRuleMinLength");
            expect(labels).toContain("auth.register.passwordRuleUppercase");
            expect(labels).toContain("auth.register.passwordRuleLowercase");
            expect(labels).toContain("auth.register.passwordRuleNumber");
            expect(labels).toContain("auth.register.passwordRuleSpecial");
        });
    });
});
