import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useSettingsStore } from "../useSettingsStore";

// ─── Mock Nuxt auto-imports ──────────────────────────────────

const mockSetLocale = vi.fn();
vi.stubGlobal("useI18n", () => ({
    locales: ref([{ code: "en" }, { code: "de" }]),
    setLocale: mockSetLocale,
}));

const mockClassList = { add: vi.fn(), remove: vi.fn() };
vi.stubGlobal("document", {
    documentElement: { classList: mockClassList },
});

// useLocalStorage — simulate a plain reactive ref (no real localStorage in test)
vi.stubGlobal("useLocalStorage", <T>(_key: string, defaultValue: T, _opts?: unknown) =>
    ref(defaultValue),
);

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
});

describe("useSettingsStore — initial state", () => {
    it("defaults to 'en' locale and 'dark' theme", () => {
        const store = useSettingsStore();
        expect(store.currentLocale).toBe("en");
        expect(store.currentTheme).toBe("dark");
    });

    it("isDarkMode is true by default", () => {
        const store = useSettingsStore();
        expect(store.isDarkMode).toBe(true);
    });

    it("applies dark class on init", () => {
        useSettingsStore();
        expect(mockClassList.add).toHaveBeenCalledWith("dark");
    });

    it("sets initial locale via i18n", () => {
        useSettingsStore();
        expect(mockSetLocale).toHaveBeenCalledWith("en");
    });
});

describe("useSettingsStore — setLocale", () => {
    it("updates locale to valid value", () => {
        const store = useSettingsStore();
        store.setLocale("de");
        expect(store.currentLocale).toBe("de");
        expect(mockSetLocale).toHaveBeenCalledWith("de");
    });

    it("ignores invalid locale", () => {
        const store = useSettingsStore();
        store.setLocale("fr");
        expect(store.currentLocale).toBe("en");
    });
});

describe("useSettingsStore — setTheme", () => {
    it("switches to light theme", () => {
        const store = useSettingsStore();
        store.setTheme("light");
        expect(store.currentTheme).toBe("light");
        expect(store.isDarkMode).toBe(false);
    });

    it("ignores invalid theme value", () => {
        const store = useSettingsStore();
        store.setTheme("neon" as "light");
        expect(store.currentTheme).toBe("dark");
    });
});

describe("useSettingsStore — toggleTheme", () => {
    it("toggles dark → light", () => {
        const store = useSettingsStore();
        store.toggleTheme();
        expect(store.currentTheme).toBe("light");
    });

    it("toggles light → dark", () => {
        const store = useSettingsStore();
        store.setTheme("light");
        store.toggleTheme();
        expect(store.currentTheme).toBe("dark");
    });
});
