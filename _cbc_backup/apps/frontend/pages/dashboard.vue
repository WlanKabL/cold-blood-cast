<template>
    <PageContainer :title="$t('dashboard.title')" hide-back-button>
        <!-- Greeting -->
        <p class="mb-8 -mt-8 text-center text-fg-muted">
            {{
                $t("dashboard.greeting", {
                    name: authStore.user?.displayName || authStore.user?.username || "",
                })
            }}
        </p>

        <!-- Stats overview -->
        <div
            v-if="!loading && (enclosures.length || pets.length || sensors.length)"
            class="mb-8 grid grid-cols-3 gap-4"
        >
            <NuxtLink
                to="/enclosures"
                class="rounded-xl border border-card-border bg-card-bg p-5 text-center transition-colors hover:border-emerald-500"
            >
                <div class="text-3xl font-bold text-emerald-400">{{ enclosures.length }}</div>
                <div class="mt-1 text-xs text-fg-muted">{{ $t("dashboard.stat_enclosures") }}</div>
            </NuxtLink>
            <NuxtLink
                to="/pets"
                class="rounded-xl border border-card-border bg-card-bg p-5 text-center transition-colors hover:border-emerald-500"
            >
                <div class="text-3xl font-bold text-emerald-400">{{ pets.length }}</div>
                <div class="mt-1 text-xs text-fg-muted">{{ $t("dashboard.stat_pets") }}</div>
            </NuxtLink>
            <NuxtLink
                to="/sensors"
                class="rounded-xl border border-card-border bg-card-bg p-5 text-center transition-colors hover:border-emerald-500"
            >
                <div class="text-3xl font-bold text-emerald-400">{{ sensors.length }}</div>
                <div class="mt-1 text-xs text-fg-muted">{{ $t("dashboard.stat_sensors") }}</div>
            </NuxtLink>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
            <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-emerald-400" />
        </div>

        <!-- Empty state -->
        <div
            v-else-if="!enclosures.length && !pets.length && !sensors.length"
            class="py-16 text-center"
        >
            <Icon name="lucide:box" class="mx-auto h-12 w-12 text-fg-soft" />
            <h3 class="mt-4 text-lg font-semibold text-fg">{{ $t("dashboard.empty_title") }}</h3>
            <p class="mt-2 text-sm text-fg-muted">{{ $t("dashboard.empty_desc") }}</p>
            <NuxtLink
                to="/enclosures"
                class="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
                <Icon name="lucide:plus" class="h-4 w-4" />
                {{ $t("dashboard.create_enclosure") }}
            </NuxtLink>
        </div>

        <!-- Quick actions grid -->
        <template v-else>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-soft">
                {{ $t("dashboard.recent_title") }}
            </h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <NuxtLink
                    to="/enclosures"
                    class="group block rounded-xl border border-card-border bg-card-bg p-6 transition-colors hover:border-emerald-500"
                >
                    <div
                        class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"
                    >
                        <Icon name="lucide:warehouse" class="h-5 w-5 text-emerald-400" />
                    </div>
                    <h2 class="text-lg font-semibold text-fg">{{ $t("dashboard.enclosures") }}</h2>
                    <p class="mt-1 text-sm text-fg-muted">
                        {{ $t("dashboard.enclosures_description") }}
                    </p>
                </NuxtLink>

                <NuxtLink
                    to="/pets"
                    class="group block rounded-xl border border-card-border bg-card-bg p-6 transition-colors hover:border-emerald-500"
                >
                    <div
                        class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10"
                    >
                        <Icon name="lucide:paw-print" class="h-5 w-5 text-pink-400" />
                    </div>
                    <h2 class="text-lg font-semibold text-fg">{{ $t("dashboard.pets") }}</h2>
                    <p class="mt-1 text-sm text-fg-muted">{{ $t("dashboard.pets_description") }}</p>
                </NuxtLink>

                <NuxtLink
                    to="/sensors"
                    class="group block rounded-xl border border-card-border bg-card-bg p-6 transition-colors hover:border-emerald-500"
                >
                    <div
                        class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"
                    >
                        <Icon name="lucide:thermometer" class="h-5 w-5 text-blue-400" />
                    </div>
                    <h2 class="text-lg font-semibold text-fg">{{ $t("dashboard.sensors") }}</h2>
                    <p class="mt-1 text-sm text-fg-muted">
                        {{ $t("dashboard.sensors_description") }}
                    </p>
                </NuxtLink>
            </div>
        </template>
    </PageContainer>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });
useSeoMeta({ title: "Dashboard – Cold Blood Cast" });

const authStore = useAuthStore();
const http = useHttp();

interface EnclosureListItem {
    id: string;
    name: string;
    type: string;
    species: string | null;
    _count: { pets: number; sensors: number };
}

interface PetListItem {
    id: string;
    name: string;
    species: string;
    enclosure: { id: string; name: string } | null;
    _count: { feedings: number; sheddings: number; weightRecords: number };
}

interface SensorListItem {
    id: string;
    name: string;
    type: string;
    unit: string;
    active: boolean;
    enclosure: { id: string; name: string } | null;
}

const enclosures = ref<EnclosureListItem[]>([]);
const pets = ref<PetListItem[]>([]);
const sensors = ref<SensorListItem[]>([]);
const loading = ref(true);

onMounted(async () => {
    try {
        const [encRes, petRes, senRes] = await Promise.all([
            http.get<EnclosureListItem[]>("/api/enclosures"),
            http.get<PetListItem[]>("/api/pets"),
            http.get<SensorListItem[]>("/api/sensors"),
        ]);
        enclosures.value = encRes.data;
        pets.value = petRes.data;
        sensors.value = senRes.data;
    } catch {
        // Silently handle — user will see empty state
    } finally {
        loading.value = false;
    }
});
</script>
