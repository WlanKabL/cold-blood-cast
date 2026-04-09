<template>
    <header
        class="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-line bg-topbar-bg px-4 backdrop-blur-xl lg:px-6"
    >
        <!-- Mobile menu toggle -->
        <button
            class="rounded-lg p-2 text-fg-muted transition hover:bg-hover hover:text-fg lg:hidden"
            @click="emit('toggleSidebar')"
        >
            <Icon name="lucide:menu" class="h-5 w-5" />
        </button>

        <!-- Page title -->
        <h2 class="text-lg font-semibold text-fg">{{ pageTitle }}</h2>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Actions -->
        <div class="flex items-center gap-2">
            <!-- Theme Toggle -->
            <button
                class="rounded-lg p-2 text-fg-muted transition hover:bg-hover hover:text-fg"
                :title="themeLabel"
                @click="settingsStore.toggleTheme()"
            >
                <Icon :name="themeIcon" class="h-5 w-5" />
            </button>

            <!-- Locale Toggle -->
            <button
                class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-hover hover:text-fg"
                @click="toggleLocale"
            >
                {{ currentLocale.toUpperCase() }}
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
const emit = defineEmits<{ toggleSidebar: [] }>();

const route = useRoute();
const { t, locale } = useI18n();
const settingsStore = useSettingsStore();

const currentLocale = computed(() => locale.value);

const themeIcon = computed(() => {
    if (settingsStore.themeMode === "dark") return "lucide:moon";
    if (settingsStore.themeMode === "light") return "lucide:sun";
    return "lucide:monitor";
});

const themeLabel = computed(() => {
    if (settingsStore.themeMode === "dark") return t("settings.theme.dark");
    if (settingsStore.themeMode === "light") return t("settings.theme.light");
    return t("settings.theme.system");
});

const pageTitle = computed(() => {
    const path = route.path;

    const titles: Record<string, string> = {
        "/dashboard": t("nav.dashboard"),
        "/enclosures": t("nav.enclosures"),
        "/pets": t("nav.pets"),
        "/sensors": t("nav.sensors"),
        "/settings": t("nav.settings"),
        "/about": t("nav.about"),
        "/contact": t("nav.contact"),
        "/admin": t("nav.adminDashboard"),
        "/admin/users": t("nav.adminUsers"),
        "/admin/roles": t("nav.adminRoles"),
        "/admin/feature-flags": t("nav.adminFeatureFlags"),
        "/admin/settings": t("nav.adminSettings"),
    };

    if (titles[path]) return titles[path];

    for (const [prefix, title] of Object.entries(titles)) {
        if (prefix !== "/" && path.startsWith(prefix)) return title;
    }

    return "Cold Blood Cast";
});

function toggleLocale() {
    const next = locale.value === "en" ? "de" : "en";
    locale.value = next;
}
</script>
