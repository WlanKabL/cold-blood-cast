<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Page Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.planner.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.planner.subtitle") }}</p>
            </div>

            <!-- Week Navigation -->
            <div class="flex items-center gap-2">
                <button
                    class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg rounded-lg border p-2 transition-all"
                    @click="previousWeek"
                >
                    <Icon name="lucide:chevron-left" class="h-4 w-4" />
                </button>
                <button
                    class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg rounded-lg border px-3 py-1.5 text-sm transition-all"
                    @click="goToCurrentWeek"
                >
                    {{ $t("pages.planner.today") }}
                </button>
                <button
                    class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg rounded-lg border p-2 transition-all"
                    @click="nextWeek"
                >
                    <Icon name="lucide:chevron-right" class="h-4 w-4" />
                </button>
                <span class="text-fg-muted ml-2 text-sm font-medium">{{ weekLabel }}</span>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-16">
            <Icon name="lucide:loader-2" class="text-fg-muted h-8 w-8 animate-spin" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card rounded-xl p-8 text-center">
            <Icon name="lucide:alert-triangle" class="text-fg-muted mx-auto mb-3 h-10 w-10" />
            <p class="text-fg-muted text-sm">{{ $t("pages.planner.error") }}</p>
        </div>

        <template v-else-if="days">
            <!-- Week Summary Stats -->
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div class="glass-card rounded-xl p-4">
                    <p class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                        {{ $t("pages.planner.stats.total") }}
                    </p>
                    <p class="text-fg mt-1 text-2xl font-bold">{{ totalEvents }}</p>
                </div>
                <div class="glass-card rounded-xl p-4">
                    <p class="text-xs font-medium uppercase tracking-wider text-red-400">
                        {{ $t("pages.planner.stats.overdue") }}
                    </p>
                    <p class="mt-1 text-2xl font-bold" :class="overdueCount > 0 ? 'text-red-400' : 'text-fg'">
                        {{ overdueCount }}
                    </p>
                </div>
                <div class="glass-card rounded-xl p-4">
                    <p class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                        {{ $t("pages.planner.stats.busiest") }}
                    </p>
                    <p class="text-fg mt-1 text-sm font-semibold">{{ busiestDayLabel || "—" }}</p>
                </div>
                <div class="glass-card rounded-xl p-4">
                    <p class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                        {{ $t("pages.planner.stats.types") }}
                    </p>
                    <div class="mt-1.5 flex items-center gap-2">
                        <template v-for="t in activeTypeCounts" :key="t.type">
                            <span
                                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                                :class="eventBadgeClass(t.type)"
                            >
                                <Icon :name="eventIcon(t.type)" class="h-3 w-3" />
                                {{ t.count }}
                            </span>
                        </template>
                        <span v-if="activeTypeCounts.length === 0" class="text-fg-faint text-sm">—</span>
                    </div>
                </div>
            </div>

            <!-- Two-Panel Layout -->
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <!-- Main: Day Agenda -->
                <div class="space-y-4">
                    <div v-for="day in days" :key="day.date">
                        <!-- Day Header Row -->
                        <div
                            class="mb-2 flex items-center gap-3"
                            :class="{ 'mt-4': day !== days[0] }"
                        >
                            <div
                                class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                                :class="isToday(day.date) ? 'bg-primary-500 text-white' : 'bg-surface text-fg'"
                            >
                                <span class="text-[10px] font-semibold uppercase leading-none">
                                    {{ formatDayName(day.date) }}
                                </span>
                                <span class="text-lg font-bold leading-none">
                                    {{ formatDayNumber(day.date) }}
                                </span>
                            </div>
                            <div class="flex-1">
                                <p
                                    class="text-sm font-semibold"
                                    :class="isToday(day.date) ? 'text-primary-400' : 'text-fg'"
                                >
                                    {{ formatFullDate(day.date) }}
                                    <span v-if="isToday(day.date)" class="text-primary-400 ml-1.5 text-xs font-normal">
                                        {{ $t("pages.planner.todayBadge") }}
                                    </span>
                                </p>
                                <p class="text-fg-faint text-xs">
                                    {{ day.events.length > 0
                                        ? $t("pages.planner.eventCount", { n: day.events.length })
                                        : $t("pages.planner.noTasks")
                                    }}
                                </p>
                            </div>
                        </div>

                        <!-- Event Cards for This Day -->
                        <div v-if="day.events.length > 0" class="ml-15 space-y-2">
                            <button
                                v-for="event in day.events"
                                :key="event.id"
                                class="glass-card flex w-full items-start gap-3 rounded-xl p-4 text-left transition-all hover:ring-1 hover:ring-white/10"
                                :class="selectedEvent?.id === event.id ? 'ring-1 ring-primary-500/40' : ''"
                                @click="selectEvent(event, day.date)"
                            >
                                <div
                                    class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                    :class="eventIconBgClass(event.type)"
                                >
                                    <Icon :name="eventIcon(event.type)" class="h-4 w-4" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-2">
                                        <p class="text-fg text-sm font-semibold">{{ event.title }}</p>
                                        <span
                                            class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                            :class="eventBadgeClass(event.type)"
                                        >
                                            {{ $t(`pages.planner.legend.${eventTypeKey(event.type)}`) }}
                                        </span>
                                        <span
                                            v-if="event.meta?.isOverdue"
                                            class="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400"
                                        >
                                            <Icon name="lucide:alert-circle" class="h-2.5 w-2.5" />
                                            {{ $t("pages.planner.overdue") }}
                                        </span>
                                    </div>
                                    <p v-if="event.detail" class="text-fg-muted mt-0.5 text-xs">
                                        {{ event.detail }}
                                    </p>
                                    <p v-if="event.petName || event.enclosureName" class="text-fg-faint mt-1 flex items-center gap-3 text-xs">
                                        <span v-if="event.petName" class="flex items-center gap-1">
                                            <Icon name="lucide:heart" class="h-3 w-3" />
                                            {{ event.petName }}
                                        </span>
                                        <span v-if="event.enclosureName" class="flex items-center gap-1">
                                            <Icon name="lucide:box" class="h-3 w-3" />
                                            {{ event.enclosureName }}
                                        </span>
                                    </p>
                                </div>
                                <Icon name="lucide:chevron-right" class="text-fg-faint mt-1 h-4 w-4 shrink-0" />
                            </button>
                        </div>

                        <!-- Empty Day -->
                        <div v-else class="ml-15">
                            <div class="border-line rounded-xl border border-dashed px-4 py-3">
                                <p class="text-fg-faint text-xs">{{ $t("pages.planner.noTasks") }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar: Detail Panel (desktop) -->
                <div class="hidden lg:block">
                    <div class="sticky top-6 space-y-4">
                        <!-- Selected Event Detail -->
                        <div v-if="selectedEvent" class="glass-card space-y-4 rounded-xl p-5">
                            <div class="flex items-start justify-between">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="flex h-10 w-10 items-center justify-center rounded-lg"
                                        :class="eventIconBgClass(selectedEvent.type)"
                                    >
                                        <Icon :name="eventIcon(selectedEvent.type)" class="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 class="text-fg text-[16px] font-semibold">
                                            {{ selectedEvent.title }}
                                        </h3>
                                        <span
                                            class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                            :class="eventBadgeClass(selectedEvent.type)"
                                        >
                                            {{ $t(`pages.planner.legend.${eventTypeKey(selectedEvent.type)}`) }}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    class="text-fg-faint hover:text-fg rounded-lg p-1 transition-colors"
                                    @click="selectedEvent = null"
                                >
                                    <Icon name="lucide:x" class="h-4 w-4" />
                                </button>
                            </div>

                            <!-- Details List -->
                            <dl class="space-y-3">
                                <div v-if="selectedEventDate">
                                    <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                        {{ $t("pages.planner.detail.date") }}
                                    </dt>
                                    <dd class="text-fg mt-0.5 text-sm">{{ selectedEventDate }}</dd>
                                </div>
                                <div v-if="selectedEvent.detail">
                                    <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                        {{ $t("pages.planner.detail.info") }}
                                    </dt>
                                    <dd class="text-fg mt-0.5 text-sm">{{ selectedEvent.detail }}</dd>
                                </div>
                                <div v-if="selectedEvent.petName">
                                    <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                        {{ $t("pages.planner.detail.pet") }}
                                    </dt>
                                    <dd class="text-fg mt-0.5 text-sm">{{ selectedEvent.petName }}</dd>
                                </div>
                                <div v-if="selectedEvent.enclosureName">
                                    <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                        {{ $t("pages.planner.detail.enclosure") }}
                                    </dt>
                                    <dd class="text-fg mt-0.5 text-sm">{{ selectedEvent.enclosureName }}</dd>
                                </div>

                                <!-- Type-specific meta -->
                                <template v-if="selectedEvent.type === 'feeding'">
                                    <div v-if="selectedEvent.meta?.status">
                                        <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                            {{ $t("pages.planner.detail.status") }}
                                        </dt>
                                        <dd class="mt-0.5">
                                            <span
                                                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                                :class="feedingStatusClass(selectedEvent.meta.status as string)"
                                            >
                                                {{ $t(`pages.planner.detail.feedingStatus.${selectedEvent.meta.status}`) }}
                                            </span>
                                        </dd>
                                    </div>
                                    <div v-if="selectedEvent.meta?.intervalMin">
                                        <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                            {{ $t("pages.planner.detail.interval") }}
                                        </dt>
                                        <dd class="text-fg mt-0.5 text-sm">
                                            {{ selectedEvent.meta.intervalMin }}–{{ selectedEvent.meta.intervalMax }} {{ $t("pages.planner.detail.days") }}
                                        </dd>
                                    </div>
                                </template>

                                <template v-if="selectedEvent.type === 'vet_visit'">
                                    <div v-if="selectedEvent.meta?.vetName">
                                        <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                            {{ $t("pages.planner.detail.veterinarian") }}
                                        </dt>
                                        <dd class="text-fg mt-0.5 text-sm">
                                            {{ selectedEvent.meta.vetName }}
                                            <span v-if="selectedEvent.meta.clinicName" class="text-fg-muted">
                                                · {{ selectedEvent.meta.clinicName }}
                                            </span>
                                        </dd>
                                    </div>
                                    <div v-if="selectedEvent.meta?.reason">
                                        <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                            {{ $t("pages.planner.detail.reason") }}
                                        </dt>
                                        <dd class="text-fg mt-0.5 text-sm">{{ selectedEvent.meta.reason }}</dd>
                                    </div>
                                    <div v-if="selectedEvent.meta?.isFollowUp">
                                        <dd class="mt-0.5">
                                            <span class="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400">
                                                <Icon name="lucide:repeat" class="h-3 w-3" />
                                                {{ $t("pages.planner.detail.followUp") }}
                                            </span>
                                        </dd>
                                    </div>
                                </template>

                                <template v-if="selectedEvent.type === 'shedding'">
                                    <div v-if="selectedEvent.meta?.averageInterval">
                                        <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                            {{ $t("pages.planner.detail.avgCycle") }}
                                        </dt>
                                        <dd class="text-fg mt-0.5 text-sm">
                                            ~{{ selectedEvent.meta.averageInterval }} {{ $t("pages.planner.detail.days") }}
                                        </dd>
                                    </div>
                                    <div v-if="selectedEvent.meta?.trend">
                                        <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                            {{ $t("pages.planner.detail.trend") }}
                                        </dt>
                                        <dd class="text-fg mt-0.5 text-sm capitalize">
                                            {{ $t(`pages.planner.detail.trends.${selectedEvent.meta.trend}`) }}
                                        </dd>
                                    </div>
                                </template>

                                <template v-if="selectedEvent.type === 'maintenance'">
                                    <div v-if="selectedEvent.meta?.maintenanceType">
                                        <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                            {{ $t("pages.planner.detail.taskType") }}
                                        </dt>
                                        <dd class="text-fg mt-0.5 text-sm">
                                            {{ $t(`pages.maintenance.types.${selectedEvent.meta.maintenanceType}`) }}
                                        </dd>
                                    </div>
                                    <div v-if="selectedEvent.meta?.recurring !== undefined">
                                        <dt class="text-fg-faint text-xs font-medium uppercase tracking-wider">
                                            {{ $t("pages.planner.detail.schedule") }}
                                        </dt>
                                        <dd class="text-fg mt-0.5 text-sm">
                                            {{ selectedEvent.meta.recurring
                                                ? $t("pages.maintenance.recurring")
                                                : $t("pages.maintenance.oneTime")
                                            }}
                                        </dd>
                                    </div>
                                    <div v-if="selectedEvent.meta?.isOverdue">
                                        <dd>
                                            <span class="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                                                <Icon name="lucide:alert-circle" class="h-3 w-3" />
                                                {{ $t("pages.planner.overdue") }}
                                            </span>
                                        </dd>
                                    </div>
                                </template>
                            </dl>

                            <!-- Go-to link -->
                            <NuxtLink
                                v-if="eventLink"
                                :to="eventLink"
                                class="bg-accent/10 text-accent hover:bg-accent/20 mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                            >
                                <Icon name="lucide:external-link" class="h-3.5 w-3.5" />
                                {{ $t("pages.planner.detail.goTo") }}
                            </NuxtLink>
                        </div>

                        <!-- No Selection Hint -->
                        <div v-else class="glass-card rounded-xl p-6 text-center">
                            <Icon name="lucide:pointer" class="text-fg-faint mx-auto mb-3 h-8 w-8" />
                            <p class="text-fg-muted text-sm">{{ $t("pages.planner.detail.hint") }}</p>
                        </div>

                        <!-- Legend -->
                        <div class="glass-card rounded-xl p-4">
                            <p class="text-fg-faint mb-2.5 text-xs font-medium uppercase tracking-wider">
                                {{ $t("pages.planner.legendTitle") }}
                            </p>
                            <div class="space-y-2">
                                <div
                                    v-for="type in eventTypes"
                                    :key="type.key"
                                    class="flex items-center gap-2 text-xs"
                                >
                                    <div class="flex h-6 w-6 items-center justify-center rounded" :class="type.bgClass">
                                        <Icon :name="type.icon" class="h-3.5 w-3.5" />
                                    </div>
                                    <span class="text-fg-muted">{{ $t(type.label) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Mobile Detail Modal -->
        <UiModal
            :show="!!selectedEvent && isMobile"
            :title="selectedEvent?.title"
            width="md"
            @close="selectedEvent = null"
        >
            <template v-if="selectedEvent">
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div
                            class="flex h-9 w-9 items-center justify-center rounded-lg"
                            :class="eventIconBgClass(selectedEvent.type)"
                        >
                            <Icon :name="eventIcon(selectedEvent.type)" class="h-4 w-4" />
                        </div>
                        <span
                            class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            :class="eventBadgeClass(selectedEvent.type)"
                        >
                            {{ $t(`pages.planner.legend.${eventTypeKey(selectedEvent.type)}`) }}
                        </span>
                        <span
                            v-if="selectedEvent.meta?.isOverdue"
                            class="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400"
                        >
                            {{ $t("pages.planner.overdue") }}
                        </span>
                    </div>

                    <dl class="space-y-2.5 text-sm">
                        <div v-if="selectedEventDate" class="flex justify-between">
                            <dt class="text-fg-muted">{{ $t("pages.planner.detail.date") }}</dt>
                            <dd class="text-fg font-medium">{{ selectedEventDate }}</dd>
                        </div>
                        <div v-if="selectedEvent.detail" class="flex justify-between">
                            <dt class="text-fg-muted">{{ $t("pages.planner.detail.info") }}</dt>
                            <dd class="text-fg font-medium">{{ selectedEvent.detail }}</dd>
                        </div>
                        <div v-if="selectedEvent.petName" class="flex justify-between">
                            <dt class="text-fg-muted">{{ $t("pages.planner.detail.pet") }}</dt>
                            <dd class="text-fg font-medium">{{ selectedEvent.petName }}</dd>
                        </div>
                        <div v-if="selectedEvent.enclosureName" class="flex justify-between">
                            <dt class="text-fg-muted">{{ $t("pages.planner.detail.enclosure") }}</dt>
                            <dd class="text-fg font-medium">{{ selectedEvent.enclosureName }}</dd>
                        </div>

                        <!-- Feeding meta -->
                        <div v-if="selectedEvent.type === 'feeding' && selectedEvent.meta?.status" class="flex justify-between">
                            <dt class="text-fg-muted">{{ $t("pages.planner.detail.status") }}</dt>
                            <dd>
                                <span
                                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                                    :class="feedingStatusClass(selectedEvent.meta.status as string)"
                                >
                                    {{ $t(`pages.planner.detail.feedingStatus.${selectedEvent.meta.status}`) }}
                                </span>
                            </dd>
                        </div>

                        <!-- Vet meta -->
                        <div v-if="selectedEvent.type === 'vet_visit' && selectedEvent.meta?.vetName" class="flex justify-between">
                            <dt class="text-fg-muted">{{ $t("pages.planner.detail.veterinarian") }}</dt>
                            <dd class="text-fg font-medium">{{ selectedEvent.meta.vetName }}</dd>
                        </div>

                        <!-- Shedding meta -->
                        <div v-if="selectedEvent.type === 'shedding' && selectedEvent.meta?.averageInterval" class="flex justify-between">
                            <dt class="text-fg-muted">{{ $t("pages.planner.detail.avgCycle") }}</dt>
                            <dd class="text-fg font-medium">~{{ selectedEvent.meta.averageInterval }}d</dd>
                        </div>

                        <!-- Maintenance meta -->
                        <div v-if="selectedEvent.type === 'maintenance' && selectedEvent.meta?.maintenanceType" class="flex justify-between">
                            <dt class="text-fg-muted">{{ $t("pages.planner.detail.taskType") }}</dt>
                            <dd class="text-fg font-medium">
                                {{ $t(`pages.maintenance.types.${selectedEvent.meta.maintenanceType}`) }}
                            </dd>
                        </div>
                    </dl>

                    <NuxtLink
                        v-if="eventLink"
                        :to="eventLink"
                        class="bg-accent/10 text-accent hover:bg-accent/20 mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                        @click="selectedEvent = null"
                    >
                        <Icon name="lucide:external-link" class="h-3.5 w-3.5" />
                        {{ $t("pages.planner.detail.goTo") }}
                    </NuxtLink>
                </div>
            </template>
        </UiModal>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

definePageMeta({
    layout: "default",
    middleware: ["feature-gate"],
    requiredFeature: "weekly_planner",
});

const { t, locale } = useI18n();
const api = useApi();

useHead({ title: () => t("pages.planner.title") });

interface PlannerEvent {
    id: string;
    type: "feeding" | "vet_visit" | "shedding" | "maintenance";
    date: string;
    title: string;
    detail: string | null;
    petName: string | null;
    enclosureName: string | null;
    meta: Record<string, unknown>;
}

interface PlannerDay {
    date: string;
    events: PlannerEvent[];
}

// ── Responsive ──
const isMobile = ref(false);

function checkMobile() {
    isMobile.value = window.innerWidth < 1024;
}

onMounted(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
    window.removeEventListener("resize", checkMobile);
});

// ── Week State ──
const weekOffset = ref(0);

const weekStart = computed(() => {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setUTCDate(monday.getUTCDate() + diff + weekOffset.value * 7);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
});

const weekFrom = computed(() => weekStart.value.toISOString().slice(0, 10));

const weekLabel = computed(() => {
    const start = weekStart.value;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    const loc = locale.value === "de" ? "de-DE" : "en-US";
    return `${start.toLocaleDateString(loc, opts)} – ${end.toLocaleDateString(loc, opts)}`;
});

function previousWeek() {
    weekOffset.value--;
    selectedEvent.value = null;
}

function nextWeek() {
    weekOffset.value++;
    selectedEvent.value = null;
}

function goToCurrentWeek() {
    weekOffset.value = 0;
    selectedEvent.value = null;
}

// ── Data ──
const {
    data: days,
    isLoading,
    error,
} = useQuery<PlannerDay[]>({
    queryKey: ["planner", "week", weekFrom],
    queryFn: () => api.get<PlannerDay[]>(`/api/planner/week?from=${weekFrom.value}`),
});

// ── Summary Stats ──
const totalEvents = computed(() =>
    days.value?.reduce((sum, d) => sum + d.events.length, 0) ?? 0,
);

const overdueCount = computed(() =>
    days.value?.reduce(
        (sum, d) => sum + d.events.filter((e) => e.meta?.isOverdue).length,
        0,
    ) ?? 0,
);

const busiestDayLabel = computed(() => {
    if (!days.value) return null;
    let max = 0;
    let busiest: PlannerDay | null = null;
    for (const day of days.value) {
        if (day.events.length > max) {
            max = day.events.length;
            busiest = day;
        }
    }
    if (!busiest || max === 0) return null;
    return formatFullDate(busiest.date);
});

const activeTypeCounts = computed(() => {
    if (!days.value) return [];
    const counts: Record<string, number> = {};
    for (const day of days.value) {
        for (const event of day.events) {
            counts[event.type] = (counts[event.type] ?? 0) + 1;
        }
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
});

// ── Selected Event ──
const selectedEvent = ref<PlannerEvent | null>(null);
const selectedEventDateStr = ref<string>("");

function selectEvent(event: PlannerEvent, date: string) {
    if (selectedEvent.value?.id === event.id) {
        selectedEvent.value = null;
    } else {
        selectedEvent.value = event;
        selectedEventDateStr.value = date;
    }
}

const selectedEventDate = computed(() => {
    if (!selectedEventDateStr.value) return null;
    return formatFullDate(selectedEventDateStr.value);
});

const eventLink = computed((): string | null => {
    const e = selectedEvent.value;
    if (!e) return null;
    switch (e.type) {
        case "feeding":
            return "/feedings";
        case "vet_visit":
            return "/vet-visits";
        case "shedding":
            return "/sheddings";
        case "maintenance":
            return "/maintenance";
        default:
            return null;
    }
});

// ── Today ──
const todayStr = computed(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
});

function isToday(date: string): boolean {
    return date === todayStr.value;
}

// ── Formatting ──
function formatDayName(date: string): string {
    const loc = locale.value === "de" ? "de-DE" : "en-US";
    return new Date(date + "T00:00:00").toLocaleDateString(loc, { weekday: "short" });
}

function formatDayNumber(date: string): string {
    return new Date(date + "T00:00:00").getDate().toString();
}

function formatFullDate(date: string): string {
    const loc = locale.value === "de" ? "de-DE" : "en-US";
    return new Date(date + "T00:00:00").toLocaleDateString(loc, {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

// ── Event Styling ──
function eventIcon(type: string): string {
    const icons: Record<string, string> = {
        feeding: "lucide:utensils",
        vet_visit: "lucide:stethoscope",
        shedding: "lucide:layers",
        maintenance: "lucide:wrench",
    };
    return icons[type] ?? "lucide:circle";
}

function eventIconBgClass(type: string): string {
    const classes: Record<string, string> = {
        feeding: "bg-amber-500/10 text-amber-400",
        vet_visit: "bg-teal-500/10 text-teal-400",
        shedding: "bg-violet-500/10 text-violet-400",
        maintenance: "bg-blue-500/10 text-blue-400",
    };
    return classes[type] ?? "bg-surface text-fg";
}

function eventBadgeClass(type: string): string {
    const classes: Record<string, string> = {
        feeding: "bg-amber-500/10 text-amber-400",
        vet_visit: "bg-teal-500/10 text-teal-400",
        shedding: "bg-violet-500/10 text-violet-400",
        maintenance: "bg-blue-500/10 text-blue-400",
    };
    return classes[type] ?? "bg-surface text-fg";
}

function eventTypeKey(type: string): string {
    const keys: Record<string, string> = {
        feeding: "feeding",
        vet_visit: "vetVisit",
        shedding: "shedding",
        maintenance: "maintenance",
    };
    return keys[type] ?? type;
}

function feedingStatusClass(status: string): string {
    const classes: Record<string, string> = {
        ok: "bg-green-500/10 text-green-400",
        due: "bg-amber-500/10 text-amber-400",
        critical: "bg-red-500/10 text-red-400",
    };
    return classes[status] ?? "bg-surface text-fg";
}

const eventTypes = [
    { key: "feeding", bgClass: "bg-amber-500/10 text-amber-400", icon: "lucide:utensils", label: "pages.planner.legend.feeding" },
    { key: "vet_visit", bgClass: "bg-teal-500/10 text-teal-400", icon: "lucide:stethoscope", label: "pages.planner.legend.vetVisit" },
    { key: "shedding", bgClass: "bg-violet-500/10 text-violet-400", icon: "lucide:layers", label: "pages.planner.legend.shedding" },
    { key: "maintenance", bgClass: "bg-blue-500/10 text-blue-400", icon: "lucide:wrench", label: "pages.planner.legend.maintenance" },
];
</script>
