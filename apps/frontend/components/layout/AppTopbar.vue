<template>
    <header
        class="border-line bg-base-translucent sticky top-0 z-10 flex h-15 items-center gap-4 border-b px-4 backdrop-blur-xl lg:px-6"
    >
        <!-- Mobile menu toggle -->
        <button
            class="text-fg-muted hover:bg-surface-hover hover:text-fg-soft rounded-xl p-2 transition-all duration-200 lg:hidden"
            @click="emit('toggleSidebar')"
        >
            <Icon name="lucide:menu" class="h-5 w-5" />
        </button>

        <!-- Page title -->
        <h2 class="text-fg text-[15px] font-semibold tracking-tight">{{ pageTitle }}</h2>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Actions -->
        <div class="flex items-center gap-1">
            <!-- Locale Toggle -->
            <button
                class="text-fg-muted hover:bg-surface-hover hover:text-fg-soft rounded-xl px-2.5 py-2.5 text-[12px] font-medium transition-all duration-200 sm:py-1.5"
                @click="toggleLocale"
            >
                {{ (settings.currentLocale ?? "en").toUpperCase() }}
            </button>

            <!-- Theme Toggle -->
            <button
                class="text-fg-muted hover:bg-surface-hover hover:text-fg-soft rounded-xl p-2 transition-all duration-200"
                @click="settings.toggleTheme()"
            >
                <Icon :name="settings.isDarkMode ? 'lucide:sun' : 'lucide:moon'" class="h-4 w-4" />
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
const emit = defineEmits<{ toggleSidebar: [] }>();

const route = useRoute();
const { t } = useI18n();
const settings = useSettingsStore();

const pageTitle = computed(() => {
    const path = route.path;

    const titles: Record<string, string> = {
        "/dashboard": t("nav.dashboard"),
        "/enclosures": t("nav.enclosures"),
        "/pets": t("nav.pets"),
        "/sensors": t("nav.sensors"),
        "/feedings": t("nav.feedings"),
        "/sheddings": t("nav.sheddings"),
        "/weights": t("nav.weights"),
        "/settings": t("nav.settings"),
        "/api-keys": t("nav.apiKeys"),
    };

    if (titles[path]) return titles[path];

    for (const [prefix, title] of Object.entries(titles)) {
        if (prefix !== "/" && path.startsWith(prefix)) return title;
    }

    return "KeeperLog";
});

function toggleLocale() {
    const next = settings.currentLocale === "en" ? "de" : "en";
    settings.setLocale(next);
}
</script>
