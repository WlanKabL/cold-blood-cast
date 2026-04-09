import { defineStore } from "pinia";

export type ThemeMode = "light" | "dark" | "system";

export const useSettingsStore = defineStore("settings", () => {
    const themeMode = ref<ThemeMode>("system");
    const resolvedTheme = ref<"light" | "dark">("dark");

    function applyTheme() {
        const isDark =
            themeMode.value === "dark" ||
            (themeMode.value === "system" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        resolvedTheme.value = isDark ? "dark" : "light";
        document.documentElement.classList.toggle("dark", isDark);
    }

    function setTheme(mode: ThemeMode) {
        themeMode.value = mode;
        localStorage.setItem("cbc-theme", mode);
        applyTheme();
    }

    function toggleTheme() {
        if (themeMode.value === "dark") setTheme("light");
        else if (themeMode.value === "light") setTheme("system");
        else setTheme("dark");
    }

    function init() {
        const stored = localStorage.getItem("cbc-theme") as ThemeMode | null;
        if (stored && ["light", "dark", "system"].includes(stored)) {
            themeMode.value = stored;
        }
        applyTheme();

        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            if (themeMode.value === "system") applyTheme();
        });
    }

    return {
        themeMode,
        resolvedTheme,
        setTheme,
        toggleTheme,
        init,
    };
});
