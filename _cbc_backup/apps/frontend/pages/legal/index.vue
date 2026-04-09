<template>
    <div class="min-h-dvh bg-base">
        <div class="mx-auto max-w-3xl px-6 py-16">
            <NuxtLink
                to="/"
                class="mb-8 inline-flex items-center gap-1 text-sm text-fg-muted transition hover:text-fg"
            >
                <Icon name="lucide:arrow-left" class="h-4 w-4" />
                {{ $t("common.back") }}
            </NuxtLink>

            <h1 class="mb-8 text-3xl font-bold text-fg">{{ $t("legal.title") }}</h1>

            <div class="space-y-4">
                <NuxtLink
                    v-for="doc in documents"
                    :key="doc.key"
                    :to="`/legal/${doc.key}`"
                    class="flex items-center justify-between rounded-xl border border-card-border bg-card-bg p-5 transition hover:border-emerald-500/30 hover:bg-hover"
                >
                    <div>
                        <h2 class="font-semibold text-fg">{{ getLocalizedTitle(doc) }}</h2>
                        <p v-if="doc.updatedAt" class="mt-1 text-xs text-fg-muted">
                            {{ $t("legal.last_updated") }}: {{ formatDate(doc.updatedAt) }}
                        </p>
                    </div>
                    <Icon name="lucide:chevron-right" class="h-5 w-5 text-fg-soft" />
                </NuxtLink>

                <p v-if="documents.length === 0" class="py-12 text-center text-fg-muted">
                    {{ $t("common.no_data") }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { locale } = useI18n();
const http = useHttp();

useSeoMeta({ title: "Legal — Cold Blood Cast" });

interface LegalDocument {
    id: string;
    key: string;
    title: string;
    titleDe: string | null;
    content: string;
    contentDe: string | null;
    isPublished: boolean;
    updatedAt: string;
}

const documents = ref<LegalDocument[]>([]);

function getLocalizedTitle(doc: LegalDocument): string {
    if (locale.value === "de" && doc.titleDe) return doc.titleDe;
    return doc.title;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
}

async function loadDocuments() {
    try {
        const { data } = await http.get<LegalDocument[]>("/api/legal");
        documents.value = data;
    } catch {
        documents.value = [];
    }
}

onMounted(() => loadDocuments());
</script>
