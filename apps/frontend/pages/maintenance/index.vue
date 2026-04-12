<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Header -->
        <div
            class="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.maintenance.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">
                    {{ $t("pages.maintenance.subtitle") }}
                </p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">
                {{ $t("pages.maintenance.add") }}
            </UiButton>
        </div>

        <!-- Filters -->
        <div class="animate-fade-in-up flex flex-col gap-3 delay-75 sm:flex-row sm:items-center">
            <UiTextInput
                v-model="searchQuery"
                :placeholder="$t('pages.maintenance.search')"
                class="sm:max-w-xs"
            >
                <template #leading>
                    <Icon name="lucide:search" class="h-4 w-4" />
                </template>
            </UiTextInput>
            <UiSelect v-model="selectedType" class="w-48">
                <option value="ALL">{{ $t("pages.maintenance.allTypes") }}</option>
                <option v-for="mt in maintenanceTypes" :key="mt" :value="mt">
                    {{ $t(`pages.maintenance.types.${mt}`) }}
                </option>
            </UiSelect>
            <UiSelect v-model="selectedEnclosure" class="w-48">
                <option value="ALL">{{ $t("pages.maintenance.fields.enclosure") }}</option>
                <option v-for="enc in enclosures" :key="enc.id" :value="enc.id">
                    {{ enc.name }}
                </option>
            </UiSelect>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 6" :key="i" class="glass-card h-40 animate-pulse rounded-xl" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">
                {{ $t("common.retry") }}
            </UiButton>
        </div>

        <!-- Task Grid -->
        <div
            v-else-if="filteredTasks?.length"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            <div
                v-for="task in filteredTasks"
                :key="task.id"
                class="glass-card group rounded-xl p-5 transition-all hover:shadow-lg hover:ring-1 hover:shadow-black/5 hover:ring-white/10"
            >
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            :class="typeIconClass(task.type)"
                            class="flex h-10 w-10 items-center justify-center rounded-lg"
                        >
                            <Icon :name="typeIcon(task.type)" class="h-5 w-5" />
                        </div>
                        <div>
                            <h3 class="text-fg font-semibold">
                                {{ $t(`pages.maintenance.types.${task.type}`) }}
                            </h3>
                            <p class="text-fg-faint text-sm">
                                {{ task.enclosure?.name }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <span
                            v-if="task.recurring"
                            class="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400"
                        >
                            {{ $t("pages.maintenance.recurring") }}
                        </span>
                        <span
                            v-if="isOverdue(task)"
                            class="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400"
                        >
                            {{ $t("pages.maintenance.overdue") }}
                        </span>
                    </div>
                </div>

                <p v-if="task.description" class="text-fg-muted mt-2 text-sm">
                    {{ task.description }}
                </p>

                <div class="text-fg-faint mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span v-if="task.nextDueAt" class="flex items-center gap-1.5">
                        <Icon name="lucide:calendar" class="h-3.5 w-3.5" />
                        {{ formatDueStatus(task) }}
                    </span>
                    <span
                        v-if="task.recurring && task.intervalDays"
                        class="flex items-center gap-1.5"
                    >
                        <Icon name="lucide:repeat" class="h-3.5 w-3.5" />
                        {{ $t("pages.maintenance.every", { n: task.intervalDays }) }}
                    </span>
                    <span v-if="task.completedAt" class="flex items-center gap-1.5">
                        <Icon name="lucide:check-circle" class="h-3.5 w-3.5 text-green-400" />
                        {{ new Date(task.completedAt).toLocaleDateString() }}
                    </span>
                </div>

                <!-- Actions -->
                <div class="mt-4 flex items-center gap-2">
                    <UiButton
                        v-if="!isCompleted(task)"
                        size="sm"
                        icon="lucide:check"
                        :loading="completingId === task.id"
                        @click="handleComplete(task.id)"
                    >
                        {{ $t("pages.maintenance.markDone") }}
                    </UiButton>
                    <UiButton
                        size="sm"
                        variant="ghost"
                        icon="lucide:pencil"
                        @click="openEditModal(task)"
                    />
                    <UiButton
                        size="sm"
                        variant="ghost"
                        icon="lucide:trash-2"
                        @click="confirmDelete(task)"
                    />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:wrench" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">
                {{
                    searchQuery || selectedType !== "ALL" || selectedEnclosure !== "ALL"
                        ? $t("common.noResults")
                        : $t("pages.maintenance.empty")
                }}
            </p>
            <UiButton
                v-if="!searchQuery && selectedType === 'ALL' && selectedEnclosure === 'ALL'"
                class="mt-4"
                @click="openCreateModal"
            >
                {{ $t("pages.maintenance.addFirst") }}
            </UiButton>
        </div>

        <!-- Create / Edit Modal -->
        <UiModal
            :show="showModal"
            :title="editingTask ? $t('pages.maintenance.edit') : $t('pages.maintenance.create')"
            width="lg"
            @close="showModal = false"
        >
            <form class="space-y-4" @submit.prevent="handleSubmit">
                <UiSelect
                    v-if="!editingTask"
                    v-model="form.enclosureId"
                    :label="$t('pages.maintenance.fields.enclosure')"
                    required
                >
                    <option value="">—</option>
                    <option v-for="enc in enclosures" :key="enc.id" :value="enc.id">
                        {{ enc.name }}
                    </option>
                </UiSelect>

                <UiSelect v-model="form.type" :label="$t('pages.maintenance.fields.type')">
                    <option v-for="mt in maintenanceTypes" :key="mt" :value="mt">
                        {{ $t(`pages.maintenance.types.${mt}`) }}
                    </option>
                </UiSelect>

                <UiTextInput
                    v-model="form.description"
                    :label="$t('pages.maintenance.fields.description')"
                    :placeholder="$t('pages.maintenance.fields.descriptionPlaceholder')"
                />

                <UiTextInput
                    v-model="form.nextDueAt"
                    type="date"
                    :label="$t('pages.maintenance.fields.nextDueAt')"
                />

                <div class="flex items-center gap-3">
                    <label class="text-fg-dim text-[13px] font-medium">
                        {{ $t("pages.maintenance.fields.recurring") }}
                    </label>
                    <UiToggle v-model="form.recurring" />
                </div>

                <UiTextInput
                    v-if="form.recurring"
                    v-model.number="form.intervalDays"
                    type="number"
                    min="1"
                    max="365"
                    :label="$t('pages.maintenance.fields.intervalDays')"
                    :hint="$t('pages.maintenance.fields.intervalDaysHint')"
                />

                <UiTextarea
                    v-model="form.notes"
                    :label="$t('pages.maintenance.fields.notes')"
                    :placeholder="$t('pages.maintenance.fields.notesPlaceholder')"
                />

                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showModal = false">
                        {{ $t("common.cancel") }}
                    </UiButton>
                    <UiButton type="submit" :loading="saving">
                        {{ $t("common.save") }}
                    </UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Delete Confirmation -->
        <UiConfirmDialog
            :show="showDeleteConfirm"
            variant="danger"
            :title="$t('common.confirmDelete')"
            :message="$t('pages.maintenance.confirmDelete')"
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

interface MaintenanceTask {
    id: string;
    enclosureId: string;
    type: string;
    description: string | null;
    completedAt: string | null;
    nextDueAt: string | null;
    intervalDays: number | null;
    recurring: boolean;
    notes: string | null;
    createdAt: string;
    enclosure: { id: string; name: string } | null;
}

interface Enclosure {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

definePageMeta({
    layout: "default",
    middleware: ["feature-gate"],
    requiredFeature: "enclosure_maintenance",
});
useHead({ title: () => t("pages.maintenance.title") });

const maintenanceTypes = [
    "CLEANING",
    "SUBSTRATE_CHANGE",
    "LAMP_REPLACEMENT",
    "WATER_CHANGE",
    "FILTER_CHANGE",
    "DISINFECTION",
    "OTHER",
];

// ── Filters ──────────────────────────────────────────────
const searchQuery = ref("");
const selectedType = ref("ALL");
const selectedEnclosure = ref("ALL");
const debouncedSearch = refDebounced(searchQuery, 300);

// ── Data ─────────────────────────────────────────────────
const {
    data: tasks,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["maintenance-tasks"],
    queryFn: () => api.get<MaintenanceTask[]>("/api/enclosure-maintenance"),
});

const { data: enclosures } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

const filteredTasks = computed(() => {
    let result = tasks.value ?? [];
    const search = debouncedSearch.value.toLowerCase();
    if (search) {
        result = result.filter(
            (t) =>
                t.type.toLowerCase().includes(search) ||
                (t.description && t.description.toLowerCase().includes(search)) ||
                (t.enclosure && t.enclosure.name.toLowerCase().includes(search)),
        );
    }
    if (selectedType.value !== "ALL") {
        result = result.filter((t) => t.type === selectedType.value);
    }
    if (selectedEnclosure.value !== "ALL") {
        result = result.filter((t) => t.enclosureId === selectedEnclosure.value);
    }
    return result;
});

// ── Helpers ──────────────────────────────────────────────
function isOverdue(task: MaintenanceTask): boolean {
    if (!task.nextDueAt || task.completedAt) return false;
    return new Date(task.nextDueAt) < new Date();
}

function isCompleted(task: MaintenanceTask): boolean {
    if (!task.recurring) return !!task.completedAt;
    if (!task.nextDueAt) return !!task.completedAt;
    // Recurring: considered "done" only if nextDueAt is in the future
    return new Date(task.nextDueAt) > new Date();
}

function formatDueStatus(task: MaintenanceTask): string {
    if (!task.nextDueAt) return "";
    const due = new Date(task.nextDueAt);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("pages.maintenance.dueToday");
    if (diffDays < 0) return t("pages.maintenance.daysOverdue", { n: Math.abs(diffDays) });
    return t("pages.maintenance.dueIn", { n: diffDays });
}

function typeIcon(type: string): string {
    const icons: Record<string, string> = {
        CLEANING: "lucide:sparkles",
        SUBSTRATE_CHANGE: "lucide:layers",
        LAMP_REPLACEMENT: "lucide:lightbulb",
        WATER_CHANGE: "lucide:droplets",
        FILTER_CHANGE: "lucide:filter",
        DISINFECTION: "lucide:shield-check",
        OTHER: "lucide:wrench",
    };
    return icons[type] ?? "lucide:wrench";
}

function typeIconClass(type: string): string {
    const classes: Record<string, string> = {
        CLEANING: "bg-cyan-500/10 text-cyan-400",
        SUBSTRATE_CHANGE: "bg-amber-500/10 text-amber-400",
        LAMP_REPLACEMENT: "bg-yellow-500/10 text-yellow-400",
        WATER_CHANGE: "bg-blue-500/10 text-blue-400",
        FILTER_CHANGE: "bg-purple-500/10 text-purple-400",
        DISINFECTION: "bg-green-500/10 text-green-400",
        OTHER: "bg-gray-500/10 text-gray-400",
    };
    return classes[type] ?? "bg-gray-500/10 text-gray-400";
}

// ── Create / Edit ────────────────────────────────────────
const showModal = ref(false);
const editingTask = ref<MaintenanceTask | null>(null);
const form = reactive({
    enclosureId: "",
    type: "CLEANING",
    description: "",
    nextDueAt: "",
    intervalDays: 7,
    recurring: false,
    notes: "",
});

function resetForm() {
    Object.assign(form, {
        enclosureId: "",
        type: "CLEANING",
        description: "",
        nextDueAt: "",
        intervalDays: 7,
        recurring: false,
        notes: "",
    });
}

function openCreateModal() {
    editingTask.value = null;
    resetForm();
    showModal.value = true;
}

function openEditModal(task: MaintenanceTask) {
    editingTask.value = task;
    Object.assign(form, {
        enclosureId: task.enclosureId,
        type: task.type,
        description: task.description ?? "",
        nextDueAt: task.nextDueAt ? task.nextDueAt.slice(0, 10) : "",
        intervalDays: task.intervalDays ?? 7,
        recurring: task.recurring,
        notes: task.notes ?? "",
    });
    showModal.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/enclosure-maintenance", {
            enclosureId: form.enclosureId,
            type: form.type,
            description: form.description || undefined,
            nextDueAt: form.nextDueAt || undefined,
            intervalDays: form.recurring ? form.intervalDays : undefined,
            recurring: form.recurring,
            notes: form.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] });
        toast.success(t("pages.maintenance.created"));
        showModal.value = false;
    },
    onError: () => toast.error(t("common.error")),
});

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/enclosure-maintenance/${editingTask.value!.id}`, {
            type: form.type,
            description: form.description || undefined,
            nextDueAt: form.nextDueAt || undefined,
            intervalDays: form.recurring ? form.intervalDays : undefined,
            recurring: form.recurring,
            notes: form.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] });
        toast.success(t("pages.maintenance.saved"));
        showModal.value = false;
    },
    onError: () => toast.error(t("common.error")),
});

const saving = computed(() => creating.value || updating.value);

function handleSubmit() {
    if (editingTask.value) {
        updateMutation();
    } else {
        createMutation();
    }
}

// ── Complete ─────────────────────────────────────────────
const completingId = ref<string | null>(null);

const { mutate: completeMutation } = useMutation({
    mutationFn: (id: string) => api.post(`/api/enclosure-maintenance/${id}/complete`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] });
        toast.success(t("pages.maintenance.completed"));
        completingId.value = null;
    },
    onError: () => {
        toast.error(t("common.error"));
        completingId.value = null;
    },
});

function handleComplete(id: string) {
    completingId.value = id;
    completeMutation(id);
}

// ── Delete ───────────────────────────────────────────────
const showDeleteConfirm = ref(false);
const taskToDelete = ref<MaintenanceTask | null>(null);

function confirmDelete(task: MaintenanceTask) {
    taskToDelete.value = task;
    showDeleteConfirm.value = true;
}

const { mutate: deleteMutation, isPending: deleting } = useMutation({
    mutationFn: () => api.del(`/api/enclosure-maintenance/${taskToDelete.value!.id}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] });
        toast.success(t("pages.maintenance.deleted"));
        showDeleteConfirm.value = false;
    },
    onError: () => toast.error(t("common.error")),
});

function handleDelete() {
    deleteMutation();
}
</script>
