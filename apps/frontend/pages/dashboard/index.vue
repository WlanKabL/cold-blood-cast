<template>
    <div class="mx-auto max-w-7xl space-y-8 p-6">
        <!-- Page Header -->
        <div>
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("pages.dashboard.title") }}
            </h1>
            <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.dashboard.subtitle") }}</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="glass-card rounded-xl p-5">
                <div class="flex items-center gap-3">
                    <div
                        class="bg-primary-500/10 text-primary-400 flex h-10 w-10 items-center justify-center rounded-lg"
                    >
                        <Icon name="lucide:box" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                            {{ $t("pages.dashboard.enclosures") }}
                        </p>
                        <p class="text-fg text-xl font-bold">{{ enclosures?.length ?? 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="glass-card rounded-xl p-5">
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400"
                    >
                        <Icon name="lucide:heart" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                            {{ $t("pages.dashboard.pets") }}
                        </p>
                        <p class="text-fg text-xl font-bold">{{ pets?.length ?? 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="glass-card rounded-xl p-5">
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400"
                    >
                        <Icon name="lucide:thermometer" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                            {{ $t("pages.dashboard.sensors") }}
                        </p>
                        <p class="text-fg text-xl font-bold">{{ sensors?.length ?? 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="glass-card rounded-xl p-5">
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400"
                    >
                        <Icon name="lucide:utensils" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                            {{ $t("pages.dashboard.recentFeedings") }}
                        </p>
                        <p class="text-fg text-xl font-bold">
                            {{ recentFeedings?.length ?? 0 }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Feeding Reminders -->
        <div>
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-fg text-lg font-semibold">
                    {{ $t("pages.dashboard.feedingReminders") }}
                </h2>
                <NuxtLink
                    to="/feedings"
                    class="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                    {{ $t("pages.dashboard.viewAll") }}
                </NuxtLink>
            </div>
            <div
                v-if="feedingStatuses?.length"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
                <div
                    v-for="fs in feedingStatuses"
                    :key="fs.petId"
                    class="glass-card rounded-xl p-4"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                            <NuxtLink
                                :to="`/pets/${fs.petId}`"
                                class="text-fg hover:text-primary-400 font-semibold transition-colors"
                            >
                                {{ fs.petName }}
                            </NuxtLink>
                            <p class="text-fg-faint text-xs">{{ fs.species }}</p>
                        </div>
                        <span
                            :class="feedingStatusBadgeClass(fs.status)"
                            class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                            {{ feedingStatusLabel(fs.status) }}
                        </span>
                    </div>
                    <div class="text-fg-faint mt-2 text-xs">
                        <template v-if="fs.daysSinceLastFeeding === null">
                            {{ $t("pages.dashboard.neverFed") }}
                        </template>
                        <template v-else-if="fs.daysSinceLastFeeding === 0">
                            {{ $t("pages.dashboard.today") }}
                        </template>
                        <template v-else>
                            {{ $t("pages.dashboard.daysAgo", { n: fs.daysSinceLastFeeding }) }}
                        </template>
                        <template v-if="fs.intervalMinDays && fs.intervalMaxDays">
                            · {{ fs.intervalMinDays }}–{{ fs.intervalMaxDays }}d
                        </template>
                    </div>
                </div>
            </div>
            <div v-else class="glass-card flex flex-col items-center rounded-xl py-8">
                <Icon name="lucide:utensils" class="text-fg-faint mb-2 h-8 w-8" />
                <p class="text-fg-muted text-sm">{{ $t("pages.dashboard.noPetsScheduled") }}</p>
            </div>
        </div>

        <!-- Weight Trends -->
        <div>
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-fg text-lg font-semibold">
                    {{ $t("pages.dashboard.weightTrends") }}
                </h2>
                <NuxtLink
                    to="/weights/chart"
                    class="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                    {{ $t("pages.dashboard.viewAll") }}
                </NuxtLink>
            </div>
            <div
                v-if="weightChartSeries?.length"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                <div
                    v-for="series in weightChartSeries"
                    :key="series.petId"
                    class="glass-card rounded-xl p-4"
                >
                    <div class="mb-2 flex items-center justify-between">
                        <NuxtLink
                            :to="`/pets/${series.petId}`"
                            class="text-fg hover:text-primary-400 text-sm font-semibold transition-colors"
                        >
                            {{ series.petName }}
                        </NuxtLink>
                        <span v-if="series.points.length" class="text-fg-faint text-xs">
                            {{ series.points[series.points.length - 1].weightGrams }} g
                        </span>
                    </div>
                    <ChartsWeightLineChart
                        :series="[series]"
                        :height="60"
                        :sparkline="true"
                        :show-legend="false"
                        :fill="true"
                    />
                </div>
            </div>
            <div v-else class="glass-card flex flex-col items-center rounded-xl py-8">
                <Icon name="lucide:scale" class="text-fg-faint mb-2 h-8 w-8" />
                <p class="text-fg-muted text-sm">{{ $t("pages.dashboard.noWeightData") }}</p>
            </div>
        </div>

        <!-- Upcoming Sheddings -->
        <div>
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-fg text-lg font-semibold">
                    {{ $t("pages.dashboard.upcomingSheddings") }}
                </h2>
                <NuxtLink
                    to="/sheddings"
                    class="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                    {{ $t("pages.dashboard.viewAll") }}
                </NuxtLink>
            </div>
            <div
                v-if="upcomingSheddings?.length"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
                <NuxtLink
                    v-for="item in upcomingSheddings"
                    :key="item.petId"
                    :to="`/pets/${item.petId}`"
                    class="glass-card group rounded-xl p-4 transition-all hover:ring-1 hover:ring-white/10"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                            <p
                                class="text-fg group-hover:text-primary-400 font-semibold transition-colors"
                            >
                                {{ item.petName }}
                            </p>
                            <p class="text-fg-faint text-xs">
                                {{
                                    $t("pages.dashboard.avgCycle", {
                                        days: item.averageIntervalDays,
                                    })
                                }}
                            </p>
                        </div>
                        <span
                            :class="
                                item.daysUntil <= 0
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-amber-500/10 text-amber-400'
                            "
                            class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                            {{
                                item.daysUntil <= 0
                                    ? $t("pages.dashboard.predictedOverdue", {
                                          days: Math.abs(item.daysUntil),
                                      })
                                    : $t("pages.dashboard.predictedIn", { days: item.daysUntil })
                            }}
                        </span>
                    </div>
                    <p class="text-fg-faint mt-2 text-xs">
                        {{ new Date(item.predictedDate).toLocaleDateString() }}
                    </p>
                </NuxtLink>
            </div>
            <div v-else class="glass-card flex flex-col items-center rounded-xl py-8">
                <Icon name="lucide:sparkles" class="text-fg-faint mb-2 h-8 w-8" />
                <p class="text-fg-muted text-sm">{{ $t("pages.dashboard.noUpcomingSheddings") }}</p>
            </div>
        </div>

        <!-- Enclosures Overview -->
        <div>
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-fg text-lg font-semibold">
                    {{ $t("pages.dashboard.yourEnclosures") }}
                </h2>
                <NuxtLink
                    to="/enclosures"
                    class="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                    {{ $t("pages.dashboard.viewAll") }}
                </NuxtLink>
            </div>
            <div
                v-if="enclosureLoading"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                <div v-for="i in 3" :key="i" class="glass-card h-40 animate-pulse rounded-xl" />
            </div>
            <div
                v-else-if="activeEnclosures.length"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                <NuxtLink
                    v-for="enc in activeEnclosures.slice(0, 3)"
                    :key="enc.id"
                    :to="`/enclosures/${enc.id}`"
                    class="glass-card group rounded-xl p-5 transition-all hover:ring-1 hover:ring-white/10"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                            <h3
                                class="text-fg group-hover:text-primary-400 truncate font-semibold transition-colors"
                            >
                                {{ enc.name }}
                            </h3>
                            <p class="text-fg-faint mt-0.5 text-sm">
                                {{ enc.species || enc.type }}
                            </p>
                        </div>
                        <span
                            class="bg-primary-500/10 text-primary-400 shrink-0 rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                            {{ enc.type }}
                        </span>
                    </div>
                    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span
                            v-if="enc.room"
                            class="text-fg-faint flex items-center gap-1.5 text-xs"
                        >
                            <Icon name="lucide:map-pin" class="h-3.5 w-3.5" />
                            {{ enc.room }}
                        </span>
                        <span class="text-fg-muted flex items-center gap-1.5 text-xs">
                            <Icon name="lucide:heart" class="h-3.5 w-3.5 text-pink-400" />
                            {{ enc._count.pets }}
                        </span>
                        <span class="text-fg-muted flex items-center gap-1.5 text-xs">
                            <Icon name="lucide:thermometer" class="h-3.5 w-3.5 text-green-400" />
                            {{ enc._count.sensors }}
                        </span>
                    </div>
                </NuxtLink>
            </div>
            <div v-else class="glass-card flex flex-col items-center rounded-xl py-12">
                <Icon name="lucide:box" class="text-fg-faint mb-3 h-10 w-10" />
                <p class="text-fg-muted text-sm">{{ $t("pages.dashboard.noEnclosures") }}</p>
                <NuxtLink
                    to="/enclosures"
                    class="text-primary-400 hover:text-primary-300 mt-2 text-sm font-medium"
                >
                    {{ $t("pages.dashboard.addFirst") }}
                </NuxtLink>
            </div>
        </div>

        <!-- Overdue Maintenance -->
        <div>
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-fg text-lg font-semibold">
                    {{ $t("pages.dashboard.overdueMaintenance") }}
                </h2>
                <NuxtLink
                    to="/maintenance"
                    class="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                    {{ $t("pages.dashboard.viewAll") }}
                </NuxtLink>
            </div>
            <div
                v-if="overdueMaintenance?.length"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
                <NuxtLink
                    v-for="task in overdueMaintenance"
                    :key="task.id"
                    to="/maintenance"
                    class="glass-card group rounded-xl p-4 transition-all hover:ring-1 hover:ring-white/10"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                            <p
                                class="text-fg group-hover:text-primary-400 font-semibold transition-colors"
                            >
                                {{ task.enclosure?.name }}
                            </p>
                            <p class="text-fg-faint text-xs">
                                {{ task.description || task.type }}
                            </p>
                        </div>
                        <span
                            class="shrink-0 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400"
                        >
                            {{ $t("pages.maintenance.overdue") }}
                        </span>
                    </div>
                    <p v-if="task.nextDueAt" class="text-fg-faint mt-2 text-xs">
                        {{ new Date(task.nextDueAt).toLocaleDateString() }}
                    </p>
                </NuxtLink>
            </div>
            <div v-else class="glass-card flex flex-col items-center rounded-xl py-8">
                <Icon name="lucide:wrench" class="text-fg-faint mb-2 h-8 w-8" />
                <p class="text-fg-muted text-sm">
                    {{ $t("pages.dashboard.noOverdueMaintenance") }}
                </p>
            </div>
        </div>

        <!-- Upcoming Vet Appointments -->
        <div>
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-fg text-lg font-semibold">
                    {{ $t("pages.dashboard.upcomingVetVisits") }}
                </h2>
                <NuxtLink
                    to="/vet-visits"
                    class="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                    {{ $t("pages.dashboard.viewAll") }}
                </NuxtLink>
            </div>
            <div
                v-if="upcomingVetVisits?.length"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
                <div
                    v-for="visit in upcomingVetVisits"
                    :key="visit.id"
                    class="glass-card rounded-xl p-4"
                >
                    <NuxtLink :to="`/vet-visits/${visit.id}`" class="block">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0 flex-1">
                                <p class="text-fg font-semibold">{{ visit.pet?.name }}</p>
                                <p class="text-fg-faint text-xs">
                                    {{ visit.veterinarian?.name ?? $t("pages.dashboard.noVet") }}
                                    <template v-if="visit.veterinarian?.clinicName">
                                        · {{ visit.veterinarian.clinicName }}</template
                                    >
                                </p>
                            </div>
                            <span
                                :class="
                                    visit.isAppointment
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'bg-teal-500/10 text-teal-400'
                                "
                                class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium"
                            >
                                {{ new Date(visit._sortDate).toLocaleDateString() }}
                            </span>
                        </div>
                        <p v-if="visit.reason" class="text-fg-faint mt-2 text-xs">
                            {{ visit.reason }}
                        </p>
                    </NuxtLink>
                </div>
            </div>
            <div v-else class="glass-card flex flex-col items-center rounded-xl py-8">
                <Icon name="lucide:stethoscope" class="text-fg-faint mb-2 h-8 w-8" />
                <p class="text-fg-muted text-sm">{{ $t("pages.dashboard.noUpcomingVetVisits") }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

interface DashboardEnclosure {
    id: string;
    name: string;
    type: string;
    species: string | null;
    description: string | null;
    room: string | null;
    active: boolean;
    _count: { pets: number; sensors: number };
}

interface Pet {
    id: string;
    name: string;
}

interface Sensor {
    id: string;
    name: string;
}

interface Feeding {
    id: string;
    fedAt: string;
}

interface FeedingStatusItem {
    petId: string;
    petName: string;
    species: string;
    intervalMinDays: number | null;
    intervalMaxDays: number | null;
    lastFedAt: string | null;
    daysSinceLastFeeding: number | null;
    status: "ok" | "due" | "overdue" | "critical" | "no_schedule";
}

interface UpcomingVetVisit {
    id: string;
    reason: string | null;
    isAppointment: boolean;
    visitDate: string;
    nextAppointment: string | null;
    _sortDate: string;
    pet: { id: string; name: string; species: string } | null;
    veterinarian: { id: string; name: string; clinicName: string | null } | null;
}

interface OverdueMaintenanceTask {
    id: string;
    type: string;
    description: string | null;
    nextDueAt: string | null;
    enclosure: { id: string; name: string } | null;
}

interface WeightChartSeries {
    petId: string;
    petName: string;
    points: { date: string; weightGrams: number }[];
}

interface UpcomingSheddingItem {
    petId: string;
    petName: string;
    predictedDate: string;
    daysUntil: number;
    averageIntervalDays: number;
}

const { t } = useI18n();
const api = useApi();

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "dashboard" });
useHead({ title: () => t("pages.dashboard.title") });

const { data: enclosures, isLoading: enclosureLoading } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<DashboardEnclosure[]>("/api/enclosures"),
});

const activeEnclosures = computed(() => (enclosures.value ?? []).filter((e) => e.active));

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const { data: sensors } = useQuery({
    queryKey: ["sensors"],
    queryFn: () => api.get<Sensor[]>("/api/sensors"),
});

const { data: recentFeedings } = useQuery({
    queryKey: ["feedings", "recent"],
    queryFn: () => api.get<Feeding[]>("/api/feedings?limit=5"),
});

const { data: allFeedingStatuses } = useQuery({
    queryKey: ["feeding-reminders"],
    queryFn: () => api.get<FeedingStatusItem[]>("/api/feeding-reminders"),
});

const feedingStatuses = computed(() =>
    (allFeedingStatuses.value ?? []).filter((s) => s.status !== "no_schedule"),
);

const { data: upcomingVetVisits } = useQuery({
    queryKey: ["vet-visits", "upcoming"],
    queryFn: () => api.get<UpcomingVetVisit[]>("/api/vet-visits/upcoming"),
});

const { data: overdueMaintenance } = useQuery({
    queryKey: ["maintenance-tasks", "overdue"],
    queryFn: () => api.get<OverdueMaintenanceTask[]>("/api/enclosure-maintenance/overdue"),
});

const allPetIds = computed(() => (pets.value ?? []).map((p) => p.id).join(","));

const { data: weightChartSeries } = useQuery({
    queryKey: ["weights-chart-dashboard", allPetIds],
    queryFn: () => api.get<WeightChartSeries[]>(`/api/weights/chart?petIds=${allPetIds.value}`),
    enabled: () => (pets.value ?? []).length > 0,
});

const { data: upcomingSheddings } = useQuery({
    queryKey: ["sheddings", "upcoming"],
    queryFn: () => api.get<UpcomingSheddingItem[]>("/api/sheddings/upcoming"),
});

function feedingStatusBadgeClass(status: string): string {
    switch (status) {
        case "ok":
            return "bg-green-500/10 text-green-400";
        case "due":
            return "bg-amber-500/10 text-amber-400";
        case "critical":
            return "bg-red-500/10 text-red-400";
        default:
            return "bg-white/5 text-fg-faint";
    }
}

function feedingStatusLabel(status: string): string {
    switch (status) {
        case "ok":
            return t("pages.dashboard.feedingOk");
        case "due":
            return t("pages.dashboard.feedingDue");
        case "critical":
            return t("pages.dashboard.feedingCritical");
        default:
            return t("pages.dashboard.feedingNoSchedule");
    }
}
</script>
