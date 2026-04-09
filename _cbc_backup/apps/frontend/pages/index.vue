<template>
    <div class="landing min-h-dvh bg-base text-fg">
        <!-- Ambient background -->
        <div class="pointer-events-none fixed inset-0 z-0">
            <div
                class="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]"
            />
            <div
                class="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-emerald-600/[0.04] blur-[100px]"
            />
            <div class="dot-grid absolute inset-0 opacity-[0.03]" />
        </div>

        <!-- Nav -->
        <nav
            class="fixed top-0 z-30 w-full transition-all duration-300"
            :class="scrolled ? 'border-b border-line bg-base/90 backdrop-blur-xl' : ''"
        >
            <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
                <NuxtLink to="/" class="flex items-center gap-2.5">
                    <div
                        class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs"
                    >
                        🐍
                    </div>
                    <span class="text-sm font-bold tracking-tight">Cold Blood Cast</span>
                </NuxtLink>
                <div class="flex items-center gap-2">
                    <button
                        class="rounded-lg px-2 py-1.5 text-xs font-medium text-fg-soft transition hover:text-fg-muted"
                        @click="toggleLocale"
                    >
                        {{ currentLocale.toUpperCase() }}
                    </button>
                    <template v-if="!authStore.isLoggedIn">
                        <NuxtLink
                            to="/login"
                            class="rounded-lg px-3 py-1.5 text-[13px] text-fg-muted transition hover:text-fg"
                        >
                            {{ $t("nav.login") }}
                        </NuxtLink>
                        <NuxtLink
                            to="/register"
                            class="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-emerald-500"
                        >
                            {{ $t("register.title") }}
                        </NuxtLink>
                    </template>
                    <NuxtLink
                        v-else
                        to="/dashboard"
                        class="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-emerald-500"
                    >
                        {{ $t("nav.dashboard") }}
                    </NuxtLink>
                </div>
            </div>
        </nav>

        <!-- Hero -->
        <section
            class="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 pt-14 text-center"
        >
            <div class="hero-enter mx-auto max-w-3xl">
                <div
                    class="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5"
                >
                    <span class="relative flex h-2 w-2">
                        <span
                            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
                        />
                        <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span class="text-[12px] font-medium text-emerald-400">{{
                        $t("landing.badge")
                    }}</span>
                </div>

                <h1
                    class="text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[1.1] tracking-tight"
                >
                    <span class="text-fg">{{ $t("landing.hero_line1") }}</span>
                    <br />
                    <span
                        class="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent"
                    >
                        {{ $t("landing.hero_line2") }}
                    </span>
                </h1>

                <p class="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-fg-muted">
                    {{ $t("landing.hero_subtitle") }}
                </p>

                <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <NuxtLink
                        :to="authStore.isLoggedIn ? '/dashboard' : '/register'"
                        class="group inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 hover:shadow-emerald-500/40"
                    >
                        {{ $t("landing.cta_primary") }}
                        <Icon
                            name="lucide:arrow-right"
                            class="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        />
                    </NuxtLink>
                    <NuxtLink
                        to="/about"
                        class="inline-flex items-center gap-2 rounded-xl border border-line px-7 py-3 text-sm font-medium text-fg-muted transition hover:border-line hover:text-fg"
                    >
                        {{ $t("landing.cta_secondary") }}
                    </NuxtLink>
                </div>

                <!-- Trust strip -->
                <div class="mt-16 flex items-center justify-center gap-6 text-[12px] text-fg-soft">
                    <span class="flex items-center gap-1.5">
                        <Icon name="lucide:shield-check" class="h-3.5 w-3.5" />
                        {{ $t("landing.trust_secure") }}
                    </span>
                    <span class="h-3 w-px bg-line" />
                    <span class="flex items-center gap-1.5">
                        <Icon name="lucide:zap" class="h-3.5 w-3.5" />
                        {{ $t("landing.trust_realtime") }}
                    </span>
                    <span class="h-3 w-px bg-line" />
                    <span class="flex items-center gap-1.5">
                        <Icon name="lucide:heart" class="h-3.5 w-3.5" />
                        {{ $t("landing.trust_built_for") }}
                    </span>
                </div>
            </div>

            <!-- Scroll indicator -->
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-fg-soft">
                <Icon name="lucide:chevron-down" class="h-5 w-5" />
            </div>
        </section>

        <!-- Dashboard preview mock -->
        <section class="relative z-10 -mt-8 px-6 pb-24">
            <div v-scroll-reveal class="scroll-reveal mx-auto max-w-4xl">
                <div
                    class="rounded-2xl border border-card-border bg-card-bg p-1.5 shadow-2xl shadow-black/40"
                >
                    <div class="rounded-xl bg-surface p-6">
                        <!-- Fake topbar -->
                        <div class="mb-6 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="h-3 w-3 rounded-full bg-emerald-500" />
                                <div class="h-2 w-20 rounded-full bg-hover" />
                            </div>
                            <div class="flex gap-2">
                                <div class="h-2 w-12 rounded-full bg-active" />
                                <div class="h-2 w-8 rounded-full bg-active" />
                            </div>
                        </div>
                        <!-- Fake sensor cards -->
                        <div class="grid grid-cols-3 gap-3">
                            <div class="rounded-xl border border-card-border bg-surface-alt p-4">
                                <div
                                    class="mb-3 text-[10px] font-medium uppercase tracking-wider text-fg-soft"
                                >
                                    {{ $t("landing.mock_temp") }}
                                </div>
                                <div class="text-2xl font-bold text-emerald-400">26.4°C</div>
                                <div class="mt-1 text-[11px] text-fg-soft">
                                    ▲ 0.2° {{ $t("landing.mock_1h") }}
                                </div>
                            </div>
                            <div class="rounded-xl border border-card-border bg-surface-alt p-4">
                                <div
                                    class="mb-3 text-[10px] font-medium uppercase tracking-wider text-fg-soft"
                                >
                                    {{ $t("landing.mock_humidity") }}
                                </div>
                                <div class="text-2xl font-bold text-blue-400">68%</div>
                                <div class="mt-1 text-[11px] text-fg-soft">
                                    ▼ 2% {{ $t("landing.mock_1h") }}
                                </div>
                            </div>
                            <div
                                class="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4"
                            >
                                <div
                                    class="mb-3 text-[10px] font-medium uppercase tracking-wider text-emerald-500/80"
                                >
                                    {{ $t("landing.mock_status") }}
                                </div>
                                <div class="text-2xl font-bold text-emerald-400">✓</div>
                                <div class="mt-1 text-[11px] text-emerald-600">
                                    {{ $t("landing.mock_all_safe") }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Problem section -->
        <section class="relative z-10 border-t border-line bg-surface-alt">
            <div class="mx-auto max-w-6xl px-6 py-24">
                <div v-scroll-reveal class="scroll-reveal text-center">
                    <span
                        class="text-[11px] font-semibold uppercase tracking-widest text-emerald-500"
                        >{{ $t("landing.problem_label") }}</span
                    >
                    <h2 class="mt-3 text-3xl font-bold tracking-tight">
                        {{ $t("landing.problem_title") }}
                    </h2>
                </div>

                <div class="mt-14 grid gap-6 md:grid-cols-3">
                    <div
                        v-for="(problem, i) in problems"
                        :key="problem.title"
                        v-scroll-reveal="i"
                        class="scroll-reveal rounded-2xl border border-card-border bg-card-bg p-6"
                    >
                        <div
                            class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400"
                        >
                            <Icon :name="problem.icon" class="h-5 w-5" />
                        </div>
                        <h3 class="text-[15px] font-semibold text-fg">{{ problem.title }}</h3>
                        <p class="mt-2 text-[13px] leading-relaxed text-fg-muted">
                            {{ problem.desc }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features section -->
        <section class="relative z-10">
            <div class="mx-auto max-w-6xl px-6 py-24">
                <div v-scroll-reveal class="scroll-reveal text-center">
                    <span
                        class="text-[11px] font-semibold uppercase tracking-widest text-emerald-500"
                        >{{ $t("landing.features_label") }}</span
                    >
                    <h2 class="mt-3 text-3xl font-bold tracking-tight">
                        {{ $t("landing.features_title") }}
                    </h2>
                    <p class="mx-auto mt-4 max-w-lg text-[14px] text-fg-muted">
                        {{ $t("landing.features_subtitle") }}
                    </p>
                </div>

                <div class="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="(feature, i) in features"
                        :key="feature.title"
                        v-scroll-reveal="i"
                        class="scroll-reveal group rounded-2xl border border-card-border bg-card-bg p-6 transition hover:border-emerald-500/20 hover:bg-emerald-500/[0.03]"
                    >
                        <div
                            class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition"
                            :class="feature.bgClass"
                        >
                            <Icon :name="feature.icon" class="h-5 w-5" :class="feature.iconClass" />
                        </div>
                        <h3 class="text-[15px] font-semibold text-fg">{{ feature.title }}</h3>
                        <p class="mt-2 text-[13px] leading-relaxed text-fg-muted">
                            {{ feature.desc }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- How it works -->
        <section class="relative z-10 border-t border-line bg-surface-alt">
            <div class="mx-auto max-w-4xl px-6 py-24">
                <div v-scroll-reveal class="scroll-reveal text-center">
                    <span
                        class="text-[11px] font-semibold uppercase tracking-widest text-emerald-500"
                        >{{ $t("landing.how_label") }}</span
                    >
                    <h2 class="mt-3 text-3xl font-bold tracking-tight">
                        {{ $t("landing.how_title") }}
                    </h2>
                </div>

                <div class="mt-14 space-y-0">
                    <div
                        v-for="(step, i) in steps"
                        :key="step.title"
                        v-scroll-reveal="i"
                        class="scroll-reveal relative flex gap-6"
                    >
                        <!-- Connecting line -->
                        <div class="flex flex-col items-center">
                            <div
                                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
                            >
                                {{ i + 1 }}
                            </div>
                            <div
                                v-if="i < steps.length - 1"
                                class="w-px flex-1 bg-gradient-to-b from-emerald-600/40 to-transparent"
                            />
                        </div>
                        <div class="pb-12">
                            <h3 class="text-[15px] font-semibold text-fg">{{ step.title }}</h3>
                            <p class="mt-1 text-[13px] leading-relaxed text-fg-muted">
                                {{ step.desc }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA -->
        <section class="relative z-10">
            <div class="mx-auto max-w-6xl px-6 py-24">
                <div
                    v-scroll-reveal
                    class="scroll-reveal relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-12 text-center"
                >
                    <div
                        class="absolute left-1/2 top-0 h-[200px] w-[400px] -translate-x-1/2 rounded-full bg-emerald-500/[0.08] blur-[80px]"
                    />
                    <div class="relative z-10">
                        <h2 class="text-3xl font-bold tracking-tight">
                            {{ $t("landing.cta_title") }}
                        </h2>
                        <p class="mx-auto mt-4 max-w-md text-[14px] text-fg-muted">
                            {{ $t("landing.cta_subtitle") }}
                        </p>
                        <NuxtLink
                            :to="authStore.isLoggedIn ? '/dashboard' : '/register'"
                            class="group mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500"
                        >
                            {{ $t("landing.cta_primary") }}
                            <Icon
                                name="lucide:arrow-right"
                                class="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                            />
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="relative z-10 border-t border-line">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                <span class="text-[12px] text-fg-soft"
                    >&copy; {{ new Date().getFullYear() }} Cold Blood Cast</span
                >
                <div class="flex items-center gap-4">
                    <NuxtLink
                        to="/about"
                        class="text-[12px] text-fg-soft transition hover:text-fg-muted"
                        >{{ $t("nav.about") }}</NuxtLink
                    >
                    <NuxtLink
                        to="/contact"
                        class="text-[12px] text-fg-soft transition hover:text-fg-muted"
                        >{{ $t("nav.contact") }}</NuxtLink
                    >
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t, locale } = useI18n();
const authStore = useAuthStore();

useSeoMeta({ title: "Cold Blood Cast — Terrarium Monitoring" });

const currentLocale = computed(() => locale.value);
function toggleLocale() {
    locale.value = locale.value === "en" ? "de" : "en";
}

// Scroll-aware nav
const scrolled = ref(false);
function onScroll() {
    scrolled.value = window.scrollY > 40;
}

// Scroll reveal observer — created during setup so it's ready when directives mount
const observer = import.meta.client
    ? new IntersectionObserver(
          (entries) => {
              for (const entry of entries) {
                  if (entry.isIntersecting) {
                      (entry.target as HTMLElement).classList.add("revealed");
                      observer?.unobserve(entry.target);
                  }
              }
          },
          { threshold: 0.05, rootMargin: "0px 0px -30px 0px" },
      )
    : null;

const vScrollReveal = {
    mounted(el: HTMLElement, binding: { value?: number }) {
        if (binding.value) {
            el.style.transitionDelay = `${binding.value * 100}ms`;
        }
        observer?.observe(el);
    },
    unmounted(el: HTMLElement) {
        observer?.unobserve(el);
    },
};

onMounted(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
});

onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    observer?.disconnect();
});

