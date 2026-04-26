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
                <h1 class="text-fg text-2xl font-bold tracking-tight">KeeperLog</h1>
                <p class="text-fg-muted mt-2 text-[13px]">{{ $t("auth.login.subtitle") }}</p>
            </div>

            <!-- Form -->
            <form class="space-y-5" @submit.prevent="handleLogin">
                <!-- Login Field -->
                <div>
                    <UiTextInput
                        id="login"
                        v-model="form.login"
                        autocomplete="username"
                        required
                        :disabled="authStore.loading"
                        :label="$t('auth.login.usernameOrEmail')"
                        :placeholder="$t('auth.login.loginPlaceholder')"
                    />
                </div>

                <!-- Password -->
                <div>
                    <UiTextInput
                        id="password"
                        v-model="form.password"
                        type="password"
                        autocomplete="current-password"
                        required
                        :disabled="authStore.loading"
                        :label="$t('auth.login.password')"
                        :placeholder="$t('auth.login.passwordPlaceholder')"
                    />
                </div>

                <!-- Error -->
                <p v-if="error" class="rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
                    {{ error }}
                </p>

                <!-- Forgot Password -->
                <div class="text-right">
                    <NuxtLink
                        to="/forgot-password"
                        class="text-primary-400 hover:text-primary-300 text-[13px] transition"
                    >
                        {{ $t("auth.login.forgotPassword") }}
                    </NuxtLink>
                </div>

                <!-- Submit -->
                <UiButton type="submit" :loading="authStore.loading" block size="lg">
                    {{ authStore.loading ? $t("auth.login.signingIn") : $t("auth.login.signIn") }}
                </UiButton>
            </form>

            <!-- Register Link -->
            <p class="text-fg-muted mt-6 text-center text-[13px]">
                {{ $t("auth.login.noAccount") }}
                <NuxtLink to="/register" class="text-primary-400 hover:text-primary-300 transition">
                    {{ $t("auth.login.createAccount") }}
                </NuxtLink>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();

useHead({
    title: () => t("auth.login.pageTitle"),
    meta: [
        {
            name: "description",
            content:
                "Log in to KeeperLog — your terrarium monitoring, alerts, and care journal system.",
        },
    ],
});
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
    login: "",
    password: "",
});

const error = ref<string | null>(null);

async function handleLogin() {
    error.value = null;
    try {
        await authStore.login(form);
        const redirect = route.query.redirect as string;
        await router.push(redirect || "/dashboard");
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("auth.login.error");
    }
}
</script>
