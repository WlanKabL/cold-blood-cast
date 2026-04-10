<template>
    <div class="landing relative min-h-dvh bg-gray-950 text-white">
        <!-- ═══ Background layers ═══ -->
        <div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
            <div
                class="bg-primary-600/[0.07] absolute top-0 left-1/2 h-[800px] w-[1200px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[120px]"
            />
            <div
                class="absolute right-0 bottom-0 h-[600px] w-[800px] translate-x-1/4 translate-y-1/4 rounded-full bg-violet-600/[0.05] blur-[100px]"
            />
            <div class="dot-grid absolute inset-0 opacity-[0.03]" />
            <div class="noise absolute inset-0 opacity-[0.025]" />
        </div>

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
                        href="#monitoring"
                        class="text-sm text-gray-400 transition hover:text-white"
                        >{{ $t("landing.nav.monitoring") }}</a
                    >
                    <a href="#alerts" class="text-sm text-gray-400 transition hover:text-white">{{
                        $t("landing.nav.alerts")
                    }}</a>
                    <a href="#carelog" class="text-sm text-gray-400 transition hover:text-white">{{
                        $t("landing.nav.careLog")
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

        <!-- ═══ Hero ═══ -->
        <section class="relative z-10 mx-auto max-w-7xl px-6 pt-36 pb-32 text-center md:pt-48">
            <div
                class="hero-enter mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-sm"
            >
                <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span class="text-gray-400">{{ $t("landing.hero.badge") }}</span>
            </div>

            <h1
                class="hero-enter hero-delay-1 mx-auto max-w-5xl text-5xl leading-[1.08] font-bold tracking-tight md:text-7xl lg:text-8xl"
            >
                <span class="block text-white">{{ $t("landing.hero.titleLine1") }}</span>
                <span class="mt-2 block">
                    <span class="text-gray-500">{{ $t("landing.hero.titleLine2") }}</span>
                    <span
                        class="relative inline-flex h-[1.15em] items-end overflow-hidden align-bottom"
                    >
                        <Transition name="word-slide" mode="out-in">
                            <span
                                :key="activeWord"
                                class="from-primary-400 to-primary-300 inline-block bg-linear-to-r bg-clip-text text-transparent"
                            >
                                {{ activeWord }}
                            </span>
                        </Transition>
                    </span>
                </span>
            </h1>

            <p
                class="hero-enter hero-delay-2 mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl"
            >
                {{ $t("landing.hero.subtitle") }}
            </p>

            <div
                class="hero-enter hero-delay-3 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
                <NuxtLink
                    to="/register"
                    class="group bg-primary-500 shadow-primary-500/20 hover:shadow-primary-500/30 relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-lg transition-all hover:brightness-110"
                >
                    {{ $t("landing.hero.primaryCta") }}
                    <Icon
                        name="lucide:arrow-right"
                        class="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                </NuxtLink>
                <a
                    href="#monitoring"
                    class="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-8 py-4 font-medium text-gray-300 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
                >
                    {{ $t("landing.hero.secondaryCta") }}
                </a>
            </div>

            <div
                class="hero-enter hero-delay-3 mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600 md:gap-8"
            >
                <span class="flex items-center gap-1.5">
                    <Icon name="lucide:shield-check" class="h-3.5 w-3.5" />
                    {{ $t("landing.trust.encrypted") }}
                </span>
                <span class="flex items-center gap-1.5">
                    <Icon name="lucide:gift" class="h-3.5 w-3.5" />
                    {{ $t("landing.trust.openSource") }}
                </span>
                <span class="flex items-center gap-1.5">
                    <Icon name="lucide:zap" class="h-3.5 w-3.5" />
                    {{ $t("landing.trust.fast") }}
                </span>
            </div>

            <!-- Dashboard Preview -->
            <div data-reveal class="relative mx-auto mt-24 max-w-5xl">
                <div
                    class="absolute -inset-px rounded-2xl bg-linear-to-b from-white/[0.08] to-transparent"
                />
                <div
                    class="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-900/80 shadow-2xl shadow-black/40 backdrop-blur-sm"
                    style="transition: transform 0.2s ease-out"
                    @mousemove="handleTiltMove"
                    @mouseleave="handleTiltLeave"
                >
                    <div
                        class="flex items-center gap-2 border-b border-white/[0.04] bg-white/[0.02] px-4 py-3"
                    >
                        <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                        <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                        <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                        <span class="ml-3 text-xs text-gray-600">{{
                            $t("landing.preview.dashboardBar")
                        }}</span>
                    </div>
                    <div class="p-6">
                        <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div class="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                                <p class="text-xs text-gray-600">
                                    {{ $t("landing.preview.warmSide") }}
                                </p>
                                <p class="mt-1 text-xl font-bold text-emerald-400">31.2°C</p>
                            </div>
                            <div class="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                                <p class="text-xs text-gray-600">
                                    {{ $t("landing.preview.coolSide") }}
                                </p>
                                <p class="mt-1 text-xl font-bold text-white">24.8°C</p>
                            </div>
                            <div class="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                                <p class="text-xs text-gray-600">
                                    {{ $t("landing.preview.humidity") }}
                                </p>
                                <p class="mt-1 text-xl font-bold text-white">52%</p>
                            </div>
                            <div class="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                                <p class="text-xs text-gray-600">
                                    {{ $t("landing.preview.enclosures") }}
                                </p>
                                <p class="text-primary-400 mt-1 text-xl font-bold">3</p>
                            </div>
                        </div>
                        <!-- Sensor trend visualization -->
                        <div
                            class="flex h-32 items-end gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                        >
                            <div
                                v-for="(bar, i) in sensorTrend"
                                :key="i"
                                class="sensor-bar w-full rounded-sm"
                                :class="bar.c"
                                :style="{
                                    height: bar.h,
                                    animationDelay: `${1.2 + i * 0.05}s`,
                                }"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ How It Works ═══ -->
        <section class="relative z-10 border-y border-white/[0.04] py-24 md:py-32">
            <div class="mx-auto max-w-7xl px-6">
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
                        class="absolute top-6 right-[16.6%] left-[16.6%] hidden h-px bg-linear-to-r from-transparent via-white/[0.06] to-transparent md:block"
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
                        <Icon :name="step.icon" class="mx-auto mb-3 h-5 w-5 text-gray-500" />
                        <h3 class="text-lg font-semibold">
                            {{ $t(`landing.howItWorks.${step.key}.title`) }}
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-gray-500">
                            {{ $t(`landing.howItWorks.${step.key}.desc`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Problem Section ═══ -->
        <section class="relative z-10 py-24 md:py-32">
            <div class="mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-sm font-semibold tracking-widest text-red-400/80 uppercase">
                        {{ $t("landing.problem.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.problem.title") }}
                    </h2>
                </div>

                <div class="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
                    <div
                        v-for="(item, i) in problemItems"
                        :key="item.key"
                        data-reveal
                        :data-reveal-delay="i + 1"
                        class="card-base group p-8 transition-all duration-300 hover:border-red-500/10 hover:bg-white/[0.03]"
                    >
                        <div
                            class="mb-5 inline-flex rounded-xl bg-red-500/[0.08] p-3 transition-transform duration-300 group-hover:scale-105"
                        >
                            <Icon :name="item.icon" class="h-6 w-6 text-red-400/80" />
                        </div>
                        <h3 class="text-lg font-semibold">
                            {{ $t(`landing.problem.${item.key}.title`) }}
                        </h3>
                        <p class="mt-3 text-sm leading-relaxed text-gray-500">
                            {{ $t(`landing.problem.${item.key}.desc`) }}
                        </p>
                    </div>
                </div>

                <div data-reveal class="mt-16 text-center">
                    <p
                        class="from-primary-400 to-primary-300 inline-block bg-linear-to-r bg-clip-text text-xl font-semibold text-transparent md:text-2xl"
                    >
                        {{ $t("landing.problem.transition") }}
                    </p>
                </div>
            </div>
        </section>

        <!-- ═══ Deep Dive: Sensor Monitoring ═══ -->
        <section
            id="monitoring"
            class="relative z-10 border-y border-white/[0.04] bg-white/[0.01] py-24 md:py-32"
        >
            <div class="mx-auto max-w-7xl px-6">
                <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                    <div data-reveal="left">
                        <p class="text-primary-400 text-sm font-semibold tracking-widest uppercase">
                            {{ $t("landing.monitoring.label") }}
                        </p>
                        <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                            {{ $t("landing.monitoring.title") }}
                        </h2>
                        <p class="mt-6 text-lg leading-relaxed text-gray-400">
                            {{ $t("landing.monitoring.desc") }}
                        </p>
                        <ul class="mt-8 space-y-4">
                            <li v-for="n in 4" :key="n" class="flex items-start gap-3">
                                <Icon
                                    name="lucide:check"
                                    class="text-primary-400 mt-0.5 h-4 w-4 shrink-0"
                                />
                                <span class="text-gray-300">{{
                                    $t(`landing.monitoring.point${n}`)
                                }}</span>
                            </li>
                        </ul>
                    </div>

                    <div data-reveal="right" class="relative">
                        <div
                            class="preview-card"
                            @mousemove="handleTiltMove"
                            @mouseleave="handleTiltLeave"
                        >
                            <div
                                class="flex items-center gap-2 border-b border-white/[0.04] bg-white/[0.02] px-4 py-3"
                            >
                                <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                                <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                                <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                                <span class="ml-3 text-xs text-gray-600">{{
                                    $t("landing.preview.sensorBar")
                                }}</span>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4">
                                    <div
                                        class="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                                    >
                                        <div class="flex items-center gap-3">
                                            <Icon
                                                name="lucide:thermometer"
                                                class="h-5 w-5 text-orange-400"
                                            />
                                            <span class="text-sm text-gray-300">{{
                                                $t("landing.preview.warmSide")
                                            }}</span>
                                        </div>
                                        <span class="text-lg font-bold text-emerald-400"
                                            >31.2°C</span
                                        >
                                    </div>
                                    <div
                                        class="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                                    >
                                        <div class="flex items-center gap-3">
                                            <Icon
                                                name="lucide:thermometer"
                                                class="h-5 w-5 text-blue-400"
                                            />
                                            <span class="text-sm text-gray-300">{{
                                                $t("landing.preview.coolSide")
                                            }}</span>
                                        </div>
                                        <span class="text-lg font-bold text-white">24.8°C</span>
                                    </div>
                                    <div
                                        class="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                                    >
                                        <div class="flex items-center gap-3">
                                            <Icon
                                                name="lucide:droplets"
                                                class="h-5 w-5 text-cyan-400"
                                            />
                                            <span class="text-sm text-gray-300">{{
                                                $t("landing.preview.humidity")
                                            }}</span>
                                        </div>
                                        <span class="text-lg font-bold text-white">52%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Deep Dive: Alerts ═══ -->
        <section id="alerts" class="relative z-10 py-24 md:py-32">
            <div class="mx-auto max-w-7xl px-6">
                <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                    <div data-reveal="right" class="order-2 lg:order-1">
                        <div
                            class="preview-card"
                            @mousemove="handleTiltMove"
                            @mouseleave="handleTiltLeave"
                        >
                            <div
                                class="flex items-center gap-2 border-b border-white/[0.04] bg-white/[0.02] px-4 py-3"
                            >
                                <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                                <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                                <div class="h-3 w-3 rounded-full bg-white/[0.08]" />
                                <span class="ml-3 text-xs text-gray-600">{{
                                    $t("landing.preview.alertsBar")
                                }}</span>
                            </div>
                            <div class="space-y-3 p-6">
                                <div
                                    class="flex items-center gap-3 rounded-xl border border-red-500/10 bg-red-500/[0.04] p-4"
                                >
                                    <Icon
                                        name="lucide:alert-triangle"
                                        class="h-5 w-5 shrink-0 text-red-400"
                                    />
                                    <div>
                                        <p class="text-sm font-medium text-red-300">
                                            {{ $t("landing.preview.temperature") }} &lt; 22°C
                                        </p>
                                        <p class="text-xs text-gray-500">Telegram → @keeper</p>
                                    </div>
                                </div>
                                <div
                                    class="flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-4"
                                >
                                    <Icon
                                        name="lucide:alert-circle"
                                        class="h-5 w-5 shrink-0 text-amber-400"
                                    />
                                    <div>
                                        <p class="text-sm font-medium text-amber-300">
                                            {{ $t("landing.preview.humidity") }} &gt; 70%
                                        </p>
                                        <p class="text-xs text-gray-500">Telegram → @keeper</p>
                                    </div>
                                </div>
                                <div
                                    class="flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4"
                                >
                                    <Icon
                                        name="lucide:check-circle"
                                        class="h-5 w-5 shrink-0 text-emerald-400"
                                    />
                                    <div>
                                        <p class="text-sm font-medium text-emerald-300">
                                            All sensors OK
                                        </p>
                                        <p class="text-xs text-gray-500">Last check: 2 min ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div data-reveal="left" class="order-1 lg:order-2">
                        <p class="text-primary-400 text-sm font-semibold tracking-widest uppercase">
                            {{ $t("landing.alertsDeep.label") }}
                        </p>
                        <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                            {{ $t("landing.alertsDeep.title") }}
                        </h2>
                        <p class="mt-6 text-lg leading-relaxed text-gray-400">
                            {{ $t("landing.alertsDeep.desc") }}
                        </p>
                        <ul class="mt-8 space-y-4">
                            <li v-for="n in 4" :key="n" class="flex items-start gap-3">
                                <Icon
                                    name="lucide:check"
                                    class="text-primary-400 mt-0.5 h-4 w-4 shrink-0"
                                />
                                <span class="text-gray-300">{{
                                    $t(`landing.alertsDeep.point${n}`)
                                }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Features Grid ═══ -->
        <section
            id="features"
            class="relative z-10 border-y border-white/[0.04] bg-white/[0.01] py-24 md:py-32"
        >
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

                <div class="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
                    <div
                        v-for="(feature, i) in featureItems"
                        :key="feature.key"
                        data-reveal
                        :data-reveal-delay="(i % 4) + 1"
                        class="card-base group p-8 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03]"
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
                        <p class="mt-3 text-sm leading-relaxed text-gray-500">
                            {{ $t(`landing.features.${feature.key}.desc`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Comparison ═══ -->
        <section class="relative z-10 py-24 md:py-32">
            <div class="mx-auto max-w-7xl px-6">
                <div data-reveal class="text-center">
                    <p class="text-primary-400 text-sm font-semibold tracking-widest uppercase">
                        {{ $t("landing.comparison.label") }}
                    </p>
                    <h2 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.comparison.title") }}
                    </h2>
                </div>

                <div class="mx-auto mt-16 max-w-4xl space-y-6">
                    <div
                        v-for="(item, i) in comparisonItems"
                        :key="item"
                        data-reveal
                        :data-reveal-delay="(i % 4) + 1"
                        class="grid grid-cols-1 gap-4 md:grid-cols-2"
                    >
                        <div class="card-base flex items-start gap-4 border-red-500/10 p-6">
                            <Icon name="lucide:x" class="mt-0.5 h-5 w-5 shrink-0 text-red-400/60" />
                            <div>
                                <p
                                    class="text-xs font-semibold tracking-wider text-red-400/60 uppercase"
                                >
                                    {{ $t("landing.comparison.without") }}
                                </p>
                                <p class="mt-2 text-sm leading-relaxed text-gray-400">
                                    {{ $t(`landing.comparison.${item}.bad`) }}
                                </p>
                            </div>
                        </div>
                        <div class="card-base flex items-start gap-4 border-emerald-500/10 p-6">
                            <Icon
                                name="lucide:check"
                                class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                            />
                            <div>
                                <p
                                    class="text-xs font-semibold tracking-wider text-emerald-400 uppercase"
                                >
                                    {{ $t("landing.comparison.with") }}
                                </p>
                                <p class="mt-2 text-sm leading-relaxed text-gray-300">
                                    {{ $t(`landing.comparison.${item}.good`) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ Social Proof ═══ -->
        <section class="relative z-10 border-y border-white/[0.04] py-16">
            <div class="mx-auto max-w-7xl px-6">
                <div data-reveal class="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
                    <div v-for="stat in socialStats" :key="stat.key">
                        <p class="text-primary-400 text-3xl font-bold">{{ stat.value }}</p>
                        <p class="mt-1 text-sm text-gray-500">
                            {{ $t(`landing.social.${stat.key}`) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ CTA ═══ -->
        <section class="relative z-10 py-24 md:py-32">
            <div class="mx-auto max-w-3xl px-6 text-center">
                <div data-reveal>
                    <h2 class="text-4xl font-bold tracking-tight md:text-5xl">
                        {{ $t("landing.cta.title") }}
                    </h2>
                    <p class="mt-6 text-lg text-gray-400">
                        {{ $t("landing.cta.subtitle") }}
                    </p>
                    <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <NuxtLink
                            to="/register"
                            class="group bg-primary-500 shadow-primary-500/20 hover:shadow-primary-500/30 relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-semibold text-white shadow-lg transition-all hover:brightness-110"
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
                                <a href="#monitoring" class="transition hover:text-white">{{
                                    $t("landing.nav.monitoring")
                                }}</a>
                            </li>
                            <li>
                                <a href="#alerts" class="transition hover:text-white">{{
                                    $t("landing.nav.alerts")
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
    { key: "connect", icon: "lucide:cable" },
    { key: "monitor", icon: "lucide:activity" },
    { key: "alert", icon: "lucide:bell-ring" },
];

const problemItems = [
    { key: "manual", icon: "lucide:thermometer" },
    { key: "blind", icon: "lucide:eye-off" },
    { key: "emergency", icon: "lucide:alert-triangle" },
];

const comparisonItems = ["manual", "blind", "care", "emergency"];

const featureItems = [
    {
        key: "sensors",
        icon: "lucide:cpu",
        bgClass: "bg-cyan-500/[0.08]",
        iconClass: "text-cyan-400",
    },
    {
        key: "alerts",
        icon: "lucide:bell-ring",
        bgClass: "bg-red-500/[0.08]",
        iconClass: "text-red-400",
    },
    {
        key: "careLog",
        icon: "lucide:book-open",
        bgClass: "bg-emerald-500/[0.08]",
        iconClass: "text-emerald-400",
    },
    {
        key: "dashboard",
        icon: "lucide:layout-dashboard",
        bgClass: "bg-primary-500/[0.08]",
        iconClass: "text-primary-400",
    },
];

const socialStats = [
    { key: "sensors", value: "500+" },
    { key: "enclosures", value: "200+" },
    { key: "alerts", value: "10K+" },
    { key: "uptime", value: "99.9%" },
];

const sensorTrend = [
    { h: "60%", c: "bg-emerald-500/40" },
    { h: "62%", c: "bg-emerald-500/40" },
    { h: "58%", c: "bg-emerald-500/40" },
    { h: "65%", c: "bg-emerald-500/40" },
    { h: "63%", c: "bg-emerald-500/40" },
    { h: "55%", c: "bg-amber-500/30" },
    { h: "60%", c: "bg-emerald-500/40" },
    { h: "62%", c: "bg-emerald-500/40" },
    { h: "48%", c: "bg-red-500/30" },
    { h: "52%", c: "bg-amber-500/30" },
    { h: "58%", c: "bg-emerald-500/40" },
    { h: "61%", c: "bg-emerald-500/40" },
    { h: "64%", c: "bg-emerald-500/40" },
    { h: "60%", c: "bg-emerald-500/40" },
    { h: "57%", c: "bg-emerald-500/40" },
    { h: "62%", c: "bg-emerald-500/40" },
    { h: "65%", c: "bg-emerald-500/40" },
    { h: "63%", c: "bg-emerald-500/40" },
];

// ── 3D Tilt ──────────────────────────────────────────────────
function handleTiltMove(e: MouseEvent) {
    if (window.innerWidth < 768) return;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -6;
    const tiltY = (x - 0.5) * 6;
    el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.01, 1.01, 1)`;
}

function handleTiltLeave(e: MouseEvent) {
    (e.currentTarget as HTMLElement).style.transform = "";
}

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
.dot-grid {
    background-image: radial-gradient(circle, rgb(255 255 255) 1px, transparent 1px);
    background-size: 24px 24px;
}

.noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
}

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

.preview-card {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    border: 1px solid rgb(255 255 255 / 0.06);
    background: rgb(255 255 255 / 0.02);
    box-shadow:
        0 0 0 1px rgb(255 255 255 / 0.02),
        0 20px 50px -12px rgb(0 0 0 / 0.4);
    transition: transform 0.2s ease-out;
    will-change: transform;
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

.sensor-bar {
    animation: barGrow 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    transform-origin: bottom;
}
@keyframes barGrow {
    from {
        transform: scaleY(0);
    }
    to {
        transform: scaleY(1);
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
    .sensor-bar {
        animation: none;
    }
}
</style>
