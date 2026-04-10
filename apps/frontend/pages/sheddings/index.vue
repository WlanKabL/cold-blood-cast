<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.sheddings.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.sheddings.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">{{ $t("pages.sheddings.add") }}</UiButton>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
            <UiSelect v-model="selectedPet" class="w-48">
                <option value="ALL">{{ $t("pages.sheddings.allPets") }}</option>
                <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
            </UiSelect>
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
        <div v-else-if="sheddings?.length" class="space-y-2">
            <div
                v-for="shed in sheddings"
                :key="shed.id"
                class="glass-card flex items-center justify-between rounded-xl p-4"
            >
                <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                        <Icon name="lucide:layers" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">{{ shed.pet?.name ?? "" }}</p>
                        <p class="text-fg-faint text-xs">
                            {{ $t("pages.sheddings.started") }}: {{ new Date(shed.startedAt).toLocaleDateString() }}
                            <span v-if="shed.completedAt">
                                · {{ $t("pages.sheddings.completed") }}: {{ new Date(shed.completedAt).toLocaleDateString() }}
                            </span>
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span
                        :class="shed.complete ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'"
                        class="rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ shed.complete ? $t("pages.sheddings.complete") : $t("pages.sheddings.inProgress") }}
                    </span>
                    <span v-if="shed.quality" class="text-fg-faint text-xs">{{ shed.quality }}</span>
                    <UiButton variant="ghost" icon="lucide:pencil" size="sm" @click="openEditModal(shed)" />
                    <UiButton variant="danger" icon="lucide:trash-2" size="sm" @click="confirmDelete(shed.id)" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:layers" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.sheddings.empty") }}</p>
            <UiButton class="mt-4" @click="openCreateModal">{{ $t("pages.sheddings.addFirst") }}</UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal :show="showCreate" :title="$t('pages.sheddings.create')" width="lg" @close="showCreate = false">
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiSelect v-model="form.petId" :label="$t('pages.sheddings.fields.pet')" required>
                    <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
                </UiSelect>
                <UiTextInput v-model="form.startedAt" :label="$t('pages.sheddings.fields.startedAt')" type="date" required />
                <UiTextInput v-model="form.completedAt" :label="$t('pages.sheddings.fields.completedAt')" type="date" />
                <div class="flex items-center gap-3">
                    <UiToggle v-model="form.complete" />
                    <label class="text-fg text-sm">{{ $t("pages.sheddings.fields.completeLabel") }}</label>
                </div>
                <UiTextInput v-model="form.quality" :label="$t('pages.sheddings.fields.quality')" :placeholder="$t('pages.sheddings.fields.qualityPlaceholder')" />
                <UiTextarea v-model="form.notes" :label="$t('pages.sheddings.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal :show="showEdit" :title="$t('pages.sheddings.edit')" width="lg" @close="showEdit = false">
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput v-model="editForm.startedAt" :label="$t('pages.sheddings.fields.startedAt')" type="date" required />
                <UiTextInput v-model="editForm.completedAt" :label="$t('pages.sheddings.fields.completedAt')" type="date" />
                <div class="flex items-center gap-3">
                    <UiToggle v-model="editForm.complete" />
                    <label class="text-fg text-sm">{{ $t("pages.sheddings.fields.completeLabel") }}</label>
                </div>
                <UiTextInput v-model="editForm.quality" :label="$t('pages.sheddings.fields.quality')" :placeholder="$t('pages.sheddings.fields.qualityPlaceholder')" />
                <UiTextarea v-model="editForm.notes" :label="$t('pages.sheddings.fields.notes')" />
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
            :message="$t('pages.sheddings.confirmDelete')"
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

interface Shedding {
    id: string;
    startedAt: string;
    completedAt: string | null;
    complete: boolean;
    quality: string | null;
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

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "sheddings" });
useHead({ title: () => t("pages.sheddings.title") });

const selectedPet = ref("ALL");

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (selectedPet.value && selectedPet.value !== "ALL") params.set("petId", selectedPet.value);
    return params.toString();
});

// ── Data ─────────────────────────────────────────────────
const {
    data: sheddings,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["sheddings", selectedPet],
    queryFn: () => api.get<Shedding[]>(`/api/sheddings${queryParams.value ? `?${queryParams.value}` : ""}`),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    petId: "",
    startedAt: "",
    completedAt: "",
    complete: false,
    quality: "",
    notes: "",
});

function resetForm() {
    Object.assign(form, { petId: "", startedAt: "", completedAt: "", complete: false, quality: "", notes: "" });
}

function openCreateModal() {
    resetForm();
    form.startedAt = new Date().toISOString().split("T")[0];
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/sheddings", {
            petId: form.petId,
            startedAt: form.startedAt,
            completedAt: form.completedAt || undefined,
            complete: form.complete,
            quality: form.quality || undefined,
            notes: form.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sheddings"] });
        toast.success(t("pages.sheddings.created"));
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
    startedAt: "",
    completedAt: "",
    complete: false,
    quality: "",
    notes: "",
});

function openEditModal(shed: Shedding) {
    editingId.value = shed.id;
    Object.assign(editForm, {
        startedAt: shed.startedAt.split("T")[0],
        completedAt: shed.completedAt ? shed.completedAt.split("T")[0] : "",
        complete: shed.complete,
        quality: shed.quality ?? "",
        notes: shed.notes ?? "",
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/sheddings/${editingId.value}`, {
            startedAt: editForm.startedAt,
            completedAt: editForm.completedAt || undefined,
            complete: editForm.complete,
            quality: editForm.quality || undefined,
            notes: editForm.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sheddings"] });
        toast.success(t("pages.sheddings.saved"));
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
    mutationFn: () => api.del(`/api/sheddings/${deletingId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sheddings"] });
        toast.success(t("pages.sheddings.deleted"));
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
