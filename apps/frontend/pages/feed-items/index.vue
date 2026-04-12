<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div
            class="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.feedItems.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.feedItems.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">{{
                $t("pages.feedItems.add")
            }}</UiButton>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="glass-card h-20 animate-pulse rounded-xl" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <!-- List -->
        <div v-else-if="feedItems?.length" class="space-y-2">
            <div
                v-for="item in feedItems"
                :key="item.id"
                class="glass-card flex items-center justify-between rounded-xl p-4"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400"
                    >
                        <Icon name="lucide:rat" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">{{ item.name }}</p>
                        <p class="text-fg-faint text-xs">
                            <span v-if="item.size">{{ item.size }}</span>
                            <span v-if="item.size && item.weightGrams"> · </span>
                            <span v-if="item.weightGrams">{{ item.weightGrams }}g</span>
                            <span v-if="!item.size && !item.weightGrams">{{
                                $t("pages.feedItems.noDetails")
                            }}</span>
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <p v-if="item.suitablePets?.length" class="text-fg-muted text-xs">
                            {{ item.suitablePets.map((p: { name: string }) => p.name).join(", ") }}
                        </p>
                        <p class="text-fg-faint text-xs">
                            {{
                                $t("pages.feedItems.usedCount", {
                                    count: item._count?.feedings ?? 0,
                                })
                            }}
                        </p>
                    </div>
                    <UiButton
                        variant="ghost"
                        icon="lucide:pencil"
                        size="sm"
                        @click="openEditModal(item)"
                    />
                    <UiButton
                        variant="danger"
                        icon="lucide:trash-2"
                        size="sm"
                        @click="confirmDelete(item.id)"
                    />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:rat" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.feedItems.empty") }}</p>
            <p class="text-fg-faint mt-1 max-w-sm text-center text-xs">
                {{ $t("pages.feedItems.emptyHint") }}
            </p>
            <UiButton class="mt-4" @click="openCreateModal">{{
                $t("pages.feedItems.addFirst")
            }}</UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal
            :show="showCreate"
            :title="$t('pages.feedItems.create')"
            width="lg"
            @close="showCreate = false"
        >
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiTextInput
                    v-model="form.name"
                    :label="$t('pages.feedItems.fields.name')"
                    required
                    :placeholder="$t('pages.feedItems.fields.namePlaceholder')"
                />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model="form.size"
                        :label="$t('pages.feedItems.fields.size')"
                        :placeholder="$t('pages.feedItems.fields.sizePlaceholder')"
                    />
                    <UiTextInput
                        v-model.number="form.weightGrams"
                        :label="$t('pages.feedItems.fields.weight')"
                        type="number"
                        step="0.1"
                        min="0"
                    />
                </div>
                <div>
                    <label class="text-fg mb-1.5 block text-sm font-medium">{{
                        $t("pages.feedItems.fields.suitablePets")
                    }}</label>
                    <div class="space-y-1.5">
                        <label v-for="p in pets" :key="p.id" class="flex items-center gap-2">
                            <input
                                v-model="form.suitablePetIds"
                                type="checkbox"
                                :value="p.id"
                                class="accent-primary-500 h-4 w-4 rounded"
                            />
                            <span class="text-fg text-sm">{{ p.name }}</span>
                        </label>
                        <p v-if="!pets?.length" class="text-fg-faint text-xs">
                            {{ $t("pages.feedItems.noPetsYet") }}
                        </p>
                    </div>
                </div>
                <UiTextarea v-model="form.notes" :label="$t('pages.feedItems.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal
            :show="showEdit"
            :title="$t('pages.feedItems.edit')"
            width="lg"
            @close="showEdit = false"
        >
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput
                    v-model="editForm.name"
                    :label="$t('pages.feedItems.fields.name')"
                    required
                    :placeholder="$t('pages.feedItems.fields.namePlaceholder')"
                />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model="editForm.size"
                        :label="$t('pages.feedItems.fields.size')"
                        :placeholder="$t('pages.feedItems.fields.sizePlaceholder')"
                    />
                    <UiTextInput
                        v-model.number="editForm.weightGrams"
                        :label="$t('pages.feedItems.fields.weight')"
                        type="number"
                        step="0.1"
                        min="0"
                    />
                </div>
                <div>
                    <label class="text-fg mb-1.5 block text-sm font-medium">{{
                        $t("pages.feedItems.fields.suitablePets")
                    }}</label>
                    <div class="space-y-1.5">
                        <label v-for="p in pets" :key="p.id" class="flex items-center gap-2">
                            <input
                                v-model="editForm.suitablePetIds"
                                type="checkbox"
                                :value="p.id"
                                class="accent-primary-500 h-4 w-4 rounded"
                            />
                            <span class="text-fg text-sm">{{ p.name }}</span>
                        </label>
                    </div>
                </div>
                <UiTextarea v-model="editForm.notes" :label="$t('pages.feedItems.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showEdit = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="updating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Delete Confirmation -->
        <UiConfirmDialog
            :show="showDeleteConfirm"
            :title="$t('common.confirmDelete')"
            :message="$t('pages.feedItems.confirmDelete')"
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

interface FeedItem {
    id: string;
    name: string;
    size: string | null;
    weightGrams: number | null;
    notes: string | null;
    suitablePets?: Array<{ id: string; name: string }>;
    _count?: { feedings: number };
}

interface Pet {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "feedings" });
useHead({ title: () => t("pages.feedItems.title") });

// ── Data ─────────────────────────────────────────────────
const {
    data: feedItems,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["feed-items"],
    queryFn: () => api.get<FeedItem[]>("/api/feed-items"),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    name: "",
    size: "",
    weightGrams: null as number | null,
    notes: "",
    suitablePetIds: [] as string[],
});

function resetForm() {
    Object.assign(form, { name: "", size: "", weightGrams: null, notes: "", suitablePetIds: [] });
}

function openCreateModal() {
    resetForm();
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/feed-items", {
            name: form.name,
            size: form.size || undefined,
            weightGrams: form.weightGrams || undefined,
            notes: form.notes || undefined,
            suitablePetIds: form.suitablePetIds.length ? form.suitablePetIds : undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["feed-items"] });
        toast.success(t("pages.feedItems.created"));
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
    name: "",
    size: "",
    weightGrams: null as number | null,
    notes: "",
    suitablePetIds: [] as string[],
});

function openEditModal(item: FeedItem) {
    editingId.value = item.id;
    Object.assign(editForm, {
        name: item.name,
        size: item.size ?? "",
        weightGrams: item.weightGrams,
        notes: item.notes ?? "",
        suitablePetIds: item.suitablePets?.map((p) => p.id) ?? [],
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/feed-items/${editingId.value}`, {
            name: editForm.name,
            size: editForm.size || undefined,
            weightGrams: editForm.weightGrams || undefined,
            notes: editForm.notes || undefined,
            suitablePetIds: editForm.suitablePetIds,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["feed-items"] });
        toast.success(t("pages.feedItems.saved"));
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
    mutationFn: () => api.del(`/api/feed-items/${deletingId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["feed-items"] });
        toast.success(t("pages.feedItems.deleted"));
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
