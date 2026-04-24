<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("admin.marketing.title") }}
            </h1>
            <p class="text-fg-muted mt-1 text-[13px]">
                {{ $t("admin.marketing.subtitle") }}
            </p>
        </div>

        <!-- Tabs (plain buttons for predictable a11y & testing) -->
        <div role="tablist" class="border-line flex gap-2 border-b">
            <button
                v-for="(t, i) in tabs"
                :key="i"
                type="button"
                role="tab"
                :aria-selected="tabIndex === i"
                class="text-fg-muted hover:text-fg border-b-2 px-3 py-2 text-sm transition"
                :class="
                    tabIndex === i ? 'text-fg border-primary-500' : 'border-transparent'
                "
                @click="tabIndex = i"
            >
                {{ t.label }}
            </button>
        </div>

        <!-- Overview tab -->
        <div v-if="tabIndex === 0" class="space-y-6">
            <div v-if="overviewLoading" class="text-fg-muted text-sm">{{ $t("common.loading") }}</div>
            <div v-else-if="overview" class="space-y-6">
                <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div class="glass-card p-4">
                        <p class="text-fg-muted text-[11px] uppercase">
                            {{ $t("admin.marketing.totals.landings") }}
                        </p>
                        <p class="text-fg text-2xl font-bold">{{ overview.totals.landings }}</p>
                    </div>
                    <div class="glass-card p-4">
                        <p class="text-fg-muted text-[11px] uppercase">
                            {{ $t("admin.marketing.totals.attributedUsers") }}
                        </p>
                        <p class="text-fg text-2xl font-bold">
                            {{ overview.totals.attributedUsers }}
                        </p>
                    </div>
                    <div class="glass-card p-4">
                        <p class="text-fg-muted text-[11px] uppercase">
                            {{ $t("admin.marketing.totals.registrationEvents") }}
                        </p>
                        <p class="text-fg text-2xl font-bold">
                            {{ overview.totals.registrationEvents }}
                        </p>
                    </div>
                    <div class="glass-card p-4">
                        <p class="text-fg-muted text-[11px] uppercase">Pixel / CAPI</p>
                        <p class="text-fg text-sm">
                            Pixel: {{ overview.config.metaPixelEnabled ? "✅" : "❌" }}<br />
                            CAPI: {{ overview.config.metaCapiEnabled ? "✅" : "❌" }}<br />
                            Dry run: {{ overview.config.metaCapiDryRun ? "✅" : "❌" }}
                        </p>
                    </div>
                </div>

                <div class="glass-card p-4">
                    <h2 class="text-fg mb-3 text-sm font-semibold">
                        {{ $t("admin.marketing.eventStatus") }}
                    </h2>
                    <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div
                            v-for="(count, status) in overview.eventStatusCounts"
                            :key="status"
                            class="border-line rounded-lg border p-3"
                        >
                            <p class="text-fg-muted text-[11px] uppercase">{{ status }}</p>
                            <p class="text-fg text-lg font-semibold">{{ count }}</p>
                        </div>
                    </div>
                </div>

                <div class="glass-card overflow-x-auto p-4">
                    <h2 class="text-fg mb-3 text-sm font-semibold">
                        {{ $t("admin.marketing.campaigns") }}
                    </h2>
                    <table class="w-full text-left text-xs">
                        <thead class="text-fg-muted">
                            <tr>
                                <th class="py-2">utm_source</th>
                                <th class="py-2">utm_campaign</th>
                                <th class="py-2">utm_content</th>
                                <th class="py-2 text-right">{{ $t("admin.marketing.signups") }}</th>
                                <th class="py-2 text-right">
                                    {{ $t("admin.marketing.activated") }}
                                </th>
                                <th class="py-2 text-right">
                                    {{ $t("admin.marketing.activationRate") }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(c, i) in overview.campaigns"
                                :key="i"
                                class="border-line border-t"
                            >
                                <td class="py-2">{{ c.utmSource ?? "(direct)" }}</td>
                                <td class="py-2">{{ c.utmCampaign ?? "—" }}</td>
                                <td class="py-2">{{ c.utmContent ?? "—" }}</td>
                                <td class="py-2 text-right">{{ c.signups }}</td>
                                <td class="py-2 text-right">{{ c.activated }}</td>
                                <td class="py-2 text-right">
                                    {{ (c.activationRate * 100).toFixed(1) }}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Users tab -->
        <div v-if="tabIndex === 1" class="space-y-3">
            <div v-if="usersLoading" class="text-fg-muted text-sm">{{ $t("common.loading") }}</div>
            <div v-else-if="users" class="glass-card overflow-x-auto p-4">
                <table class="w-full text-left text-xs">
                    <thead class="text-fg-muted">
                        <tr>
                            <th class="py-2">{{ $t("admin.marketing.user") }}</th>
                            <th class="py-2">utm_source</th>
                            <th class="py-2">utm_campaign</th>
                            <th class="py-2">referrer</th>
                            <th class="py-2">{{ $t("admin.marketing.boundAt") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in users.items" :key="row.userId" class="border-line border-t">
                            <td class="py-2">{{ row.username }} <span class="text-fg-muted">({{ row.email }})</span></td>
                            <td class="py-2">{{ row.utmSource ?? "—" }}</td>
                            <td class="py-2">{{ row.utmCampaign ?? "—" }}</td>
                            <td class="py-2 max-w-xs truncate">{{ row.referrer ?? "—" }}</td>
                            <td class="py-2">{{ formatDate(row.boundAt) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Events tab -->
        <div v-if="tabIndex === 2" class="space-y-3">
            <div v-if="eventsLoading" class="text-fg-muted text-sm">{{ $t("common.loading") }}</div>
            <div v-else-if="events" class="glass-card overflow-x-auto p-4">
                <table class="w-full text-left text-xs">
                    <thead class="text-fg-muted">
                        <tr>
                            <th class="py-2">event_name</th>
                            <th class="py-2">source</th>
                            <th class="py-2">consent</th>
                            <th class="py-2">status</th>
                            <th class="py-2">attempts</th>
                            <th class="py-2">created_at</th>
                            <th class="py-2">last_error</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in events.items" :key="row.id" class="border-line border-t">
                            <td class="py-2">{{ row.eventName }}</td>
                            <td class="py-2">{{ row.eventSource }}</td>
                            <td class="py-2">{{ row.consentState }}</td>
                            <td class="py-2">{{ row.status }}</td>
                            <td class="py-2">{{ row.attemptCount }}</td>
                            <td class="py-2">{{ formatDate(row.createdAt) }}</td>
                            <td class="py-2 text-rose-400">{{ row.lastErrorCode ?? "—" }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {
    MarketingOverviewResponse,
    MarketingAttributionRow,
    MarketingEventRow,
} from "@cold-blood-cast/shared";

definePageMeta({ layout: "admin" });

const api = useApi();
const { t } = useI18n();

const tabs = computed(() => [
    { label: t("admin.marketing.tabs.overview") },
    { label: t("admin.marketing.tabs.users") },
    { label: t("admin.marketing.tabs.events") },
]);
const tabIndex = ref(0);

const overview = ref<MarketingOverviewResponse | null>(null);
const overviewLoading = ref(false);
const users = ref<{ items: MarketingAttributionRow[]; total: number } | null>(null);
const usersLoading = ref(false);
const events = ref<{ items: MarketingEventRow[]; total: number } | null>(null);
const eventsLoading = ref(false);

async function loadOverview() {
    overviewLoading.value = true;
    try {
        overview.value = await api.get<MarketingOverviewResponse>("/api/admin/marketing/overview");
    } finally {
        overviewLoading.value = false;
    }
}

async function loadUsers() {
    usersLoading.value = true;
    try {
        users.value = await api.get<{ items: MarketingAttributionRow[]; total: number }>(
            "/api/admin/marketing/users?page=1&pageSize=50",
        );
    } finally {
        usersLoading.value = false;
    }
}

async function loadEvents() {
    eventsLoading.value = true;
    try {
        events.value = await api.get<{ items: MarketingEventRow[]; total: number }>(
            "/api/admin/marketing/events?page=1&pageSize=100",
        );
    } finally {
        eventsLoading.value = false;
    }
}

watch(tabIndex, (idx) => {
    if (idx === 0 && !overview.value) loadOverview();
    if (idx === 1 && !users.value) loadUsers();
    if (idx === 2 && !events.value) loadEvents();
});

function formatDate(s: string): string {
    try {
        return new Date(s).toLocaleString();
    } catch {
        return s;
    }
}

onMounted(loadOverview);
</script>
