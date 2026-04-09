<template>
    <div class="flex min-h-[80vh] items-center justify-center px-4">
        <div class="w-full max-w-md">
            <!-- Loading State -->
            <div v-if="loading" class="glass-card p-8 text-center">
                <Icon
                    name="lucide:loader-2"
                    class="text-accent mx-auto mb-4 h-12 w-12 animate-spin"
                />
                <p class="text-fg-muted text-[14px]">{{ $t("pages.unsubscribe.processing") }}</p>
            </div>

            <!-- Success: Unsubscribed -->
            <div v-else-if="success && action === 'unsubscribe'" class="glass-card p-8 text-center">
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
                >
                    <Icon name="lucide:mail-x" class="h-8 w-8 text-green-400" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">
                    {{ $t("pages.unsubscribe.successTitle") }}
                </h1>
                <p class="text-fg-muted mb-6 text-[14px]">
                    {{ $t("pages.unsubscribe.successMessage") }}
                </p>

                <!-- Resubscribe option -->
                <div class="border-line bg-surface mb-6 rounded-xl border p-4">
                    <p class="text-fg-muted mb-3 text-[13px]">
                        {{ $t("pages.unsubscribe.resubscribeHint") }}
                    </p>
                    <button
                        :disabled="resubscribing"
                        class="border-accent/50 bg-accent/10 text-accent hover:bg-accent/20 w-full rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-all disabled:opacity-50"
                        @click="resubscribe"
                    >
                        <Icon
                            v-if="resubscribing"
                            name="lucide:loader-2"
                            class="mr-2 inline h-4 w-4 animate-spin"
                        />
                        <Icon v-else name="lucide:bell" class="mr-2 inline h-4 w-4" />
                        {{ $t("pages.unsubscribe.resubscribeButton") }}
                    </button>
                </div>

                <NuxtLink
                    to="/settings"
                    class="text-fg-muted hover:text-fg inline-flex items-center text-[13px]"
                >
                    <Icon name="lucide:settings" class="mr-1.5 h-4 w-4" />
                    {{ $t("pages.unsubscribe.goToSettings") }}
                </NuxtLink>
            </div>

            <!-- Success: Resubscribed -->
            <div v-else-if="success && action === 'resubscribe'" class="glass-card p-8 text-center">
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
                >
                    <Icon name="lucide:bell" class="h-8 w-8 text-green-400" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">
                    {{ $t("pages.unsubscribe.resubscribeSuccessTitle") }}
                </h1>
                <p class="text-fg-muted mb-6 text-[14px]">
                    {{ $t("pages.unsubscribe.resubscribeSuccessMessage") }}
                </p>

                <NuxtLink
                    to="/dashboard"
                    class="bg-accent hover:bg-accent/90 inline-flex items-center rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-all"
                >
                    <Icon name="lucide:layout-dashboard" class="mr-2 h-4 w-4" />
                    {{ $t("pages.unsubscribe.goToDashboard") }}
                </NuxtLink>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="glass-card p-8 text-center">
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10"
                >
                    <Icon name="lucide:alert-circle" class="h-8 w-8 text-red-400" />
                </div>
                <h1 class="text-fg mb-2 text-xl font-bold">
                    {{ $t("pages.unsubscribe.errorTitle") }}
                </h1>
                <p class="text-fg-muted mb-6 text-[14px]">
                    {{ error }}
                </p>

                <NuxtLink
                    to="/settings"
                    class="bg-accent hover:bg-accent/90 inline-flex items-center rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-all"
                >
                    <Icon name="lucide:settings" class="mr-2 h-4 w-4" />
                    {{ $t("pages.unsubscribe.manageInSettings") }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface UnsubscribeResponse {
    success: boolean;
    message?: string;
    resubscribeUrl?: string;
}

definePageMeta({
    auth: false, // Allow unauthenticated access
    layout: "default",
});

const { t } = useI18n();
const route = useRoute();
const api = useApi();

useHead({ title: () => t("pages.unsubscribe.title") });

const loading = ref(true);
const success = ref(false);
const error = ref("");
const action = ref<"unsubscribe" | "resubscribe">("unsubscribe");
const resubscribeUrl = ref("");
const resubscribing = ref(false);

async function processToken() {
    const token = route.query.token as string | undefined;
    const queryAction = route.query.action as string | undefined;

    if (!token) {
        error.value = t("pages.unsubscribe.noToken");
        loading.value = false;
        return;
    }

    action.value = queryAction === "resubscribe" ? "resubscribe" : "unsubscribe";

    try {
        if (action.value === "resubscribe") {
            await api.get<UnsubscribeResponse>(`/api/email/resubscribe?token=${token}`);
        } else {
            const result = await api.get<UnsubscribeResponse>(
                `/api/email/unsubscribe?token=${token}`,
            );
            if (result.resubscribeUrl) {
                resubscribeUrl.value = result.resubscribeUrl;
            }
        }
        success.value = true;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("pages.unsubscribe.genericError");
    } finally {
        loading.value = false;
    }
}

async function resubscribe() {
    if (!resubscribeUrl.value) return;

    resubscribing.value = true;
    try {
        // Extract token from URL and call API
        const url = new URL(resubscribeUrl.value);
        const token = url.searchParams.get("token");
        if (token) {
            await api.get<UnsubscribeResponse>(`/api/email/resubscribe?token=${token}`);
            action.value = "resubscribe";
        }
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : t("pages.unsubscribe.genericError");
        success.value = false;
    } finally {
        resubscribing.value = false;
    }
}

onMounted(() => {
    processToken();
});
</script>
