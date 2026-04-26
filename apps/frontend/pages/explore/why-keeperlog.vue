<template>
    <div class="landing bg-page text-fg relative min-h-dvh">
        <PublicNav />

        <!-- ═══ Hero ═══ -->
        <section class="relative z-10 overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg4.png" alt="" class="h-full w-full object-cover" loading="eager" />
                <div class="bg-page/70 absolute inset-0" />
                <div class="from-page/40 to-page absolute inset-0 bg-linear-to-b via-transparent" />
            </div>
            <div class="relative z-10 mx-auto max-w-7xl px-6 text-center">
                <p
                    class="hero-enter hero-delay-1 text-brand text-sm font-semibold tracking-widest uppercase"
                >
                    {{ $t("explore.why.hero.label") }}
                </p>
                <h1
                    class="hero-enter hero-delay-1 mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                >
                    {{ $t("explore.why.hero.title") }}
                </h1>
                <p
                    class="hero-enter hero-delay-2 text-fg-muted mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
                >
                    {{ $t("explore.why.hero.desc") }}
                </p>
            </div>
        </section>

        <!-- ═══ Problems ═══ -->
        <section class="relative z-10 py-20 md:py-28">
            <div class="mx-auto max-w-7xl px-6">
                <h2 data-reveal class="text-center text-3xl font-bold tracking-tight md:text-4xl">
                    {{ $t("explore.why.problems.title") }}
                </h2>

                <div class="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
                    <div
                        v-for="(problem, i) in problems"
                        :key="problem.key"
                        data-reveal
                        :data-reveal-delay="i + 1"
                        class="card-base group p-8 transition-all duration-300"
                    >
                        <div class="mb-5 inline-flex rounded-xl p-3" :class="problem.bgClass">
                            <Icon :name="problem.icon" class="h-6 w-6" :class="problem.iconClass" />
                        </div>
                        <h3 class="text-lg font-semibold">
                            {{ $t(`explore.why.problems.${problem.key}.title`) }}
                        </h3>
                        <p class="text-fg-faint mt-3 text-sm leading-relaxed">
                            {{ $t(`explore.why.problems.${problem.key}.desc`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Solution ═══ -->
        <section class="relative z-10 overflow-hidden py-20 md:py-28">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg3.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="bg-page/85 absolute inset-0" />
            </div>

            <div class="relative z-10 mx-auto max-w-7xl px-6">
                <h2 data-reveal class="text-center text-3xl font-bold tracking-tight md:text-4xl">
                    {{ $t("explore.why.solution.title") }}
                </h2>

                <div class="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
                    <div
                        v-for="(item, i) in solutionItems"
                        :key="item.key"
                        data-reveal
                        :data-reveal-delay="i + 1"
                        class="card-base group p-8 backdrop-blur-sm transition-all duration-300"
                    >
                        <div class="mb-5 inline-flex rounded-xl p-3" :class="item.bgClass">
                            <Icon :name="item.icon" class="h-6 w-6" :class="item.iconClass" />
                        </div>
                        <h3 class="text-lg font-semibold">
                            {{ $t(`explore.why.solution.items.${item.key}.title`) }}
                        </h3>
                        <p class="text-fg-faint mt-3 text-sm leading-relaxed">
                            {{ $t(`explore.why.solution.items.${item.key}.desc`) }}
                        </p>
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
                        {{ $t("explore.why.cta.title") }}
                    </h2>
                    <p class="text-fg-dim mt-6 text-lg">
                        {{ $t("explore.why.cta.desc") }}
                    </p>
                    <div class="mt-10">
                        <NuxtLink
                            to="/register"
                            class="group bg-primary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-xl transition-all hover:brightness-110"
                        >
                            {{ $t("explore.why.cta.button") }}
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
    title: () => t("explore.why.pageTitle"),
    meta: [
        { name: "description", content: () => t("seo.whyKeeperlog.description") },
        { property: "og:title", content: () => t("explore.why.pageTitle") },
        { property: "og:description", content: () => t("seo.whyKeeperlog.description") },
    ],
});

// ── Data ─────────────────────────────────────────────────────
const problems = [
    {
        key: "memory",
        icon: "lucide:brain",
        bgClass: "bg-rose-500/[0.08]",
        iconClass: "text-rose-400",
    },
    {
        key: "scattered",
        icon: "lucide:layers",
        bgClass: "bg-amber-500/[0.08]",
        iconClass: "text-amber-400",
    },
    {
        key: "handover",
        icon: "lucide:file-search",
        bgClass: "bg-cyan-500/[0.08]",
        iconClass: "text-cyan-400",
    },
    {
        key: "forgetting",
        icon: "lucide:alarm-clock-off",
        bgClass: "bg-purple-500/[0.08]",
        iconClass: "text-purple-400",
    },
];

const solutionItems = [
    {
        key: "onePlace",
        icon: "lucide:database",
        bgClass: "bg-emerald-500/[0.08]",
        iconClass: "text-emerald-400",
    },
    {
        key: "trends",
        icon: "lucide:trending-up",
        bgClass: "bg-cyan-500/[0.08]",
        iconClass: "text-cyan-400",
    },
    {
        key: "shareProof",
        icon: "lucide:share-2",
        bgClass: "bg-primary-500/[0.08]",
        iconClass: "text-primary-400",
    },
    {
        key: "neverForget",
        icon: "lucide:bell-ring",
        bgClass: "bg-amber-500/[0.08]",
        iconClass: "text-amber-400",
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
