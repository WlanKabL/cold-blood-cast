<template>
    <div class="flex min-h-dvh items-center justify-center bg-base px-4 py-8">
        <!-- Guest controls (locale toggle) -->
        <div class="fixed right-4 top-4 z-10">
            <button
                class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-hover hover:text-fg"
                @click="toggleLocale"
            >
                {{ currentLocale.toUpperCase() }}
            </button>
        </div>

        <div
            class="w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-8 backdrop-blur-xl"
        >
            <!-- Brand -->
            <div class="mb-8 text-center">
                <div
                    class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl shadow-lg shadow-emerald-500/20"
                >
                    🐍
                </div>
                <h1 class="text-2xl font-bold tracking-tight text-fg">{{ $t("project_title") }}</h1>
                <p class="mt-2 text-[13px] text-fg-muted">{{ $t("login.subtitle") }}</p>
            </div>

            <form class="space-y-5" @submit.prevent="handleLogin">
                <div
                    v-if="error"
                    class="rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-400"
                >
                    {{ error }}
                </div>

                <BaseInput
                    v-model="username"
                    :label="$t('login.username')"
                    type="text"
                    :placeholder="$t('login.username_placeholder')"
                    required
                />
                <!-- Password with toggle -->
                <div class="relative">
                    <BaseInput
                        v-model="password"
                        :label="$t('login.password')"
                        :type="showPassword ? 'text' : 'password'"
                        :placeholder="$t('login.password_placeholder')"
                        required
                    />
                    <button
                        type="button"
                        tabindex="-1"
                        class="absolute right-3 top-[34px] text-fg-soft transition hover:text-fg-muted"
                        @click="showPassword = !showPassword"
                    >
                        <Icon
                            :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                            class="h-4 w-4"
                        />
                    </button>
                </div>

                <button
                    type="submit"
                    :disabled="loading"
                    class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                    {{ loading ? "..." : $t("nav.login") }}
                </button>

                <div class="text-right">
                    <NuxtLink
                        to="/forgot-password"
                        class="text-xs text-fg-soft transition hover:text-emerald-400"
                    >
                        {{ $t("login.forgot_password") }}
                    </NuxtLink>
                </div>
            </form>

            <p class="mt-6 text-center text-sm text-fg-muted">
                {{ $t("login.no_account") }}
                <NuxtLink to="/register" class="text-emerald-400 transition hover:text-emerald-300">
                    {{ $t("register.title") }}
                </NuxtLink>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t, locale } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const currentLocale = computed(() => locale.value);
function toggleLocale() {
    locale.value = locale.value === "en" ? "de" : "en";
}

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const loading = ref(false);

async function handleLogin() {
    error.value = "";
    loading.value = true;
    try {
        await authStore.login(username.value, password.value);
        const redirect = route.query.redirect as string | undefined;
        router.push(redirect || "/dashboard");
    } catch {
        error.value = t("login.failed");
    } finally {
        loading.value = false;
    }
}
</script>
