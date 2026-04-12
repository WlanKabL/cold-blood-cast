<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="animate-fade-in-up flex items-center gap-3">
            <NuxtLink
                to="/enclosures"
                class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors"
            >
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <h1 class="text-fg truncate text-2xl font-bold tracking-tight">
                        {{ enclosure?.name ?? "..." }}
                    </h1>
                    <span
                        v-if="enclosure && !enclosure.active"
                        class="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400"
                    >
                        {{ $t("pages.enclosures.archived") }}
                    </span>
                </div>
                <p class="text-fg-faint text-sm">
                    {{ enclosure?.type }}
                    <template v-if="enclosure?.species"> · {{ enclosure.species }}</template>
                </p>
            </div>
            <div v-if="enclosure" class="flex items-center gap-2">
                <UiButton variant="ghost" icon="lucide:pencil" @click="openEditModal" />
                <UiButton
                    variant="danger"
                    icon="lucide:trash-2"
                    @click="showDeleteConfirm = true"
                />
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
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <template v-else-if="enclosure">
            <!-- Tabs -->
            <UiTabs v-model="activeTab" :tabs="enclosureTabs">
                <!-- Info Tab -->
                <div v-if="activeTab === 'info'" class="space-y-6">
                    <!-- Info Card -->
                    <div class="glass-card-accent rounded-xl p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="text-fg font-semibold">
                                {{ $t("pages.enclosures.details") }}
                            </h2>
                            <span
                                class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                            >
                                {{ enclosure.type }}
                            </span>
                        </div>
                        <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt class="text-fg-faint text-xs font-medium uppercase">
                                    {{ $t("pages.enclosures.fields.species") }}
                                </dt>
                                <dd class="text-fg mt-1 text-sm">{{ enclosure.species || "—" }}</dd>
                            </div>
                            <div>
                                <dt class="text-fg-faint text-xs font-medium uppercase">
                                    {{ $t("pages.enclosures.fields.room") }}
                                </dt>
                                <dd class="text-fg mt-1 text-sm">
                                    {{ enclosure.room || $t("pages.enclosures.noRoom") }}
                                </dd>
                            </div>
                            <div
                                v-if="enclosure.lengthCm || enclosure.widthCm || enclosure.heightCm"
                            >
                                <dt class="text-fg-faint text-xs font-medium uppercase">
                                    {{ $t("pages.enclosures.fields.dimensions") }}
                                </dt>
                                <dd class="text-fg mt-1 text-sm">
                                    {{ enclosure.lengthCm ?? "—" }} ×
                                    {{ enclosure.widthCm ?? "—" }} ×
                                    {{ enclosure.heightCm ?? "—" }} cm
                                </dd>
                            </div>
                            <div>
                                <dt class="text-fg-faint text-xs font-medium uppercase">
                                    {{ $t("pages.enclosures.fields.active") }}
                                </dt>
                                <dd class="mt-1">
                                    <span
                                        :class="
                                            enclosure.active
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-amber-500/10 text-amber-400'
                                        "
                                        class="rounded-md px-2 py-0.5 text-xs font-medium"
                                    >
                                        {{
                                            enclosure.active
                                                ? $t("pages.enclosures.active")
                                                : $t("pages.enclosures.inactive")
                                        }}
                                    </span>
                                </dd>
                            </div>
                            <div v-if="enclosure.description" class="sm:col-span-2">
                                <dt class="text-fg-faint text-xs font-medium uppercase">
                                    {{ $t("pages.enclosures.fields.description") }}
                                </dt>
                                <dd class="text-fg mt-1 text-sm">{{ enclosure.description }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <!-- Inhabitants Tab -->
                <div v-if="activeTab === 'inhabitants'" class="space-y-6">
                    <!-- Pets -->
                    <div class="glass-card rounded-xl p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="text-fg font-semibold">
                                {{ $t("pages.enclosures.petsInEnclosure") }}
                            </h2>
                            <NuxtLink to="/pets" class="text-primary-400 text-sm font-medium">
                                {{ $t("pages.dashboard.viewAll") }}
                            </NuxtLink>
                        </div>
                        <div v-if="enclosure.pets?.length" class="space-y-2">
                            <NuxtLink
                                v-for="pet in enclosure.pets"
                                :key="pet.id"
                                :to="`/pets/${pet.id}`"
                                class="bg-surface-raised hover:bg-surface-hover flex items-center gap-3 rounded-lg p-3 transition-colors"
                            >
                                <Icon name="lucide:heart" class="text-primary-400 h-4 w-4" />
                                <span class="text-fg text-sm font-medium">{{ pet.name }}</span>
                                <span class="text-fg-faint text-xs">
                                    {{ pet.species }}
                                    <template v-if="pet.morph"> · {{ pet.morph }}</template>
                                    <template v-if="pet.gender">
                                        · {{ $t(`common.gender.${pet.gender}`) }}</template
                                    >
                                </span>
                            </NuxtLink>
                        </div>
                        <p v-else class="text-fg-muted text-sm">
                            {{ $t("pages.enclosures.noPets") }}
                        </p>
                    </div>

                    <!-- Sensors -->
                    <div class="glass-card rounded-xl p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="text-fg font-semibold">
                                {{ $t("pages.enclosures.sensorsInEnclosure") }}
                            </h2>
                            <NuxtLink to="/sensors" class="text-primary-400 text-sm font-medium">
                                {{ $t("pages.dashboard.viewAll") }}
                            </NuxtLink>
                        </div>
                        <div
                            v-if="enclosure.sensors?.length"
                            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
                        >
                            <NuxtLink
                                v-for="sensor in enclosure.sensors"
                                :key="sensor.id"
                                :to="`/sensors/${sensor.id}`"
                                class="bg-surface-raised hover:bg-surface-hover rounded-lg p-3 transition-colors"
                            >
                                <div class="flex items-center gap-2">
                                    <Icon
                                        name="lucide:thermometer"
                                        class="h-4 w-4 text-green-400"
                                    />
                                    <span class="text-fg text-sm font-medium">{{
                                        sensor.name
                                    }}</span>
                                    <span
                                        v-if="!sensor.active"
                                        class="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400"
                                    >
                                        {{ $t("pages.enclosures.inactive") }}
                                    </span>
                                </div>
                                <p class="text-fg-faint mt-1 text-xs">
                                    {{ sensor.type }} · {{ sensor.unit }}
                                </p>
                            </NuxtLink>
                        </div>
                        <p v-else class="text-fg-muted text-sm">
                            {{ $t("pages.enclosures.noSensors") }}
                        </p>
                    </div>
                </div>

                <!-- Maintenance Tab -->
                <div v-if="activeTab === 'maintenance'" class="space-y-6">
                    <div class="glass-card rounded-xl p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <h2 class="text-fg font-semibold">
                                    {{ $t("pages.enclosures.maintenanceTasks") }}
                                </h2>
                                <span
                                    v-if="overdueCount > 0"
                                    class="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400"
                                >
                                    {{
                                        $t("pages.enclosures.overdueTasksCount", {
                                            n: overdueCount,
                                        })
                                    }}
                                </span>
                            </div>
                            <NuxtLink
                                :to="`/maintenance`"
                                class="text-primary-400 text-sm font-medium"
                            >
                                {{ $t("pages.dashboard.viewAll") }}
                            </NuxtLink>
                        </div>
                        <div v-if="maintenanceTasks?.length" class="space-y-2">
                            <div
                                v-for="task in maintenanceTasks"
                                :key="task.id"
                                class="bg-surface-raised flex items-center justify-between gap-3 rounded-lg p-3"
                            >
                                <div class="flex items-center gap-3">
                                    <Icon name="lucide:wrench" class="text-fg-faint h-4 w-4" />
                                    <div>
                                        <span class="text-fg text-sm font-medium">
                                            {{ task.description || task.type }}
                                        </span>
                                        <p class="text-fg-faint text-xs">
                                            <template v-if="task.nextDueAt">
                                                {{ new Date(task.nextDueAt).toLocaleDateString() }}
                                            </template>
                                            <template v-if="task.recurring">
                                                · {{ $t("pages.maintenance.recurring") }}
                                            </template>
                                        </p>
                                    </div>
                                </div>
                                <span
                                    v-if="
                                        task.nextDueAt &&
                                        new Date(task.nextDueAt) < new Date() &&
                                        !task.completedAt
                                    "
                                    class="shrink-0 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400"
                                >
                                    {{ $t("pages.maintenance.overdue") }}
                                </span>
                            </div>
                        </div>
                        <p v-else class="text-fg-muted text-sm">
                            {{ $t("pages.enclosures.noMaintenanceTasks") }}
                        </p>
                    </div>
                </div>
            </UiTabs>
        </template>

        <!-- Edit Modal -->
        <UiModal :show="showEdit" :title="$t('pages.enclosures.edit')" @close="showEdit = false">
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput
                    v-model="editForm.name"
                    required
                    :label="$t('pages.enclosures.fields.name')"
                />
                <div class="grid grid-cols-2 gap-3">
                    <UiSelect v-model="editForm.type" :label="$t('pages.enclosures.fields.type')">
                        <option v-for="et in enclosureTypes" :key="et" :value="et">{{ et }}</option>
                    </UiSelect>
                    <UiTextInput
                        v-model="editForm.room"
                        :label="$t('pages.enclosures.fields.room')"
                        :placeholder="$t('pages.enclosures.fields.roomPlaceholder')"
                    />
                </div>
                <UiTextInput
                    v-model="editForm.species"
                    :label="$t('pages.enclosures.fields.species')"
                    :placeholder="$t('pages.enclosures.fields.speciesPlaceholder')"
                />
                <UiTextarea
                    v-model="editForm.description"
                    :label="$t('pages.enclosures.fields.description')"
                />
                <div class="grid grid-cols-3 gap-3">
                    <UiTextInput
                        v-model.number="editForm.lengthCm"
                        type="number"
                        min="1"
                        :label="$t('pages.enclosures.fields.length')"
                    />
                    <UiTextInput
                        v-model.number="editForm.widthCm"
                        type="number"
                        min="1"
                        :label="$t('pages.enclosures.fields.width')"
                    />
                    <UiTextInput
                        v-model.number="editForm.heightCm"
                        type="number"
                        min="1"
                        :label="$t('pages.enclosures.fields.height')"
                    />
                </div>
                <div class="flex items-center gap-3">
                    <label class="text-fg-dim text-[13px] font-medium">{{
                        $t("pages.enclosures.fields.active")
                    }}</label>
                    <UiToggle v-model="editForm.active" />
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showEdit = false">
                        {{ $t("common.cancel") }}
                    </UiButton>
                    <UiButton type="submit" :loading="updating">
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
            :message="$t('pages.enclosures.confirmDelete')"
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

interface EnclosurePet {
    id: string;
    name: string;
    species: string;
    morph: string | null;
    gender: string | null;
    imageUrl: string | null;
}

interface EnclosureSensor {
    id: string;
    name: string;
    type: string;
    unit: string | null;
    active: boolean;
}

interface EnclosureDetail {
    id: string;
    name: string;
    type: string;
    species: string | null;
    description: string | null;
    imageUrl: string | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    room: string | null;
    active: boolean;
    pets: EnclosurePet[];
    sensors: EnclosureSensor[];
}

interface MaintenanceTaskItem {
    id: string;
    type: string;
    description: string | null;
    completedAt: string | null;
    nextDueAt: string | null;
    recurring: boolean;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

const enclosureId = route.params.id as string;

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "enclosures" });

