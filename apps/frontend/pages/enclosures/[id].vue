<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="flex items-center gap-3">
            <NuxtLink to="/enclosures" class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors">
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="flex-1">
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ enclosure?.name ?? "..." }}</h1>
                <p class="text-fg-faint text-sm">{{ enclosure?.type }} · {{ enclosure?.species }}</p>
            </div>
            <UButton v-if="enclosure" variant="ghost" icon="i-lucide-trash-2" color="error" @click="handleDelete" />
        </div>

        <div v-if="loading" class="space-y-4">
            <div class="glass-card h-48 animate-pulse rounded-xl" />
        </div>

        <template v-else-if="enclosure">
            <!-- Info Card -->
            <div class="glass-card rounded-xl p-6">
                <h2 class="text-fg mb-4 font-semibold">{{ $t("pages.enclosures.details") }}</h2>
                <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.enclosures.fields.type") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ enclosure.type }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.enclosures.fields.species") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ enclosure.species || "—" }}</dd>
                    </div>
                    <div v-if="enclosure.lengthCm || enclosure.widthCm || enclosure.heightCm">
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.enclosures.fields.dimensions") }}</dt>
                        <dd class="text-fg mt-1 text-sm">
                            {{ enclosure.lengthCm ?? "—" }} × {{ enclosure.widthCm ?? "—" }} × {{ enclosure.heightCm ?? "—" }} cm
                        </dd>
                    </div>
                    <div v-if="enclosure.description" class="sm:col-span-2">
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.enclosures.fields.description") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ enclosure.description }}</dd>
                    </div>
                </dl>
            </div>

            <!-- Pets in this enclosure -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.enclosures.petsInEnclosure") }}</h2>
                    <NuxtLink to="/pets" class="text-primary-400 text-sm font-medium">{{ $t("pages.dashboard.viewAll") }}</NuxtLink>
                </div>
                <div v-if="pets?.length" class="space-y-2">
                    <NuxtLink
                        v-for="pet in pets"
                        :key="pet.id"
                        :to="`/pets/${pet.id}`"
                        class="bg-surface-raised hover:bg-surface-hover flex items-center gap-3 rounded-lg p-3 transition-colors"
                    >
                        <Icon name="lucide:heart" class="text-primary-400 h-4 w-4" />
                        <span class="text-fg text-sm font-medium">{{ pet.name }}</span>
                        <span class="text-fg-faint text-xs">{{ pet.species }} · {{ pet.morph }}</span>
                    </NuxtLink>
                </div>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.enclosures.noPets") }}</p>
            </div>

            <!-- Sensors in this enclosure -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.enclosures.sensorsInEnclosure") }}</h2>
                    <NuxtLink to="/sensors" class="text-primary-400 text-sm font-medium">{{ $t("pages.dashboard.viewAll") }}</NuxtLink>
                </div>
                <div v-if="sensors?.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NuxtLink
                        v-for="sensor in sensors"
                        :key="sensor.id"
                        :to="`/sensors/${sensor.id}`"
                        class="bg-surface-raised hover:bg-surface-hover rounded-lg p-3 transition-colors"
                    >
                        <div class="flex items-center gap-2">
                            <Icon name="lucide:thermometer" class="text-green-400 h-4 w-4" />
                            <span class="text-fg text-sm font-medium">{{ sensor.name }}</span>
                        </div>
                        <p class="text-fg-faint mt-1 text-xs">{{ sensor.type }} · {{ sensor.location }}</p>
                    </NuxtLink>
                </div>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.enclosures.noSensors") }}</p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface Enclosure {
    id: string;
    name: string;
    type: string;
    species: string | null;
    description: string | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
}

interface Pet {
    id: string;
    name: string;
    species: string;
    morph: string | null;
}

interface Sensor {
    id: string;
    name: string;
    type: string;
    location: string | null;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useToast();

const enclosureId = route.params.id as string;

definePageMeta({ layout: "default" });
useHead({ title: () => enclosure.value?.name ?? t("pages.enclosures.title") });

const { data: enclosure, isLoading: loading } = useQuery({
    queryKey: ["enclosures", enclosureId],
    queryFn: () => api.get<Enclosure>(`/api/enclosures/${enclosureId}`),
});

const { data: pets } = useQuery({
    queryKey: ["pets", { enclosureId }],
    queryFn: () => api.get<Pet[]>(`/api/pets?enclosureId=${enclosureId}`),
});

const { data: sensors } = useQuery({
    queryKey: ["sensors", { enclosureId }],
    queryFn: () => api.get<Sensor[]>(`/api/sensors?enclosureId=${enclosureId}`),
});

async function handleDelete() {
    if (!confirm(t("pages.enclosures.confirmDelete"))) return;
    try {
        await api.del(`/api/enclosures/${enclosureId}`);
        await queryClient.invalidateQueries({ queryKey: ["enclosures"] });
        toast.add({ title: t("common.deleted"), color: "green" });
        router.push("/enclosures");
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    }
}
</script>
