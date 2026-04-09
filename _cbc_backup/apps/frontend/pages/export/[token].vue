<template>
    <div class="bg-base flex min-h-dvh items-center justify-center px-4">
        <div class="border-line bg-surface w-full max-w-md rounded-2xl border p-8">
            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-12">
                <UIcon name="i-lucide-loader-2" class="text-fg-muted h-8 w-8 animate-spin" />
            </div>

            <!-- Error -->
            <div v-else-if="error" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10"
                >
                    <UIcon name="i-lucide-alert-triangle" class="h-7 w-7 text-red-400" />
                </div>
                <p class="text-fg-muted mb-6 text-sm">{{ error }}</p>
                <UButton to="/" block variant="outline">
                    {{ $t("common.goHome") }}
                </UButton>
            </div>

            <!-- Download ready -->
            <div v-else class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <UIcon name="i-lucide-download" class="h-7 w-7 text-green-400" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">{{ $t("dataExport.title") }}</h1>
                <p class="text-fg-muted mb-6 text-sm">{{ $t("dataExport.description") }}</p>
                <UButton block icon="i-lucide-download" @click="downloadExport">
                    {{ $t("dataExport.download") }}
                </UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();
useHead({ title: () => t("dataExport.title") });

const route = useRoute();
const http = useHttp();

const token = computed(() => route.params.token as string);
const loading = ref(true);
const error = ref<string | null>(null);
const exportData = ref<{ filePath: string; status: string } | null>(null);

async function loadExport() {
    try {
        const { data } = await http.get(`/api/gdpr/export/${token.value}`);
        exportData.value = data;
    } catch {
        error.value = t("dataExport.notFound");
    } finally {
        loading.value = false;
    }
}

async function downloadExport() {
    try {
        const response = await http.get(`/api/gdpr/export/${token.value}/download`, {
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.download = `data-export-${token.value}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
    } catch {
        error.value = t("dataExport.downloadError");
    }
}

onMounted(loadExport);
</script>
