<template>
    <div class="bg-base flex min-h-dvh items-center justify-center px-4">
        <div class="border-line bg-surface w-full max-w-md rounded-2xl border p-8">
            <div class="mb-8 text-center">
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("unsubscribe.title") }}
                </h1>
                <p class="text-fg-muted mt-2 text-sm">
                    {{ $t("unsubscribe.description") }}
                </p>
            </div>

            <!-- Done -->
            <div v-if="done" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <UIcon name="i-lucide-check-circle-2" class="h-7 w-7 text-green-400" />
                </div>
                <p class="mb-6 text-sm font-medium text-green-400">
                    {{ $t("unsubscribe.success") }}
                </p>
                <UButton to="/" block variant="outline">
                    {{ $t("unsubscribe.goHome") }}
                </UButton>
            </div>

            <!-- Confirm -->
            <div v-else class="space-y-5 text-center">
                <p v-if="error" class="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {{ error }}
                </p>
                <UButton block :loading="submitting" @click="handleUnsubscribe">
                    {{ $t("unsubscribe.confirm") }}
                </UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();
useHead({ title: () => t("unsubscribe.title") });

const route = useRoute();
const http = useHttp();

const token = computed(() => (route.query.token as string) || "");
const error = ref<string | null>(null);
const submitting = ref(false);
const done = ref(false);

async function handleUnsubscribe() {
    error.value = null;
    submitting.value = true;
    try {
        await http.post("/api/auth/unsubscribe", { token: token.value });
        done.value = true;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("unsubscribe.error");
    } finally {
        submitting.value = false;
    }
}
</script>
