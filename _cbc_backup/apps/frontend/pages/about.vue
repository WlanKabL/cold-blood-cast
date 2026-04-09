<template>
    <PageContainer :title="$t('about.title')">
        <div class="mx-auto max-w-3xl space-y-12">
            <!-- Intro -->
            <div class="space-y-4">
                <h2 class="text-2xl font-bold text-emerald-400">{{ $t("about.mission_title") }}</h2>
                <p class="leading-relaxed text-fg-muted">{{ $t("about.mission_text") }}</p>
            </div>

            <!-- Features grid -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div class="rounded-xl border border-card-border bg-card-bg p-6">
                    <div
                        class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20"
                    >
                        <Icon name="lucide:thermometer" class="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 class="text-lg font-semibold text-fg">
                        {{ $t("about.monitoring_title") }}
                    </h3>
                    <p class="mt-2 text-sm text-fg-muted">{{ $t("about.monitoring_text") }}</p>
                </div>

                <div class="rounded-xl border border-card-border bg-card-bg p-6">
                    <div
                        class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20"
                    >
                        <Icon name="lucide:bell-ring" class="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 class="text-lg font-semibold text-fg">{{ $t("about.alerts_title") }}</h3>
                    <p class="mt-2 text-sm text-fg-muted">{{ $t("about.alerts_text") }}</p>
                </div>

                <div class="rounded-xl border border-card-border bg-card-bg p-6">
                    <div
                        class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20"
                    >
                        <Icon name="lucide:line-chart" class="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 class="text-lg font-semibold text-fg">{{ $t("about.journal_title") }}</h3>
                    <p class="mt-2 text-sm text-fg-muted">{{ $t("about.journal_text") }}</p>
                </div>

                <div class="rounded-xl border border-card-border bg-card-bg p-6">
                    <div
                        class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20"
                    >
                        <Icon name="lucide:code" class="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 class="text-lg font-semibold text-fg">{{ $t("about.tech_title") }}</h3>
                    <p class="mt-2 text-sm text-fg-muted">{{ $t("about.tech_text") }}</p>
                </div>
            </div>

            <!-- Vision -->
            <div class="space-y-4">
                <h2 class="text-2xl font-bold text-emerald-400">{{ $t("about.vision_title") }}</h2>
                <p class="leading-relaxed text-fg-muted">{{ $t("about.vision_text") }}</p>
            </div>

            <!-- CTA -->
            <div class="flex gap-4">
                <NuxtLink
                    to="/register"
                    class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                    {{ $t("landing.cta_primary") }}
                    <Icon name="lucide:arrow-right" class="h-4 w-4" />
                </NuxtLink>
                <NuxtLink
                    to="/contact"
                    class="inline-flex items-center gap-2 rounded-lg border border-line px-6 py-3 text-sm font-medium text-fg-muted transition hover:border-line hover:text-fg"
                >
                    {{ $t("nav.contact") }}
                </NuxtLink>
            </div>
        </div>
    </PageContainer>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

useSeoMeta({
    title: "About – Cold Blood Cast",
});
</script>
