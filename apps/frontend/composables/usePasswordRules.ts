import type { Ref } from "vue";

export interface PasswordRule {
    label: string;
    met: boolean;
}

/**
 * Composable that provides password strength rules and validation.
 * Accepts either a `Ref<string>` or a getter `() => string` for the password value.
 */
export function usePasswordRules(password: Ref<string> | (() => string)) {
    const { t } = useI18n();

    const passwordValue = typeof password === "function" ? password : () => password.value;

    const passwordRules = computed<PasswordRule[]>(() => {
        const pw = passwordValue();
        return [
            { label: t("auth.register.passwordRuleMinLength"), met: pw.length >= 8 },
            { label: t("auth.register.passwordRuleUppercase"), met: /[A-Z]/.test(pw) },
            { label: t("auth.register.passwordRuleLowercase"), met: /[a-z]/.test(pw) },
            { label: t("auth.register.passwordRuleNumber"), met: /[0-9]/.test(pw) },
            { label: t("auth.register.passwordRuleSpecial"), met: /[^A-Za-z0-9]/.test(pw) },
        ];
    });

    const passwordValid = computed(() => passwordRules.value.every((r) => r.met));

    return { passwordRules, passwordValid };
}
