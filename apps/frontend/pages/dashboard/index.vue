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
                            <NuxtLink :to="`/pets/${fs.petId}`" class="text-fg hover:text-primary-400 font-semibold transition-colors">
                                {{ fs.petName }}
                            </NuxtLink>
                            <p class="text-fg-faint text-xs">{{ fs.species }}</p>
                        </div>
                        <span :class="feedingStatusBadgeClass(fs.status)" class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium">
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

const { t } = useI18n();
const api = useApi();

definePageMeta({ layout: "default" });
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
