<template>
    <div class="bg-base flex min-h-dvh items-center justify-center px-4">
        <div class="border-line bg-surface w-full max-w-md rounded-2xl border p-8">
            <div class="mb-8 text-center">
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("confirmDelete.title") }}
                </h1>
                <p class="text-fg-muted mt-2 text-sm">
                    {{ $t("confirmDelete.description") }}
                </p>
            </div>

            <!-- No Token -->
            <div v-if="!token" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10"
                >
                    <UIcon name="i-lucide-alert-triangle" class="h-7 w-7 text-red-400" />
                </div>
                <p class="text-fg-muted mb-6 text-sm">{{ $t("confirmDelete.invalidToken") }}</p>
                <UButton to="/" block variant="outline">
                    {{ $t("confirmDelete.goHome") }}
                </UButton>
            </div>

            <!-- Deleted -->
            <div v-else-if="deleted" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <UIcon name="i-lucide-check-circle-2" class="h-7 w-7 text-green-400" />
                </div>
                <p class="mb-2 text-sm font-medium text-green-400">
                    {{ $t("confirmDelete.success") }}
                </p>
                <UButton to="/" block variant="outline" class="mt-6">
                    {{ $t("confirmDelete.goHome") }}
                </UButton>
            </div>

            <!-- Confirmation -->
            <div v-else class="space-y-5 text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10"
                >
                    <UIcon name="i-lucide-trash-2" class="h-7 w-7 text-red-400" />
                </div>
                <p class="text-fg-muted text-sm">
                    {{ $t("confirmDelete.warning") }}
                </p>

                <p v-if="error" class="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {{ error }}
                </p>

                <UButton color="red" block :loading="submitting" @click="handleConfirm">
                    {{ $t("confirmDelete.confirm") }}
                </UButton>
                <UButton to="/" block variant="outline">
                    {{ $t("confirmDelete.cancel") }}
                </UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();
useHead({ title: () => t("confirmDelete.title") });

const route = useRoute();
const http = useHttp();

const token = computed(() => (route.query.token as string) || "");
const error = ref<string | null>(null);
const submitting = ref(false);
const deleted = ref(false);

async function handleConfirm() {
    error.value = null;
    submitting.value = true;
    try {
        await http.post("/api/auth/confirm-account-deletion", { token: token.value });
        deleted.value = true;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("confirmDelete.error");
    } finally {
        submitting.value = false;
    }
}
</script>
