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
                            <th class="py-2 text-right">{{ $t("admin.marketing.queue.actions") }}</th>
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
                            <td class="py-2 text-right">
                                <button
                                    v-if="row.status === 'failed' && row.eventSource === 'server'"
                                    type="button"
                                    class="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                                    :disabled="retryingId === row.id"
                                    @click="retryEvent(row.id)"
                                >
                                    {{
                                        retryingId === row.id
                                            ? $t("common.loading")
                                            : $t("admin.marketing.queue.retry")
                                    }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Settings tab -->
        <div v-if="tabIndex === 3" class="space-y-4">
            <div v-if="settingsLoading" class="text-fg-muted text-sm">
                {{ $t("common.loading") }}
            </div>
            <div v-else-if="settings" class="glass-card max-w-2xl space-y-5 p-5">
                <div>
                    <h2 class="text-fg text-sm font-semibold">
                        {{ $t("admin.marketing.settings.title") }}
                    </h2>
                    <p class="text-fg-muted mt-1 text-xs">
                        {{ $t("admin.marketing.settings.subtitle") }}
                    </p>
                </div>

                <!-- Pixel ID -->
                <div class="space-y-1">
                    <label class="text-fg block text-sm font-medium">
                        {{ $t("admin.marketing.settings.pixelId") }}
                    </label>
                    <input
                        v-model="settingsForm.metaPixelId"
                        type="text"
                        :placeholder="settings.metaPixelId ?? '—'"
                        class="border-line bg-card-bg text-fg w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <p class="text-fg-soft text-[11px]">
                        {{ $t("admin.marketing.settings.pixelIdHint") }}
                    </p>
                </div>

                <!-- Pixel enabled tri-state -->
                <div class="space-y-1">
                    <label class="text-fg block text-sm font-medium">
                        {{ $t("admin.marketing.settings.pixelEnabled") }}
                    </label>
                    <select
                        v-model="settingsForm.metaPixelEnabled"
                        class="border-line bg-card-bg text-fg w-full rounded-lg border px-3 py-2 text-sm"
                    >
                        <option :value="null">
                            {{ $t("admin.marketing.settings.useEnv") }}
                        </option>
                        <option :value="true">{{ $t("common.enabled") }}</option>
                        <option :value="false">{{ $t("common.disabled") }}</option>
                    </select>
                </div>

                <!-- CAPI enabled -->
                <div class="space-y-1">
                    <label class="text-fg block text-sm font-medium">
                        {{ $t("admin.marketing.settings.capiEnabled") }}
                    </label>
                    <select
                        v-model="settingsForm.metaCapiEnabled"
                        class="border-line bg-card-bg text-fg w-full rounded-lg border px-3 py-2 text-sm"
                    >
                        <option :value="null">
                            {{ $t("admin.marketing.settings.useEnv") }}
                        </option>
                        <option :value="true">{{ $t("common.enabled") }}</option>
                        <option :value="false">{{ $t("common.disabled") }}</option>
                    </select>
                    <p
                        v-if="!settings.metaAccessTokenConfigured"
                        class="text-amber-400 text-[11px]"
                    >
                        {{ $t("admin.marketing.settings.tokenMissing") }}
                    </p>
                </div>

                <!-- CAPI dry run -->
                <div class="space-y-1">
                    <label class="text-fg block text-sm font-medium">
                        {{ $t("admin.marketing.settings.capiDryRun") }}
                    </label>
                    <select
                        v-model="settingsForm.metaCapiDryRun"
                        class="border-line bg-card-bg text-fg w-full rounded-lg border px-3 py-2 text-sm"
                    >
                        <option :value="null">
                            {{ $t("admin.marketing.settings.useEnv") }}
                        </option>
                        <option :value="true">{{ $t("common.enabled") }}</option>
                        <option :value="false">{{ $t("common.disabled") }}</option>
                    </select>
                </div>

                <!-- Test event code -->
                <div class="space-y-1">
                    <label class="text-fg block text-sm font-medium">
                        {{ $t("admin.marketing.settings.testEventCode") }}
                    </label>
                    <input
                        v-model="settingsForm.metaTestEventCode"
                        type="text"
                        :placeholder="settings.metaTestEventCode ?? '—'"
                        class="border-line bg-card-bg text-fg w-full rounded-lg border px-3 py-2 text-sm"
                    />
                </div>

                <div class="flex gap-2 pt-2">
                    <button
                        type="button"
                        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        :disabled="settingsSaving"
                        @click="saveSettings"
                    >
                        {{ settingsSaving ? $t("common.loading") : $t("common.save") }}
                    </button>
                    <button
                        type="button"
                        class="border-line text-fg-muted hover:bg-hover rounded-lg border px-4 py-2 text-sm transition"
                        @click="loadSettings"
                    >
                        {{ $t("common.cancel") }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Queue tab -->
        <div v-if="tabIndex === 4" class="space-y-4">
            <div v-if="queueLoading" class="text-fg-muted text-sm">{{ $t("common.loading") }}</div>
            <div v-else-if="queueHealth" class="space-y-4">
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <div
                        v-for="(count, key) in queueHealth.counts"
                        :key="key"
                        class="glass-card p-3"
                    >
                        <p class="text-fg-muted text-[11px] uppercase">{{ key }}</p>
                        <p class="text-fg text-xl font-bold">{{ count }}</p>
                    </div>
                </div>
                <div v-if="queueHealth.paused" class="text-amber-400 text-sm">
                    {{ $t("admin.marketing.queue.paused") }}
                </div>
                <div class="glass-card overflow-x-auto p-4">
                    <h2 class="text-fg mb-3 text-sm font-semibold">
                        {{ $t("admin.marketing.queue.recentFailures") }}
                    </h2>
                    <div
                        v-if="queueHealth.failedJobs.length === 0"
                        class="text-fg-muted text-xs"
                    >
                        {{ $t("admin.marketing.queue.noFailures") }}
                    </div>
                    <table v-else class="w-full text-left text-xs">
                        <thead class="text-fg-muted">
                            <tr>
                                <th class="py-2">job_id</th>
                                <th class="py-2">attempts</th>
                                <th class="py-2">timestamp</th>
                                <th class="py-2">reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="job in queueHealth.failedJobs"
                                :key="job.id"
                                class="border-line border-t"
                            >
                                <td class="py-2 font-mono">{{ job.id }}</td>
                                <td class="py-2">{{ job.attemptsMade }}</td>
                                <td class="py-2">{{ formatDate(job.timestamp) }}</td>
                                <td class="py-2 text-rose-400 max-w-md truncate">
                                    {{ job.failedReason ?? "—" }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <button
                    type="button"
                    class="border-line text-fg-muted hover:bg-hover rounded-lg border px-3 py-1.5 text-xs"
                    @click="loadQueueHealth"
                >
                    {{ $t("common.refresh") }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {
    MarketingOverviewResponse,
    MarketingAttributionRow,
    MarketingEventRow,
    MarketingSettingsResponse,
    MarketingSettingsUpdateInput,
    MarketingQueueHealth,
} from "@cold-blood-cast/shared";

definePageMeta({ layout: "admin" });

const api = useApi();
const toast = useAppToast();
const { t } = useI18n();

const tabs = computed(() => [
    { label: t("admin.marketing.tabs.overview") },
    { label: t("admin.marketing.tabs.users") },
    { label: t("admin.marketing.tabs.events") },
    { label: t("admin.marketing.tabs.settings") },
    { label: t("admin.marketing.tabs.queue") },
]);
const tabIndex = ref(0);

const overview = ref<MarketingOverviewResponse | null>(null);
const overviewLoading = ref(false);
const users = ref<{ items: MarketingAttributionRow[]; total: number } | null>(null);
const usersLoading = ref(false);
const events = ref<{ items: MarketingEventRow[]; total: number } | null>(null);
const eventsLoading = ref(false);

// ── Settings tab state ──
const settings = ref<MarketingSettingsResponse | null>(null);
const settingsLoading = ref(false);
const settingsSaving = ref(false);
const settingsForm = reactive<{
    metaPixelEnabled: boolean | null;
    metaPixelId: string;
    metaCapiEnabled: boolean | null;
    metaCapiDryRun: boolean | null;
    metaTestEventCode: string;
}>({
    metaPixelEnabled: null,
    metaPixelId: "",
    metaCapiEnabled: null,
    metaCapiDryRun: null,
    metaTestEventCode: "",
});

// ── Queue tab state ──
const queueHealth = ref<MarketingQueueHealth | null>(null);
const queueLoading = ref(false);
const retryingId = ref<string | null>(null);

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

async function loadSettings() {
    settingsLoading.value = true;
    try {
        const res = await api.get<MarketingSettingsResponse>("/api/admin/marketing/settings");
        settings.value = res;
        settingsForm.metaPixelEnabled = res.overrides.metaPixelEnabled
            ? res.metaPixelEnabled
            : null;
        settingsForm.metaPixelId = res.overrides.metaPixelId ? (res.metaPixelId ?? "") : "";
        settingsForm.metaCapiEnabled = res.overrides.metaCapiEnabled ? res.metaCapiEnabled : null;
        settingsForm.metaCapiDryRun = res.overrides.metaCapiDryRun ? res.metaCapiDryRun : null;
        settingsForm.metaTestEventCode = res.overrides.metaTestEventCode
            ? (res.metaTestEventCode ?? "")
            : "";
    } finally {
        settingsLoading.value = false;
    }
}

async function saveSettings() {
    settingsSaving.value = true;
    try {
        const payload: MarketingSettingsUpdateInput = {
            metaPixelEnabled: settingsForm.metaPixelEnabled,
            metaPixelId:
                settingsForm.metaPixelId.trim().length > 0 ? settingsForm.metaPixelId.trim() : null,
            metaCapiEnabled: settingsForm.metaCapiEnabled,
            metaCapiDryRun: settingsForm.metaCapiDryRun,
            metaTestEventCode:
                settingsForm.metaTestEventCode.trim().length > 0
                    ? settingsForm.metaTestEventCode.trim()
                    : null,
        };
        const res = await api.put<MarketingSettingsResponse>(
            "/api/admin/marketing/settings",
            payload,
        );
        settings.value = res;
        toast.success(t("admin.marketing.settings.saved"));
        // Refresh overview KPI badges and clear sessionStorage so next page load reads fresh values.
        try {
            sessionStorage.removeItem("cbc-marketing-public-config");
        } catch {
            // ignore
        }
        await loadOverview();
    } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
        settingsSaving.value = false;
    }
}

async function loadQueueHealth() {
    queueLoading.value = true;
    try {
        queueHealth.value = await api.get<MarketingQueueHealth>(
            "/api/admin/marketing/queue-health",
        );
    } finally {
        queueLoading.value = false;
    }
}

async function retryEvent(eventId: string) {
    retryingId.value = eventId;
    try {
        await api.post(`/api/admin/marketing/events/${eventId}/retry`);
        toast.success(t("admin.marketing.queue.retried"));
        await Promise.all([loadEvents(), loadQueueHealth()]);
    } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
        retryingId.value = null;
    }
}

watch(tabIndex, (idx) => {
    if (idx === 0 && !overview.value) loadOverview();
    if (idx === 1 && !users.value) loadUsers();
    if (idx === 2 && !events.value) loadEvents();
    if (idx === 3 && !settings.value) loadSettings();
    if (idx === 4 && !queueHealth.value) loadQueueHealth();
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
