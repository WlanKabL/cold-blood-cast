import { defineStore } from "pinia";
import { isValidTheme, type Theme } from "~/types/settings";

export const useSettingsStore = defineStore("settings", () => {
    const { locales, setLocale } = useI18n();

    // Get available locales from i18n config
    const availableLocales = computed(() => locales.value.map((l) => l.code as string));

    // Validation function using i18n config
    function isValidLocale(value: unknown): boolean {
        return typeof value === "string" && availableLocales.value.includes(value);
    }

    // Single source of truth - localStorage with validation
    const currentLocale = useLocalStorage<string>("kl_locale", "en", {
        writeDefaults: false,
        serializer: {
            read: (value: string | null) => {
                try {
                    const parsed = value ? JSON.parse(value) : null;
                    return isValidLocale(parsed) ? parsed : "en";
                } catch {
                    return "en";
                }
            },
            write: (value: string) => JSON.stringify(value),
        },
    });

    const currentTheme = useLocalStorage<Theme>("kl_theme", "dark", {
        writeDefaults: false,
        serializer: {
            read: (value: string | null) => {
                try {
                    const parsed = value ? JSON.parse(value) : null;
                    return isValidTheme(parsed) ? parsed : "dark";
                } catch {
                    return "dark";
                }
            },
            write: (value: Theme) => JSON.stringify(value),
        },
    });

    const isDarkMode = computed(() => currentTheme.value === "dark");

    function applyTheme() {
        if (isDarkMode.value) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }

    function setAppLocale(localeCode: string) {
        if (!isValidLocale(localeCode)) return;

        currentLocale.value = localeCode;
        setLocale(localeCode as Parameters<typeof setLocale>[0]);

        // Persist to backend (fire-and-forget)
        try {
            const api = useApi();
            void api.patch("/api/auth/profile", { locale: localeCode });
        } catch {
            // Non-critical — locale is also stored locally
        }
    }

    function setAppTheme(theme: Theme) {
        if (!isValidTheme(theme)) return;
        currentTheme.value = theme;
    }

    function toggleTheme() {
        currentTheme.value = isDarkMode.value ? "light" : "dark";
    }

    // Apply theme on init and watch for changes
    applyTheme();
    watch(currentTheme, applyTheme);

    // Set initial locale
    setLocale(currentLocale.value as Parameters<typeof setLocale>[0]);

    return {
        currentLocale,
        currentTheme,
        isDarkMode,
        setLocale: setAppLocale,
        setTheme: setAppTheme,
        toggleTheme,
    };
});
