<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Page Header -->
        <div
            class="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.vetVisits.costs.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">
                    {{ $t("pages.vetVisits.costs.subtitle") }}
                </p>
            </div>
            <div class="flex items-center gap-3">
                <UiSelect
                    v-model="selectedPetId"
                    :placeholder-option="$t('pages.vetVisits.costs.allPets')"
                    size="compact"
                >
                    <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
                </UiSelect>
                <UiSelect v-model="selectedYear" size="compact">
                    <option v-for="y in availableYears" :key="y" :value="String(y)">
                        {{ y }}
                    </option>
                </UiSelect>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="glass-card rounded-xl p-5">
                <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                    {{ $t("pages.vetVisits.costs.totalCost") }}
                </p>
                <p class="text-fg mt-1 text-2xl font-bold">{{ formatCost(costs?.totalCents) }}</p>
            </div>
            <div class="glass-card rounded-xl p-5">
                <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                    {{ $t("pages.vetVisits.costs.visitCount") }}
                </p>
                <p class="text-fg mt-1 text-2xl font-bold">{{ costs?.visitCount ?? 0 }}</p>
            </div>
            <div class="glass-card rounded-xl p-5">
                <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                    {{ $t("pages.vetVisits.costs.avgPerVisit") }}
                </p>
                <p class="text-fg mt-1 text-2xl font-bold">
                    {{
                        costs && costs.visitCount > 0
                            ? formatCost(Math.round(costs.totalCents / costs.visitCount))
                            : "—"
                    }}
                </p>
            </div>
        </div>

        <!-- Monthly Chart -->
        <div class="glass-card rounded-xl p-5">
            <h2 class="text-fg mb-4 text-lg font-semibold">
                {{ $t("pages.vetVisits.costs.monthlyBreakdown") }}
            </h2>
            <ChartsVetCostChart :entries="monthlyCosts ?? []" :height="300" />
        </div>

        <!-- Per-Pet Breakdown Table -->
        <div v-if="costs?.perPet?.length" class="glass-card rounded-xl p-5">
            <h2 class="text-fg mb-4 text-lg font-semibold">
                {{ $t("pages.vetVisits.costs.perPet") }}
            </h2>
            <div class="space-y-3">
                <div
                    v-for="pet in costs.perPet"
                    :key="pet.petId"
                    class="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                >
                    <div>
                        <NuxtLink
                            :to="`/pets/${pet.petId}`"
                            class="text-fg hover:text-primary-400 font-semibold transition-colors"
                        >
                            {{ pet.petName }}
                        </NuxtLink>
                        <p class="text-fg-faint text-xs">
                            {{
                                $t("pages.vetVisits.costs.visits", {
                                    n: pet.visitCount,
                                })
                            }}
                        </p>
                    </div>
                    <span class="text-fg text-lg font-bold">
                        {{ formatCost(pet.totalCents) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

interface CostSummary {
    totalCents: number;
    visitCount: number;
    perPet: {
        petId: string;
        petName: string;
        totalCents: number;
        visitCount: number;
    }[];
}

interface MonthlyCostEntry {
    month: string;
    petId: string;
    petName: string;
    totalCents: number;
    visitCount: number;
}

interface Pet {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "vet_visits" });
useHead({ title: () => t("pages.vetVisits.costs.title") });

const currentYear = new Date().getFullYear();
const availableYears = computed(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push(y);
    }
    return years;
});

const selectedYear = ref(String(currentYear));
const selectedPetId = ref("");

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const { data: costs } = useQuery({
    queryKey: ["vet-costs", selectedYear, selectedPetId],
    queryFn: () => {
        const params = new URLSearchParams({ year: selectedYear.value });
        if (selectedPetId.value) params.set("petId", selectedPetId.value);
        return api.get<CostSummary>(`/api/vet-visits/costs?${params}`);
    },
});

const { data: monthlyCosts } = useQuery({
    queryKey: ["vet-costs-monthly", selectedYear, selectedPetId],
    queryFn: () => {
        const params = new URLSearchParams({ year: selectedYear.value });
        if (selectedPetId.value) params.set("petId", selectedPetId.value);
        return api.get<MonthlyCostEntry[]>(`/api/vet-visits/costs/monthly?${params}`);
    },
});

function formatCost(cents?: number | null): string {
    if (cents == null) return "—";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
        cents / 100,
    );
}
</script>
