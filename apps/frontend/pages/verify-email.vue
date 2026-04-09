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
                    {{ $t("auth.verifyEmail.title") }}
                </h1>
                <p class="text-fg-muted mt-2 text-[13px]">{{ $t("auth.verifyEmail.subtitle") }}</p>
            </div>

            <!-- Success State -->
            <div v-if="verified" class="text-center">
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10"
                >
                    <Icon name="lucide:check-circle-2" class="h-7 w-7 text-green-400" />
                </div>
                <p class="mb-6 text-[14px] font-medium text-green-400">
                    {{ $t("auth.verifyEmail.verified") }}
                </p>
                <button
                    class="from-primary-500 to-primary-600 shadow-primary-500/20 hover:shadow-primary-500/30 w-full rounded-xl bg-linear-to-r px-4 py-2.5 text-[14px] font-medium text-white shadow-lg transition-all duration-200 hover:brightness-110"
                    @click="goToDashboard"
                >
                    {{ $t("auth.verifyEmail.goToDashboard") }}
                </button>
            </div>

            <!-- Verification Form -->
            <div v-else>
                <!-- Hint -->
                <div class="bg-primary-500/10 mb-6 rounded-xl px-4 py-3">
                    <p class="text-primary-300 text-[13px]">
                        <Icon name="lucide:info" class="mr-1 inline h-4 w-4 -translate-y-px" />
                        {{ $t("auth.verifyEmail.hint") }}
                    </p>
                </div>

                <!-- Code Input -->
                <form class="space-y-5" @submit.prevent="handleVerify">
                    <div>
                        <label for="code" class="text-fg-dim mb-1.5 block text-[13px] font-medium">
                            {{ $t("auth.verifyEmail.codeLabel") }}
                        </label>
                        <input
                            id="code"
                            v-model="code"
                            type="text"
                            inputmode="numeric"
                            maxlength="6"
                            pattern="[0-9]{6}"
                            autocomplete="one-time-code"
                            required
                            :disabled="submitting"
                            class="border-line bg-surface text-fg placeholder-fg-ghost focus:border-primary-500/50 focus:ring-primary-500/30 w-full rounded-xl border px-4 py-2.5 text-center font-mono text-[18px] tracking-[0.3em] transition-all duration-200 outline-none focus:ring-1 disabled:opacity-50"
                            placeholder="000000"
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
                        :disabled="submitting || code.length !== 6"
                        class="from-primary-500 to-primary-600 shadow-primary-500/20 hover:shadow-primary-500/30 w-full rounded-xl bg-linear-to-r px-4 py-2.5 text-[14px] font-medium text-white shadow-lg transition-all duration-200 hover:brightness-110 focus:outline-none disabled:opacity-50"
                    >
                        <span v-if="submitting" class="inline-flex items-center gap-2">
                            <Icon name="svg-spinners:ring-resize" class="h-4 w-4" />
                            {{ $t("auth.verifyEmail.verifying") }}
                        </span>
                        <span v-else>{{ $t("auth.verifyEmail.verify") }}</span>
                    </button>
                </form>

                <!-- Resend -->
                <div class="mt-6 text-center">
                    <p class="text-fg-muted text-[13px]">{{ $t("auth.verifyEmail.noCode") }}</p>
                    <button
                        :disabled="resendCooldown > 0 || resending"
                        class="text-primary-400 hover:text-primary-300 disabled:text-fg-ghost mt-1 text-[13px] transition disabled:cursor-not-allowed"
                        @click="handleResend"
                    >
                        <span v-if="resending" class="inline-flex items-center gap-1">
                            <Icon name="svg-spinners:ring-resize" class="h-3 w-3" />
                            {{ $t("auth.verifyEmail.sending") }}
                        </span>
                        <span v-else-if="resendCooldown > 0">
                            {{ $t("auth.verifyEmail.resendIn", { seconds: resendCooldown }) }}
                        </span>
                        <span v-else>{{ $t("auth.verifyEmail.resend") }}</span>
                    </button>
                </div>

                <!-- Logout -->
                <p class="text-fg-muted mt-4 text-center text-[13px]">
                    <button class="text-fg-dim hover:text-fg transition" @click="handleLogout">
                        {{ $t("auth.verifyEmail.logout") }}
                    </button>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();

useHead({ title: () => t("auth.verifyEmail.pageTitle") });

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const code = ref("");
const error = ref<string | null>(null);
const submitting = ref(false);
const verified = ref(false);
const resending = ref(false);
const resendCooldown = ref(0);

let cooldownTimer: ReturnType<typeof setInterval> | null = null;

// Auto-fill code from URL ?code=123456
onMounted(() => {
    const urlCode = route.query.code as string | undefined;
    if (urlCode && /^\d{6}$/.test(urlCode)) {
        code.value = urlCode;
        // Auto-submit
        handleVerify();
    }
});

onUnmounted(() => {
    if (cooldownTimer) clearInterval(cooldownTimer);
});

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
    if (code.value.length !== 6) return;
    error.value = null;
    submitting.value = true;

    try {
        await authStore.verifyEmailCode(code.value);
        verified.value = true;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("auth.verifyEmail.error");
    } finally {
        submitting.value = false;
    }
}

async function handleResend() {
    error.value = null;
    resending.value = true;

    try {
        await authStore.resendVerification();
        startCooldown();
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("auth.verifyEmail.error");
    } finally {
        resending.value = false;
    }
}

async function handleLogout() {
    await authStore.logout();
    await router.push("/login");
}

async function goToDashboard() {
    await router.push("/dashboard");
}
</script>
