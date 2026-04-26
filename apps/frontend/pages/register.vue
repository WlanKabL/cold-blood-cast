<template>
    <div class="bg-page flex min-h-dvh items-center justify-center px-4 py-8">
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
                <p class="text-fg-muted mt-2 text-[13px]">{{ $t("auth.register.subtitle") }}</p>
            </div>

            <!-- Pending Approval Success -->
            <div v-if="pendingApproval" class="space-y-4 text-center">
                <div class="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-6">
                    <Icon name="lucide:check-circle" class="mx-auto mb-3 h-8 w-8 text-green-400" />
                    <p class="text-[14px] font-medium text-green-300">
                        {{ $t("auth.register.pendingApproval") }}
                    </p>
                </div>
                <p class="text-fg-muted text-[13px]">
                    <NuxtLink
                        to="/login"
                        class="text-primary-400 hover:text-primary-300 transition"
                    >
                        {{ $t("auth.register.backToLogin") }}
                    </NuxtLink>
                </p>
            </div>

            <!-- Loading State -->
            <div v-else-if="checkingMode" class="flex items-center justify-center py-8">
                <Icon name="svg-spinners:ring-resize" class="text-primary-400 h-6 w-6" />
            </div>

            <!-- Form (open / approval / invite_only) -->
            <template v-else>
                <!-- Invite-only banner -->
                <div
                    v-if="registrationMode === 'invite_only'"
                    class="mb-5 flex items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-4 py-3"
                >
                    <Icon name="lucide:ticket" class="h-4 w-4 shrink-0 text-purple-400" />
                    <p class="text-[12px] text-purple-300">
                        {{ $t("auth.register.inviteOnlyHint") }}
                    </p>
                </div>

                <form class="space-y-5" @submit.prevent="handleRegister">
                    <!-- Invite Code (only in invite_only mode) -->
                    <div v-if="registrationMode === 'invite_only'">
                        <UiTextInput
                            id="inviteCode"
                            v-model="form.inviteCode"
                            autocomplete="off"
                            required
                            :disabled="authStore.loading"
                            accent="purple"
                            class="font-mono uppercase"
                            :label="$t('auth.register.inviteCode', 'Invite Code')"
                            :placeholder="$t('auth.register.inviteCodePlaceholder', 'XXXXXXXXXX')"
                        />
                    </div>

                    <!-- Username -->
                    <div>
                        <UiTextInput
                            id="username"
                            v-model="form.username"
                            autocomplete="username"
                            :disabled="authStore.loading"
                            :label="$t('auth.register.username')"
                            :error="fieldErrors.username"
                            :hint="
                                !fieldErrors.username ? $t('auth.register.usernameHint') : undefined
                            "
                            :placeholder="$t('auth.register.usernamePlaceholder')"
                            @blur="validateUsername"
                            @input="fieldErrors.username = ''"
                        />
                    </div>

                    <!-- Email -->
                    <div>
                        <UiTextInput
                            id="email"
                            v-model="form.email"
                            type="email"
                            autocomplete="email"
                            :disabled="authStore.loading"
                            :label="$t('auth.register.email')"
                            :error="fieldErrors.email"
                            :placeholder="$t('auth.register.emailPlaceholder')"
                            @input="fieldErrors.email = ''"
                        />
                    </div>

                    <!-- Password -->
                    <div>
                        <UiTextInput
                            id="password"
                            v-model="form.password"
                            :type="showPassword ? 'text' : 'password'"
                            autocomplete="new-password"
                            :disabled="authStore.loading"
                            :label="$t('auth.register.password')"
                            :error="fieldErrors.password"
                            :placeholder="$t('auth.register.passwordPlaceholder')"
                            @input="fieldErrors.password = ''"
                        >
                            <template #trailing>
                                <button
                                    type="button"
                                    tabindex="-1"
                                    class="text-fg-faint hover:text-fg"
                                    @click="showPassword = !showPassword"
                                >
                                    <Icon
                                        :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                                        class="h-4 w-4"
                                    />
                                </button>
                            </template>
                        </UiTextInput>
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
                        <UiTextInput
                            id="confirmPassword"
                            v-model="form.confirmPassword"
                            :type="showConfirmPassword ? 'text' : 'password'"
                            autocomplete="new-password"
                            :disabled="authStore.loading"
                            :label="$t('auth.register.confirmPassword')"
                            :error="fieldErrors.confirmPassword"
                            :placeholder="$t('auth.register.confirmPasswordPlaceholder')"
                            @input="fieldErrors.confirmPassword = ''"
                        >
                            <template #trailing>
                                <button
                                    type="button"
                                    tabindex="-1"
                                    class="text-fg-faint hover:text-fg"
                                    @click="showConfirmPassword = !showConfirmPassword"
                                >
                                    <Icon
                                        :name="
                                            showConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'
                                        "
                                        class="h-4 w-4"
                                    />
                                </button>
                            </template>
                        </UiTextInput>
                    </div>

                    <!-- General Error -->
                    <p
                        v-if="error"
                        class="rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-400"
                    >
                        {{ error }}
                    </p>

                    <!-- ToS / Privacy Consent Checkbox -->
                    <label class="flex cursor-pointer items-start gap-2.5 select-none">
                        <input
                            v-model="form.acceptedTerms"
                            type="checkbox"
                            class="border-line bg-surface accent-primary-500 mt-0.5 h-4 w-4 shrink-0 rounded"
                            :disabled="authStore.loading"
                        />
                        <span class="text-fg-muted text-[11px] leading-relaxed">
                            {{ $t("auth.register.legalNotice.prefix") }}
                            <NuxtLink
                                to="/legal/terms_of_service"
                                target="_blank"
                                class="text-primary-400 hover:text-primary-300 underline"
                            >
                                {{ $t("auth.register.legalNotice.terms") }}
                            </NuxtLink>
                            {{ $t("auth.register.legalNotice.and") }}
                            <NuxtLink
                                to="/legal/privacy_policy"
                                target="_blank"
                                class="text-primary-400 hover:text-primary-300 underline"
                            >
                                {{ $t("auth.register.legalNotice.privacy") }} </NuxtLink
                            >{{ $t("auth.register.legalNotice.suffix") }}
                        </span>
                    </label>

                    <!-- Submit -->
                    <UiButton
                        type="submit"
                        :disabled="!isFormValid"
                        :loading="authStore.loading"
                        block
                        size="lg"
                    >
                        {{
                            authStore.loading
                                ? $t("auth.register.creating")
                                : $t("auth.register.createAccount")
                        }}
                    </UiButton>
                </form>

                <!-- Request Invite (invite_only mode) -->
                <div v-if="registrationMode === 'invite_only'" class="mt-5">
                    <div v-if="!showRequestForm" class="text-center">
                        <button
                            type="button"
                            class="text-[13px] text-purple-400 transition hover:text-purple-300"
                            @click="showRequestForm = true"
                        >
                            {{ $t("auth.register.requestInvite") }}
                        </button>
                    </div>

                    <!-- Request Invite Form -->
                    <div
                        v-else
                        class="space-y-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4"
                    >
                        <h3 class="text-[14px] font-medium text-purple-300">
                            {{ $t("auth.register.requestInviteTitle") }}
                        </h3>

                        <!-- Request Success -->
                        <div v-if="requestSuccess" class="space-y-2 text-center">
                            <Icon
                                name="lucide:check-circle"
                                class="mx-auto h-6 w-6 text-green-400"
                            />
                            <p class="text-[13px] text-green-300">
                                {{ $t("auth.register.requestSent") }}
                            </p>
                        </div>

                        <template v-else>
                            <UiTextInput
                                v-model="requestForm.email"
                                type="email"
                                accent="purple"
                                :label="$t('auth.register.email')"
                                :placeholder="$t('auth.register.emailPlaceholder')"
                            />
                            <UiTextarea
                                v-model="requestForm.reason"
                                :rows="2"
                                accent="purple"
                                :label="$t('auth.register.requestReason')"
                                :placeholder="$t('auth.register.requestReasonPlaceholder')"
                            />
                            <p v-if="requestError" class="text-[12px] text-red-400">
                                {{ requestError }}
                            </p>
                            <UiButton
                                type="button"
                                :disabled="!requestForm.email"
                                :loading="requestLoading"
                                block
                                @click="handleRequestInvite"
                            >
                                {{
                                    requestLoading
                                        ? $t("common.sending")
                                        : $t("auth.register.sendRequest")
                                }}
                            </UiButton>
                        </template>
                    </div>
                </div>

                <!-- Login Link -->
                <p class="text-fg-muted mt-6 text-center text-[13px]">
                    {{ $t("auth.register.hasAccount") }}
                    <NuxtLink
                        to="/login"
                        class="text-primary-400 hover:text-primary-300 transition"
                    >
                        {{ $t("auth.register.signIn") }}
                    </NuxtLink>
                </p>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();

