<template>
    <div class="landing bg-page text-fg relative min-h-dvh">
        <PublicNav />

        <!-- ═══ Hero ═══ -->
        <section class="relative z-10 overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg2.png" alt="" class="h-full w-full object-cover" loading="eager" />
                <div class="bg-page/70 absolute inset-0" />
                <div class="from-page/40 to-page absolute inset-0 bg-linear-to-b via-transparent" />
            </div>
            <div class="relative z-10 mx-auto max-w-7xl px-6 text-center">
                <p
                    class="hero-enter hero-delay-1 text-brand text-sm font-semibold tracking-widest uppercase"
                >
                    {{ $t("explore.features.hero.label") }}
                </p>
                <h1
                    class="hero-enter hero-delay-1 mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                >
                    {{ $t("explore.features.hero.title") }}
                </h1>
                <p
                    class="hero-enter hero-delay-2 text-fg-muted mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
                >
                    {{ $t("explore.features.hero.desc") }}
                </p>
            </div>
        </section>

        <!-- ═══ Feature Sections ═══ -->
        <section
            v-for="(section, idx) in featureSections"
            :key="section.key"
            class="relative z-10 py-20 md:py-28"
            :class="idx % 2 === 1 ? 'bg-surface' : ''"
        >
            <div class="mx-auto max-w-7xl px-6">
                <div data-reveal class="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
                    <!-- Text column -->
                    <div :class="idx % 2 === 1 ? 'lg:order-2' : ''">
                        <div class="mb-5 inline-flex rounded-xl p-3" :class="section.bgClass">
                            <Icon :name="section.icon" class="h-6 w-6" :class="section.iconClass" />
                        </div>
                        <h2 class="text-3xl font-bold tracking-tight md:text-4xl">
                            {{ $t(`explore.features.${section.key}.title`) }}
                        </h2>
                        <p class="text-fg-muted mt-4 text-lg leading-relaxed">
                            {{ $t(`explore.features.${section.key}.desc`) }}
                        </p>

                        <ul class="mt-8 space-y-4">
                            <li
                                v-for="item in section.items"
                                :key="item"
                                class="flex items-start gap-3"
                            >
                                <Icon
                                    name="lucide:check"
                                    class="text-brand mt-0.5 h-5 w-5 shrink-0"
                                />
                                <span class="text-fg-dim text-sm leading-relaxed">{{
                                    $t(`explore.features.${section.key}.items.${item}`)
                                }}</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Visual column -->
                    <div
                        :class="idx % 2 === 1 ? 'lg:order-1' : ''"
                        class="flex items-center justify-center"
                    >
                        <div class="card-base w-full overflow-hidden rounded-2xl">
                            <img
                                :src="section.image"
                                :alt="$t(`explore.features.${section.key}.title`)"
                                class="h-64 w-full object-cover lg:h-80"
                                :class="section.isScreenshot ? 'object-top' : 'object-center'"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ CTA ═══ -->
        <section class="relative z-10 overflow-hidden py-24 md:py-32">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg5.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="bg-page/70 absolute inset-0" />
                <div class="from-page to-page absolute inset-0 bg-linear-to-b via-transparent" />
            </div>
            <div class="relative z-10 mx-auto max-w-3xl px-6 text-center">
                <div data-reveal>
                    <h2 class="text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("explore.features.cta.title") }}
                    </h2>
                    <p class="text-fg-dim mt-6 text-lg">
                        {{ $t("explore.features.cta.desc") }}
                    </p>
                    <div class="mt-10">
                        <NuxtLink
                            to="/register"
                            class="group bg-primary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-xl transition-all hover:brightness-110"
                        >
                            {{ $t("explore.features.cta.button") }}
                            <Icon
                                name="lucide:arrow-right"
                                class="h-4 w-4 transition-transform group-hover:translate-x-1"
                            />
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>

        <PublicFooter />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();

useHead({
    htmlAttrs: { class: "scroll-smooth" },
    title: () => t("explore.features.pageTitle"),
    meta: [
        { name: "description", content: () => t("seo.features.description") },
        { property: "og:title", content: () => t("explore.features.pageTitle") },
        { property: "og:description", content: () => t("seo.features.description") },
    ],
});

// ── Feature sections ─────────────────────────────────────────
const featureSections = [
    {
        key: "careJournal",
        icon: "lucide:book-open",
        bgClass: "bg-emerald-500/[0.08]",
        iconClass: "text-emerald-400",
        image: "/features/feature-carelog.png",
        isScreenshot: true,
        items: ["feedings", "sheddings", "weights", "vetVisits", "notes"],
    },
    {
        key: "animalManagement",
        icon: "lucide:paw-print",
        bgClass: "bg-cyan-500/[0.08]",
        iconClass: "text-cyan-400",
        image: "/features/feature-animals.png",
        isScreenshot: false,
        items: ["profiles", "enclosures", "photos", "documents"],
    },
    {
        key: "publicProfiles",
        icon: "lucide:globe",
        bgClass: "bg-primary-500/[0.08]",
        iconClass: "text-primary-400",
        image: "/features/feature-profiles.png",
        isScreenshot: false,
        items: ["customUrl", "careStats", "community", "embed"],
    },
    {
        key: "healthTracking",
        icon: "lucide:heart-pulse",
        bgClass: "bg-rose-500/[0.08]",
        iconClass: "text-rose-400",
        image: "/features/feature-health.png",
        isScreenshot: false,
        items: ["weightCharts", "shedCycles", "vetRecords", "reminders"],
    },
    {
        key: "planning",
        icon: "lucide:calendar-check",
        bgClass: "bg-amber-500/[0.08]",
        iconClass: "text-amber-400",
        image: "/features/feature-planning.png",
        isScreenshot: false,
        items: ["weeklyPlanner", "feedingReminders", "vetReminders", "maintenance"],
    },
    {
        key: "monitoring",
        icon: "lucide:thermometer",
        bgClass: "bg-sky-500/[0.08]",
        iconClass: "text-sky-400",
        image: "/features/feature-dashboard.png",
        isScreenshot: true,
        items: ["sensors", "alerts", "history", "dashboard"],
    },
];

// ── Lifecycle ────────────────────────────────────────────────
let revealObserver: IntersectionObserver | null = null;

onMounted(() => {
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
    revealObserver?.disconnect();
    revealObserver = null;
});
</script>

<style scoped>
.card-base {
    border-radius: 1rem;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    transition: all 0.3s;
}
.card-base:hover {
    border-color: var(--glass-border-hover);
    background: var(--glass-hover);
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
    transform: translateY(0);
    will-change: auto;
}
</style>
