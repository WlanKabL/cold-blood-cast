<template>
    <div class="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        <!-- Success / Cancel Banners -->
        <div
            v-if="route.query.subscription === 'success'"
            class="glass-card flex items-center gap-3 border-green-500/30 bg-green-500/5 p-4"
        >
            <Icon name="lucide:check-circle" class="h-5 w-5 text-green-400" />
            <p class="text-[13px] text-green-400">{{ $t("pages.pricing.subscriptionSuccess") }}</p>
        </div>
        <div
            v-if="route.query.subscription === 'canceled'"
            class="glass-card flex items-center gap-3 border-amber-500/30 bg-amber-500/5 p-4"
        >
            <Icon name="lucide:info" class="h-5 w-5 text-amber-400" />
            <p class="text-[13px] text-amber-400">{{ $t("pages.pricing.subscriptionCanceled") }}</p>
        </div>

        <!-- Hero -->
        <div class="animate-fade-in-up text-center">
            <h1 class="text-fg text-3xl font-bold tracking-tight sm:text-4xl">
                {{ $t("pages.pricing.title") }}
            </h1>
            <p class="text-fg-muted mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed">
                {{ $t("pages.pricing.subtitle") }}
            </p>
        </div>

        <!-- Payments Unavailable -->
        <div
            v-if="!paymentsActive"
            class="glass-card mx-auto max-w-xl border-amber-500/20 bg-amber-500/5 p-4 text-center"
        >
            <Icon name="lucide:lock" class="text-fg-faint mx-auto mb-2 h-8 w-8" />
            <p class="text-fg-muted text-[13px]">
                {{ $t("pages.pricing.paymentsUnavailable") }}
            </p>
        </div>

        <!-- Billing Toggle -->
        <div class="flex items-center justify-center gap-3">
            <button
                class="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                :class="
                    billingCycle === 'monthly'
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-fg-muted hover:text-fg'
                "
                @click="billingCycle = 'monthly'"
            >
                {{ $t("pages.pricing.monthly") }}
            </button>
            <button
                class="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                :class="
                    billingCycle === 'yearly'
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-fg-muted hover:text-fg'
                "
                @click="billingCycle = 'yearly'"
            >
                {{ $t("pages.pricing.yearly") }}
                <span
                    class="ml-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400"
                    >{{ $t("pages.pricing.save17") }}</span
                >
            </button>
        </div>

        <!-- Plan Cards -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <!-- Free -->
            <div class="glass-card flex flex-col rounded-2xl p-6">
                <div class="mb-6">
                    <h3 class="text-fg text-lg font-bold">{{ $t("pages.pricing.freeName") }}</h3>
                    <p class="text-fg-faint mt-1 text-[12px]">
                        {{ $t("pages.pricing.freeDesc") }}
                    </p>
                </div>
                <div class="mb-6">
                    <span class="text-fg text-4xl font-bold">{{
                        $t("pages.pricing.freePrice")
                    }}</span>
                    <span class="text-fg-faint ml-1 text-sm">{{
                        $t("pages.pricing.forever")
                    }}</span>
                </div>
                <ul class="mb-8 flex-1 space-y-2.5">
                    <li
                        v-for="f in freeFeatures"
                        :key="f"
                        class="text-fg-muted flex items-start gap-2 text-[13px]"
                    >
                        <Icon name="lucide:check" class="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                        <span>{{ f }}</span>
                    </li>
                </ul>
                <UiButton
                    v-if="effectiveTier === 'free'"
                    variant="secondary"
                    class="w-full"
                    disabled
                >
                    {{ $t("pages.pricing.currentPlan") }}
                </UiButton>
                <UiButton v-else variant="secondary" class="w-full" disabled>
                    {{ $t("pages.pricing.freePlan") }}
                </UiButton>
            </div>

            <!-- Premium -->
            <div
                class="glass-card border-primary-500/30 ring-primary-500/20 relative flex flex-col rounded-2xl p-6 ring-1"
            >
                <span
                    class="bg-primary-500 absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase"
                >
                    {{ $t("pages.pricing.popular") }}
                </span>
                <div class="mb-6">
                    <h3 class="text-fg text-lg font-bold">
                        {{ $t("pages.pricing.premiumName") }}
                    </h3>
                    <p class="text-fg-faint mt-1 text-[12px]">
                        {{ $t("pages.pricing.premiumDesc") }}
                    </p>
                </div>
                <div class="mb-6">
                    <span class="text-fg text-4xl font-bold">{{
                        billingCycle === "monthly"
                            ? $t("pages.pricing.premiumMonthly")
                            : $t("pages.pricing.premiumYearly")
                    }}</span>
                    <span class="text-fg-faint ml-1 text-sm">{{
                        billingCycle === "monthly"
                            ? $t("pages.pricing.perMonth")
                            : $t("pages.pricing.perYear")
                    }}</span>
                </div>
                <ul class="mb-8 flex-1 space-y-2.5">
                    <li
                        v-for="f in premiumFeatures"
                        :key="f"
                        class="text-fg-muted flex items-start gap-2 text-[13px]"
                    >
                        <Icon name="lucide:check" class="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                        <span>{{ f }}</span>
                    </li>
                </ul>
                <UiButton
                    v-if="effectiveTier === 'premium'"
                    variant="secondary"
                    class="w-full"
                    disabled
                >
                    {{ $t("pages.pricing.currentPlan") }}
                </UiButton>
                <UiButton
                    v-else
                    class="w-full"
                    :loading="subscribing"
                    :disabled="!paymentsActive"
                    @click="
                        subscribe(billingCycle === 'monthly' ? 'premium_monthly' : 'premium_yearly')
                    "
                >
                    {{ $t("pages.pricing.upgrade") }}
                </UiButton>
            </div>

            <!-- Pro -->
            <div class="glass-card flex flex-col rounded-2xl border-amber-500/20 p-6">
                <div class="mb-6">
                    <h3 class="text-fg text-lg font-bold">{{ $t("pages.pricing.proName") }}</h3>
                    <p class="text-fg-faint mt-1 text-[12px]">
                        {{ $t("pages.pricing.proDesc") }}
                    </p>
                </div>
                <div class="mb-6">
                    <span class="text-fg text-4xl font-bold">{{
                        billingCycle === "monthly"
                            ? $t("pages.pricing.proMonthly")
                            : $t("pages.pricing.proYearly")
                    }}</span>
                    <span class="text-fg-faint ml-1 text-sm">{{
                        billingCycle === "monthly"
                            ? $t("pages.pricing.perMonth")
                            : $t("pages.pricing.perYear")
                    }}</span>
                </div>
                <ul class="mb-8 flex-1 space-y-2.5">
                    <li
                        v-for="f in proFeatures"
                        :key="f"
                        class="text-fg-muted flex items-start gap-2 text-[13px]"
                    >
                        <Icon name="lucide:check" class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <span>{{ f }}</span>
                    </li>
                </ul>
                <UiButton
                    v-if="effectiveTier === 'pro'"
                    variant="secondary"
                    class="w-full"
                    disabled
                >
                    {{ $t("pages.pricing.currentPlan") }}
                </UiButton>
                <UiButton
                    v-else
                    variant="secondary"
                    class="w-full"
                    :loading="subscribing"
                    :disabled="!paymentsActive"
                    @click="subscribe(billingCycle === 'monthly' ? 'pro_monthly' : 'pro_yearly')"
                >
                    {{ $t("pages.pricing.upgrade") }}
                </UiButton>
            </div>
        </div>

        <!-- Lifetime Banner -->
        <div
            class="glass-card mx-auto flex max-w-2xl flex-col items-center gap-4 border-amber-500/20 p-6 sm:flex-row"
        >
            <div class="flex-1 text-center sm:text-left">
                <h3 class="text-fg text-lg font-bold">
                    {{ $t("pages.pricing.lifetimeTitle") }}
                </h3>
                <p class="text-fg-muted mt-1 text-[13px]">
                    {{ $t("pages.pricing.lifetimeDesc") }}
                </p>
            </div>
            <UiButton
                :loading="subscribing"
                :disabled="!paymentsActive || effectiveTier === 'pro'"
                @click="subscribe('pro_lifetime')"
            >
                {{ $t("pages.pricing.lifetimeCta") }}
            </UiButton>
        </div>

        <!-- Feature Comparison Table -->
        <div class="glass-card overflow-x-auto">
            <table class="w-full text-left text-[13px]">
                <thead>
                    <tr class="border-line border-b">
                        <th class="text-fg-muted px-5 py-4 font-medium">
                            {{ $t("pages.pricing.feature") }}
                        </th>
                        <th class="text-fg-muted px-5 py-4 text-center font-medium">
                            {{ $t("pages.pricing.freeName") }}
                        </th>
                        <th class="text-primary-400 px-5 py-4 text-center font-medium">
                            {{ $t("pages.pricing.premiumName") }}
                        </th>
                        <th class="px-5 py-4 text-center font-medium text-amber-400">
                            {{ $t("pages.pricing.proName") }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="row in comparisonRows"
                        :key="row.label"
                        class="border-line border-b last:border-0"
                    >
                        <td class="text-fg-muted px-5 py-3">{{ row.label }}</td>
                        <td class="px-5 py-3 text-center">
                            <template v-if="typeof row.free === 'boolean'">
                                <Icon
                                    v-if="row.free"
                                    name="lucide:check"
                                    class="mx-auto h-4 w-4 text-green-400"
                                />
                                <Icon
                                    v-else
                                    name="lucide:x"
                                    class="text-fg-ghost mx-auto h-4 w-4"
                                />
                            </template>
                            <span v-else class="text-fg-faint text-[12px]">{{ row.free }}</span>
                        </td>
                        <td class="px-5 py-3 text-center">
                            <template v-if="typeof row.premium === 'boolean'">
                                <Icon
                                    v-if="row.premium"
                                    name="lucide:check"
                                    class="mx-auto h-4 w-4 text-violet-400"
                                />
                                <Icon
                                    v-else
                                    name="lucide:x"
                                    class="text-fg-ghost mx-auto h-4 w-4"
                                />
                            </template>
                            <span v-else class="text-fg-faint text-[12px]">{{ row.premium }}</span>
                        </td>
                        <td class="px-5 py-3 text-center">
                            <template v-if="typeof row.pro === 'boolean'">
                                <Icon
                                    v-if="row.pro"
                                    name="lucide:check"
                                    class="mx-auto h-4 w-4 text-amber-400"
                                />
                                <Icon
                                    v-else
                                    name="lucide:x"
                                    class="text-fg-ghost mx-auto h-4 w-4"
                                />
                            </template>
                            <span v-else class="text-fg-faint text-[12px]">{{ row.pro }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Manage Subscription (for paid users) -->
        <div v-if="effectiveTier !== 'free' && paymentsActive" class="text-center">
            <UiButton variant="ghost" :loading="portalLoading" @click="openPortal">
                {{ $t("pages.pricing.manageSubscription") }}
            </UiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

const { t } = useI18n();
const route = useRoute();
const api = useApi();
const authStore = useAuthStore();
const toast = useAppToast();

useHead({ title: () => t("pages.pricing.title") });

const billingCycle = ref<"monthly" | "yearly">("monthly");
const subscribing = ref(false);
const portalLoading = ref(false);

const { data: availability } = useQuery({
    queryKey: ["subscription-availability"],
    queryFn: () => api.get<{ paymentsActive: boolean }>("/api/subscriptions/availability"),
});

const paymentsActive = computed(() => availability.value?.paymentsActive ?? false);

const effectiveTier = computed(() => {
    if (authStore.hasRole("ADMIN") || authStore.hasRole("PRO")) return "pro";
    if (authStore.hasRole("PREMIUM")) return "premium";
    return "free";
});

const freeFeatures = computed(() => [
    t("pages.pricing.features.enclosures", { n: 2 }),
    t("pages.pricing.features.pets", { n: 5 }),
    t("pages.pricing.features.sensors", { n: 4 }),
    t("pages.pricing.features.feedings"),
    t("pages.pricing.features.weights"),
    t("pages.pricing.features.sheddings"),
    t("pages.pricing.features.dashboard"),
]);

const premiumFeatures = computed(() => [
    t("pages.pricing.features.allFree"),
    t("pages.pricing.features.enclosures", { n: 10 }),
    t("pages.pricing.features.pets", { n: 30 }),
    t("pages.pricing.features.sensors", { n: 10 }),
    t("pages.pricing.features.vetVisits"),
    t("pages.pricing.features.photos"),
    t("pages.pricing.features.planner"),
    t("pages.pricing.features.maintenance"),
    t("pages.pricing.features.publicProfile"),
    t("pages.pricing.features.documents"),
]);

const proFeatures = computed(() => [
    t("pages.pricing.features.allPremium"),
    t("pages.pricing.features.unlimitedAll"),
    t("pages.pricing.features.apiAccess"),
    t("pages.pricing.features.advancedAnalytics"),
    t("pages.pricing.features.prioritySupport"),
]);

const comparisonRows = computed(() => [
    {
        label: t("pages.pricing.comparison.enclosures"),
        free: "2",
        premium: "10",
        pro: t("pages.pricing.unlimited"),
    },
    {
        label: t("pages.pricing.comparison.pets"),
        free: "5",
        premium: "30",
        pro: t("pages.pricing.unlimited"),
    },
    {
        label: t("pages.pricing.comparison.sensors"),
        free: "4 / enc.",
        premium: "10 / enc.",
        pro: t("pages.pricing.unlimited"),
    },
    { label: t("pages.pricing.comparison.feedings"), free: true, premium: true, pro: true },
    { label: t("pages.pricing.comparison.weights"), free: true, premium: true, pro: true },
    { label: t("pages.pricing.comparison.sheddings"), free: true, premium: true, pro: true },
    { label: t("pages.pricing.comparison.dashboard"), free: true, premium: true, pro: true },
    { label: t("pages.pricing.comparison.vetVisits"), free: false, premium: true, pro: true },
    { label: t("pages.pricing.comparison.photos"), free: false, premium: true, pro: true },
    { label: t("pages.pricing.comparison.planner"), free: false, premium: true, pro: true },
    { label: t("pages.pricing.comparison.maintenance"), free: false, premium: true, pro: true },
    { label: t("pages.pricing.comparison.publicProfile"), free: false, premium: true, pro: true },
    { label: t("pages.pricing.comparison.documents"), free: false, premium: true, pro: true },
    { label: t("pages.pricing.comparison.apiAccess"), free: false, premium: false, pro: true },
]);

async function subscribe(plan: string) {
    subscribing.value = true;
    try {
        const data = await api.post<{ checkoutUrl: string }>("/api/subscriptions/checkout", {
            plan,
        });
        window.location.href = data.checkoutUrl;
    } catch {
        toast.error(t("common.error"));
    } finally {
        subscribing.value = false;
    }
}

async function openPortal() {
    portalLoading.value = true;
    try {
        const data = await api.post<{ portalUrl: string }>("/api/subscriptions/portal", {});
        window.location.href = data.portalUrl;
    } catch {
        toast.error(t("common.error"));
    } finally {
        portalLoading.value = false;
    }
}
</script>
