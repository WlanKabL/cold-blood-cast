<template>
    <div class="landing bg-page text-fg relative min-h-dvh">
        <PublicNav />

        <!-- ═══ Hero ═══ -->
        <section class="relative z-10 pt-32 pb-16 md:pt-40 md:pb-24">
            <div class="mx-auto max-w-7xl px-6 text-center">
                <h1
                    class="hero-enter hero-delay-1 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                >
                    {{ $t("explore.faq.hero.title") }}
                </h1>
                <p
                    class="hero-enter hero-delay-2 text-fg-muted mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
                >
                    {{ $t("explore.faq.hero.desc") }}
                </p>
            </div>
        </section>

        <!-- ═══ FAQ Items ═══ -->
        <section class="relative z-10 py-16 md:py-24">
            <div class="mx-auto max-w-3xl px-6">
                <div class="space-y-4">
                    <div
                        v-for="(item, i) in faqKeys"
                        :key="item"
                        data-reveal
                        :data-reveal-delay="Math.min(i + 1, 4)"
                        class="card-base overflow-hidden transition-all duration-300"
                    >
                        <button
                            class="flex w-full items-center justify-between px-6 py-5 text-left"
                            @click="toggle(item)"
                        >
                            <span class="pr-4 font-semibold">{{
                                $t(`explore.faq.items.${item}.q`)
                            }}</span>
                            <Icon
                                name="lucide:chevron-down"
                                class="text-fg-faint h-5 w-5 shrink-0 transition-transform duration-200"
                                :class="openItems.has(item) ? 'rotate-180' : ''"
                            />
                        </button>
                        <div
                            class="grid transition-all duration-300"
                            :class="
                                openItems.has(item)
                                    ? 'grid-rows-[1fr] opacity-100'
                                    : 'grid-rows-[0fr] opacity-0'
                            "
                        >
                            <div class="overflow-hidden">
                                <p
                                    class="border-line-faint text-fg-muted border-t px-6 pt-4 pb-5 text-sm leading-relaxed"
                                >
                                    {{ $t(`explore.faq.items.${item}.a`) }}
                                </p>
                            </div>
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
                        {{ $t("explore.faq.cta.title") }}
                    </h2>
                    <p class="text-fg-dim mt-6 text-lg">
                        {{ $t("explore.faq.cta.desc") }}
                    </p>
                    <div class="mt-10">
                        <NuxtLink
                            to="/register"
                            class="group bg-primary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-xl transition-all hover:brightness-110"
                        >
                            {{ $t("explore.faq.cta.button") }}
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
    title: () => t("explore.faq.pageTitle"),
    meta: [
        { name: "description", content: () => t("seo.faq.description") },
        { property: "og:title", content: () => t("explore.faq.pageTitle") },
        { property: "og:description", content: () => t("seo.faq.description") },
    ],
});

// ── FAQ accordion ────────────────────────────────────────────
const faqKeys = [
    "free",
    "animals",
    "dataSafe",
    "sensors",
    "publicProfiles",
    "export",
    "mobile",
    "whoBuilt",
];

const openItems = ref(new Set<string>());

function toggle(key: string) {
    const next = new Set(openItems.value);
    if (next.has(key)) {
        next.delete(key);
    } else {
        next.add(key);
    }
    openItems.value = next;
}

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
