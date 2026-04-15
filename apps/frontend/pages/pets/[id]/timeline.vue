<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="animate-fade-in-up flex items-center gap-3">
            <NuxtLink
                :to="`/pets/${petId}`"
                class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors"
            >
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ pet?.name }} — {{ $t("pages.pets.timeline.title") }}
                </h1>
                <p class="text-fg-muted mt-0.5 text-sm">
                    {{ $t("pages.pets.timeline.subtitle") }}
                </p>
            </div>
        </div>

        <!-- Type Filters -->
        <div class="flex flex-wrap gap-2">
            <button
                v-for="filter in typeFilters"
                :key="filter.value"
                :class="[
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    activeTypes.includes(filter.value)
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-fg-faint bg-white/5 hover:bg-white/10',
                ]"
                @click="toggleType(filter.value)"
            >
                <Icon :name="filter.icon" class="mr-1 inline h-3.5 w-3.5" />
                {{ filter.label }}
            </button>
        </div>

        <!-- Loading -->
        <div v-if="isLoading && !timeline" class="space-y-4">
            <div v-for="i in 5" :key="i" class="glass-card h-20 animate-pulse rounded-xl" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <!-- Timeline -->
        <template v-else-if="timeline">
            <div
                v-if="timeline.events.length === 0"
                class="glass-card flex flex-col items-center rounded-xl py-16"
            >
                <Icon name="lucide:calendar-x" class="mb-3 h-12 w-12 text-white/10" />
                <p class="text-fg-muted text-sm">{{ $t("pages.pets.timeline.empty") }}</p>
            </div>

            <div v-else class="space-y-2">
                <!-- Date group headers + events -->
                <template v-for="(group, dateKey) in groupedEvents" :key="dateKey">
                    <h3
                        class="text-fg-faint pt-4 text-xs font-semibold tracking-wider uppercase first:pt-0"
                    >
                        {{ dateKey }}
                    </h3>
                    <div
                        v-for="event in group"
                        :key="event.id"
                        class="glass-card flex items-start gap-4 rounded-xl p-4"
                    >
                        <!-- Icon -->
                        <div
                            :class="[
                                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                                eventColorClass(event.type),
                            ]"
                        >
                            <Icon :name="event.icon" class="h-4 w-4" />
                        </div>

                        <!-- Content -->
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="text-fg text-sm font-medium">{{ event.title }}</span>
                                <span
                                    :class="[
                                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                                        eventBadgeClass(event.type),
                                    ]"
                                >
                                    {{ eventTypeLabel(event.type) }}
                                </span>
                            </div>
                            <p v-if="event.detail" class="text-fg-faint mt-0.5 text-xs">
                                {{ event.detail }}
                            </p>
                            <!-- Meta -->
                            <div
                                class="text-fg-faint mt-1 flex flex-wrap items-center gap-3 text-xs"
                            >
                                <span>{{ formatTime(event.date) }}</span>
                                <template
                                    v-if="event.type === 'feeding' && event.meta.quantity > 1"
                                >
                                    <span>× {{ event.meta.quantity }}</span>
                                </template>
                                <template v-if="event.type === 'feeding' && !event.meta.accepted">
                                    <span class="text-red-400">{{ $t("common.refused") }}</span>
                                </template>
                                <template v-if="event.type === 'weight'">
                                    <span>{{ event.meta.weightGrams }}g</span>
                                </template>
                                <template v-if="event.type === 'vet_visit' && event.meta.costCents">
                                    <span>{{ formatCost(event.meta.costCents as number) }}</span>
                                </template>
                                <template v-if="event.type === 'vet_visit' && event.meta.vetName">
                                    <span>{{ event.meta.vetName }}</span>
                                </template>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Load More -->
                <div v-if="timeline.hasMore" class="flex justify-center pt-4">
                    <UiButton variant="ghost" :loading="isFetching" @click="loadMore">
                        {{ $t("pages.pets.timeline.loadMore") }}
                    </UiButton>
                </div>
                <p
                    v-else-if="timeline.events.length > 0"
                    class="text-fg-faint pt-4 text-center text-xs"
                >
                    {{ $t("pages.pets.timeline.noMore") }}
                </p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface TimelineEvent {
    id: string;
    type: "feeding" | "shedding" | "weight" | "vet_visit" | "photo" | "husbandry_note";
    date: string;
    title: string;
    detail: string | null;
    icon: string;
    meta: Record<string, unknown>;
}

interface TimelineResult {
    events: TimelineEvent[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

const route = useRoute();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();

const petId = route.params.id as string;

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "timeline" });

// ── Pet Data ─────────────────────────────────────────────
const { data: pet } = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => api.get<{ id: string; name: string }>(`/api/pets/${petId}`),
});

useHead({
    title: () =>
        pet.value?.name
            ? `${pet.value.name} — ${t("pages.pets.timeline.title")}`
            : t("pages.pets.timeline.title"),
});

// ── Filters ──────────────────────────────────────────────
type EventType = "feeding" | "shedding" | "weight" | "vet_visit" | "photo" | "husbandry_note";