useHead({
    title: () => t("auth.register.pageTitle"),
    meta: [
        {
            name: "description",
            content: () => t("seo.register.description"),
        },
    ],
});
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const apiBaseURL = useRuntimeConfig().public.apiBaseURL;

// ── Registration mode check ─────────────────
const checkingMode = ref(true);
const registrationMode = ref<string>("open");

onMounted(async () => {
    // Pre-fill invite code from ?invite= query param
    const inviteParam = route.query.invite;
    if (typeof inviteParam === "string" && inviteParam) {
        form.inviteCode = inviteParam;
    }
    // Pre-fill email from ?email= query param (e.g. from invite email)
    const emailParam = route.query.email;
    if (typeof emailParam === "string" && emailParam) {
        form.email = emailParam;
    }
    try {
        const res = await fetch(`${apiBaseURL}/api/auth/registration-status`);
        const json = await res.json();
        if (json.success) {
            registrationMode.value = json.data.mode;
        }
    } catch {
        // If check fails, allow the form to show (backend will enforce)
    } finally {
        checkingMode.value = false;
    }
});

const form = reactive({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
    acceptedTerms: false,
});

const fieldErrors = reactive({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
});

const error = ref<string | null>(null);
const pendingApproval = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// ── Request invite state ────────────────────
const showRequestForm = ref(false);
const requestForm = reactive({ email: "", reason: "" });
const requestLoading = ref(false);
const requestError = ref<string | null>(null);
const requestSuccess = ref(false);

