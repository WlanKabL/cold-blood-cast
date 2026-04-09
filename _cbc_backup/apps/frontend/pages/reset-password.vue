<template>
    <div class="bg-base flex min-h-dvh items-center justify-center px-4">
        <div class="border-line bg-surface w-full max-w-md rounded-2xl border p-8">
            <div class="mb-8 text-center">
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("resetPassword.title") }}
                </h1>
                <p class="text-fg-muted mt-2 text-sm">
                    {{ $t("resetPassword.description") }}
                </p>
            </div>

            <!-- No Token -->
            <div v-if="!token" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10"
                >
                    <UIcon name="i-lucide-alert-triangle" class="h-7 w-7 text-red-400" />
                </div>
                <p class="text-fg-muted mb-6 text-sm">{{ $t("resetPassword.invalidToken") }}</p>
                <UButton to="/forgot-password" block>
                    {{ $t("resetPassword.requestNew") }}
                </UButton>
            </div>

            <!-- Success -->
            <div v-else-if="success" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <UIcon name="i-lucide-check-circle-2" class="h-7 w-7 text-green-400" />
                </div>
                <p class="mb-2 text-sm font-medium text-green-400">
                    {{ $t("resetPassword.success") }}
                </p>
                <UButton to="/login" block class="mt-6">
                    {{ $t("resetPassword.goToLogin") }}
                </UButton>
            </div>

            <!-- Form -->
            <form v-else class="space-y-5" @submit.prevent="handleReset">
                <UFormField :label="$t('resetPassword.newPassword')">
                    <UInput
                        v-model="password"
                        type="password"
                        autocomplete="new-password"
                        required
                        :disabled="submitting"
                        class="w-full"
                    />
                    <div class="mt-2 grid grid-cols-2 gap-1">
                        <div
                            v-for="rule in passwordRules"
                            :key="rule.label"
                            class="flex items-center gap-1.5 text-xs"
                            :class="rule.met ? 'text-green-400' : 'text-fg-faint'"
                        >
                            <UIcon
                                :name="rule.met ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                                class="h-3 w-3 shrink-0"
                            />
                            {{ rule.label }}
                        </div>
                    </div>
                </UFormField>

                <UFormField :label="$t('resetPassword.confirmPassword')">
                    <UInput
                        v-model="confirmPassword"
                        type="password"
                        autocomplete="new-password"
                        required
                        :disabled="submitting"
                        class="w-full"
                    />
                </UFormField>

                <p v-if="error" class="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {{ error }}
                </p>

                <UButton
                    type="submit"
                    block
                    :loading="submitting"
                    :disabled="!allMet || password !== confirmPassword"
                >
                    {{ $t("resetPassword.submit") }}
                </UButton>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();
useHead({ title: () => t("resetPassword.title") });

const route = useRoute();
const http = useHttp();
const { passwordRules, allMet } = usePasswordRules();

const token = computed(() => (route.query.token as string) || "");
const password = ref("");
const confirmPassword = ref("");
const error = ref<string | null>(null);
const submitting = ref(false);
const success = ref(false);

watch(password, (val) => {
    for (const rule of passwordRules.value) {
        rule.met = rule.test(val);
    }
});

async function handleReset() {
    if (password.value !== confirmPassword.value) {
        error.value = t("resetPassword.mismatch");
        return;
    }
    error.value = null;
    submitting.value = true;
    try {
        await http.post("/api/auth/reset-password", {
            token: token.value,
            password: password.value,
        });
        success.value = true;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("resetPassword.error");
    } finally {
        submitting.value = false;
    }
}
</script>
