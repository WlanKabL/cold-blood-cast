<template>
    <div class="mx-auto max-w-7xl space-y-8 p-6">
        <!-- Page Header -->
        <div>
            <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.dashboard.title") }}</h1>
            <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.dashboard.subtitle") }}</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="glass-card rounded-xl p-5">
                <div class="flex items-center gap-3">
                    <div class="bg-primary-500/10 text-primary-400 flex h-10 w-10 items-center justify-center rounded-lg">
                        <Icon name="lucide:box" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium uppercase tracking-wider">{{ $t("pages.dashboard.enclosures") }}</p>
                        <p class="text-fg text-xl font-bold">{{ enclosures?.length ?? 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="glass-card rounded-xl p-5">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
                        <Icon name="lucide:heart" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium uppercase tracking-wider">{{ $t("pages.dashboard.pets") }}</p>
                        <p class="text-fg text-xl font-bold">{{ pets?.length ?? 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="glass-card rounded-xl p-5">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                        <Icon name="lucide:thermometer" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium uppercase tracking-wider">{{ $t("pages.dashboard.sensors") }}</p>
                        <p class="text-fg text-xl font-bold">{{ sensors?.length ?? 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="glass-card rounded-xl p-5">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                        <Icon name="lucide:utensils" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium uppercase tracking-wider">{{ $t("pages.dashboard.recentFeedings") }}</p>
                        <p class="text-fg text-xl font-bold">{{ recentFeedings?.length ?? 0 }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Enclosures Overview -->
        <div>
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-fg text-lg font-semibold">{{ $t("pages.dashboard.yourEnclosures") }}</h2>
                <NuxtLink to="/enclosures" class="text-primary-400 hover:text-primary-300 text-sm font-medium">
                    {{ $t("pages.dashboard.viewAll") }}
                </NuxtLink>
            </div>
            <div v-if="enclosureLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 3" :key="i" class="glass-card h-32 animate-pulse rounded-xl" />
            </div>
            <div v-else-if="enclosures?.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NuxtLink
                    v-for="enc in enclosures"
                    :key="enc.id"
                    :to="`/enclosures/${enc.id}`"
                    class="glass-card group rounded-xl p-5 transition-all hover:ring-1 hover:ring-white/10"
                >
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-fg font-semibold group-hover:text-primary-400 transition-colors">{{ enc.name }}</h3>
                            <p class="text-fg-faint mt-1 text-sm">{{ enc.species || enc.type }}</p>
                        </div>
                        <span class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium">
                            {{ enc.type }}
                        </span>
                    </div>
                    <div v-if="enc.description" class="text-fg-muted mt-3 line-clamp-2 text-sm">
                        {{ enc.description }}
                    </div>
                </NuxtLink>
            </div>
            <div v-else class="glass-card flex flex-col items-center rounded-xl py-12">
                <Icon name="lucide:box" class="text-fg-faint mb-3 h-10 w-10" />
                <p class="text-fg-muted text-sm">{{ $t("pages.dashboard.noEnclosures") }}</p>
                <NuxtLink to="/enclosures" class="text-primary-400 hover:text-primary-300 mt-2 text-sm font-medium">
                    {{ $t("pages.dashboard.addFirst") }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

interface Enclosure {
    id: string;
    name: string;
    type: string;
    species: string | null;
    description: string | null;
    imageUrl: string | null;
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

const { t } = useI18n();
const api = useApi();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.dashboard.title") });

const { data: enclosures, isLoading: enclosureLoading } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

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
</script>