// ── Tabs ──
const activeTab = ref("info");
const enclosureTabs = computed(() => [
    { key: "info", label: t("pages.enclosures.tabs.info"), icon: "lucide:info" },
    { key: "inhabitants", label: t("pages.enclosures.tabs.inhabitants"), icon: "lucide:heart" },
    { key: "maintenance", label: t("pages.enclosures.tabs.maintenance"), icon: "lucide:wrench" },
]);

const enclosureTypes = ["TERRARIUM", "VIVARIUM", "AQUARIUM", "PALUDARIUM", "RACK", "OTHER"];

// ── Data ─────────────────────────────────────────────────
const {
    data: enclosure,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["enclosures", enclosureId],
    queryFn: () => api.get<EnclosureDetail>(`/api/enclosures/${enclosureId}`),
});

useHead({ title: () => enclosure.value?.name ?? t("pages.enclosures.title") });

// ── Maintenance Tasks ────────────────────────────────────
const { data: maintenanceTasks } = useQuery({
    queryKey: ["maintenance-tasks", enclosureId],
    queryFn: () =>
        api.get<MaintenanceTaskItem[]>(`/api/enclosure-maintenance?enclosureId=${enclosureId}`),
});

const overdueCount = computed(
    () =>
        (maintenanceTasks.value ?? []).filter(
            (t) => t.nextDueAt && new Date(t.nextDueAt) < new Date() && !t.completedAt,
        ).length,
);

