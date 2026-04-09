<template>
    <div class="bg-base flex min-h-dvh items-center justify-center px-4">
        <div class="border-line bg-surface w-full max-w-md rounded-2xl border p-8">
            <div class="mb-8 text-center">
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("verifyEmail.title") }}
                </h1>
                <p class="text-fg-muted mt-2 text-sm">
                    {{ $t("verifyEmail.description") }}
                </p>
            </div>

            <!-- Success -->
            <div v-if="verified" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <UIcon name="i-lucide-check-circle-2" class="h-7 w-7 text-green-400" />
                </div>
                <p class="mb-2 text-sm font-medium text-green-400">
                    {{ $t("verifyEmail.success") }}
                </p>
                <UButton to="/dashboard" block class="mt-6">
                    {{ $t("verifyEmail.goToDashboard") }}
                </UButton>
            </div>

            <!-- Form -->
            <form v-else class="space-y-5" @submit.prevent="handleVerify">
                <UFormField :label="$t('verifyEmail.codeLabel')">
                    <UInput
                        v-model="code"
                        type="text"
                        inputmode="numeric"
                        maxlength="6"
                        required
                        :disabled="submitting"
                        :placeholder="$t('verifyEmail.codePlaceholder')"
                        class="w-full text-center text-2xl tracking-[0.5em]"
                    />
                </UFormField>

                <p v-if="error" class="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {{ error }}
                </p>

                <UButton type="submit" block :loading="submitting" :disabled="code.length !== 6">
                    {{ $t("verifyEmail.submit") }}
                </UButton>

                <div class="text-center">
                    <UButton
                        variant="ghost"
                        :loading="resending"
                        :disabled="resendCooldown > 0"
                        @click="handleResend"
                    >
                        {{
                            resendCooldown > 0
                                ? $t("verifyEmail.resendIn", { seconds: resendCooldown })
                                : $t("verifyEmail.resend")
                        }}
                    </UButton>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();
useHead({ title: () => t("verifyEmail.title") });

const http = useHttp();

const code = ref("");
const error = ref<string | null>(null);
const submitting = ref(false);
const verified = ref(false);
const resending = ref(false);
const resendCooldown = ref(0);

let cooldownTimer: ReturnType<typeof setInterval> | null = null;

function startCooldown() {
    resendCooldown.value = 60;
    cooldownTimer = setInterval(() => {
        resendCooldown.value--;
        if (resendCooldown.value <= 0 && cooldownTimer) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
        }
    }, 1000);
}

async function handleVerify() {
    error.value = null;
    submitting.value = true;
    try {
        await http.post("/api/auth/verify-email", { code: code.value });
        verified.value = true;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("verifyEmail.error");
    } finally {
        submitting.value = false;
    }
}

async function handleResend() {
    resending.value = true;
    try {
        await http.post("/api/auth/resend-verification");
        startCooldown();
    } catch {
        // silently ignore
    } finally {
        resending.value = false;
    }
}

onUnmounted(() => {
    if (cooldownTimer) clearInterval(cooldownTimer);
});
</script>
