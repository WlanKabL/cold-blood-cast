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
                <p class="mt-2 text-[13px] text-fg-muted">{{ $t("register.subtitle") }}</p>
            </div>

            <form class="space-y-5" @submit.prevent="handleRegister">
                <div
                    v-if="error"
                    class="rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-400"
                >
                    {{ error }}
                </div>
                <div
                    v-if="pendingApproval"
                    class="rounded-xl bg-amber-500/10 px-3 py-2 text-[13px] text-amber-400"
                >
                    {{ $t("register.pending_approval") }}
                </div>

                <BaseInput
                    v-model="form.email"
                    :label="$t('register.email')"
                    type="email"
                    placeholder="name@example.com"
                    required
                />
                <BaseInput
                    v-model="form.username"
                    :label="$t('register.username')"
                    type="text"
                    :placeholder="$t('register.username_placeholder')"
                    required
                />
                <BaseInput
                    v-model="form.displayName"
                    :label="$t('register.display_name')"
                    type="text"
                    :placeholder="$t('register.display_name_placeholder')"
                />

                <!-- Invite Code (optional, visible when registration may require it) -->
                <BaseInput
                    v-model="form.inviteCode"
                    :label="$t('register.invite_code')"
                    type="text"
                    :placeholder="$t('register.invite_code_placeholder')"
                />

                <!-- Password with toggle -->
                <div>
                    <div class="relative">
                        <BaseInput
                            v-model="form.password"
                            :label="$t('register.password')"
                            :type="showPassword ? 'text' : 'password'"
                            :placeholder="$t('register.password_placeholder')"
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
                    <!-- Password strength rules -->
                    <div class="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
                        <div
                            v-for="rule in passwordRules"
                            :key="rule.label"
                            class="flex items-center gap-1.5 text-[11px] transition-colors"
                            :class="rule.met ? 'text-green-400' : 'text-fg-soft'"
                        >
                            <Icon
                                :name="rule.met ? 'lucide:check-circle' : 'lucide:circle'"
                                class="h-3 w-3 shrink-0"
                            />
                            {{ rule.label }}
                        </div>
                    </div>
                </div>

                <!-- Confirm Password with toggle -->
                <div class="relative">
                    <BaseInput
                        v-model="confirmPassword"
                        :label="$t('register.confirm_password')"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        :placeholder="$t('register.confirm_password_placeholder')"
                        :error="confirmPasswordError"
                        required
                    />
                    <button
                        type="button"
                        tabindex="-1"
                        class="absolute right-3 top-[34px] text-fg-soft transition hover:text-fg-muted"
                        @click="showConfirmPassword = !showConfirmPassword"
                    >
                        <Icon
                            :name="showConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'"
                            class="h-4 w-4"
                        />
                    </button>
                </div>

                <button
                    type="submit"
                    :disabled="!isFormValid || loading"
                    class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {{ loading ? "..." : $t("register.submit") }}
                </button>
            </form>

            <p class="mt-6 text-center text-sm text-fg-muted">
                {{ $t("register.has_account") }}
                <NuxtLink to="/login" class="text-emerald-400 transition hover:text-emerald-300">
                    {{ $t("nav.login") }}
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

const currentLocale = computed(() => locale.value);
function toggleLocale() {
    locale.value = locale.value === "en" ? "de" : "en";
}

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
    email: "",
    username: "",
    displayName: "",
    password: "",
    inviteCode: "",
});
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);
const pendingApproval = ref(false);

const { passwordRules, passwordValid } = usePasswordRules(() => form.password);

const confirmPasswordError = computed(() => {
    if (!confirmPassword.value) return undefined;
    if (form.password !== confirmPassword.value) return t("register.passwords_mismatch");
    return undefined;
});

const isFormValid = computed(() => {
    if (!form.email || !form.username || !form.password || !confirmPassword.value) return false;
    if (form.username.length < 3) return false;
    if (!passwordValid.value) return false;
    if (form.password !== confirmPassword.value) return false;
    return true;
});

async function handleRegister() {
    error.value = "";
    pendingApproval.value = false;
    loading.value = true;
    try {
        const result = await authStore.register({
            email: form.email,
            username: form.username,
            password: form.password,
            displayName: form.displayName || undefined,
            inviteCode: form.inviteCode || undefined,
        });
        if (result.pendingApproval) {
            pendingApproval.value = true;
        } else {
            router.push("/dashboard");
        }
    } catch {
        error.value = t("register.failed");
    } finally {
        loading.value = false;
    }
}
</script>
