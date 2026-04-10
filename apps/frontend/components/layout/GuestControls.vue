<template>
    <div class="fixed top-4 right-4 z-50 flex items-center gap-1">
        <!-- Locale Toggle -->
        <button
            class="rounded-xl px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200"
            :class="buttonClass"
            @click="toggleLocale"
        >
            {{ (settings.currentLocale ?? "en").toUpperCase() }}
        </button>

        <!-- Theme Toggle -->
        <button
            class="rounded-xl p-2 transition-all duration-200"
            :class="buttonClass"
            @click="settings.toggleTheme()"
        >
            <Icon :name="settings.isDarkMode ? 'lucide:sun' : 'lucide:moon'" class="h-4 w-4" />
        </button>
    </div>
</template>

<script setup lang="ts">
interface Props {
    /** Visual style — 'dark' for dark backgrounds (landing), 'auto' follows theme */
    variant?: "auto" | "dark";
}

const props = withDefaults(defineProps<Props>(), { variant: "auto" });

const settings = useSettingsStore();

const buttonClass = computed(() =>
    props.variant === "dark"
        ? "text-gray-400 hover:bg-white/10 hover:text-white"
        : "text-fg-muted hover:bg-surface-hover hover:text-fg-soft",
);

function toggleLocale() {
    const next = settings.currentLocale === "en" ? "de" : "en";
    settings.setLocale(next);
}
</script>
