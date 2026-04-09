<template>
    <div class="min-h-dvh bg-base">
        <div class="mx-auto max-w-3xl px-6 py-16">
            <NuxtLink
                to="/legal"
                class="mb-8 inline-flex items-center gap-1 text-sm text-fg-muted transition hover:text-fg"
            >
                <Icon name="lucide:arrow-left" class="h-4 w-4" />
                {{ $t("common.back") }}
            </NuxtLink>

            <template v-if="document">
                <h1 class="mb-2 text-3xl font-bold text-fg">{{ localizedTitle }}</h1>
                <p class="mb-8 text-sm text-fg-muted">
                    {{ $t("legal.last_updated") }}: {{ formatDate(document.updatedAt) }}
                </p>
                <div
                    class="prose prose-invert max-w-none text-fg-muted"
                    v-html="sanitizedContent"
                />
            </template>

            <div v-else class="py-24 text-center">
                <p class="text-fg-muted">{{ $t("common.loading") }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import DOMPurify from "dompurify";

definePageMeta({ layout: false });

const route = useRoute();
const { locale } = useI18n();
const http = useHttp();

const key = computed(() => route.params.key as string);

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

const document = ref<LegalDocument | null>(null);

const localizedTitle = computed(() => {
    if (!document.value) return "";
    if (locale.value === "de" && document.value.titleDe) return document.value.titleDe;
    return document.value.title;
});

const sanitizedContent = computed(() => {
    if (!document.value) return "";
    const raw =
        locale.value === "de" && document.value.contentDe
            ? document.value.contentDe
            : document.value.content;
    return DOMPurify.sanitize(raw);
});

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
}

useSeoMeta({ title: () => `${localizedTitle.value} — Cold Blood Cast` });

async function loadDocument() {
    try {
        const { data } = await http.get<LegalDocument>(`/api/legal/${key.value}`);
        document.value = data;
    } catch {
        document.value = null;
    }
}

onMounted(() => loadDocument());
</script>
