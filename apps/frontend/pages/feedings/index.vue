<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.feedings.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.feedings.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">{{ $t("pages.feedings.add") }}</UiButton>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
            <UiSelect v-model="selectedPet" class="w-48">
                <option value="ALL">{{ $t("pages.feedings.allPets") }}</option>
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
                            <span v-if="feeding.quantity > 1"> · ×{{ feeding.quantity }}</span>
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
                    <UiButton variant="ghost" icon="lucide:pencil" size="sm" @click="openEditModal(feeding)" />
                    <UiButton variant="danger" icon="lucide:trash-2" size="sm" @click="confirmDelete(feeding.id)" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:utensils" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.feedings.empty") }}</p>
            <UiButton class="mt-4" @click="openCreateModal">{{ $t("pages.feedings.addFirst") }}</UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal :show="showCreate" :title="$t('pages.feedings.create')" width="lg" @close="showCreate = false">
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiSelect v-model="form.petId" :label="$t('pages.feedings.fields.pet')" required>
                    <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
                </UiSelect>
                <UiTextInput v-model="form.fedAt" :label="$t('pages.feedings.fields.fedAt')" type="datetime-local" required />
                <UiSelect v-model="form.feedItemId" :label="$t('pages.feedings.fields.feedItem')" @update:model-value="onFeedItemSelected">
                    <option value="">{{ $t("pages.feedings.fields.feedItemNone") }}</option>
                    <option v-for="fi in petFeedItems" :key="fi.id" :value="fi.id">
                        {{ fi.name }}<template v-if="fi.size"> ({{ fi.size }})</template>
                    </option>
                </UiSelect>
                <UiTextInput v-model="form.foodType" :label="$t('pages.feedings.fields.foodType')" required :placeholder="$t('pages.feedings.fields.foodTypePlaceholder')" />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput v-model="form.foodSize" :label="$t('pages.feedings.fields.foodSize')" />
                    <UiTextInput v-model.number="form.quantity" :label="$t('pages.feedings.fields.quantity')" type="number" min="1" />
                </div>
                <div class="flex items-center gap-3">
                    <UiToggle v-model="form.accepted" />
                    <label class="text-fg text-sm">{{ $t("pages.feedings.fields.acceptedLabel") }}</label>
                </div>
                <UiTextarea v-model="form.notes" :label="$t('pages.feedings.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal :show="showEdit" :title="$t('pages.feedings.edit')" width="lg" @close="showEdit = false">
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput v-model="editForm.fedAt" :label="$t('pages.feedings.fields.fedAt')" type="datetime-local" required />
                <UiSelect v-model="editForm.feedItemId" :label="$t('pages.feedings.fields.feedItem')" @update:model-value="onEditFeedItemSelected">
                    <option value="">{{ $t("pages.feedings.fields.feedItemNone") }}</option>
                    <option v-for="fi in feedItemsList" :key="fi.id" :value="fi.id">
                        {{ fi.name }}<template v-if="fi.size"> ({{ fi.size }})</template>
                    </option>
                </UiSelect>
                <UiTextInput v-model="editForm.foodType" :label="$t('pages.feedings.fields.foodType')" required :placeholder="$t('pages.feedings.fields.foodTypePlaceholder')" />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput v-model="editForm.foodSize" :label="$t('pages.feedings.fields.foodSize')" />
                    <UiTextInput v-model.number="editForm.quantity" :label="$t('pages.feedings.fields.quantity')" type="number" min="1" />
                </div>
                <div class="flex items-center gap-3">
                    <UiToggle v-model="editForm.accepted" />
                    <label class="text-fg text-sm">{{ $t("pages.feedings.fields.acceptedLabel") }}</label>
                </div>
                <UiTextarea v-model="editForm.notes" :label="$t('pages.feedings.fields.notes')" />
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
            :message="$t('pages.feedings.confirmDelete')"
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

