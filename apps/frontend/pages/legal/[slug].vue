<template>
    <div class="min-h-dvh bg-[#09090b] text-white">
        <!-- Nav -->
        <nav class="border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-xl">
            <div class="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
                <NuxtLink to="/" class="flex items-center gap-2">
                    <img src="/cbc.png" alt="KeeperLog" class="h-7 w-7 rounded-lg" />
                    <span class="text-sm font-bold">KeeperLog</span>
                </NuxtLink>
                <NuxtLink to="/legal" class="text-[13px] text-gray-400 transition hover:text-white">
                    {{ $t("legal.allDocuments") }}
                </NuxtLink>
            </div>
        </nav>

        <!-- Content -->
        <main class="mx-auto max-w-4xl px-6 py-12">
            <div v-if="loading" class="space-y-6">
                <div class="space-y-2">
                    <UiSkeleton width="80" height="12" />
                    <UiSkeleton width="300" height="28" />
                    <UiSkeleton width="140" height="12" />
                </div>
                <div class="space-y-3">
                    <UiSkeleton height="14" />
                    <UiSkeleton height="14" />
                    <UiSkeleton width="80%" height="14" />
                    <UiSkeleton height="14" />
                    <UiSkeleton width="60%" height="14" />
                </div>
            </div>

            <div v-else-if="error" class="py-16 text-center">
                <Icon name="lucide:file-x" class="mx-auto h-12 w-12 text-gray-600" />
                <p class="mt-4 text-sm text-gray-400">{{ $t("legal.notFound") }}</p>
                <NuxtLink
                    to="/legal"
                    class="text-primary-400 mt-4 inline-block text-sm hover:underline"
                >
                    {{ $t("legal.allDocuments") }}
                </NuxtLink>
            </div>

            <template v-else-if="legalDoc">
                <div class="mb-8">
                    <NuxtLink
                        to="/legal"
                        class="mb-4 inline-flex items-center gap-1 text-[12px] text-gray-500 transition hover:text-gray-300"
                    >
                        <Icon name="lucide:arrow-left" class="h-3.5 w-3.5" />
                        {{ $t("legal.allDocuments") }}
                    </NuxtLink>
                    <h1 class="text-2xl font-bold tracking-tight">{{ legalDoc.title }}</h1>
                    <p class="mt-1 text-[12px] text-gray-500">
                        {{ $t("legal.lastUpdated") }}:
                        {{ new Date(legalDoc.updatedAt).toLocaleDateString() }}
                    </p>
                </div>

                <!-- Impressum Structured Data -->
                <div
                    v-if="slug === 'impressum' && impressumMeta"
                    class="mb-8 space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                    <div v-if="impressumMeta.companyName" class="space-y-1">
                        <p class="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                            {{ $t("legal.impressum.provider") }}
                        </p>
                        <p class="text-[14px] text-gray-200">{{ impressumMeta.companyName }}</p>
                        <p v-if="impressumMeta.legalForm" class="text-[13px] text-gray-400">
                            {{ impressumMeta.legalForm }}
                        </p>
                    </div>
                    <div v-if="impressumMeta.ownerName" class="space-y-1">
                        <p class="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                            {{ $t("legal.impressum.represented") }}
                        </p>
                        <p class="text-[14px] text-gray-200">{{ impressumMeta.ownerName }}</p>
                    </div>
                    <div v-if="impressumMeta.street" class="space-y-1">
                        <p class="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                            {{ $t("legal.impressum.address") }}
                        </p>
                        <p class="text-[14px] text-gray-200">
                            {{ impressumMeta.street }}<br />
                            {{ impressumMeta.zip }} {{ impressumMeta.city }}<br />
                            {{ impressumMeta.country }}
                        </p>
                    </div>
                    <div v-if="impressumMeta.email" class="space-y-1">
                        <p class="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                            {{ $t("legal.impressum.contact") }}
                        </p>
                        <p class="text-[14px] text-gray-200">{{ impressumMeta.email }}</p>
                        <p v-if="impressumMeta.phone" class="text-[13px] text-gray-400">
                            {{ impressumMeta.phone }}
                        </p>
                    </div>
                    <div
                        v-if="impressumMeta.registerCourt || impressumMeta.registerNumber"
                        class="space-y-1"
                    >
                        <p class="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                            {{ $t("legal.impressum.register") }}
                        </p>
                        <p class="text-[14px] text-gray-200">
                            {{
                                [impressumMeta.registerCourt, impressumMeta.registerNumber]
                                    .filter(Boolean)
                                    .join(", ")
                            }}
                        </p>
                    </div>
                    <div v-if="impressumMeta.vatId" class="space-y-1">
                        <p class="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                            {{ $t("legal.impressum.vatId") }}
                        </p>
                        <p class="text-[14px] text-gray-200">{{ impressumMeta.vatId }}</p>
                    </div>
                </div>

                <!-- Markdown Content -->
                <div v-if="renderedContent" class="legal-prose" v-html="renderedContent" />
            </template>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { ImpressumMetadata } from "~/types/api";

definePageMeta({ layout: false });

const route = useRoute();
const { locale } = useI18n();
const api = useApi();

const slug = computed(() => route.params.slug as string);
const localeStr = computed(() => (locale.value === "de" || locale.value === "de-DE" ? "de" : "en"));

const {
    data: legalDoc,
    isLoading: loading,
    isError: error,
} = useQuery({
    queryKey: computed(() => ["legal-doc", slug.value, localeStr.value]),
    queryFn: () =>
        api.get<{
            key: string;
            title: string;
            content: string;
            metadata: ImpressumMetadata | null;
            updatedAt: string;
        }>(`/api/legal/${slug.value}?locale=${localeStr.value}`),
});

useHead({
    title: () => (legalDoc.value ? `${legalDoc.value.title} — KeeperLog` : "Legal — KeeperLog"),
});

const impressumMeta = computed(() => {
    if (slug.value !== "impressum" || !legalDoc.value?.metadata) return null;
    return legalDoc.value.metadata;
});

const renderedContent = computed(() => {
    if (!legalDoc.value?.content) return "";
    const raw = marked.parse(legalDoc.value.content, { async: false }) as string;
    return DOMPurify.sanitize(raw);
});
</script>

<style>
@reference "~/assets/tailwind.css";

.legal-prose {
    @apply text-[14px] leading-relaxed text-gray-300;
}

.legal-prose h1 {
    @apply mt-8 mb-4 text-xl font-bold text-white;
}

.legal-prose h2 {
    @apply mt-6 mb-3 text-lg font-semibold text-white;
}

.legal-prose h3 {
    @apply mt-4 mb-2 text-[15px] font-semibold text-gray-200;
}

.legal-prose p {
    @apply mb-3;
}

.legal-prose ul {
    @apply mb-4 ml-6 list-disc space-y-1;
}

.legal-prose ol {
    @apply mb-4 ml-6 list-decimal space-y-1;
}

.legal-prose a {
    @apply text-primary-400 hover:text-primary-300 underline;
}

.legal-prose strong {
    @apply font-semibold text-gray-200;
}

.legal-prose blockquote {
    @apply my-4 border-l-2 border-gray-600 pl-4 text-gray-400 italic;
}

.legal-prose hr {
    @apply my-6 border-white/[0.06];
}

.legal-prose table {
    @apply my-4 w-full border-collapse text-[13px];
}

.legal-prose th {
    @apply border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-left font-medium text-gray-200;
}

.legal-prose td {
    @apply border border-white/[0.06] px-3 py-2 text-gray-400;
}
</style>
