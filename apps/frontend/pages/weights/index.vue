<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.weights.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.weights.subtitle") }}</p>
            </div>
            <UButton icon="i-lucide-plus" :label="$t('pages.weights.add')" @click="showCreate = true" />
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
            <USelect v-model="selectedPet" :items="petOptions" :placeholder="$t('pages.weights.allPets')" class="w-48" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="glass-card h-16 animate-pulse rounded-xl" />
        </div>

        <!-- List -->
        <div v-else-if="weights?.length" class="space-y-2">
            <div
                v-for="w in weights"
                :key="w.id"
                class="glass-card flex items-center justify-between rounded-xl p-4"
            >
                <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <Icon name="lucide:scale" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">{{ w.weightGrams }} g</p>
                        <p class="text-fg-faint text-xs">{{ w.pet?.name ?? "" }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-fg-muted text-sm">{{ new Date(w.measuredAt).toLocaleDateString() }}</span>
                    <UButton variant="ghost" icon="i-lucide-trash-2" size="xs" color="error" @click="handleDelete(w.id)" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:scale" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.weights.empty") }}</p>
            <UButton class="mt-4" :label="$t('pages.weights.addFirst')" @click="showCreate = true" />
        </div>

        <!-- Create Modal -->
        <UModal v-model:open="showCreate">
            <template #content>
                <div class="p-6">
                    <h2 class="text-fg mb-4 text-lg font-semibold">{{ $t("pages.weights.create") }}</h2>
                    <form class="space-y-4" @submit.prevent="handleCreate">
                        <UFormField :label="$t('pages.weights.fields.pet')">
                            <USelect v-model="form.petId" :items="petOptions.filter((p) => p.value)" required />
                        </UFormField>
                        <UFormField :label="$t('pages.weights.fields.weight')">
                            <UInput v-model.number="form.weightGrams" type="number" min="1" required :placeholder="$t('pages.weights.fields.weightPlaceholder')" />
                        </UFormField>
                        <UFormField :label="$t('pages.weights.fields.measuredAt')">
                            <UInput v-model="form.measuredAt" type="date" required />
                        </UFormField>
                        <UFormField :label="$t('pages.weights.fields.notes')">
                            <UTextarea v-model="form.notes" />
                        </UFormField>
                        <div class="flex justify-end gap-2 pt-2">
                            <UButton variant="ghost" :label="$t('common.cancel')" @click="showCreate = false" />
                            <UButton type="submit" :loading="creating" :label="$t('common.save')" />
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface WeightRecord {
    id: string;
    weightGrams: number;
    measuredAt: string;
    notes: string | null;
    pet?: { name: string };
}

interface Pet {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.weights.title") });

const selectedPet = ref("");
const showCreate = ref(false);
const creating = ref(false);
const form = reactive({
    petId: "",
    weightGrams: null as number | null,
    measuredAt: "",
    notes: "",
});

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (selectedPet.value) params.set("petId", selectedPet.value);
    return params.toString();
});

const { data: weights, isLoading: loading } = useQuery({
    queryKey: ["weights", selectedPet],
    queryFn: () => api.get<WeightRecord[]>(`/api/weights${queryParams.value ? `?${queryParams.value}` : ""}`),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const petOptions = computed(() => [
    { label: t("pages.weights.allPets"), value: "" },
    ...(pets.value ?? []).map((p) => ({ label: p.name, value: p.id })),
]);

async function handleCreate() {
    creating.value = true;
    try {
        await api.post("/api/weights", {
            petId: form.petId,
            weightGrams: form.weightGrams,
            measuredAt: form.measuredAt,
            notes: form.notes || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["weights"] });
        toast.add({ title: t("common.saved"), color: "green" });
        showCreate.value = false;
        Object.assign(form, { petId: "", weightGrams: null, measuredAt: "", notes: "" });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    } finally {
        creating.value = false;
    }
}

async function handleDelete(id: string) {
    if (!confirm(t("pages.weights.confirmDelete"))) return;
    try {
        await api.del(`/api/weights/${id}`);
        await queryClient.invalidateQueries({ queryKey: ["weights"] });
        toast.add({ title: t("common.deleted"), color: "green" });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    }
}
</script>
