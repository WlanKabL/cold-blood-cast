<template>
    <div class="bg-page flex min-h-dvh items-center justify-center px-4">
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
                    {{ $t("auth.resetPassword.title") }}
                </h1>
                <p class="text-fg-muted mt-2 text-[13px]">
                    {{ $t("auth.resetPassword.subtitle") }}
                </p>
            </div>

            <!-- No Token -->
            <div v-if="!token" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10"
                >
                    <Icon name="lucide:alert-triangle" class="h-7 w-7 text-red-400" />
                </div>
                <p class="text-fg-muted mb-6 text-[14px]">{{ $t("auth.resetPassword.noToken") }}</p>
                <NuxtLink
                    to="/forgot-password"
                    class="from-primary-500 to-primary-600 shadow-primary-500/20 hover:shadow-primary-500/30 inline-block w-full rounded-xl bg-linear-to-r px-4 py-2.5 text-center text-[14px] font-medium text-white shadow-lg transition-all duration-200 hover:brightness-110"
                >
                    {{ $t("auth.resetPassword.requestNew") }}
                </NuxtLink>
            </div>

            <!-- Success State -->
            <div v-else-if="success" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <Icon name="lucide:check-circle-2" class="h-7 w-7 text-green-400" />
                </div>
                <p class="mb-2 text-[14px] font-medium text-green-400">
                    {{ $t("auth.resetPassword.success") }}
                </p>
                <p class="text-fg-muted mb-6 text-[13px]">
                    {{ $t("auth.resetPassword.loginNow") }}
                </p>
                <NuxtLink
                    to="/login"
                    class="from-primary-500 to-primary-600 shadow-primary-500/20 hover:shadow-primary-500/30 inline-block w-full rounded-xl bg-linear-to-r px-4 py-2.5 text-center text-[14px] font-medium text-white shadow-lg transition-all duration-200 hover:brightness-110"
                >
                    {{ $t("auth.resetPassword.goToLogin") }}
                </NuxtLink>
            </div>

            <!-- Form -->
            <div v-else>
                <form class="space-y-5" @submit.prevent="handleReset">
                    <!-- New Password -->
                    <div>
                        <label
                            for="password"
                            class="text-fg-dim mb-1.5 block text-[13px] font-medium"
                        >
                            {{ $t("auth.resetPassword.newPassword") }}
                        </label>
                        <input
                            id="password"
                            v-model="password"
                            type="password"
                            autocomplete="new-password"
                            required
                            :disabled="submitting"
                            class="border-line bg-surface text-fg placeholder-fg-ghost focus:border-primary-500/50 focus:ring-primary-500/30 w-full rounded-xl border px-4 py-2.5 text-[13px] transition-all duration-200 outline-none focus:ring-1 disabled:opacity-50"
                            :placeholder="$t('auth.resetPassword.newPasswordPlaceholder')"
                        />
                        <!-- Password strength rules -->
                        <div class="mt-2.5 grid grid-cols-2 gap-1">
                            <div
                                v-for="rule in passwordRules"
                                :key="rule.label"
                                class="flex items-center gap-1.5 text-[11px]"
                                :class="rule.met ? 'text-green-400' : 'text-fg-faint'"
                            >
                                <Icon
                                    :name="rule.met ? 'lucide:check-circle' : 'lucide:circle'"
                                    class="h-3 w-3 shrink-0"
                                />
                                {{ rule.label }}
                            </div>
                        </div>
                    </div>

                    <!-- Confirm Password -->
                    <div>
                        <label
                            for="confirmPassword"
                            class="text-fg-dim mb-1.5 block text-[13px] font-medium"
                        >
                            {{ $t("auth.resetPassword.confirmPassword") }}
                        </label>
                        <input
                            id="confirmPassword"
                            v-model="confirmPassword"
                            type="password"
                            autocomplete="new-password"
                            required
                            :disabled="submitting"
                            class="border-line bg-surface text-fg placeholder-fg-ghost focus:border-primary-500/50 focus:ring-primary-500/30 w-full rounded-xl border px-4 py-2.5 text-[13px] transition-all duration-200 outline-none focus:ring-1 disabled:opacity-50"
                            :placeholder="$t('auth.resetPassword.confirmPasswordPlaceholder')"
                        />
                    </div>

                    <!-- Mismatch Warning -->
                    <p
                        v-if="password && confirmPassword && password !== confirmPassword"
                        class="rounded-xl bg-amber-500/10 px-3 py-2 text-[13px] text-amber-400"
                    >
                        {{ $t("auth.register.passwordMismatch") }}
                    </p>

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
                        :disabled="
                            submitting ||
                            !password ||
                            !confirmPassword ||
                            password !== confirmPassword ||
                            !passwordValid
                        "
                        class="from-primary-500 to-primary-600 shadow-primary-500/20 hover:shadow-primary-500/30 w-full rounded-xl bg-linear-to-r px-4 py-2.5 text-[14px] font-medium text-white shadow-lg transition-all duration-200 hover:brightness-110 focus:outline-none disabled:opacity-50"
                    >
                        <span v-if="submitting" class="inline-flex items-center gap-2">
                            <Icon name="svg-spinners:ring-resize" class="h-4 w-4" />
                            {{ $t("auth.resetPassword.resetting") }}
                        </span>
                        <span v-else>{{ $t("auth.resetPassword.reset") }}</span>
                    </button>
                </form>

                <!-- Back to Login -->
                <p class="text-fg-muted mt-6 text-center text-[13px]">
                    <NuxtLink
                        to="/login"
                        class="text-primary-400 hover:text-primary-300 transition"
                    >
                        {{ $t("auth.resetPassword.backToLogin") }}
                    </NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();

useHead({ title: () => t("auth.resetPassword.pageTitle") });

const authStore = useAuthStore();
const route = useRoute();

const token = computed(() => route.query.token as string | undefined);
const password = ref("");
const confirmPassword = ref("");
const error = ref<string | null>(null);
const submitting = ref(false);
const success = ref(false);

// ── Password strength rules ─────────────────
const { passwordRules, passwordValid } = usePasswordRules(password);

async function handleReset() {
    if (!token.value || password.value !== confirmPassword.value) return;
    error.value = null;
    submitting.value = true;

    try {
        await authStore.resetUserPassword(token.value, password.value);
        success.value = true;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("auth.resetPassword.error");
    } finally {
        submitting.value = false;
    }
}
</script>