const problems = computed(() => [
    {
        icon: "lucide:thermometer-snowflake",
        title: t("landing.problem1_title"),
        desc: t("landing.problem1_desc"),
    },
    {
        icon: "lucide:eye-off",
        title: t("landing.problem2_title"),
        desc: t("landing.problem2_desc"),
    },
    {
        icon: "lucide:file-x",
        title: t("landing.problem3_title"),
        desc: t("landing.problem3_desc"),
    },
]);

const features = computed(() => [
    {
        icon: "lucide:thermometer",
        title: t("landing.feature_monitoring_title"),
        desc: t("landing.feature_monitoring_desc"),
        bgClass: "bg-emerald-500/10",
        iconClass: "text-emerald-400",
    },
    {
        icon: "lucide:bell-ring",
        title: t("landing.feature_alerts_title"),
        desc: t("landing.feature_alerts_desc"),
        bgClass: "bg-amber-500/10",
        iconClass: "text-amber-400",
    },
    {
        icon: "lucide:line-chart",
        title: t("landing.feature_journal_title"),
        desc: t("landing.feature_journal_desc"),
        bgClass: "bg-blue-500/10",
        iconClass: "text-blue-400",
    },
    {
        icon: "lucide:layout-dashboard",
        title: t("landing.feature_dashboard_title"),
        desc: t("landing.feature_dashboard_desc"),
        bgClass: "bg-purple-500/10",
        iconClass: "text-purple-400",
    },
    {
        icon: "lucide:paw-print",
        title: t("landing.feature_pets_title"),
        desc: t("landing.feature_pets_desc"),
        bgClass: "bg-pink-500/10",
        iconClass: "text-pink-400",
    },
    {
        icon: "lucide:smartphone",
        title: t("landing.feature_mobile_title"),
        desc: t("landing.feature_mobile_desc"),
        bgClass: "bg-cyan-500/10",
        iconClass: "text-cyan-400",
    },
]);

const steps = computed(() => [
    { title: t("landing.step1_title"), desc: t("landing.step1_desc") },
    { title: t("landing.step2_title"), desc: t("landing.step2_desc") },
    { title: t("landing.step3_title"), desc: t("landing.step3_desc") },
]);
</script>

<style scoped>
.dot-grid {
    background-image: radial-gradient(circle, var(--cbc-fg) 1px, transparent 1px);
    background-size: 24px 24px;
}

/* Hero entrance */
.hero-enter {
    animation: hero-in 0.8s ease-out both;
}

@keyframes hero-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Scroll reveal */
.scroll-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition:
        opacity 0.6s ease-out,
        transform 0.6s ease-out;
}

.scroll-reveal.revealed {
    opacity: 1;
    transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
    .hero-enter {
        animation: none;
    }
    .scroll-reveal {
        opacity: 1;
        transform: none;
        transition: none;
    }
}
</style>
