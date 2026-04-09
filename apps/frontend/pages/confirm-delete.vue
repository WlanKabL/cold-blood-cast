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
                    {{ $t("pages.confirmDelete.invalidLink") }}
                </h1>
                <p class="text-fg-muted mb-6 text-[14px]">
                    {{ $t("pages.confirmDelete.invalidLinkMessage") }}
                </p>
                <NuxtLink
                    to="/login"
                    class="bg-accent hover:bg-accent/90 inline-flex items-center rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-all"
                >
                    <Icon name="lucide:log-in" class="mr-2 h-4 w-4" />
                    {{ $t("pages.confirmDelete.goToLogin") }}
                </NuxtLink>
            </div>

            <!-- Confirm Form -->
            <div v-else-if="!deleted" class="glass-card border border-red-500/20 p-8">
                <div class="mb-6 text-center">
                    <div
                        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10"
                    >
                        <Icon name="lucide:trash-2" class="h-8 w-8 text-red-400" />
                    </div>
                    <h1 class="text-fg mb-2 text-xl font-bold">
                        {{ $t("pages.confirmDelete.title") }}
                    </h1>
                    <p class="text-fg-muted text-[14px]">
                        {{ $t("pages.confirmDelete.message") }}
                    </p>
                </div>

                <form class="space-y-4" @submit.prevent="confirmDeletion">
                    <div>
                        <label class="text-fg mb-1.5 block text-[13px] font-medium">
                            {{ $t("pages.confirmDelete.passwordLabel") }}
                        </label>
                        <input
                            v-model="password"
                            type="password"
                            required
                            autocomplete="current-password"
                            :placeholder="$t('pages.confirmDelete.passwordPlaceholder')"
                            class="border-line bg-surface text-fg w-full rounded-xl border px-4 py-2.5 text-[13px] transition-colors outline-none focus:border-red-500/50"
                        />
                    </div>

                    <p v-if="error" class="text-[12px] text-red-500">
                        <Icon name="lucide:alert-circle" class="mr-1 inline h-3.5 w-3.5" />
                        {{ error }}
                    </p>

                    <button
                        type="submit"
                        :disabled="loading || !password"
                        class="w-full rounded-xl bg-red-500 px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-red-600 disabled:opacity-50"
                    >
                        <Icon
                            v-if="loading"
                            name="lucide:loader-2"
                            class="mr-1.5 inline h-4 w-4 animate-spin"
                        />
                        <Icon v-else name="lucide:trash-2" class="mr-1.5 inline h-4 w-4" />
                        {{ $t("pages.confirmDelete.confirm") }}
                    </button>

                    <NuxtLink
                        to="/"
                        class="text-fg-muted hover:text-fg block text-center text-[12px]"
                    >
                        {{ $t("pages.confirmDelete.cancel") }}
                    </NuxtLink>
                </form>
            </div>

            <!-- Success -->
            <div v-else class="glass-card p-8 text-center">
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
                >
                    <Icon name="lucide:check-circle" class="h-8 w-8 text-green-400" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">
                    {{ $t("pages.confirmDelete.successTitle") }}
                </h1>
                <p class="text-fg-muted mb-6 text-[14px]">
                    {{ $t("pages.confirmDelete.successMessage") }}
                </p>
                <NuxtLink
                    to="/"
                    class="bg-accent hover:bg-accent/90 inline-flex items-center rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-all"
                >
                    {{ $t("pages.confirmDelete.goHome") }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
const api = useApi();
const authStore = useAuthStore();

useHead({ title: () => t("pages.confirmDelete.title") });

definePageMeta({ layout: false });

const token = computed(() => route.query.token as string | undefined);
const password = ref("");
const loading = ref(false);
const error = ref("");
const deleted = ref(false);

async function confirmDeletion() {
    if (!token.value || !password.value) return;

    loading.value = true;
    error.value = "";

    try {
        await api.post("/api/auth/confirm-account-deletion", {
            token: token.value,
            password: password.value,
        });
        deleted.value = true;
        authStore.clear();
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : String(err);
    } finally {
        loading.value = false;
    }
}
</script>
