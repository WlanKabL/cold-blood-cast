<template>
    <Teleport to="body">
        <Transition name="cookie-banner">
            <div
                v-if="visible"
                class="fixed bottom-0 left-0 right-0 z-50 border-t border-card-border bg-card-bg p-4 shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm sm:rounded-xl sm:border"
            >
                <h3 class="mb-2 text-sm font-bold text-fg">{{ $t("cookie_consent.title") }}</h3>
                <p class="mb-4 text-xs leading-relaxed text-fg-muted">
                    {{ $t("cookie_consent.message") }}
                </p>

                <!-- Cookie categories -->
                <div class="mb-4 space-y-3">
                    <label class="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked
                            disabled
                            class="h-4 w-4 rounded accent-emerald-600"
                        />
                        <div>
                            <span class="text-sm font-medium text-fg">{{
                                $t("cookie_consent.essential")
                            }}</span>
                            <p class="text-[11px] text-fg-muted">
                                {{ $t("cookie_consent.essential_desc") }}
                            </p>
                        </div>
                    </label>
                    <label class="flex items-center gap-3">
                        <input
                            v-model="analytics"
                            type="checkbox"
                            class="h-4 w-4 rounded accent-emerald-600"
                        />
                        <div>
                            <span class="text-sm font-medium text-fg">{{
                                $t("cookie_consent.analytics")
                            }}</span>
                            <p class="text-[11px] text-fg-muted">
                                {{ $t("cookie_consent.analytics_desc") }}
                            </p>
                        </div>
                    </label>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                    <button
                        class="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-500"
                        @click="acceptAll"
                    >
                        {{ $t("cookie_consent.accept_all") }}
                    </button>
                    <button
                        class="flex-1 rounded-lg border border-line px-3 py-2 text-xs font-medium text-fg-muted transition hover:bg-hover"
                        @click="savePreferences"
                    >
                        {{ $t("cookie_consent.save_preferences") }}
                    </button>
                </div>

                <NuxtLink
                    to="/legal/privacy-policy"
                    class="mt-3 block text-center text-[11px] text-fg-soft transition hover:text-fg-muted"
                >
                    {{ $t("legal.privacy_policy") }}
                </NuxtLink>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
const http = useHttp();
const authStore = useAuthStore();

const visible = ref(false);
const analytics = ref(false);

const COOKIE_KEY = "cbc-cookie-consent";
const COOKIE_CONSENT_VERSION = 1;

function hasConsented(): boolean {
    if (!import.meta.client) return true;
    return localStorage.getItem(COOKIE_KEY) !== null;
}

function saveConsent(analyticsVal: boolean) {
    const consent = {
        analytics: analyticsVal,
        version: COOKIE_CONSENT_VERSION,
        timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));

    if (authStore.isLoggedIn) {
        http.post("/api/gdpr/cookie-consent", {
            analytics: analyticsVal,
            version: COOKIE_CONSENT_VERSION,
        }).catch(() => {});
    }
}

function acceptAll() {
    saveConsent(true);
    visible.value = false;
}

function savePreferences() {
    saveConsent(analytics.value);
    visible.value = false;
}

onMounted(() => {
    if (!hasConsented()) {
        visible.value = true;
    }
});
</script>

<style scoped>
.cookie-banner-enter-active,
.cookie-banner-leave-active {
    transition: all 0.3s ease;
}
.cookie-banner-enter-from,
.cookie-banner-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>
