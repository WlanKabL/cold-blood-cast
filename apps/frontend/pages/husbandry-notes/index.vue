<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div
            class="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.husbandryNotes.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">
                    {{ $t("pages.husbandryNotes.subtitle") }}
                </p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">{{
                $t("pages.husbandryNotes.add")
            }}</UiButton>
        </div>

        <!-- Filters -->
        <div class="animate-fade-in-up flex flex-wrap gap-3 delay-75">
            <UiSelect v-model="selectedPet" class="w-48">
                <option value="ALL">{{ $t("pages.husbandryNotes.allPets") }}</option>
                <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
            </UiSelect>
            <UiSelect v-model="selectedType" class="w-48">
                <option value="ALL">{{ $t("pages.husbandryNotes.allTypes") }}</option>
                <option v-for="tp in noteTypePresets" :key="tp" :value="tp">
                    {{ noteTypeLabel(tp) }}
                </option>
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
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <!-- List -->
        <div v-else-if="filteredNotes.length" class="animate-fade-in-up space-y-2 delay-150">
            <div
                v-for="note in filteredNotes"
                :key="note.id"
                class="glass-card flex items-center justify-between rounded-xl p-4"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
                    >
                        <Icon :name="noteTypeIcon(note.type)" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">{{ note.title }}</p>
                        <p class="text-fg-faint text-xs">
                            {{ note.pet?.name ?? "" }}
                            <span class="text-fg-faint/60"> · {{ noteTypeLabel(note.type) }}</span>
                        </p>
                        <p v-if="note.content" class="text-fg-faint mt-0.5 line-clamp-1 text-xs">
                            {{ note.content }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <p class="text-fg-muted text-sm">
                            {{ new Date(note.occurredAt).toLocaleDateString() }}
                        </p>
                        <p class="text-fg-faint text-xs">
                            {{ new Date(note.occurredAt).toLocaleTimeString() }}
                        </p>
                    </div>
                    <UiButton
                        variant="ghost"
                        icon="lucide:pencil"
                        size="sm"
                        @click="openEditModal(note)"
                    />
                    <UiButton
                        variant="danger"
                        icon="lucide:trash-2"
                        size="sm"
                        @click="confirmDelete(note.id)"
                    />
                </div>
            </div>
            <!-- Infinite scroll sentinel -->
            <div ref="sentinel" class="h-1" />
            <div v-if="isFetchingNextPage" class="flex justify-center py-4">
                <Icon name="lucide:loader-2" class="text-fg-muted h-5 w-5 animate-spin" />
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:clipboard-list" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.husbandryNotes.empty") }}</p>
            <UiButton class="mt-4" @click="openCreateModal">{{
                $t("pages.husbandryNotes.addFirst")
            }}</UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal
            :show="showCreate"
            :title="$t('pages.husbandryNotes.create')"
            width="lg"
            @close="showCreate = false"
        >
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiSelect
                    v-model="form.petId"
                    :label="$t('pages.husbandryNotes.fields.pet')"
                    required
                >
                    <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
                </UiSelect>
                <div>
                    <label class="text-fg-muted mb-1 block text-sm font-medium">{{
                        $t("pages.husbandryNotes.fields.type")
                    }}</label>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="tp in noteTypePresets"
                            :key="tp"
                            type="button"
                            class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                            :class="
                                form.type === tp
                                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                                    : 'text-fg-muted bg-white/5 hover:bg-white/10'
                            "
                            @click="form.type = form.type === tp ? '' : tp"
                        >
                            {{ noteTypeLabel(tp) }}
                        </button>
                    </div>
                </div>
                <UiTextInput
                    v-model="form.title"
                    :label="$t('pages.husbandryNotes.fields.title')"
                    required
                    :placeholder="$t('pages.husbandryNotes.fields.titlePlaceholder')"
                />
                <UiTextarea
                    v-model="form.content"
                    :label="$t('pages.husbandryNotes.fields.content')"
                    :placeholder="$t('pages.husbandryNotes.fields.contentPlaceholder')"
                />
                <UiTextInput
                    v-model="form.occurredAt"
                    :label="$t('pages.husbandryNotes.fields.occurredAt')"
                    type="datetime-local"
                    required
                />
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
            :title="$t('pages.husbandryNotes.edit')"
            width="lg"
            @close="showEdit = false"
        >
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <div>
                    <label class="text-fg-muted mb-1 block text-sm font-medium">{{
                        $t("pages.husbandryNotes.fields.type")
                    }}</label>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="tp in noteTypePresets"
                            :key="tp"
                            type="button"
                            class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                            :class="
                                editForm.type === tp
                                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                                    : 'text-fg-muted bg-white/5 hover:bg-white/10'
                            "
                            @click="editForm.type = editForm.type === tp ? '' : tp"
                        >
                            {{ noteTypeLabel(tp) }}
                        </button>
                    </div>
                </div>
                <UiTextInput
                    v-model="editForm.title"
                    :label="$t('pages.husbandryNotes.fields.title')"
                    required
                    :placeholder="$t('pages.husbandryNotes.fields.titlePlaceholder')"
                />
                <UiTextarea
                    v-model="editForm.content"
                    :label="$t('pages.husbandryNotes.fields.content')"
                    :placeholder="$t('pages.husbandryNotes.fields.contentPlaceholder')"
                />
                <UiTextInput
                    v-model="editForm.occurredAt"
                    :label="$t('pages.husbandryNotes.fields.occurredAt')"
                    type="datetime-local"
                    required
                />
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
            :message="$t('pages.husbandryNotes.confirmDelete')"
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
import { useInfiniteQuery, useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";

interface HusbandryNote {
    id: string;
    petId: string;
    type: string;
    title: string;
    content: string | null;
    occurredAt: string;
    pet?: { id: string; name: string };
}

interface Pet {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

definePageMeta({ layout: "default", middleware: ["auth"] });
useHead({ title: () => t("pages.husbandryNotes.title") });

const selectedPet = ref("ALL");
const selectedType = ref("ALL");

const noteTypePresets = [
    "observation",
    "behavior",
    "habitat_change",
    "health",
    "enrichment",
    "other",
] as const;

function noteTypeLabel(type: string): string {
    const key = `pages.husbandryNotes.types.${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
}

function noteTypeIcon(type: string): string {
    const icons: Record<string, string> = {
        observation: "lucide:eye",
        behavior: "lucide:activity",
        habitat_change: "lucide:home",
        health: "lucide:heart-pulse",
        enrichment: "lucide:sparkles",
        other: "lucide:clipboard-list",
    };
    return icons[type] ?? "lucide:clipboard-list";
}

// ── Data ─────────────────────────────────────────────────
const {
    data: notesData,
    isLoading: loading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
} = useInfiniteQuery({
    queryKey: ["husbandry-notes", selectedPet],
    queryFn: ({ pageParam }) => {
        const params = new URLSearchParams();
        if (selectedPet.value && selectedPet.value !== "ALL")
            params.set("petId", selectedPet.value);
        if (pageParam) params.set("cursor", pageParam);
        return api.get<{ items: HusbandryNote[]; nextCursor: string | null }>(
            `/api/husbandry-notes${params.size ? `?${params}` : ""}`,
        );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});

const notes = computed(() => notesData.value?.pages.flatMap((p) => p.items) ?? []);

const { sentinel } = useInfiniteScroll(() => fetchNextPage(), {
    enabled: computed(() => !!hasNextPage.value && !isFetchingNextPage.value),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const filteredNotes = computed(() => {
    if (selectedType.value === "ALL") return notes.value;
    return notes.value.filter((n) => n.type === selectedType.value);
});

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    petId: "",
    type: "",
    title: "",
    content: "",
    occurredAt: "",
});

function resetForm() {
    Object.assign(form, {
        petId: "",
        type: "",
        title: "",
        content: "",
        occurredAt: "",
    });
}

function openCreateModal() {
    resetForm();
    form.occurredAt = new Date().toISOString().slice(0, 16);
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/husbandry-notes", {
            petId: form.petId,
            type: form.type || "other",
            title: form.title,
            content: form.content || undefined,
            occurredAt: form.occurredAt,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["husbandry-notes"] });
        toast.success(t("pages.husbandryNotes.created"));
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
    type: "",
    title: "",
    content: "",
    occurredAt: "",
});

function openEditModal(note: HusbandryNote) {
    editingId.value = note.id;
    Object.assign(editForm, {
        type: note.type,
        title: note.title,
        content: note.content ?? "",
        occurredAt: note.occurredAt.slice(0, 16),
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/husbandry-notes/${editingId.value}`, {
            type: editForm.type || "other",
            title: editForm.title,
            content: editForm.content || undefined,
            occurredAt: editForm.occurredAt,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["husbandry-notes"] });
        toast.success(t("pages.husbandryNotes.saved"));
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
    mutationFn: () => api.delete(`/api/husbandry-notes/${deletingId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["husbandry-notes"] });
        toast.success(t("pages.husbandryNotes.deleted"));
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
