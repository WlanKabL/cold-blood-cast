<template>
    <nav
        class="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
        :class="
            navScrolled || mobileMenuOpen
                ? 'border-line bg-page-translucent border-b shadow-2xl shadow-black/30 backdrop-blur-xl backdrop-saturate-150'
                : 'bg-transparent'
        "
    >
        <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <NuxtLink to="/" class="flex items-center gap-3">
                <img src="/cbc.png" alt="KeeperLog" class="h-9 w-9 rounded-xl" />
                <span class="text-xl font-bold tracking-tight">KeeperLog</span>
            </NuxtLink>

            <!-- Desktop nav -->
            <div class="hidden items-center gap-8 md:flex">
                <NuxtLink
                    v-for="link in navLinks"
                    :key="link.to"
                    :to="link.to"
                    :class="
                        isActive(link.to)
                            ? 'text-brand font-medium'
                            : 'text-fg-muted hover:text-fg transition'
                    "
                    class="text-sm"
                >
                    {{ $t(link.label) }}
                </NuxtLink>
            </div>

            <div class="flex items-center gap-3">
                <button
                    class="text-fg-muted hover:bg-surface-hover hover:text-fg rounded-xl px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200"
                    @click="toggleLocale"
                >
                    {{ (settings.currentLocale ?? "en").toUpperCase() }}
                </button>
                <button
                    class="text-fg-muted hover:bg-surface-hover hover:text-fg rounded-xl p-2 transition-all duration-200"
                    @click="settings.toggleTheme()"
                >
                    <Icon
                        :name="settings.isDarkMode ? 'lucide:sun' : 'lucide:moon'"
                        class="h-4 w-4"
                    />
                </button>
                <NuxtLink
                    to="/login"
                    class="text-fg-dim hover:text-fg hidden text-sm font-medium transition md:inline-block"
                >
                    {{ $t("landing.nav.login") }}
                </NuxtLink>
                <NuxtLink
                    to="/register"
                    class="from-primary-500 to-primary-400 shadow-primary-500/20 hover:shadow-primary-500/30 hidden rounded-full bg-linear-to-r px-5 py-2 text-sm font-semibold text-white shadow-lg transition sm:inline-block"
                >
                    {{ $t("landing.nav.getStarted") }}
                </NuxtLink>
                <!-- Mobile menu button -->
                <button
                    class="text-fg-muted hover:text-fg rounded-xl p-2 transition md:hidden"
                    :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
                    @click="mobileMenuOpen = !mobileMenuOpen"
                >
                    <Icon :name="mobileMenuOpen ? 'lucide:x' : 'lucide:menu'" class="h-5 w-5" />
                </button>
            </div>
        </div>

        <!-- Mobile menu -->
        <Transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-150 ease-in"
            enter-from-class="opacity-0 -translate-y-2"
            leave-to-class="opacity-0 -translate-y-2"
        >
            <div v-if="mobileMenuOpen" class="border-line-faint border-t px-6 pt-4 pb-6 md:hidden">
                <div class="flex flex-col gap-1">
                    <NuxtLink
                        v-for="link in navLinks"
                        :key="link.to"
                        :to="link.to"
                        :class="
                            isActive(link.to)
                                ? 'text-brand font-medium'
                                : 'text-fg-muted hover:text-fg'
                        "
                        class="rounded-lg px-3 py-2.5 text-sm transition"
                        @click="mobileMenuOpen = false"
                    >
                        {{ $t(link.label) }}
                    </NuxtLink>
                    <div class="border-line-faint my-2 border-t" />
                    <NuxtLink
                        to="/login"
                        class="text-fg-dim hover:text-fg rounded-lg px-3 py-2.5 text-sm font-medium transition"
                        @click="mobileMenuOpen = false"
                    >
                        {{ $t("landing.nav.login") }}
                    </NuxtLink>
                    <NuxtLink
                        to="/register"
                        class="from-primary-500 to-primary-400 mt-2 rounded-full bg-linear-to-r px-5 py-2.5 text-center text-sm font-semibold text-white transition"
                        @click="mobileMenuOpen = false"
                    >
                        {{ $t("landing.nav.getStarted") }}
                    </NuxtLink>
                </div>
            </div>
        </Transition>
    </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const settings = useSettingsStore();
const { paymentsActive } = usePricingAvailability();

const navScrolled = ref(false);
const mobileMenuOpen = ref(false);

const navLinks = computed(() => {
    const links = [
        { to: "/explore/features", label: "landing.nav.features" },
        { to: "/explore/compare/excel-vs-keeperlog", label: "landing.nav.compare" },
        { to: "/explore/why-keeperlog", label: "landing.nav.whyKeeperlog" },
    ];
    if (paymentsActive.value) {
        links.push({ to: "/explore/pricing", label: "landing.nav.pricing" });
    }
    return links;
});

function isActive(path: string) {
    return route.path === path;
}

function toggleLocale() {
    const next = settings.currentLocale === "en" ? "de" : "en";
    settings.setLocale(next);
}

function onScroll() {
    navScrolled.value = window.scrollY > 50;
}

watch(
    () => route.fullPath,
    () => {
        mobileMenuOpen.value = false;
    },
);

onMounted(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
});

onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
});
</script>
