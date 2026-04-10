<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.sensors.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.sensors.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">{{ $t("pages.sensors.add") }}</UiButton>
        </div>

        <!-- Filters -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UiTextInput
                v-model="searchQuery"
                :placeholder="$t('pages.sensors.search')"
                class="sm:max-w-xs"
            >
                <template #leading>
                    <Icon name="lucide:search" class="h-4 w-4" />
                </template>
            </UiTextInput>
            <UiSelect v-model="selectedType" class="w-48">
                <option value="ALL">{{ $t("pages.sensors.allTypes") }}</option>
                <option v-for="st in sensorTypes" :key="st" :value="st">{{ st }}</option>
            </UiSelect>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 6" :key="i" class="glass-card h-36 animate-pulse rounded-xl" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{ $t("common.retry") }}</UiButton>
        </div>

        <!-- Sensor Grid -->
        <div
            v-else-if="filteredSensors?.length"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            <NuxtLink
                v-for="sensor in filteredSensors"
                :key="sensor.id"
                :to="`/sensors/${sensor.id}`"
                class="glass-card group rounded-xl p-5 transition-all hover:ring-1 hover:ring-white/10"
                :class="{ 'opacity-60': !sensor.active }"
            >
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            :class="sensorIconClass(sensor.type)"
                            class="flex h-10 w-10 items-center justify-center rounded-lg"
                        >
                            <Icon :name="sensorIcon(sensor.type)" class="h-5 w-5" />
                        </div>
                        <div>
                            <h3
                                class="text-fg group-hover:text-primary-400 font-semibold transition-colors"
                            >
                                {{ sensor.name }}
                            </h3>
                            <p class="text-fg-faint text-sm">{{ sensor.type }} · {{ sensor.unit }}</p>
                        </div>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                        <span
                            v-if="!sensor.active"
                            class="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400"
                        >
                            {{ $t("pages.sensors.inactive") }}
                        </span>
                    </div>
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span v-if="sensor.enclosure" class="text-fg-faint flex items-center gap-1.5 text-xs">
                        <Icon name="lucide:box" class="h-3.5 w-3.5" />
                        {{ sensor.enclosure.name }}
                    </span>
                </div>
            </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:thermometer" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">
                {{
                    searchQuery || (selectedType && selectedType !== "ALL")
                        ? $t("common.noResults")
                        : $t("pages.sensors.empty")
                }}
            </p>
            <UiButton
                v-if="!searchQuery && (!selectedType || selectedType === 'ALL')"
                class="mt-4"
                @click="openCreateModal"
            >{{ $t("pages.sensors.addFirst") }}</UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal :show="showCreate" :title="$t('pages.sensors.create')" width="lg" @close="showCreate = false">
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiTextInput v-model="form.name" :label="$t('pages.sensors.fields.name')" required />
                <div class="grid grid-cols-2 gap-3">
                    <UiSelect v-model="form.type" :label="$t('pages.sensors.fields.type')">
                        <option v-for="st in sensorTypes" :key="st" :value="st">{{ st }}</option>
                    </UiSelect>
                    <UiTextInput v-model="form.unit" :label="$t('pages.sensors.fields.unit')" required :placeholder="$t('pages.sensors.fields.unitPlaceholder')" />
                </div>
                <UiSelect v-model="form.enclosureId" :label="$t('pages.sensors.fields.enclosure')">
                    <option value="NONE">—</option>
                    <option v-for="enc in enclosures" :key="enc.id" :value="enc.id">{{ enc.name }}</option>
                </UiSelect>
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>
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

interface Enclosure {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.sensors.title") });

const sensorTypes = ["TEMPERATURE", "HUMIDITY", "PRESSURE", "WATER"];

// ── Filters ──────────────────────────────────────────────
const searchQuery = ref("");
const selectedType = ref("ALL");
const debouncedSearch = refDebounced(searchQuery, 300);

// ── Data ─────────────────────────────────────────────────
const {
    data: sensors,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["sensors"],
    queryFn: () => api.get<Sensor[]>("/api/sensors"),
});

const { data: enclosures } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

const filteredSensors = computed(() => {
    let result = sensors.value ?? [];
    const search = debouncedSearch.value.toLowerCase();
    if (search) {
        result = result.filter(
            (s) =>
                s.name.toLowerCase().includes(search) ||
                s.type.toLowerCase().includes(search) ||
                (s.enclosure && s.enclosure.name.toLowerCase().includes(search)),
        );
    }
    if (selectedType.value && selectedType.value !== "ALL") {
        result = result.filter((s) => s.type === selectedType.value);
    }
    return result;
});

function sensorIcon(type: string): string {
    const icons: Record<string, string> = {
        TEMPERATURE: "lucide:thermometer",
        HUMIDITY: "lucide:droplets",
        PRESSURE: "lucide:gauge",
        WATER: "lucide:waves",
    };
    return icons[type] ?? "lucide:cpu";
}

function sensorIconClass(type: string): string {
    const classes: Record<string, string> = {
        TEMPERATURE: "bg-orange-500/10 text-orange-400",
        HUMIDITY: "bg-blue-500/10 text-blue-400",
        PRESSURE: "bg-purple-500/10 text-purple-400",
        WATER: "bg-cyan-500/10 text-cyan-400",
    };
    return classes[type] ?? "bg-gray-500/10 text-gray-400";
}

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    name: "",
    type: "TEMPERATURE",
    unit: "°C",
    enclosureId: "NONE",
});

function resetForm() {
    Object.assign(form, { name: "", type: "TEMPERATURE", unit: "°C", enclosureId: "NONE" });
}

function openCreateModal() {
    resetForm();
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/sensors", {
            name: form.name,
            type: form.type,
            unit: form.unit,
            enclosureId: form.enclosureId === "NONE" ? undefined : form.enclosureId,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sensors"] });
        toast.success(t("pages.sensors.created"));
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
</script>
