<template>
    <Transition name="cookie-slide">
        <div
            v-if="visible"
            class="border-line-faint bg-surface/95 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-md"
        >
            <div
                class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-2.5"
            >
                <!-- Text -->
                <p class="text-fg-muted flex-1 text-[12px] leading-relaxed sm:text-[13px]">
                    <Icon name="lucide:cookie" class="text-fg-dim mr-1 inline h-3.5 w-3.5" />
                    {{ $t("cookie.message") }}
                    <NuxtLink
                        to="/legal/cookie_policy"
                        class="text-primary-400 ml-0.5 underline-offset-2 hover:underline"
                    >
                        {{ $t("cookie.learnMore") }}
                    </NuxtLink>
                </p>

                <!-- Actions -->
                <div class="flex shrink-0 items-center gap-2">
                    <button
                        class="border-line text-fg-muted hover:bg-surface-hover hover:text-fg rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors"
                        @click="showDetails = !showDetails"
                    >
                        {{ $t("cookie.settings") }}
                    </button>
                    <button
                        class="border-line text-fg-muted hover:bg-surface-hover hover:text-fg rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors"
                        @click="acceptNecessary"
                    >
                        {{ $t("cookie.onlyNecessary") }}
                    </button>
                    <button
                        class="bg-accent hover:bg-accent/90 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white transition-colors"
                        @click="acceptAll"
                    >
                        {{ $t("cookie.acceptAll") }}
                    </button>
                </div>
            </div>

            <!-- Expanded settings -->
            <Transition name="cookie-expand">
                <div v-if="showDetails" class="border-line-faint border-t">
                    <div class="mx-auto max-w-5xl space-y-2 px-4 py-3">
                        <!-- Necessary -->
                        <div
                            class="bg-bg/50 flex items-center justify-between rounded-lg px-3 py-2"
                        >
                            <div>
                                <p class="text-fg text-[12px] font-medium">
                                    {{ $t("cookie.necessary") }}
                                </p>
                                <p class="text-fg-muted text-[11px]">
                                    {{ $t("cookie.necessaryDesc") }}
                                </p>
                            </div>
                            <span class="text-fg-dim text-[11px] font-medium">
                                {{ $t("cookie.alwaysOn") }}
                            </span>
                        </div>

                        <!-- Analytics -->
                        <div
                            class="bg-bg/50 flex items-center justify-between rounded-lg px-3 py-2"
                        >
                            <div>
                                <p class="text-fg text-[12px] font-medium">
                                    {{ $t("cookie.analytics") }}
                                </p>
                                <p class="text-fg-muted text-[11px]">
                                    {{ $t("cookie.analyticsDesc") }}
                                </p>
                            </div>
                            <UiToggle v-model="analyticsEnabled" />
                        </div>

                        <!-- Marketing -->
                        <div
                            class="bg-bg/50 flex items-center justify-between rounded-lg px-3 py-2"
                        >
                            <div>
                                <p class="text-fg text-[12px] font-medium">
                                    {{ $t("cookie.marketing") }}
                                </p>
                                <p class="text-fg-muted text-[11px]">
                                    {{ $t("cookie.marketingDesc") }}
                                </p>
                            </div>
                            <UiToggle v-model="marketingEnabled" />
                        </div>

                        <!-- Save preferences -->
                        <div class="flex justify-end pt-1">
                            <button
                                class="bg-accent hover:bg-accent/90 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white transition-colors"
                                @click="savePreferences"
                            >
                                {{ $t("cookie.savePreferences") }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<script setup lang="ts">
// Storage key MUST stay in sync with the marketing-attribution + meta-pixel
// plugins and pages/register.vue, which all read "cbc-cookie-consent".
const STORAGE_KEY = "cbc-cookie-consent";
const LEGACY_STORAGE_KEY = "kl_cookie_consent"; // pre-v2 banner key, read-only for migration
const CONSENT_VERSION = 2; // v2 added the marketing flag

interface CookiePreferences {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
    timestamp: number;
    version: number;
}

const visible = ref(false);
const showDetails = ref(false);
const analyticsEnabled = ref(false);
const marketingEnabled = ref(false);

const authStore = useAuthStore();
const api = useApi();

function readStoredPrefs(): Partial<CookiePreferences> | null {
    const raw =
        localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Partial<CookiePreferences>;
    } catch {
        return null;
    }
}

onMounted(() => {
    const prefs = readStoredPrefs();
    if (!prefs) {
        visible.value = true;
        return;
    }
    // Re-prompt when consent schema bumps (v1 → v2 added marketing flag).
    if (typeof prefs.version !== "number" || prefs.version < CONSENT_VERSION) {
        // Pre-fill the analytics toggle from the prior decision so the user
        // doesn't lose it on the schema bump.
        if (typeof prefs.analytics === "boolean") analyticsEnabled.value = prefs.analytics;
        visible.value = true;
        return;
    }
    analyticsEnabled.value = prefs.analytics === true;
    marketingEnabled.value = prefs.marketing === true;
});

// Sync stored consent to backend after login (covers pre-login consent).
watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
        if (!isAuth) return;
        const prefs = readStoredPrefs();
        if (!prefs || typeof prefs.version !== "number") return;
        syncToBackend(prefs.analytics === true, prefs.marketing === true, prefs.version);
    },
);

function syncToBackend(analytics: boolean, marketing: boolean, version: number) {
    void api
        .post("/api/users/me/cookie-consent", { analytics, marketing, version })
        .catch(() => {
            // Best-effort — consent is stored in localStorage regardless.
        });
}

function save(analytics: boolean, marketing: boolean) {
    const prefs: CookiePreferences = {
        necessary: true,
        analytics,
        marketing,
        timestamp: Date.now(),
        version: CONSENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    // Drop the legacy key so the user does not get re-prompted from the old slot.
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    visible.value = false;
    showDetails.value = false;

    if (authStore.isAuthenticated) {
        syncToBackend(analytics, marketing, CONSENT_VERSION);
    }
}

function acceptAll() {
    save(true, true);
}

function acceptNecessary() {
    save(false, false);
}

function savePreferences() {
    save(analyticsEnabled.value, marketingEnabled.value);
}
</script>

<style scoped>
.cookie-slide-enter-active,
.cookie-slide-leave-active {
    transition:
        transform 0.3s ease,
        opacity 0.3s ease;
}

.cookie-slide-enter-from,
.cookie-slide-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

.cookie-expand-enter-active,
.cookie-expand-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}

.cookie-expand-enter-from,
.cookie-expand-leave-to {
    opacity: 0;
    max-height: 0;
}

.cookie-expand-enter-to,
.cookie-expand-leave-from {
    max-height: 200px;
}
</style>
