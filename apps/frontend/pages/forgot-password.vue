<template>
    <div class="bg-base flex min-h-dvh items-center justify-center px-4">
        <LayoutGuestControls />
        <div class="border-line bg-surface w-full max-w-md rounded-2xl border p-8 backdrop-blur-xl">
            <!-- Logo / Brand -->
            <div class="mb-8 text-center">
                <img
                    src="/cbc.png"
                    alt="KeeperLog"
                    class="shadow-primary-500/20 mx-auto mb-4 h-12 w-12 rounded-2xl shadow-lg"
                />
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("auth.forgotPassword.title") }}
                </h1>
                <p class="text-fg-muted mt-2 text-[13px]">
                    {{ $t("auth.forgotPassword.subtitle") }}
                </p>
            </div>

            <!-- Success State -->
            <div v-if="sent" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <Icon name="lucide:mail-check" class="h-7 w-7 text-green-400" />
                </div>
                <p class="mb-2 text-[14px] font-medium text-green-400">
                    {{ $t("auth.forgotPassword.sent") }}
                </p>
                <p class="text-fg-muted mb-6 text-[13px]">
                    {{ $t("auth.forgotPassword.checkInbox") }}
                </p>
                <NuxtLink
                    to="/login"
                    class="border-line text-fg hover:bg-surface-hover inline-block w-full rounded-xl border px-4 py-2.5 text-center text-[14px] font-medium transition"
                >
                    {{ $t("auth.forgotPassword.backToLogin") }}
                </NuxtLink>
            </div>

            <!-- Form -->
            <div v-else>
                <form class="space-y-5" @submit.prevent="handleSubmit">
                    <div>
                        <label for="email" class="text-fg-dim mb-1.5 block text-[13px] font-medium">
                            {{ $t("auth.forgotPassword.email") }}
                        </label>
                        <input
                            id="email"
                            v-model="email"
                            type="email"
                            autocomplete="email"
                            required
                            :disabled="submitting"
                            class="border-line bg-surface text-fg placeholder-fg-ghost focus:border-primary-500/50 focus:ring-primary-500/30 w-full rounded-xl border px-4 py-2.5 text-[13px] transition-all duration-200 outline-none focus:ring-1 disabled:opacity-50"
                            :placeholder="$t('auth.forgotPassword.emailPlaceholder')"
                        />
                    </div>

                    <!-- Error -->
                    <p
                        v-if="error"
                        class="rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-400"
                    >
                        {{ error }}
                    </p>

                    <!-- Submit -->
                    <button
                        type="submit"
                        :disabled="submitting || !email"
                        class="from-primary-500 to-primary-600 shadow-primary-500/20 hover:shadow-primary-500/30 w-full rounded-xl bg-linear-to-r px-4 py-2.5 text-[14px] font-medium text-white shadow-lg transition-all duration-200 hover:brightness-110 focus:outline-none disabled:opacity-50"
                    >
                        <span v-if="submitting" class="inline-flex items-center gap-2">
                            <Icon name="svg-spinners:ring-resize" class="h-4 w-4" />
                            {{ $t("auth.forgotPassword.sending") }}
                        </span>
                        <span v-else>{{ $t("auth.forgotPassword.sendLink") }}</span>
                    </button>
                </form>

                <!-- Back to Login -->
                <p class="text-fg-muted mt-6 text-center text-[13px]">
                    <NuxtLink
                        to="/login"
                        class="text-primary-400 hover:text-primary-300 transition"
                    >
                        {{ $t("auth.forgotPassword.backToLogin") }}
                    </NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();

useHead({
    title: () => t("auth.forgotPassword.pageTitle"),
    meta: [
        {
            name: "description",
            content:
                "Reset your KeeperLog password — enter your email and we'll send you a reset link.",
        },
    ],
});

const authStore = useAuthStore();

const email = ref("");
const error = ref<string | null>(null);
const submitting = ref(false);
const sent = ref(false);

async function handleSubmit() {
    error.value = null;
    submitting.value = true;

    try {
        await authStore.forgotPassword(email.value);
        sent.value = true;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("auth.forgotPassword.error");
    } finally {
        submitting.value = false;
    }
}
</script>