interface Feeding {
    id: string;
    feedItemId: string | null;
    foodType: string;
    foodSize: string | null;
    quantity: number;
    accepted: boolean;
    fedAt: string;
    notes: string | null;
    pet?: { name: string };
    feedItem?: { id: string; name: string; size: string | null } | null;
}

interface Pet {
    id: string;
    name: string;
}

interface FeedItem {
    id: string;
    name: string;
    size: string | null;
    weightGrams: number | null;
    suitablePets?: Array<{ id: string }>;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.feedings.title") });

const selectedPet = ref("ALL");

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (selectedPet.value && selectedPet.value !== "ALL") params.set("petId", selectedPet.value);
    return params.toString();
});

// ── Data ─────────────────────────────────────────────────
const {
    data: feedings,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["feedings", selectedPet],
    queryFn: () => api.get<Feeding[]>(`/api/feedings${queryParams.value ? `?${queryParams.value}` : ""}`),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const { data: feedItemsList } = useQuery({
    queryKey: ["feed-items"],
    queryFn: () => api.get<FeedItem[]>("/api/feed-items"),
});

const petFeedItems = computed(() => {
    if (!feedItemsList.value || !form.petId) return feedItemsList.value ?? [];
    return feedItemsList.value.filter(
        (fi) => !fi.suitablePets?.length || fi.suitablePets.some((p) => p.id === form.petId),
    );
});

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    petId: "",
    feedItemId: "",
    fedAt: "",
    foodType: "",
    foodSize: "",
    quantity: 1,
    accepted: true,
    notes: "",
});

function resetForm() {
    Object.assign(form, { petId: "", feedItemId: "", fedAt: "", foodType: "", foodSize: "", quantity: 1, accepted: true, notes: "" });
}

function openCreateModal() {
    resetForm();
    form.fedAt = new Date().toISOString().slice(0, 16);
    showCreate.value = true;
}

function onFeedItemSelected(feedItemId: string) {
    const fi = feedItemsList.value?.find((f) => f.id === feedItemId);
    if (fi) {
        form.foodType = fi.name;
        form.foodSize = fi.size ?? "";
    }
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/feedings", {
            petId: form.petId,
            feedItemId: form.feedItemId || undefined,
            fedAt: form.fedAt,
            foodType: form.foodType,
            foodSize: form.foodSize || undefined,
            quantity: form.quantity,
            accepted: form.accepted,
            notes: form.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["feedings"] });
        toast.success(t("pages.feedings.created"));
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
    feedItemId: "",
    fedAt: "",
    foodType: "",
    foodSize: "",
    quantity: 1,
    accepted: true,
    notes: "",
});

function openEditModal(feeding: Feeding) {
    editingId.value = feeding.id;
    Object.assign(editForm, {
        feedItemId: feeding.feedItemId ?? "",
        fedAt: feeding.fedAt.slice(0, 16),
        foodType: feeding.foodType,
        foodSize: feeding.foodSize ?? "",
        quantity: feeding.quantity,
        accepted: feeding.accepted,
        notes: feeding.notes ?? "",
    });
    showEdit.value = true;
}

function onEditFeedItemSelected(feedItemId: string) {
    const fi = feedItemsList.value?.find((f) => f.id === feedItemId);
    if (fi) {
        editForm.foodType = fi.name;
        editForm.foodSize = fi.size ?? "";
    }
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/feedings/${editingId.value}`, {
            feedItemId: editForm.feedItemId || undefined,
            fedAt: editForm.fedAt,
            foodType: editForm.foodType,
            foodSize: editForm.foodSize || undefined,
            quantity: editForm.quantity,
            accepted: editForm.accepted,
            notes: editForm.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["feedings"] });
        toast.success(t("pages.feedings.saved"));
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
    mutationFn: () => api.del(`/api/feedings/${deletingId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["feedings"] });
        toast.success(t("pages.feedings.deleted"));
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
