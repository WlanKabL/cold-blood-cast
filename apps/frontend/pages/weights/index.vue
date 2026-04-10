<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.weights.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.weights.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">{{ $t("pages.weights.add") }}</UiButton>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
            <UiSelect v-model="selectedPet" class="w-48">
                <option value="ALL">{{ $t("pages.weights.allPets") }}</option>
                <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
            </UiSelect>
            <NuxtLink to="/weights/chart" class="text-primary-400 hover:text-primary-300 ml-auto text-sm font-medium">
                <Icon name="lucide:line-chart" class="mr-1 inline h-4 w-4" />
                {{ $t("pages.weights.chart.viewChart") }}
            </NuxtLink>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="glass-card h-16 animate-pulse rounded-xl" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{ $t("common.retry") }}</UiButton>
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
                    <UiButton variant="ghost" icon="lucide:pencil" size="sm" @click="openEditModal(w)" />
                    <UiButton variant="danger" icon="lucide:trash-2" size="sm" @click="confirmDelete(w.id)" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:scale" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.weights.empty") }}</p>
            <UiButton class="mt-4" @click="openCreateModal">{{ $t("pages.weights.addFirst") }}</UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal :show="showCreate" :title="$t('pages.weights.create')" width="lg" @close="showCreate = false">
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiSelect v-model="form.petId" :label="$t('pages.weights.fields.pet')" required>
                    <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
                </UiSelect>
                <UiTextInput v-model.number="form.weightGrams" :label="$t('pages.weights.fields.weight')" type="number" min="1" required :placeholder="$t('pages.weights.fields.weightPlaceholder')" />
                <UiTextInput v-model="form.measuredAt" :label="$t('pages.weights.fields.measuredAt')" type="date" required />
                <UiTextarea v-model="form.notes" :label="$t('pages.weights.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal :show="showEdit" :title="$t('pages.weights.edit')" width="lg" @close="showEdit = false">
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput v-model.number="editForm.weightGrams" :label="$t('pages.weights.fields.weight')" type="number" min="1" required :placeholder="$t('pages.weights.fields.weightPlaceholder')" />
                <UiTextInput v-model="editForm.measuredAt" :label="$t('pages.weights.fields.measuredAt')" type="date" required />
                <UiTextarea v-model="editForm.notes" :label="$t('pages.weights.fields.notes')" />
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
            :message="$t('pages.weights.confirmDelete')"
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
const toast = useAppToast();

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "weights" });
useHead({ title: () => t("pages.weights.title") });

const selectedPet = ref("ALL");

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (selectedPet.value && selectedPet.value !== "ALL") params.set("petId", selectedPet.value);
    return params.toString();
});

// ── Data ─────────────────────────────────────────────────
const {
    data: weights,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["weights", selectedPet],
    queryFn: () => api.get<WeightRecord[]>(`/api/weights${queryParams.value ? `?${queryParams.value}` : ""}`),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    petId: "",
    weightGrams: null as number | null,
    measuredAt: "",
    notes: "",
});

function resetForm() {
    Object.assign(form, { petId: "", weightGrams: null, measuredAt: "", notes: "" });
}

function openCreateModal() {
    resetForm();
    form.measuredAt = new Date().toISOString().split("T")[0];
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/weights", {
            petId: form.petId,
            weightGrams: form.weightGrams,
            measuredAt: form.measuredAt,
            notes: form.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["weights"] });
        toast.success(t("pages.weights.created"));
        showCreate.value = false;
        resetForm();
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleCreate() {
    createMutation();
}

// ── Edit ─────────────────────────────────────────────────
const showEdit = ref(false);
const editingId = ref("");
const editForm = reactive({
    weightGrams: null as number | null,
    measuredAt: "",
    notes: "",
});

function openEditModal(w: WeightRecord) {
    editingId.value = w.id;
    Object.assign(editForm, {
        weightGrams: w.weightGrams,
        measuredAt: w.measuredAt.split("T")[0],
        notes: w.notes ?? "",
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/weights/${editingId.value}`, {
            weightGrams: editForm.weightGrams,
            measuredAt: editForm.measuredAt,
            notes: editForm.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["weights"] });
        toast.success(t("pages.weights.saved"));
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
const deletingId = ref("");

function confirmDelete(id: string) {
    deletingId.value = id;
    showDeleteConfirm.value = true;
}

const { mutate: deleteMutation, isPending: deleting } = useMutation({
    mutationFn: () => api.del(`/api/weights/${deletingId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["weights"] });
        toast.success(t("pages.weights.deleted"));
        showDeleteConfirm.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDelete() {
    deleteMutation();
}
</script>
