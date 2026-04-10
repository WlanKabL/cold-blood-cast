<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.weights.chart.comparison") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.weights.chart.subtitle") }}</p>
            </div>
            <NuxtLink to="/weights" class="text-primary-400 hover:text-primary-300 text-sm font-medium">
                {{ $t("pages.weights.title") }}
            </NuxtLink>
        </div>

        <!-- Controls -->
        <div class="flex flex-wrap items-end gap-4">
            <!-- Pet Selector -->
            <div class="min-w-0 flex-1">
                <label class="text-fg-faint mb-1 block text-xs font-medium">{{ $t("pages.weights.chart.selectPets") }}</label>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="p in pets"
                        :key="p.id"
                        :class="selectedPetIds.includes(p.id) ? 'bg-primary-500/20 text-primary-400 ring-primary-500/30 ring-1' : 'bg-surface-raised text-fg-muted hover:text-fg'"
                        class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                        @click="togglePet(p.id)"
                    >
                        {{ p.name }}
                    </button>
                </div>
                <p v-if="!selectedPetIds.length" class="text-fg-faint mt-1 text-xs">
                    {{ $t("pages.weights.chart.selectAtLeast") }}
                </p>
            </div>

            <!-- Date Range Selector -->
            <div>
                <label class="text-fg-faint mb-1 block text-xs font-medium">{{ $t("pages.weights.chart.dateRange") }}</label>
                <select
                    v-model="dateRange"
                    class="bg-surface-raised text-fg-muted rounded-md border border-white/10 px-3 py-1.5 text-sm"
                >
                    <option value="30">{{ $t("pages.weights.chart.last30d") }}</option>
                    <option value="90">{{ $t("pages.weights.chart.last90d") }}</option>
                    <option value="365">{{ $t("pages.weights.chart.last1y") }}</option>
                    <option value="0">{{ $t("pages.weights.chart.allTime") }}</option>
                </select>
            </div>
        </div>

        <!-- Chart -->
        <div v-if="selectedPetIds.length" class="glass-card rounded-xl p-6">
            <div v-if="chartLoading" class="flex h-[350px] items-center justify-center">
                <div class="glass-card h-8 w-8 animate-pulse rounded-full" />
            </div>
            <ChartsWeightLineChart v-else-if="chartSeries?.length" :series="chartSeries" :height="350" />
            <div v-else class="flex h-[350px] items-center justify-center">
                <p class="text-fg-muted text-sm">{{ $t("pages.weights.chart.noData") }}</p>
            </div>
        </div>

        <!-- Growth Rate Cards -->
        <div v-if="growthRates?.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
                v-for="gr in growthRates"
                :key="gr.petId"
                class="glass-card rounded-xl p-4"
            >
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <NuxtLink :to="`/pets/${gr.petId}`" class="text-fg hover:text-primary-400 font-semibold transition-colors">
                            {{ gr.petName }}
                        </NuxtLink>
                        <p class="text-fg-faint mt-0.5 text-xs">
                            {{ $t("pages.weights.chart.records", { count: gr.recordCount }) }}
                        </p>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <Icon
                            :name="gr.trend === 'up' ? 'lucide:trending-up' : gr.trend === 'down' ? 'lucide:trending-down' : 'lucide:minus'"
                            :class="gr.trend === 'up' ? 'text-green-400' : gr.trend === 'down' ? 'text-red-400' : 'text-fg-faint'"
                            class="h-4 w-4"
                        />
                        <span
                            :class="gr.trend === 'up' ? 'text-green-400' : gr.trend === 'down' ? 'text-red-400' : 'text-fg-faint'"
                            class="text-xs font-medium"
                        >
                            {{ $t(`pages.weights.chart.trend${gr.trend.charAt(0).toUpperCase() + gr.trend.slice(1)}`) }}
                        </span>
                    </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    <span class="text-fg-faint text-xs">
                        {{ $t("pages.weights.chart.perMonth", { rate: gr.avgGramsPerMonth }) }}
                    </span>
                    <span class="text-fg-faint text-xs">
                        {{ $t("pages.weights.chart.totalGain", { gain: gr.totalGainGrams }) }}
                    </span>
                </div>
                <div v-if="gr.latestRecord" class="text-fg-muted mt-2 text-xs">
                    {{ gr.latestRecord.weightGrams }} g · {{ new Date(gr.latestRecord.date).toLocaleDateString() }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

interface Pet {
    id: string;
    name: string;
}

interface WeightChartSeries {
    petId: string;
    petName: string;
    points: { date: string; weightGrams: number }[];
}

interface GrowthRateResult {
    petId: string;
    petName: string;
    firstRecord: { date: string; weightGrams: number } | null;
    latestRecord: { date: string; weightGrams: number } | null;
    totalGainGrams: number;
    avgGramsPerMonth: number;
    trend: "up" | "stable" | "down";
    recordCount: number;
}

const { t } = useI18n();
const api = useApi();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.weights.chart.comparison") });

const selectedPetIds = ref<string[]>([]);
const dateRange = ref("0");

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

function togglePet(petId: string) {
    const idx = selectedPetIds.value.indexOf(petId);
    if (idx >= 0) {
        selectedPetIds.value.splice(idx, 1);
    } else {
        selectedPetIds.value.push(petId);
    }
}

const chartFromParam = computed(() => {
    const days = Number(dateRange.value);
    if (days <= 0) return "";
    const d = new Date();
    d.setDate(d.getDate() - days);
    return `&from=${d.toISOString()}`;
});

const petIdsParam = computed(() => selectedPetIds.value.join(","));

const { data: chartSeries, isLoading: chartLoading } = useQuery({
    queryKey: ["weights-chart", petIdsParam, dateRange],
    queryFn: () => api.get<WeightChartSeries[]>(`/api/weights/chart?petIds=${petIdsParam.value}${chartFromParam.value}`),
    enabled: () => selectedPetIds.value.length > 0,
});

const { data: growthRates } = useQuery({
    queryKey: ["weights-growth-rate", petIdsParam],
    queryFn: () => api.get<GrowthRateResult[]>(`/api/weights/growth-rate?petIds=${petIdsParam.value}`),
    enabled: () => selectedPetIds.value.length > 0,
});
</script>