// ── Password strength rules ─────────────────
const { passwordRules, passwordValid } = usePasswordRules(() => form.password);

// ── Username validation ─────────────────────
const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

function validateUsername() {
    const u = form.username.trim();
    if (!u) {
        fieldErrors.username = t("auth.register.usernameRequired");
    } else if (u.includes(" ")) {
        fieldErrors.username = t("auth.register.usernameNoSpaces");
    } else if (!USERNAME_RE.test(u)) {
        fieldErrors.username = t("auth.register.usernameInvalidChars");
    } else if (u.length < 3) {
        fieldErrors.username = t("auth.register.usernameMinLength");
    } else if (u.length > 32) {
        fieldErrors.username = t("auth.register.usernameMaxLength");
    } else {
        fieldErrors.username = "";
    }
}

// ── Form-wide valid flag → enable submit button ─
const isFormValid = computed(() => {
    if (!form.username || !form.email || !form.password || !form.confirmPassword) return false;
    if (!USERNAME_RE.test(form.username.trim()) || form.username.length < 3) return false;
    if (!passwordValid.value) return false;
    if (form.password !== form.confirmPassword) return false;
    if (registrationMode.value === "invite_only" && !form.inviteCode.trim()) return false;
    if (!form.acceptedTerms) return false;
    return true;
});

// ── Submit ──────────────────────────────────
async function handleRegister() {
    // Re-run client-side validation before submit
    validateUsername();

    if (!passwordValid.value) {
        fieldErrors.password = t("auth.register.passwordNotMet");
        return;
    }

    if (form.password !== form.confirmPassword) {
        fieldErrors.confirmPassword = t("auth.register.passwordMismatch");
        return;
    }

    error.value = null;

    try {
        const payload: {
            username: string;
            email: string;
            password: string;
            inviteCode?: string;
            landingSessionId?: string;
            marketingConsent?: "granted" | "denied" | "unknown";
        } = {
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
        };

        if (registrationMode.value === "invite_only" && form.inviteCode) {
            payload.inviteCode = form.inviteCode.trim().toUpperCase();
        }

        // ── Marketing attribution: attach landing session + consent ──
        try {
            const { getLandingSessionId } =
                await import("~/plugins/01.marketing-attribution.client");
            const sid = getLandingSessionId();
            if (sid) payload.landingSessionId = sid;
        } catch {
            /* ignore — tracking is best-effort */
        }
        try {
            const raw = localStorage.getItem("cbc-cookie-consent");
            if (raw) {
                const parsed = JSON.parse(raw) as { marketing?: boolean };
                payload.marketingConsent = parsed.marketing ? "granted" : "denied";
            } else {
                payload.marketingConsent = "unknown";
            }
        } catch {
            payload.marketingConsent = "unknown";
        }

        const result = await authStore.register(payload);
        if ("pendingApproval" in result && result.pendingApproval) {
            pendingApproval.value = true;
            return;
        }

        // Fire Meta Pixel CompleteRegistration with canonical eventId for dedup.
        try {
            const { useMarketingTracking } = await import("~/composables/useMarketingTracking");
            await useMarketingTracking().fireRegistrationPixel(
                "marketingDispatch" in result ? result.marketingDispatch : null,
            );
        } catch {
            /* ignore — tracking is best-effort */
        }

        await router.push("/dashboard");
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("auth.register.registrationFailed");
        // Route server errors to the right field
        if (/username.*taken|taken.*username/i.test(msg)) {
            fieldErrors.username = t("auth.register.usernameTaken");
        } else if (/email.*registered|email.*taken/i.test(msg)) {
            fieldErrors.email = t("auth.register.emailTaken");
        } else if (/invite/i.test(msg)) {
            error.value = msg;
        } else {
            error.value = msg;
        }
    }
}

// ── Request invite ──────────────────────────
async function handleRequestInvite() {
    requestError.value = null;
    requestLoading.value = true;
    try {
        const res = await fetch(`${apiBaseURL}/api/access-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: requestForm.email.trim(),
                reason: requestForm.reason.trim() || undefined,
            }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            requestError.value = json.error?.message ?? t("common.error");
            return;
        }
        requestSuccess.value = true;
    } catch {
        requestError.value = t("common.error");
    } finally {
        requestLoading.value = false;
    }
}
</script>
