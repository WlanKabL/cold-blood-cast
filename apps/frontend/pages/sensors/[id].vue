<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="animate-fade-in-up flex items-center gap-3">
            <NuxtLink
                to="/sensors"
                class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors"
            >
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <h1 class="text-fg truncate text-2xl font-bold tracking-tight">
                        {{ sensor?.name ?? "..." }}
                    </h1>
                    <span
                        v-if="sensor && !sensor.active"
                        class="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400"
                    >
                        {{ $t("pages.sensors.inactive") }}
                    </span>
                </div>
                <p class="text-fg-faint text-sm">
                    {{ sensor?.type }}
                    <template v-if="sensor?.enclosure"> · {{ sensor.enclosure.name }}</template>
                </p>
            </div>
            <div v-if="sensor" class="flex items-center gap-2">
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
            <div class="glass-card h-64 animate-pulse rounded-xl" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <template v-else-if="sensor">
            <!-- Info Card -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.sensors.details") }}</h2>
                    <span
                        :class="
                            sensor.active
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-amber-500/10 text-amber-400'
                        "
                        class="rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{
                            sensor.active
                                ? $t("pages.sensors.activeStatus")
                                : $t("pages.sensors.inactive")
                        }}
                    </span>
                </div>
                <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.sensors.fields.type") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">{{ sensor.type }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.sensors.fields.unit") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">{{ sensor.unit }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.sensors.fields.enclosure") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">{{ sensor.enclosure?.name || "—" }}</dd>
                    </div>
                </dl>
            </div>

            <!-- Readings -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.sensors.readings") }}</h2>
                    <UiSelect v-model="timeRange" size="compact">
                        <option v-for="opt in timeRangeOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </UiSelect>
                </div>

                <div v-if="readingsLoading" class="flex items-center justify-center py-12">
                    <Icon name="lucide:loader-2" class="text-fg-faint h-6 w-6 animate-spin" />
                </div>

                <div v-else-if="readings?.length" class="space-y-2">
                    <div class="text-fg-faint grid grid-cols-3 gap-2 text-xs font-medium uppercase">
                        <span>{{ $t("pages.sensors.readingFields.time") }}</span>
                        <span>{{ $t("pages.sensors.readingFields.value") }}</span>
                        <span>{{ $t("pages.sensors.fields.unit") }}</span>
                    </div>
                    <div
                        v-for="r in readings"
                        :key="r.id"
                        class="bg-surface-raised grid grid-cols-3 gap-2 rounded-lg p-3 text-sm"
                    >
                        <span class="text-fg-faint text-xs">{{
                            new Date(r.recordedAt).toLocaleString()
                        }}</span>
                        <span class="text-fg font-medium">{{
                            r.value != null ? r.value : "—"
                        }}</span>
                        <span class="text-fg-faint text-xs">{{ sensor.unit }}</span>
                    </div>
                </div>

                <div v-else class="flex flex-col items-center py-12">
                    <Icon name="lucide:database" class="text-fg-faint mb-3 h-8 w-8" />
                    <p class="text-fg-muted text-sm">{{ $t("pages.sensors.noReadings") }}</p>
                </div>
            </div>
        </template>

        <!-- Edit Modal -->
        <UiModal
            :show="showEdit"
            :title="$t('pages.sensors.edit')"
            width="lg"
            @close="showEdit = false"
        >
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput
                    v-model="editForm.name"
                    :label="$t('pages.sensors.fields.name')"
                    required
                />
                <div class="grid grid-cols-2 gap-3">
                    <UiSelect v-model="editForm.type" :label="$t('pages.sensors.fields.type')">
                        <option v-for="st in sensorTypes" :key="st" :value="st">{{ st }}</option>
                    </UiSelect>
                    <UiTextInput
                        v-model="editForm.unit"
                        :label="$t('pages.sensors.fields.unit')"
                        required
                        :placeholder="$t('pages.sensors.fields.unitPlaceholder')"
                    />
                </div>
                <UiSelect
                    v-model="editForm.enclosureId"
                    :label="$t('pages.sensors.fields.enclosure')"
                >
                    <option value="NONE">—</option>
                    <option v-for="enc in enclosures" :key="enc.id" :value="enc.id">
                        {{ enc.name }}
                    </option>
                </UiSelect>
                <div class="flex items-center gap-3">
                    <UiToggle v-model="editForm.active" />
                    <label class="text-fg text-sm">{{ $t("pages.sensors.fields.active") }}</label>
                </div>
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
            :message="$t('pages.sensors.confirmDelete')"
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

interface Sensor {
    id: string;
    name: string;
    type: string;
    unit: string;
    active: boolean;
    enclosureId: string | null;
    enclosure: { id: string; name: string } | null;
}

interface SensorReading {
    id: string;
    value: number | null;
    recordedAt: string;
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

const sensorId = route.params.id as string;
const sensorTypes = ["TEMPERATURE", "HUMIDITY", "PRESSURE", "WATER"];
const timeRange = ref("24h");
const timeRangeOptions = [
    { label: "1h", value: "1h" },
    { label: "6h", value: "6h" },
    { label: "24h", value: "24h" },
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
];

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "sensors" });

const fromDate = computed(() => {
    const now = new Date();
    const hours: Record<string, number> = { "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720 };
    return new Date(now.getTime() - (hours[timeRange.value] ?? 24) * 3600000).toISOString();
});

// ── Data ─────────────────────────────────────────────────
const {
    data: sensor,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["sensors", sensorId],
    queryFn: () => api.get<Sensor>(`/api/sensors/${sensorId}`),
});

useHead({ title: () => sensor.value?.name ?? t("pages.sensors.title") });

const { data: readings, isLoading: readingsLoading } = useQuery({
    queryKey: ["sensorReadings", sensorId, timeRange],
    queryFn: () =>
        api.get<SensorReading[]>(`/api/sensors/${sensorId}/readings?from=${fromDate.value}`),
});

const { data: enclosures } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

// ── Edit ─────────────────────────────────────────────────
const showEdit = ref(false);
const editForm = reactive({
    name: "",
    type: "TEMPERATURE",
    unit: "°C",
    enclosureId: "NONE",
    active: true,
});

function openEditModal() {
    if (!sensor.value) return;
    Object.assign(editForm, {
        name: sensor.value.name,
        type: sensor.value.type,
        unit: sensor.value.unit,
        enclosureId: sensor.value.enclosureId ?? "NONE",
        active: sensor.value.active,
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/sensors/${sensorId}`, {
            name: editForm.name,
            type: editForm.type,
            unit: editForm.unit,
            enclosureId: editForm.enclosureId === "NONE" ? undefined : editForm.enclosureId,
            active: editForm.active,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sensors"] });
        toast.success(t("pages.sensors.saved"));
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
    mutationFn: () => api.del(`/api/sensors/${sensorId}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sensors"] });
        toast.success(t("pages.sensors.deleted"));
        router.push("/sensors");
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDelete() {
    deleteMutation();
}
</script>
