<template>
    <div class="bg-bg flex min-h-dvh items-center justify-center px-4">
        <LayoutGuestControls />
        <div class="w-full max-w-md">
            <!-- No Token -->
            <div v-if="!token" class="glass-card p-8 text-center">
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10"
                >
                    <Icon name="lucide:alert-circle" class="h-8 w-8 text-red-400" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">
                    {{ $t("pages.export.invalidLink") }}
                </h1>
                <p class="text-fg-muted mb-6 text-[14px]">
                    {{ $t("pages.export.invalidLinkMessage") }}
                </p>
                <NuxtLink
                    to="/login"
                    class="bg-brand hover:bg-brand/90 inline-flex items-center rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-all"
                >
                    <Icon name="lucide:log-in" class="mr-2 h-4 w-4" />
                    {{ $t("pages.export.goToLogin") }}
                </NuxtLink>
            </div>

            <!-- Downloading -->
            <div v-else-if="downloading" class="glass-card p-8 text-center">
                <div
                    class="bg-brand/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                >
                    <Icon name="lucide:loader-2" class="text-brand h-8 w-8 animate-spin" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">
                    {{ $t("pages.export.downloading") }}
                </h1>
                <p class="text-fg-muted text-[14px]">
                    {{ $t("pages.export.downloadingMessage") }}
                </p>
            </div>

            <!-- Success -->
            <div v-else-if="success" class="glass-card p-8 text-center">
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
                >
                    <Icon name="lucide:check-circle" class="h-8 w-8 text-green-400" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">
                    {{ $t("pages.export.successTitle") }}
                </h1>
                <p class="text-fg-muted mb-6 text-[14px]">
                    {{ $t("pages.export.successMessage") }}
                </p>
                <NuxtLink
                    to="/settings"
                    class="bg-brand hover:bg-brand/90 inline-flex items-center rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-all"
                >
                    <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
                    {{ $t("pages.export.backToSettings") }}
                </NuxtLink>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="glass-card p-8 text-center">
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10"
                >
                    <Icon name="lucide:alert-circle" class="h-8 w-8 text-red-400" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">
                    {{ $t("pages.export.errorTitle") }}
                </h1>
                <p class="text-fg-muted mb-6 text-[14px]">
                    {{ error }}
                </p>
                <NuxtLink
                    to="/settings"
                    class="bg-brand hover:bg-brand/90 inline-flex items-center rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-all"
                >
                    <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
                    {{ $t("pages.export.backToSettings") }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();

useHead({ title: () => t("pages.export.title") });

definePageMeta({ layout: false });

const token = computed(() => route.params.token as string);
const downloading = ref(false);
const success = ref(false);
const error = ref("");

async function startDownload() {
    if (!token.value) return;

    downloading.value = true;
    error.value = "";

    try {
        const apiBase = config.public.apiBaseURL as string;
        const response = await fetch(`${apiBase}/api/data-export/download/${token.value}`);

        if (!response.ok) {
            const body = await response.json().catch(() => null);
            const message = body?.error?.message ?? t("pages.export.downloadFailed");
            error.value = message;
            downloading.value = false;
            return;
        }

        const blob = await response.blob();
        const contentType = response.headers.get("Content-Type") ?? "";
        const contentDisposition = response.headers.get("Content-Disposition");
        const serverName = contentDisposition?.match(/filename="(.+)"/)?.[1];
        const isZip = contentType.includes("zip") || serverName?.endsWith(".zip");
        const ext = isZip ? "zip" : "json";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cbc-export-${new Date().toISOString().slice(0, 10)}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        success.value = true;
    } catch {
        error.value = t("pages.export.downloadFailed");
    } finally {
        downloading.value = false;
    }
}

onMounted(() => {
    if (token.value) {
        startDownload();
    }
});
</script>
