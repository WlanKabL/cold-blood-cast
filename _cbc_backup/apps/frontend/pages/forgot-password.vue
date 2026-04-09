<template>
    <div class="bg-base flex min-h-dvh items-center justify-center px-4">
        <div class="border-line bg-surface w-full max-w-md rounded-2xl border p-8">
            <div class="mb-8 text-center">
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("forgotPassword.title") }}
                </h1>
                <p class="text-fg-muted mt-2 text-sm">
                    {{ $t("forgotPassword.description") }}
                </p>
            </div>

            <!-- Success -->
            <div v-if="sent" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <UIcon name="i-lucide-mail-check" class="h-7 w-7 text-green-400" />
                </div>
                <p class="mb-2 text-sm font-medium text-green-400">
                    {{ $t("forgotPassword.success") }}
                </p>
                <p class="text-fg-muted mb-6 text-sm">
                    {{ $t("forgotPassword.checkInbox") }}
                </p>
                <UButton to="/login" block variant="outline">
                    {{ $t("forgotPassword.backToLogin") }}
                </UButton>
            </div>

            <!-- Form -->
            <form v-else class="space-y-5" @submit.prevent="handleSubmit">
                <UFormField :label="$t('forgotPassword.emailLabel')">
                    <UInput
                        v-model="email"
                        type="email"
                        autocomplete="email"
                        required
                        :disabled="submitting"
                        :placeholder="$t('forgotPassword.emailPlaceholder')"
                        class="w-full"
                    />
                </UFormField>

                <p v-if="error" class="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {{ error }}
                </p>

                <UButton type="submit" block :loading="submitting" :disabled="!email">
                    {{ $t("forgotPassword.submit") }}
                </UButton>

                <p class="text-fg-muted mt-4 text-center text-sm">
                    <NuxtLink
                        to="/login"
                        class="text-primary-400 hover:text-primary-300 transition"
                    >
                        {{ $t("forgotPassword.backToLogin") }}
                    </NuxtLink>
                </p>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();
useHead({ title: () => t("forgotPassword.title") });

const http = useHttp();

const email = ref("");
const error = ref<string | null>(null);
const submitting = ref(false);
const sent = ref(false);

async function handleSubmit() {
    error.value = null;
    submitting.value = true;
    try {
        await http.post("/api/auth/forgot-password", { email: email.value });
        sent.value = true;
    } catch {
        sent.value = true;
    } finally {
        submitting.value = false;
    }
}
</script>