const typeFilters = computed(() => [
    {
        value: "feeding" as EventType,
        label: t("pages.pets.timeline.filterFeeding"),
        icon: "lucide:utensils",
    },
    {
        value: "shedding" as EventType,
        label: t("pages.pets.timeline.filterShedding"),
        icon: "lucide:sparkles",
    },
    {
        value: "weight" as EventType,
        label: t("pages.pets.timeline.filterWeight"),
        icon: "lucide:scale",
    },
    {
        value: "vet_visit" as EventType,
        label: t("pages.pets.timeline.filterVetVisit"),
        icon: "lucide:stethoscope",
    },
    {
        value: "photo" as EventType,
        label: t("pages.pets.timeline.filterPhoto"),
        icon: "lucide:camera",
    },
    {
        value: "husbandry_note" as EventType,
        label: t("pages.pets.timeline.filterHusbandryNote"),
        icon: "lucide:clipboard-list",
    },
]);

const activeTypes = ref<EventType[]>([
    "feeding",
    "shedding",
    "weight",
    "vet_visit",
    "photo",
    "husbandry_note",
]);

function toggleType(type: EventType) {
    const idx = activeTypes.value.indexOf(type);
    if (idx >= 0) {
        if (activeTypes.value.length > 1) {
            activeTypes.value.splice(idx, 1);
        }
    } else {
        activeTypes.value.push(type);
    }
}

// ── Data ─────────────────────────────────────────────────
const currentPage = ref(1);
const allEvents = ref<TimelineEvent[]>([]);
const totalEvents = ref(0);
const hasMore = ref(false);

const typesParam = computed(() => activeTypes.value.join(","));

const {
    data: timelineData,
    isLoading,
    isFetching,
    error,
    refetch,
} = useQuery({
    queryKey: ["timeline", petId, typesParam, currentPage],
    queryFn: () =>
        api.get<TimelineResult>(
            `/api/pets/${petId}/timeline?page=${currentPage.value}&limit=50&types=${typesParam.value}`,
        ),
});

// Merge pages into accumulated events
watch(
    timelineData,
    (data) => {
        if (!data) return;
        if (currentPage.value === 1) {
            allEvents.value = data.events;
        } else {
            const existingIds = new Set(allEvents.value.map((e) => e.id));
            const newEvents = data.events.filter((e) => !existingIds.has(e.id));
            allEvents.value = [...allEvents.value, ...newEvents];
        }
        totalEvents.value = data.total;
        hasMore.value = data.hasMore;
    },
    { immediate: true },
);

// Reset when filters change
watch(typesParam, () => {
    currentPage.value = 1;
    allEvents.value = [];
});

const timeline = computed(() => {
    if (!timelineData.value && allEvents.value.length === 0) return null;
    return {
        events: allEvents.value,
        total: totalEvents.value,
        hasMore: hasMore.value,
    };
});

function loadMore() {
    currentPage.value++;
}

// ── Grouping by date ─────────────────────────────────────
const groupedEvents = computed(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    for (const event of allEvents.value) {
        const dateKey = new Date(event.date).toLocaleDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(event);
    }
    return groups;
});

// ── Display helpers ──────────────────────────────────────
function eventColorClass(type: string): string {
    switch (type) {
        case "feeding":
            return "bg-orange-500/10 text-orange-400";
        case "shedding":
            return "bg-purple-500/10 text-purple-400";
        case "weight":
            return "bg-blue-500/10 text-blue-400";
        case "vet_visit":
            return "bg-teal-500/10 text-teal-400";
        case "photo":
            return "bg-pink-500/10 text-pink-400";
        case "husbandry_note":
            return "bg-emerald-500/10 text-emerald-400";
        default:
            return "bg-white/5 text-fg-faint";
    }
}

function eventBadgeClass(type: string): string {
    switch (type) {
        case "feeding":
            return "bg-orange-500/10 text-orange-400";
        case "shedding":
            return "bg-purple-500/10 text-purple-400";
        case "weight":
            return "bg-blue-500/10 text-blue-400";
        case "vet_visit":
            return "bg-teal-500/10 text-teal-400";
        case "photo":
            return "bg-pink-500/10 text-pink-400";
        case "husbandry_note":
            return "bg-emerald-500/10 text-emerald-400";
        default:
            return "bg-white/5 text-fg-faint";
    }
}

function eventTypeLabel(type: string): string {
    switch (type) {
        case "feeding":
            return t("pages.pets.timeline.filterFeeding");
        case "shedding":
            return t("pages.pets.timeline.filterShedding");
        case "weight":
            return t("pages.pets.timeline.filterWeight");
        case "vet_visit":
            return t("pages.pets.timeline.filterVetVisit");
        case "photo":
            return t("pages.pets.timeline.filterPhoto");
        case "husbandry_note":
            return t("pages.pets.timeline.filterHusbandryNote");
        default:
            return type;
    }
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatCost(cents: number): string {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
        cents / 100,
    );
}
</script>