// ── Edit ─────────────────────────────────────────────────
const showEdit = ref(false);
const editForm = reactive({
    name: "",
    type: "TERRARIUM",
    species: "",
    description: "",
    room: "",
    lengthCm: null as number | null,
    widthCm: null as number | null,
    heightCm: null as number | null,
    active: true,
});

function openEditModal() {
    if (!enclosure.value) return;
    Object.assign(editForm, {
        name: enclosure.value.name,
        type: enclosure.value.type,
        species: enclosure.value.species ?? "",
        description: enclosure.value.description ?? "",
        room: enclosure.value.room ?? "",
        lengthCm: enclosure.value.lengthCm,
        widthCm: enclosure.value.widthCm,
        heightCm: enclosure.value.heightCm,
        active: enclosure.value.active,
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/enclosures/${enclosureId}`, {
            name: editForm.name,
            type: editForm.type,
            species: editForm.species || undefined,
            description: editForm.description || undefined,
            room: editForm.room || undefined,
            lengthCm: editForm.lengthCm || undefined,
            widthCm: editForm.widthCm || undefined,
            heightCm: editForm.heightCm || undefined,
            active: editForm.active,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["enclosures"] });
        toast.success(t("pages.enclosures.saved"));
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
    mutationFn: () => api.del(`/api/enclosures/${enclosureId}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["enclosures"] });
        toast.success(t("pages.enclosures.deleted"));
        router.push("/enclosures");
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDelete() {
    deleteMutation();
}
</script>
