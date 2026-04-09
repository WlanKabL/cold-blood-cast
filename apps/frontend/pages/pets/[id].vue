<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="flex items-center gap-3">
            <NuxtLink to="/pets" class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors">
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="flex-1">
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ pet?.name ?? "..." }}</h1>
                <p class="text-fg-faint text-sm">{{ pet?.species }} · {{ pet?.morph ?? "" }}</p>
            </div>
            <UButton v-if="pet" variant="ghost" icon="i-lucide-trash-2" color="error" @click="handleDelete" />
        </div>

        <div v-if="loading" class="space-y-4">
            <div class="glass-card h-48 animate-pulse rounded-xl" />
        </div>

        <template v-else-if="pet">
            <!-- Info Card -->
            <div class="glass-card rounded-xl p-6">
                <h2 class="text-fg mb-4 font-semibold">{{ $t("pages.pets.details") }}</h2>
                <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.pets.fields.species") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.species }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.pets.fields.morph") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.morph || "—" }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.pets.fields.gender") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.gender || "—" }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.pets.fields.birthDate") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.birthDate ? new Date(pet.birthDate).toLocaleDateString() : "—" }}</dd>
                    </div>
                    <div v-if="pet.notes" class="sm:col-span-2">
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.pets.fields.notes") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.notes }}</dd>
                    </div>
                </dl>
            </div>

            <!-- Recent Feedings -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.pets.recentFeedings") }}</h2>
                    <NuxtLink to="/feedings" class="text-primary-400 text-sm font-medium">{{ $t("pages.dashboard.viewAll") }}</NuxtLink>
                </div>
                <div v-if="feedings?.length" class="space-y-2">
                    <div
                        v-for="feeding in feedings"
                        :key="feeding.id"
                        class="bg-surface-raised flex items-center justify-between rounded-lg p-3"
                    >
                        <div class="flex items-center gap-3">
                            <Icon name="lucide:utensils" class="text-amber-400 h-4 w-4" />
                            <span class="text-fg text-sm">{{ feeding.foodType }}</span>
                            <span v-if="feeding.foodSize" class="text-fg-faint text-xs">({{ feeding.foodSize }})</span>
                        </div>
                        <span class="text-fg-faint text-xs">{{ new Date(feeding.fedAt).toLocaleDateString() }}</span>
                    </div>
                </div>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.pets.noFeedings") }}</p>
            </div>

            <!-- Weight History -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.pets.weightHistory") }}</h2>
                    <NuxtLink to="/weights" class="text-primary-400 text-sm font-medium">{{ $t("pages.dashboard.viewAll") }}</NuxtLink>
                </div>
                <div v-if="weights?.length" class="space-y-2">
                    <div
                        v-for="w in weights"
                        :key="w.id"
                        class="bg-surface-raised flex items-center justify-between rounded-lg p-3"
                    >
                        <div class="flex items-center gap-3">
                            <Icon name="lucide:scale" class="text-blue-400 h-4 w-4" />
                            <span class="text-fg text-sm font-medium">{{ w.weightGrams }} g</span>
                        </div>
                        <span class="text-fg-faint text-xs">{{ new Date(w.measuredAt).toLocaleDateString() }}</span>
                    </div>
                </div>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.pets.noWeights") }}</p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface Pet {
    id: string;
    name: string;
    species: string;
    morph: string | null;
    gender: string | null;
    birthDate: string | null;
    notes: string | null;
    enclosureId: string;
}

interface Feeding {
    id: string;
    foodType: string;
    foodSize: string | null;
    fedAt: string;
}

interface WeightRecord {
    id: string;
    weightGrams: number;
    measuredAt: string;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useToast();

const petId = route.params.id as string;

definePageMeta({ layout: "default" });
useHead({ title: () => pet.value?.name ?? t("pages.pets.title") });

const { data: pet, isLoading: loading } = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => api.get<Pet>(`/api/pets/${petId}`),
});

const { data: feedings } = useQuery({
    queryKey: ["feedings", { petId }],
    queryFn: () => api.get<Feeding[]>(`/api/feedings?petId=${petId}&limit=10`),
});

const { data: weights } = useQuery({
    queryKey: ["weights", { petId }],
    queryFn: () => api.get<WeightRecord[]>(`/api/weights?petId=${petId}&limit=10`),
});

async function handleDelete() {
    if (!confirm(t("pages.pets.confirmDelete"))) return;
    try {
        await api.del(`/api/pets/${petId}`);
        await queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.add({ title: t("common.deleted"), color: "green" });
        router.push("/pets");
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    }
}
</script>
