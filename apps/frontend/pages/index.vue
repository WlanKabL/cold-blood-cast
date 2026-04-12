<template>
    <div class="landing relative min-h-dvh bg-gray-950 text-white">
        <!-- ═══ Navigation ═══ -->
        <nav
            class="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
            :class="
                navScrolled
                    ? 'border-b border-white/[0.06] bg-gray-950/80 shadow-2xl shadow-black/30 backdrop-blur-xl backdrop-saturate-150'
                    : 'bg-transparent'
            "
        >
            <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <NuxtLink to="/" class="flex items-center gap-3">
                    <img src="/cbc.png" alt="KeeperLog" class="h-9 w-9 rounded-xl" />
                    <span class="text-xl font-bold tracking-tight">KeeperLog</span>
                </NuxtLink>
                <div class="hidden items-center gap-8 md:flex">
                    <a href="#features" class="text-sm text-gray-400 transition hover:text-white">{{
                        $t("landing.nav.features")
                    }}</a>
                    <a
                        href="#how-it-works"
                        class="text-sm text-gray-400 transition hover:text-white"
                        >{{ $t("landing.nav.howItWorks") }}</a
                    >
                    <a href="#keepers" class="text-sm text-gray-400 transition hover:text-white">{{
                        $t("landing.nav.forKeepers")
                    }}</a>
                </div>
                <div class="flex items-center gap-3">
                    <button
                        class="rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                        @click="toggleLocale"
                    >
                        {{ (settings.currentLocale ?? "en").toUpperCase() }}
                    </button>
                    <button
                        class="rounded-xl p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                        @click="settings.toggleTheme()"
                    >
                        <Icon
                            :name="settings.isDarkMode ? 'lucide:sun' : 'lucide:moon'"
                            class="h-4 w-4"
                        />
                    </button>
                    <NuxtLink
                        to="/login"
                        class="hidden text-sm font-medium text-gray-300 transition hover:text-white sm:inline-block"
                    >
                        {{ $t("landing.nav.login") }}
                    </NuxtLink>
                    <NuxtLink
                        to="/register"
                        class="from-primary-500 to-primary-400 shadow-primary-500/20 hover:shadow-primary-500/30 rounded-full bg-linear-to-r px-5 py-2 text-sm font-semibold text-white shadow-lg transition"
                    >
                        {{ $t("landing.nav.getStarted") }}
                    </NuxtLink>
                </div>
            </div>
        </nav>

        <!-- ═══ Hero — Full-bleed bg image ═══ -->
        <section class="relative z-10 min-h-dvh overflow-hidden">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg1.png" alt="" class="h-full w-full object-cover" loading="eager" />
                <div class="absolute inset-0 bg-gray-950/70" />
                <div
                    class="absolute inset-0 bg-linear-to-b from-gray-950/40 via-transparent to-gray-950"
                />
            </div>

            <div class="relative z-10 mx-auto max-w-7xl px-6 pt-36 pb-32 text-center md:pt-48">
                <h1
                    class="hero-enter hero-delay-1 mx-auto max-w-5xl text-5xl leading-[1.08] font-bold tracking-tight md:text-7xl lg:text-8xl"
                >
                    <span class="block text-white drop-shadow-lg">{{
                        $t("landing.hero.titleLine1")
                    }}</span>
                    <span class="mt-2 block text-gray-400">{{
                        $t("landing.hero.titleLine2")
                    }}</span>
                    <span class="mt-2 block">
                        <span
                            class="relative inline-flex h-[1.15em] items-end overflow-hidden align-bottom"
                        >
                            <Transition name="word-slide" mode="out-in">
                                <span
                                    :key="activeWord"
                                    class="from-primary-400 to-primary-300 inline-block bg-linear-to-r bg-clip-text text-transparent drop-shadow-lg"
                                >
                                    {{ activeWord }}
                                </span>
                            </Transition>
                        </span>
                    </span>
                </h1>

                <p
                    class="hero-enter hero-delay-2 mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl"
                >
                    {{ $t("landing.hero.subtitle") }}
                </p>

                <div
                    class="hero-enter hero-delay-3 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <NuxtLink
                        to="/register"
                        class="group bg-primary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-xl transition-all hover:brightness-110"
                    >
                        {{ $t("landing.hero.primaryCta") }}
                        <Icon
                            name="lucide:arrow-right"
                            class="h-4 w-4 transition-transform group-hover:translate-x-1"
                        />
                    </NuxtLink>
                    <a
                        href="#features"
                        class="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-8 py-4 font-medium text-gray-200 backdrop-blur-md transition hover:border-white/[0.2] hover:bg-white/[0.1] hover:text-white"
                    >
                        {{ $t("landing.hero.secondaryCta") }}
                    </a>
                </div>
            </div>
        </section>

        <!-- ═══ Feature Previews — visual cards with images ═══ -->
        <section id="features" class="relative z-10 py-24 md:py-32">
            <div class="mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-primary-400 text-sm font-semibold tracking-widest uppercase">
                        {{ $t("landing.features.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.features.title") }}
                    </h2>
                    <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
                        {{ $t("landing.features.subtitle") }}
                    </p>
                </div>

                <div class="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
                    <div
                        v-for="(feature, i) in featureItems"
                        :key="feature.key"
                        data-reveal
                        :data-reveal-delay="(i % 4) + 1"
                        class="group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
                    >
                        <div class="relative h-48 overflow-hidden bg-gray-900/50">
                            <img
                                :src="feature.image"
                                :alt="$t(`landing.features.${feature.key}.title`)"
                                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div
                                class="absolute inset-0 bg-linear-to-t from-gray-950/80 to-transparent"
                            />
                            <div
                                class="absolute bottom-4 left-4 inline-flex rounded-xl p-2.5"
                                :class="feature.bgClass"
                            >
                                <Icon
                                    :name="feature.icon"
                                    class="h-5 w-5"
                                    :class="feature.iconClass"
                                />
                            </div>
                        </div>
                        <div class="p-6">
                            <h3 class="text-lg font-semibold">
                                {{ $t(`landing.features.${feature.key}.title`) }}
                            </h3>
                            <p class="mt-2 text-sm leading-relaxed text-gray-500">
                                {{ $t(`landing.features.${feature.key}.desc`) }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ How It Works — with bg2 image strip ═══ -->
        <section id="how-it-works" class="relative z-10 overflow-hidden py-24 md:py-32">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg2.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="absolute inset-0 bg-gray-950/80" />
            </div>

            <div class="relative z-10 mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-primary-400 text-sm font-semibold tracking-widest uppercase">
                        {{ $t("landing.howItWorks.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.howItWorks.title") }}
                    </h2>
                </div>

                <div class="relative mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
                    <div
                        class="absolute top-6 right-[16.6%] left-[16.6%] hidden h-px bg-linear-to-r from-transparent via-white/[0.1] to-transparent md:block"
                        aria-hidden="true"
                    />

                    <div
                        v-for="(step, i) in howItWorksSteps"
                        :key="step.key"
                        data-reveal
                        :data-reveal-delay="i + 1"
                        class="relative text-center"
                    >
                        <div
                            class="step-badge text-primary-400 relative z-10 mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                        >
                            0{{ i + 1 }}
                        </div>
                        <Icon :name="step.icon" class="mx-auto mb-3 h-5 w-5 text-gray-400" />
                        <h3 class="text-lg font-semibold">
                            {{ $t(`landing.howItWorks.${step.key}.title`) }}
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-gray-400">
                            {{ $t(`landing.howItWorks.${step.key}.desc`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Why Keepers Love It ═══ -->
        <section id="keepers" class="relative z-10 py-24 md:py-32">
            <div class="mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-primary-400 text-sm font-semibold tracking-widest uppercase">
                        {{ $t("landing.keepers.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.keepers.title") }}
                    </h2>
                </div>

                <div class="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
                    <div
                        v-for="(item, i) in keeperBenefits"
                        :key="item.key"
                        data-reveal
                        :data-reveal-delay="i + 1"
                        class="card-base group hover:border-primary-500/10 p-8 transition-all duration-300 hover:bg-white/[0.03]"
                    >
                        <div
                            class="mb-5 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-105"
                            :class="item.bgClass"
                        >
                            <Icon :name="item.icon" class="h-6 w-6" :class="item.iconClass" />
                        </div>
                        <h3 class="text-lg font-semibold">
                            {{ $t(`landing.keepers.${item.key}.title`) }}
                        </h3>
                        <p class="mt-3 text-sm leading-relaxed text-gray-500">
                            {{ $t(`landing.keepers.${item.key}.desc`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Works With Your Setup ═══ -->
        <section class="relative z-10 overflow-hidden py-24 md:py-32">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg3.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="absolute inset-0 bg-gray-950/75" />
            </div>

            <div class="relative z-10 mx-auto max-w-7xl px-6">
                <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                    <div data-reveal="left">
                        <p class="text-primary-400 text-sm font-semibold tracking-widest uppercase">
                            {{ $t("landing.setup.label") }}
                        </p>
                        <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                            {{ $t("landing.setup.title") }}
                        </h2>
                        <p class="mt-6 text-lg leading-relaxed text-gray-300">
                            {{ $t("landing.setup.desc") }}
                        </p>
                    </div>

                    <div data-reveal="right" class="relative">
                        <div class="grid grid-cols-2 gap-4">
                            <div
                                v-for="tech in techStack"
                                :key="tech.key"
                                class="card-base flex items-center gap-3 p-4 backdrop-blur-sm"
                            >
                                <Icon
                                    :name="tech.icon"
                                    class="h-6 w-6 shrink-0"
                                    :class="tech.color"
                                />
                                <div>
                                    <p class="text-sm font-medium text-gray-200">{{ tech.name }}</p>
                                    <p class="text-xs text-gray-500">
                                        {{ $t(`landing.setup.tech.${tech.key}`) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Social Proof ═══ -->
        <section class="relative z-10 overflow-hidden py-16">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg4.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="absolute inset-0 bg-gray-950/80" />
            </div>
            <div class="relative z-10 mx-auto max-w-7xl px-6">
                <div data-reveal class="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
                    <div v-for="stat in socialStats" :key="stat.key">
                        <p class="text-primary-400 text-3xl font-bold">{{ stat.value }}</p>
                        <p class="mt-1 text-sm text-gray-400">
                            {{ $t(`landing.social.${stat.key}`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ CTA — with bg5 background ═══ -->
        <section class="relative z-10 overflow-hidden py-24 md:py-32">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg5.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="absolute inset-0 bg-gray-950/70" />
                <div
                    class="absolute inset-0 bg-linear-to-b from-gray-950 via-transparent to-gray-950"
                />
            </div>
            <div class="relative z-10 mx-auto max-w-3xl px-6 text-center">
                <div data-reveal>
                    <h2 class="text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.cta.title") }}
                    </h2>
                    <p class="mt-6 text-lg text-gray-300">
                        {{ $t("landing.cta.subtitle") }}
                    </p>
                    <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <NuxtLink
                            to="/register"
                            class="group bg-primary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-xl transition-all hover:brightness-110"
                        >
                            {{ $t("landing.cta.button") }}
                            <Icon
                                name="lucide:arrow-right"
                                class="h-4 w-4 transition-transform group-hover:translate-x-1"
                            />
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Footer ═══ -->
        <footer class="relative z-10 border-t border-white/[0.04] bg-white/[0.01] py-16">
            <div class="mx-auto max-w-7xl px-6">
                <div class="grid grid-cols-1 gap-12 md:grid-cols-4">
                    <div class="md:col-span-2">
                        <div class="flex items-center gap-3">
                            <img src="/cbc.png" alt="KeeperLog" class="h-8 w-8 rounded-xl" />
                            <span class="text-lg font-bold">KeeperLog</span>
                        </div>
                        <p class="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
                            {{ $t("landing.footer.tagline") }}
                        </p>
                    </div>

                    <div>
                        <h4 class="mb-4 text-sm font-semibold text-gray-300">
                            {{ $t("landing.footer.product") }}
                        </h4>
                        <ul class="space-y-3 text-sm text-gray-500">
                            <li>
                                <a href="#features" class="transition hover:text-white">{{
                                    $t("landing.nav.features")
                                }}</a>
                            </li>
                            <li>
                                <a href="#how-it-works" class="transition hover:text-white">{{
                                    $t("landing.nav.howItWorks")
                                }}</a>
                            </li>
                            <li>
                                <a href="#keepers" class="transition hover:text-white">{{
                                    $t("landing.nav.forKeepers")
                                }}</a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="mb-4 text-sm font-semibold text-gray-300">
                            {{ $t("landing.footer.legal") }}
                        </h4>
                        <ul class="space-y-3 text-sm text-gray-500">
                            <li v-for="link in legalLinks" :key="link.key">
                                <NuxtLink
                                    :to="`/legal/${link.key}`"
                                    class="transition hover:text-white"
                                    >{{ isGerman ? link.titleDe : link.title }}</NuxtLink
                                >
                            </li>
                            <li>
                                <button
                                    class="transition hover:text-white"
                                    @click="revokeCookieConsent"
                                >
                                    {{ $t("cookie.revoke") }}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div
                    class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 md:flex-row"
                >
                    <p class="text-xs text-gray-600">
                        {{ $t("landing.footer.copyright", { year: new Date().getFullYear() }) }}
                    </p>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import type { LegalDocumentLink } from "~/types/api";
import { useQuery } from "@tanstack/vue-query";

definePageMeta({ layout: false });

const { locale, t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const api = useApi();
const settings = useSettingsStore();
const isGerman = computed(() => locale.value === "de" || locale.value === "de-DE");

function toggleLocale() {
    const next = settings.currentLocale === "en" ? "de" : "en";
    settings.setLocale(next);
}

useHead({
    htmlAttrs: { class: "scroll-smooth" },
    title: () => t("landing.pageTitle"),
    meta: [
        {
            name: "description",
            content:
                "KeeperLog — Real-time terrarium monitoring, automated alerts and care journal for reptile keepers.",
        },
        {
            property: "og:title",
            content: "KeeperLog — Terrarium Monitoring & Alerts",
        },
        {
            property: "og:description",
            content:
                "Monitor your terrarium sensors, get instant alerts via Telegram, and keep a complete care journal for your reptiles.",
        },
    ],
});

// ── Sticky Nav ───────────────────────────────────────────────
const navScrolled = ref(false);

// ── Word Cycler ──────────────────────────────────────────────
const heroWordKeys = ["word1", "word2", "word3"];
const activeWordIdx = ref(0);
const activeWord = computed(() => t(`landing.hero.${heroWordKeys[activeWordIdx.value]}`));

// ── Data ─────────────────────────────────────────────────────
const howItWorksSteps = [
    { key: "register", icon: "lucide:user-plus" },
    { key: "setup", icon: "lucide:settings" },
    { key: "relax", icon: "lucide:coffee" },
];

const keeperBenefits = [
    {
        key: "peace",
        icon: "lucide:heart",
        bgClass: "bg-primary-500/[0.08]",
        iconClass: "text-primary-400",
    },
    {
        key: "history",
        icon: "lucide:clock",
        bgClass: "bg-cyan-500/[0.08]",
        iconClass: "text-cyan-400",
    },
    {
        key: "privacy",
        icon: "lucide:shield-check",
        bgClass: "bg-amber-500/[0.08]",
        iconClass: "text-amber-400",
    },
];

const techStack = [
    { key: "pi", name: "Raspberry Pi", icon: "lucide:cpu", color: "text-emerald-400" },
    { key: "dht", name: "DHT22 / BME280", icon: "lucide:thermometer", color: "text-orange-400" },
    { key: "ha", name: "Home Assistant", icon: "lucide:home", color: "text-cyan-400" },
    { key: "telegram", name: "Telegram", icon: "lucide:send", color: "text-blue-400" },
    { key: "ws", name: "WebSockets", icon: "lucide:zap", color: "text-amber-400" },
    { key: "local", name: "Local Storage", icon: "lucide:hard-drive", color: "text-purple-400" },
];

const featureItems = [
    {
        key: "sensors",
        icon: "lucide:cpu",
        bgClass: "bg-cyan-500/[0.15] backdrop-blur-sm",
        iconClass: "text-cyan-400",
        image: "/features/feature-sensors.png",
    },
    {
        key: "alerts",
        icon: "lucide:bell-ring",
        bgClass: "bg-red-500/[0.15] backdrop-blur-sm",
        iconClass: "text-red-400",
        image: "/features/feature-alerts.png",
    },
    {
        key: "careLog",
        icon: "lucide:book-open",
        bgClass: "bg-emerald-500/[0.15] backdrop-blur-sm",
        iconClass: "text-emerald-400",
        image: "/features/feature-carelog.png",
    },
    {
        key: "dashboard",
        icon: "lucide:layout-dashboard",
        bgClass: "bg-primary-500/[0.15] backdrop-blur-sm",
        iconClass: "text-primary-400",
        image: "/features/feature-dashboard.png",
    },
];

const socialStats = [
    { key: "enclosures", value: "∞" },
    { key: "sensors", value: "∞" },
    { key: "monitoring", value: "24/7" },
    { key: "alerts", value: "<1 min" },
];

// ── Lifecycle ────────────────────────────────────────────────
let revealObserver: IntersectionObserver | null = null;
let wordInterval: ReturnType<typeof setInterval> | null = null;

const { data: legalLinksData } = useQuery({
    queryKey: ["legal-links"],
    queryFn: () => api.get<LegalDocumentLink[]>("/api/legal"),
});
const legalLinks = computed(() => legalLinksData.value ?? []);

function onScroll() {
    navScrolled.value = window.scrollY > 50;
}

onMounted(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    wordInterval = setInterval(() => {
        activeWordIdx.value = (activeWordIdx.value + 1) % heroWordKeys.length;
    }, 3000);

    revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    revealObserver?.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.05, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver?.observe(el));
});

onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    if (wordInterval) clearInterval(wordInterval);
    revealObserver?.disconnect();
    revealObserver = null;
});

function revokeCookieConsent() {
    localStorage.removeItem("kl_cookie_consent");
    window.location.reload();
}
</script>

<style scoped>
.card-base {
    border-radius: 1rem;
    border: 1px solid rgb(255 255 255 / 0.04);
    background: rgb(255 255 255 / 0.02);
}

.step-badge {
    background: rgb(168 85 247 / 0.05);
}
.step-badge::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    padding: 1px;
    background: linear-gradient(135deg, rgb(168 85 247 / 0.4), rgb(168 85 247 / 0.08));
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

.hero-enter {
    opacity: 0;
    animation: heroFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.hero-delay-1 {
    animation-delay: 0.15s;
}
.hero-delay-2 {
    animation-delay: 0.3s;
}
.hero-delay-3 {
    animation-delay: 0.45s;
}

@keyframes heroFadeUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.word-slide-enter-active,
.word-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.word-slide-enter-from {
    opacity: 0;
    transform: translateY(50%);
    filter: blur(4px);
}
.word-slide-leave-to {
    opacity: 0;
    transform: translateY(-50%);
    filter: blur(4px);
}

[data-reveal] {
    opacity: 0;
    transform: translateY(20px);
    will-change: opacity, transform;
    transition:
        opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
[data-reveal].revealed {
    opacity: 1;
    transform: translateY(0) translateX(0);
    will-change: auto;
}
[data-reveal="left"] {
    transform: translateX(-30px);
    opacity: 0;
}
[data-reveal="right"] {
    transform: translateX(30px);
    opacity: 0;
}

@media (max-width: 768px) {
    [data-reveal="left"],
    [data-reveal="right"] {
        transform: translateY(16px);
    }
}

[data-reveal-delay="1"] {
    transition-delay: 0.06s;
}
[data-reveal-delay="2"] {
    transition-delay: 0.12s;
}
[data-reveal-delay="3"] {
    transition-delay: 0.18s;
}
[data-reveal-delay="4"] {
    transition-delay: 0.24s;
}

@media (prefers-reduced-motion: reduce) {
    [data-reveal],
    [data-reveal="left"],
    [data-reveal="right"] {
        opacity: 1;
        transform: none;
        transition: none;
    }
    .hero-enter {
        opacity: 1;
        animation: none;
    }
}
</style>
