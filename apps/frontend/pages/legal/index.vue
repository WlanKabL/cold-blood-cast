<template>
    <div class="min-h-dvh bg-[#09090b] text-white">
        <!-- Nav -->
        <nav class="border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-xl">
            <div class="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
                <NuxtLink to="/" class="flex items-center gap-2">
                    <img src="/cbc.png" alt="KeeperLog" class="h-7 w-7 rounded-lg" />
                    <span class="text-sm font-bold">KeeperLog</span>
                </NuxtLink>
                <NuxtLink to="/" class="text-[13px] text-gray-400 transition hover:text-white">
                    {{ $t("legal.backToHome") }}
                </NuxtLink>
            </div>
        </nav>

        <!-- Content -->
        <main class="mx-auto max-w-4xl px-6 py-12">
            <h1 class="text-2xl font-bold tracking-tight">{{ $t("legal.title") }}</h1>
            <p class="mt-2 text-sm text-gray-400">{{ $t("legal.subtitle") }}</p>

            <div v-if="loading" class="mt-8 space-y-3">
                <div
                    v-for="i in 5"
                    :key="i"
                    class="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
                >
                    <UiSkeleton width="200" height="14" />
                    <UiSkeleton width="16" height="16" />
                </div>
            </div>

            <div v-else-if="!links?.length" class="py-16 text-center text-sm text-gray-500">
                {{ $t("legal.noDocuments") }}
            </div>

            <div v-else class="mt-8 space-y-3">
                <NuxtLink
                    v-for="link in links"
                    :key="link.key"
                    :to="`/legal/${link.key}`"
                    class="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                    <span class="text-[14px] font-medium text-gray-200 group-hover:text-white">
                        {{ isGerman ? link.titleDe : link.title }}
                    </span>
                    <Icon
                        name="lucide:chevron-right"
                        class="h-4 w-4 text-gray-600 transition group-hover:text-gray-400"
                    />
                </NuxtLink>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import type { LegalDocumentLink } from "~/types/api";

definePageMeta({ layout: false });

const { locale, t } = useI18n();
const api = useApi();

useHead({ title: () => `${t("legal.title")} — KeeperLog` });

const { data: links, isLoading: loading } = useQuery({
    queryKey: ["legal-links"],
    queryFn: () => api.get<LegalDocumentLink[]>("/api/legal"),
});

const isGerman = computed(() => locale.value === "de" || locale.value === "de-DE");
</script>
