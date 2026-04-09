type PasswordRule = {
    label: string;
    met: boolean;
};

export function usePasswordRules(passwordGetter: () => string) {
    const { t } = useI18n();

    const passwordRules = computed<PasswordRule[]>(() => {
        const pw = passwordGetter();
        return [
            { label: t("register.rules.min_length"), met: pw.length >= 8 },
            { label: t("register.rules.uppercase"), met: /[A-Z]/.test(pw) },
            { label: t("register.rules.lowercase"), met: /[a-z]/.test(pw) },
            { label: t("register.rules.number"), met: /\d/.test(pw) },
            { label: t("register.rules.special"), met: /[^a-zA-Z0-9]/.test(pw) },
        ];
    });

    const passwordValid = computed(() => passwordRules.value.every((r) => r.met));

    return { passwordRules, passwordValid };
}
