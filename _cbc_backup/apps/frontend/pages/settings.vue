<template>
    <PageContainer :title="$t('settings.title')">
        <div class="mx-auto max-w-2xl space-y-8">
            <!-- Profile Section -->
            <section class="rounded-xl border border-card-border bg-card-bg p-6">
                <h2 class="mb-4 text-lg font-semibold text-fg">{{ $t("settings.profile") }}</h2>
                <div class="space-y-4">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("settings.display_name")
                        }}</label>
                        <input
                            v-model="profileForm.displayName"
                            type="text"
                            class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-fg placeholder-fg-soft outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("settings.email")
                        }}</label>
                        <input
                            :value="authStore.user?.email"
                            type="email"
                            disabled
                            class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-fg-muted outline-none opacity-60"
                        />
                    </div>
                    <div class="flex justify-end">
                        <button
                            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                            @click="saveProfile"
                        >
                            {{ $t("common.save") }}
                        </button>
                    </div>
                </div>
            </section>

            <!-- Email Verification Section -->
            <section
                v-if="authStore.user && !authStore.user.emailVerified"
                class="rounded-xl border border-amber-500/30 bg-amber-500/[0.03] p-6"
            >
                <h2 class="mb-2 text-lg font-semibold text-amber-400">
                    {{ $t("settings.email_verification") }}
                </h2>
                <p class="mb-4 text-sm text-fg-muted">{{ $t("settings.email_not_verified") }}</p>
                <div class="flex gap-3">
                    <button
                        class="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
                        :disabled="verificationSending"
                        @click="resendVerification"
                    >
                        {{ $t("settings.resend_verification") }}
                    </button>
                    <NuxtLink
                        to="/verify-email"
                        class="rounded-lg border border-line px-4 py-2 text-sm text-fg-muted transition hover:bg-hover"
                    >
                        {{ $t("settings.enter_code") }}
                    </NuxtLink>
                </div>
            </section>

            <!-- Change Password Section -->
            <section class="rounded-xl border border-card-border bg-card-bg p-6">
                <h2 class="mb-4 text-lg font-semibold text-fg">
                    {{ $t("settings.change_password") }}
                </h2>
                <div class="space-y-4">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("settings.current_password")
                        }}</label>
                        <input
                            v-model="passwordForm.currentPassword"
                            type="password"
                            class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-fg placeholder-fg-soft outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("settings.new_password")
                        }}</label>
                        <input
                            v-model="passwordForm.newPassword"
                            type="password"
                            class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-fg placeholder-fg-soft outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
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
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("settings.confirm_password")
                        }}</label>
                        <input
                            v-model="passwordForm.confirmPassword"
                            type="password"
                            class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-fg placeholder-fg-soft outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div class="flex justify-end">
                        <button
                            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            :disabled="!passwordValid"
                            @click="changePassword"
                        >
                            {{ $t("settings.change_password") }}
                        </button>
                    </div>
                </div>
            </section>

            <!-- Appearance Section -->
            <section class="rounded-xl border border-card-border bg-card-bg p-6">
                <h2 class="mb-4 text-lg font-semibold text-fg">{{ $t("settings.appearance") }}</h2>
                <div class="space-y-4">
                    <!-- Theme -->
                    <div>
                        <label class="mb-2 block text-sm font-medium text-fg">{{
                            $t("settings.theme.title")
                        }}</label>
                        <div class="flex gap-2">
                            <button
                                v-for="mode in themeOptions"
                                :key="mode.value"
                                class="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition"
                                :class="
                                    settingsStore.themeMode === mode.value
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                        : 'border-line text-fg-muted hover:bg-hover'
                                "
                                @click="settingsStore.setTheme(mode.value)"
                            >
                                <Icon :name="mode.icon" class="h-4 w-4" />
                                {{ mode.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Language -->
                    <div>
                        <label class="mb-2 block text-sm font-medium text-fg">{{
                            $t("settings.language")
                        }}</label>
                        <div class="flex gap-2">
                            <button
                                v-for="loc in localeOptions"
                                :key="loc.code"
                                class="rounded-lg border px-4 py-2.5 text-sm transition"
                                :class="
                                    locale === loc.code
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                        : 'border-line text-fg-muted hover:bg-hover'
                                "
                                @click="locale = loc.code"
                            >
                                {{ loc.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Data & Privacy -->
            <section class="rounded-xl border border-card-border bg-card-bg p-6">
                <h2 class="mb-4 text-lg font-semibold text-fg">{{ $t("settings.export_data") }}</h2>
                <p class="mb-4 text-sm text-fg-muted">{{ $t("settings.export_data_desc") }}</p>
                <button
                    class="rounded-lg border border-line px-4 py-2 text-sm text-fg-muted transition hover:bg-hover"
                    @click="requestExport"
                >
                    {{ $t("settings.export_data") }}
                </button>
            </section>

            <!-- Danger Zone -->
            <section class="rounded-xl border border-red-500/30 bg-red-500/[0.03] p-6">
                <h2 class="mb-2 text-lg font-semibold text-red-400">
                    {{ $t("settings.danger_zone") }}
                </h2>
                <p class="mb-4 text-sm text-fg-muted">{{ $t("settings.delete_account_desc") }}</p>
                <button
                    class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                    @click="requestDeleteAccount"
                >
                    {{ $t("settings.delete_account") }}
                </button>
            </section>
        </div>

        <!-- Toast -->
        <Teleport to="body">
            <Transition name="toast">
                <div
                    v-if="toast"
                    class="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
                >
                    {{ toast }}
                </div>
            </Transition>
        </Teleport>
    </PageContainer>
</template>

<script setup lang="ts">
import type { ThemeMode } from "~/stores/useSettingsStore";

definePageMeta({ layout: "default" });

const { t, locale } = useI18n();
const http = useHttp();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

useSeoMeta({ title: "Settings — Cold Blood Cast" });

const toast = ref<string | null>(null);

const profileForm = ref({
    displayName: authStore.user?.displayName || "",
});

const passwordForm = ref({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
});

const { passwordRules, passwordValid: newPasswordValid } = usePasswordRules(
    () => passwordForm.value.newPassword,
);

const passwordValid = computed(
    () =>
        newPasswordValid.value &&
        passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
        passwordForm.value.currentPassword.length > 0,
);

const themeOptions = computed<Array<{ value: ThemeMode; label: string; icon: string }>>(() => [
    { value: "light", label: t("settings.theme.light"), icon: "lucide:sun" },
    { value: "dark", label: t("settings.theme.dark"), icon: "lucide:moon" },
    { value: "system", label: t("settings.theme.system"), icon: "lucide:monitor" },
]);

const localeOptions = [
    { code: "de", label: "Deutsch" },
    { code: "en", label: "English" },
];

function showToast(msg: string) {
    toast.value = msg;
    setTimeout(() => (toast.value = null), 2500);
}

async function saveProfile() {
    await http.patch("/api/auth/me", { displayName: profileForm.value.displayName });
    await authStore.fetchUser();
    showToast(t("settings.profile_updated"));
}

async function changePassword() {
    await http.post("/api/auth/change-password", {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword,
    });
    passwordForm.value = { currentPassword: "", newPassword: "", confirmPassword: "" };
    showToast(t("settings.password_changed"));
}

async function requestExport() {
    await http.post("/api/gdpr/data-export");
    showToast(t("settings.export_requested"));
}

const verificationSending = ref(false);

async function resendVerification() {
    verificationSending.value = true;
    try {
        await http.post("/api/auth/resend-verification");
        showToast(t("settings.verification_sent"));
    } finally {
        verificationSending.value = false;
    }
}

async function requestDeleteAccount() {
    if (!confirm(t("settings.delete_account_confirm"))) return;
    await http.post("/api/auth/request-account-deletion");
    showToast(t("settings.delete_email_sent"));
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(10px);
}
</style>
