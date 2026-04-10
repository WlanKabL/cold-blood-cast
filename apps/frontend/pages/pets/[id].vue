<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="flex items-center gap-3">
            <NuxtLink to="/pets" class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors">
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <h1 class="text-fg truncate text-2xl font-bold tracking-tight">{{ pet?.name ?? "..." }}</h1>
                    <span
                        v-if="pet?.gender && pet.gender !== 'UNKNOWN'"
                        class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ pet.gender }}
                    </span>
                </div>
                <p class="text-fg-faint text-sm">
                    {{ pet?.species }}
                    <template v-if="pet?.morph"> · {{ pet.morph }}</template>
                </p>
            </div>
            <div v-if="pet" class="flex items-center gap-2">
                <UiButton variant="ghost" icon="lucide:pencil" @click="openEditModal" />
                <UiButton variant="danger" icon="lucide:trash-2" @click="showDeleteConfirm = true" />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-4">
            <div class="glass-card h-48 animate-pulse rounded-xl" />
            <div class="glass-card h-32 animate-pulse rounded-xl" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{ $t("common.retry") }}</UiButton>
        </div>

        <template v-else-if="pet">
            <!-- Info Card -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.pets.details") }}</h2>
                    <span
                        v-if="pet.enclosure"
                        class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ pet.enclosure.name }}
                    </span>
                </div>
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

        <!-- Edit Modal -->
        <UiModal :show="showEdit" :title="$t('pages.pets.edit')" width="lg" @close="showEdit = false">
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput v-model="editForm.name" :label="$t('pages.pets.fields.name')" required />
                <UiSelect v-model="editForm.enclosureId" :label="$t('pages.pets.fields.enclosure')">
                    <option value="NONE">—</option>
                    <option v-for="enc in enclosures" :key="enc.id" :value="enc.id">{{ enc.name }}</option>
                </UiSelect>
                <UiTextInput v-model="editForm.species" :label="$t('pages.pets.fields.species')" required />
                <UiTextInput v-model="editForm.morph" :label="$t('pages.pets.fields.morph')" />
                <UiSelect v-model="editForm.gender" :label="$t('pages.pets.fields.gender')">
                    <option v-for="g in genderOptions" :key="g" :value="g">{{ g }}</option>
                </UiSelect>
                <UiTextInput v-model="editForm.birthDate" :label="$t('pages.pets.fields.birthDate')" type="date" />
                <UiTextarea v-model="editForm.notes" :label="$t('pages.pets.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showEdit = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="updating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Delete Confirmation -->
        <UiConfirmDialog
            :show="showDeleteConfirm"
            :title="$t('common.confirmDelete')"
            :message="$t('pages.pets.confirmDelete')"
            variant="danger"
            :confirm-label="$t('common.delete')"
            :cancel-label="$t('common.cancel')"
            :loading="deleting"
            @confirm="handleDelete"
            @cancel="showDeleteConfirm = false"
        />
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";

interface Pet {
    id: string;
    name: string;
    species: string;
    morph: string | null;
    gender: string | null;
    birthDate: string | null;
    notes: string | null;
    enclosureId: string | null;
    enclosure: { id: string; name: string } | null;
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

interface Enclosure {
    id: string;
    name: string;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

const petId = route.params.id as string;
const genderOptions = ["MALE", "FEMALE", "UNKNOWN"];

definePageMeta({ layout: "default" });

// ── Data ─────────────────────────────────────────────────
const {
    data: pet,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
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

const { data: enclosures } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

useHead({ title: () => pet.value?.name ?? t("pages.pets.title") });

// ── Edit ─────────────────────────────────────────────────
const showEdit = ref(false);
const editForm = reactive({
    name: "",
    enclosureId: "NONE",
    species: "",
    morph: "",
    gender: "UNKNOWN",
    birthDate: "",
    notes: "",
});

function openEditModal() {
    if (!pet.value) return;
    Object.assign(editForm, {
        name: pet.value.name,
        enclosureId: pet.value.enclosureId ?? "NONE",
        species: pet.value.species,
        morph: pet.value.morph ?? "",
        gender: pet.value.gender ?? "UNKNOWN",
        birthDate: pet.value.birthDate ? pet.value.birthDate.split("T")[0] : "",
        notes: pet.value.notes ?? "",
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/pets/${petId}`, {
            name: editForm.name,
            enclosureId: editForm.enclosureId === "NONE" ? undefined : editForm.enclosureId,
            species: editForm.species,
            morph: editForm.morph || undefined,
            gender: editForm.gender,
            birthDate: editForm.birthDate || undefined,
            notes: editForm.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.saved"));
        showEdit.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleUpdate() {
    updateMutation();
}

// ── Delete ───────────────────────────────────────────────
const showDeleteConfirm = ref(false);

const { mutate: deleteMutation, isPending: deleting } = useMutation({
    mutationFn: () => api.del(`/api/pets/${petId}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.deleted"));
        router.push("/pets");
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDelete() {
    deleteMutation();
}
</script>
