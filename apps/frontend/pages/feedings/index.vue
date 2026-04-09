<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.feedings.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.feedings.subtitle") }}</p>
            </div>
            <UButton icon="i-lucide-plus" :label="$t('pages.feedings.add')" @click="showCreate = true" />
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
            <USelect v-model="selectedPet" :items="petOptions" :placeholder="$t('pages.feedings.allPets')" class="w-48" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="glass-card h-16 animate-pulse rounded-xl" />
        </div>

        <!-- List -->
        <div v-else-if="feedings?.length" class="space-y-2">
            <div
                v-for="feeding in feedings"
                :key="feeding.id"
                class="glass-card flex items-center justify-between rounded-xl p-4"
            >
                <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                        <Icon name="lucide:utensils" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">{{ feeding.foodType }}</p>
                        <p class="text-fg-faint text-xs">
                            {{ feeding.pet?.name ?? "" }}
                            <span v-if="feeding.foodSize"> · {{ feeding.foodSize }}</span>
                            <span v-if="feeding.quantity"> · ×{{ feeding.quantity }}</span>
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <p class="text-fg-muted text-sm">{{ new Date(feeding.fedAt).toLocaleDateString() }}</p>
                        <p class="text-fg-faint text-xs">{{ new Date(feeding.fedAt).toLocaleTimeString() }}</p>
                    </div>
                    <span
                        :class="feeding.accepted ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'"
                        class="rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ feeding.accepted ? $t("pages.feedings.accepted") : $t("pages.feedings.refused") }}
                    </span>
                    <UButton variant="ghost" icon="i-lucide-trash-2" size="xs" color="error" @click="handleDelete(feeding.id)" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:utensils" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.feedings.empty") }}</p>
            <UButton class="mt-4" :label="$t('pages.feedings.addFirst')" @click="showCreate = true" />
        </div>

        <!-- Create Modal -->
        <UModal v-model:open="showCreate">
            <template #content>
                <div class="p-6">
                    <h2 class="text-fg mb-4 text-lg font-semibold">{{ $t("pages.feedings.create") }}</h2>
                    <form class="space-y-4" @submit.prevent="handleCreate">
                        <UFormField :label="$t('pages.feedings.fields.pet')">
                            <USelect v-model="form.petId" :items="petOptions.filter((p) => p.value)" required />
                        </UFormField>
                        <UFormField :label="$t('pages.feedings.fields.foodType')">
                            <UInput v-model="form.foodType" required :placeholder="$t('pages.feedings.fields.foodTypePlaceholder')" />
                        </UFormField>
                        <div class="grid grid-cols-2 gap-3">
                            <UFormField :label="$t('pages.feedings.fields.foodSize')">
                                <UInput v-model="form.foodSize" />
                            </UFormField>
                            <UFormField :label="$t('pages.feedings.fields.quantity')">
                                <UInput v-model.number="form.quantity" type="number" min="1" />
                            </UFormField>
                        </div>
                        <UFormField :label="$t('pages.feedings.fields.accepted')">
                            <UCheckbox v-model="form.accepted" :label="$t('pages.feedings.fields.acceptedLabel')" />
                        </UFormField>
                        <UFormField :label="$t('pages.feedings.fields.notes')">
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

interface Feeding {
    id: string;
    foodType: string;
    foodSize: string | null;
    quantity: number | null;
    accepted: boolean;
    fedAt: string;
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
useHead({ title: () => t("pages.feedings.title") });

const selectedPet = ref("");
const showCreate = ref(false);
const creating = ref(false);
const form = reactive({
    petId: "",
    foodType: "",
    foodSize: "",
    quantity: 1,
    accepted: true,
    notes: "",
});

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (selectedPet.value) params.set("petId", selectedPet.value);
    return params.toString();
});

const { data: feedings, isLoading: loading } = useQuery({
    queryKey: ["feedings", selectedPet],
    queryFn: () => api.get<Feeding[]>(`/api/feedings${queryParams.value ? `?${queryParams.value}` : ""}`),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const petOptions = computed(() => [
    { label: t("pages.feedings.allPets"), value: "" },
    ...(pets.value ?? []).map((p) => ({ label: p.name, value: p.id })),
]);

async function handleCreate() {
    creating.value = true;
    try {
        await api.post("/api/feedings", {
            petId: form.petId,
            foodType: form.foodType,
            foodSize: form.foodSize || undefined,
            quantity: form.quantity,
            accepted: form.accepted,
            notes: form.notes || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["feedings"] });
        toast.add({ title: t("common.saved"), color: "green" });
        showCreate.value = false;
        Object.assign(form, { petId: "", foodType: "", foodSize: "", quantity: 1, accepted: true, notes: "" });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    } finally {
        creating.value = false;
    }
}

async function handleDelete(id: string) {
    if (!confirm(t("pages.feedings.confirmDelete"))) return;
    try {
        await api.del(`/api/feedings/${id}`);
        await queryClient.invalidateQueries({ queryKey: ["feedings"] });
        toast.add({ title: t("common.deleted"), color: "green" });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    }
}
</script>
