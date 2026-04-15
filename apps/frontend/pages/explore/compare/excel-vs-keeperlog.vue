<template>
    <div class="landing bg-base text-fg relative min-h-dvh">
        <PublicNav />

        <!-- ═══ Hero ═══ -->
        <section class="relative z-10 overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img
                    src="/bg-forest.png"
                    alt=""
                    class="h-full w-full object-cover"
                    loading="eager"
                />
                <div class="bg-base/70 absolute inset-0" />
                <div class="from-base/40 to-base absolute inset-0 bg-linear-to-b via-transparent" />
            </div>
            <div class="relative z-10 mx-auto max-w-7xl px-6 text-center">
                <p
                    class="hero-enter hero-delay-1 text-brand text-sm font-semibold tracking-widest uppercase"
                >
                    {{ $t("explore.compare.hero.label") }}
                </p>
                <h1
                    class="hero-enter hero-delay-1 mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                >
                    {{ $t("explore.compare.hero.title") }}
                </h1>
                <p
                    class="hero-enter hero-delay-2 text-fg-muted mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
                >
                    {{ $t("explore.compare.hero.desc") }}
                </p>
            </div>
        </section>

        <!-- ═══ Comparison Table ═══ -->
        <section class="relative z-10 py-16 md:py-24">
            <div class="mx-auto max-w-4xl px-6">
                <div data-reveal class="card-base overflow-hidden">
                    <!-- Header -->
                    <div class="border-line bg-surface grid grid-cols-3 border-b px-6 py-4">
                        <span class="text-fg-dim text-sm font-semibold">{{
                            $t("explore.compare.table.feature")
                        }}</span>
                        <span class="text-fg-faint text-center text-sm font-semibold">{{
                            $t("explore.compare.table.excel")
                        }}</span>
                        <span class="text-brand text-center text-sm font-semibold">{{
                            $t("explore.compare.table.keeperlog")
                        }}</span>
                    </div>

                    <!-- Rows -->
                    <div
                        v-for="(row, i) in comparisonRows"
                        :key="row"
                        class="border-line-faint hover:bg-surface grid grid-cols-3 border-b px-6 py-4 transition-colors"
                        :class="i === comparisonRows.length - 1 ? 'border-b-0' : ''"
                    >
                        <span class="text-fg-soft text-sm font-medium">{{
                            $t(`explore.compare.table.rows.${row}.label`)
                        }}</span>
                        <span class="text-fg-faint text-center text-sm">{{
                            $t(`explore.compare.table.rows.${row}.excel`)
                        }}</span>
                        <span class="text-primary-600 dark:text-primary-300 text-center text-sm">{{
                            $t(`explore.compare.table.rows.${row}.keeperlog`)
                        }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Honest Take ═══ -->
        <section class="relative z-10 py-20 md:py-28">
            <div class="mx-auto max-w-5xl px-6">
                <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div data-reveal class="card-base p-8 transition-all duration-300">
                        <div class="mb-5 inline-flex rounded-xl bg-emerald-500/[0.08] p-3">
                            <Icon name="lucide:check" class="h-6 w-6 text-emerald-400" />
                        </div>
                        <h3 class="text-lg font-semibold">
                            {{ $t("explore.compare.honest.title") }}
                        </h3>
                        <p class="text-fg-faint mt-3 text-sm leading-relaxed">
                            {{ $t("explore.compare.honest.desc") }}
                        </p>
                    </div>
                    <div
                        data-reveal
                        :data-reveal-delay="1"
                        class="card-base p-8 transition-all duration-300"
                    >
                        <div class="bg-primary-500/[0.08] mb-5 inline-flex rounded-xl p-3">
                            <Icon name="lucide:arrow-up-right" class="text-brand h-6 w-6" />
                        </div>
                        <h3 class="text-lg font-semibold">
                            {{ $t("explore.compare.honest.title2") }}
                        </h3>
                        <p class="text-fg-faint mt-3 text-sm leading-relaxed">
                            {{ $t("explore.compare.honest.desc2") }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ CTA ═══ -->
        <section class="relative z-10 overflow-hidden py-24 md:py-32">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg5.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="bg-base/70 absolute inset-0" />
                <div class="from-base to-base absolute inset-0 bg-linear-to-b via-transparent" />
            </div>
            <div class="relative z-10 mx-auto max-w-3xl px-6 text-center">
                <div data-reveal>
                    <h2 class="text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("explore.compare.cta.title") }}
                    </h2>
                    <p class="text-fg-dim mt-6 text-lg">
                        {{ $t("explore.compare.cta.desc") }}
                    </p>
                    <div class="mt-10">
                        <NuxtLink
                            to="/register"
                            class="group bg-primary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-xl transition-all hover:brightness-110"
                        >
                            {{ $t("explore.compare.cta.button") }}
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
    title: () => t("explore.compare.pageTitle"),
    meta: [
        { name: "description", content: () => t("seo.compare.description") },
        { property: "og:title", content: () => t("explore.compare.pageTitle") },
        { property: "og:description", content: () => t("seo.compare.description") },
    ],
});

// ── Comparison rows ──────────────────────────────────────────
const comparisonRows = [
    "feedingLog",
    "weightTracking",
    "photos",
    "sharing",
    "reminders",
    "mobile",
    "multiAnimal",
    "dataSafety",
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
