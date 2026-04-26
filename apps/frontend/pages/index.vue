<template>
    <div class="landing bg-base text-fg relative min-h-dvh">
        <PublicNav />

        <!-- ═══ Hero ═══ -->
        <section class="relative z-10 min-h-dvh overflow-hidden">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg1.png" alt="" class="h-full w-full object-cover" loading="eager" />
                <div class="bg-base/70 absolute inset-0" />
                <div class="from-base/40 to-base absolute inset-0 bg-linear-to-b via-transparent" />
            </div>

            <div
                class="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-20 text-center sm:px-6 md:pt-36 md:pb-32"
            >
                <h1
                    class="hero-enter hero-delay-1 mx-auto max-w-5xl text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                >
                    <span class="text-fg block drop-shadow-lg">{{
                        $t("landing.hero.titleLine1")
                    }}</span>
                    <span
                        class="from-primary-700 to-primary-500 dark:from-primary-400 dark:to-primary-300 mt-2 block bg-linear-to-r bg-clip-text text-transparent drop-shadow-lg"
                        >{{ $t("landing.hero.titleLine2") }}</span
                    >
                </h1>

                <p
                    class="hero-enter hero-delay-2 text-fg-dim mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg md:mt-8 md:text-xl"
                >
                    {{ $t("landing.hero.subtitle") }}
                </p>

                <ul
                    class="hero-enter hero-delay-2 text-fg-soft mx-auto mt-6 flex max-w-xl flex-col gap-2.5 text-left text-sm sm:text-base md:mt-8 md:gap-3 md:text-lg"
                >
                    <li
                        v-for="key in ['bullet1', 'bullet2', 'bullet3']"
                        :key="key"
                        class="flex items-start gap-3"
                    >
                        <Icon
                            name="lucide:check-circle-2"
                            class="text-primary-400 mt-0.5 h-5 w-5 shrink-0 md:mt-1"
                        />
                        <span>{{ $t(`landing.hero.${key}`) }}</span>
                    </li>
                </ul>

                <div
                    class="hero-enter hero-delay-3 mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4 md:mt-12"
                >
                    <NuxtLink
                        to="/register"
                        class="group bg-primary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-xl transition-all hover:brightness-110"
                    >
                        {{ $t("landing.hero.primaryCta") }}
                        <Icon
                            name="lucide:arrow-right"
                            class="h-4 w-4 transition-transform group-hover:translate-x-1"
                        />
                    </NuxtLink>
                    <a
                        href="#how-it-works"
                        class="border-line bg-surface-hover text-fg-soft hover:border-line hover:bg-surface-active hover:text-fg inline-flex items-center justify-center gap-2 rounded-full border px-8 py-4 font-medium backdrop-blur-md transition"
                    >
                        {{ $t("landing.hero.secondaryCta") }}
                    </a>
                </div>

                <p class="hero-enter hero-delay-3 text-fg-faint mt-5 text-sm md:mt-6">
                    {{ $t("landing.hero.trustLine") }}
                </p>
            </div>
        </section>

        <!-- ═══ Features — Care-first ═══ -->
        <section id="features" class="relative z-10 py-24 md:py-32">
            <div class="mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-brand text-sm font-semibold tracking-widest uppercase">
                        {{ $t("landing.features.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.features.title") }}
                    </h2>
                    <p class="text-fg-muted mx-auto mt-6 max-w-2xl text-lg">
                        {{ $t("landing.features.subtitle") }}
                    </p>
                </div>

                <div class="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
                    <div
                        v-for="(feature, i) in featureItems"
                        :key="feature.key"
                        data-reveal
                        :data-reveal-delay="i + 1"
                        class="card-base group p-8 transition-all duration-300"
                    >
                        <div
                            class="mb-5 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-105"
                            :class="feature.bgClass"
                        >
                            <Icon :name="feature.icon" class="h-6 w-6" :class="feature.iconClass" />
                        </div>
                        <h3 class="text-lg font-semibold">
                            {{ $t(`landing.features.${feature.key}.title`) }}
                        </h3>
                        <p class="text-fg-faint mt-3 text-sm leading-relaxed">
                            {{ $t(`landing.features.${feature.key}.desc`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Product Showcase ═══ -->
        <section class="relative z-10 overflow-hidden py-24 md:py-32">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg3.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="bg-base/80 absolute inset-0" />
            </div>

            <div class="relative z-10 mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-brand text-sm font-semibold tracking-widest uppercase">
                        {{ $t("landing.product.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.product.title") }}
                    </h2>
                    <p class="text-fg-muted mx-auto mt-6 max-w-2xl text-lg">
                        {{ $t("landing.product.desc") }}
                    </p>
                </div>

                <div data-reveal class="mt-16 flex justify-center">
                    <div
                        class="shadow-primary-500/5 border-line w-full max-w-4xl overflow-hidden rounded-2xl border shadow-2xl"
                    >
                        <div
                            class="border-line bg-surface flex items-center gap-2 border-b px-4 py-3"
                        >
                            <span class="h-3 w-3 rounded-full bg-red-500/60" />
                            <span class="h-3 w-3 rounded-full bg-yellow-500/60" />
                            <span class="h-3 w-3 rounded-full bg-green-500/60" />
                            <span class="text-fg-faint ml-4 text-xs">KeeperLog</span>
                        </div>
                        <img
                            src="/features/feature-carelog.png"
                            alt="KeeperLog Care Journal"
                            class="w-full"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ How It Works ═══ -->
        <section id="how-it-works" class="relative z-10 py-24 md:py-32">
            <div class="mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-brand text-sm font-semibold tracking-widest uppercase">
                        {{ $t("landing.howItWorks.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.howItWorks.title") }}
                    </h2>
                </div>

                <div class="relative mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
                    <div
                        class="via-line absolute top-6 right-[16.6%] left-[16.6%] hidden h-px bg-linear-to-r from-transparent to-transparent md:block"
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
                            class="step-badge text-brand relative z-10 mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                        >
                            0{{ i + 1 }}
                        </div>
                        <Icon :name="step.icon" class="text-fg-muted mx-auto mb-3 h-5 w-5" />
                        <h3 class="text-lg font-semibold">
                            {{ $t(`landing.howItWorks.${step.key}.title`) }}
                        </h3>
                        <p class="text-fg-muted mt-2 text-sm leading-relaxed">
                            {{ $t(`landing.howItWorks.${step.key}.desc`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Trust ═══ -->
        <section class="relative z-10 overflow-hidden py-24 md:py-32">
            <div class="absolute inset-0 z-0" aria-hidden="true">
                <img src="/bg2.png" alt="" class="h-full w-full object-cover" loading="lazy" />
                <div class="bg-base/80 absolute inset-0" />
            </div>

            <div class="relative z-10 mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-brand text-sm font-semibold tracking-widest uppercase">
                        {{ $t("landing.trust.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.trust.title") }}
                    </h2>
                </div>

                <div class="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
                    <div
                        v-for="(item, i) in trustItems"
                        :key="item.key"
                        data-reveal
                        :data-reveal-delay="i + 1"
                        class="card-base group p-8 backdrop-blur-sm transition-all duration-300"
                    >
                        <div
                            class="mb-5 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-105"
                            :class="item.bgClass"
                        >
                            <Icon :name="item.icon" class="h-6 w-6" :class="item.iconClass" />
                        </div>
                        <h3 class="text-lg font-semibold">
                            {{ $t(`landing.trust.${item.key}.title`) }}
                        </h3>
                        <p class="text-fg-faint mt-3 text-sm leading-relaxed">
                            {{ $t(`landing.trust.${item.key}.desc`) }}
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
                        {{ $t("landing.cta.title") }}
                    </h2>
                    <p class="text-fg-dim mt-6 text-lg">
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

        <PublicFooter />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();

useHead({
    htmlAttrs: { class: "scroll-smooth" },
    title: () => t("landing.pageTitle"),
    meta: [
        { name: "description", content: () => t("seo.home.description") },
        { property: "og:title", content: () => t("landing.pageTitle") },
        { property: "og:description", content: () => t("seo.home.description") },
    ],
});

// ── Data ─────────────────────────────────────────────────────
const featureItems = [
    {
        key: "careLog",
        icon: "lucide:book-open",
        bgClass: "bg-emerald-500/[0.08]",
        iconClass: "text-emerald-400",
    },
    {
        key: "history",
        icon: "lucide:clock",
        bgClass: "bg-cyan-500/[0.08]",
        iconClass: "text-cyan-400",
    },
    {
        key: "publicProfiles",
        icon: "lucide:globe",
        bgClass: "bg-primary-500/[0.08]",
        iconClass: "text-primary-400",
    },
];

const howItWorksSteps = [
    { key: "register", icon: "lucide:user-plus" },
    { key: "addAnimals", icon: "lucide:paw-print" },
    { key: "startTracking", icon: "lucide:book-open" },
];

const trustItems = [
    {
        key: "privacy",
        icon: "lucide:shield-check",
        bgClass: "bg-amber-500/[0.08]",
        iconClass: "text-amber-400",
    },
    {
        key: "keeper",
        icon: "lucide:heart",
        bgClass: "bg-primary-500/[0.08]",
        iconClass: "text-primary-400",
    },
    {
        key: "free",
        icon: "lucide:sparkles",
        bgClass: "bg-cyan-500/[0.08]",
        iconClass: "text-cyan-400",
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
</style>
