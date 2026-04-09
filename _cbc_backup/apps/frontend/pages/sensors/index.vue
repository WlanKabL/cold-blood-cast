<template>
    <PageContainer :title="$t('sensors.title')" hide-back-button>
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
            <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-emerald-400" />
        </div>

        <!-- Empty state -->
        <div v-else-if="!sensors.length && !showForm" class="py-16 text-center">
            <Icon name="lucide:thermometer" class="mx-auto h-12 w-12 text-fg-soft" />
            <h3 class="mt-4 text-lg font-semibold text-fg">{{ $t("sensors.empty_title") }}</h3>
            <p class="mt-2 text-sm text-fg-muted">{{ $t("sensors.empty_desc") }}</p>
            <button
                class="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
                @click="showForm = true"
            >
                <Icon name="lucide:plus" class="h-4 w-4" />
                {{ $t("sensors.create") }}
            </button>
        </div>

        <template v-else>
            <div class="mb-6 flex items-center justify-end">
                <button
                    v-if="!showForm"
                    class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                    @click="showForm = true"
                >
                    <Icon name="lucide:plus" class="h-4 w-4" />
                    {{ $t("sensors.create") }}
                </button>
            </div>

            <!-- Create form -->
            <div v-if="showForm" class="mb-8 rounded-xl border border-card-border bg-card-bg p-6">
                <form @submit.prevent="createSensor">
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg"
                                >{{ $t("sensors.name") }} *</label
                            >
                            <input
                                v-model="form.name"
                                type="text"
                                required
                                :placeholder="$t('sensors.name_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg"
                                >{{ $t("sensors.type") }} *</label
                            >
                            <select
                                v-model="form.type"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            >
                                <option v-for="st in sensorTypes" :key="st" :value="st">
                                    {{ $t(`sensors.type_${st}`) }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg"
                                >{{ $t("sensors.unit") }} *</label
                            >
                            <input
                                v-model="form.unit"
                                type="text"
                                required
                                :placeholder="$t('sensors.unit_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("sensors.enclosure")
                            }}</label>
                            <select
                                v-model="form.enclosureId"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            >
                                <option value="">{{ $t("sensors.no_enclosure") }}</option>
                                <option v-for="enc in enclosures" :key="enc.id" :value="enc.id">
                                    {{ enc.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            class="rounded-lg px-4 py-2 text-sm text-fg-muted transition hover:text-fg"
                            @click="resetForm"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            type="submit"
                            :disabled="saving || !form.name || !form.unit"
                            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                            <Icon
                                v-if="saving"
                                name="lucide:loader-2"
                                class="h-4 w-4 animate-spin"
                            />
                            {{ $t("common.create") }}
                        </button>
                    </div>
                </form>
            </div>

            <!-- Sensor cards -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="sensor in sensors"
                    :key="sensor.id"
                    class="group rounded-xl border border-card-border bg-card-bg p-5 transition-colors hover:border-line"
                >
                    <div class="mb-3 flex items-start justify-between">
                        <div>
                            <h3 class="text-base font-semibold text-fg">{{ sensor.name }}</h3>
                            <span class="text-xs text-fg-soft"
                                >{{ $t(`sensors.type_${sensor.type}`) }} · {{ sensor.unit }}</span
                            >
                        </div>
                        <div class="flex items-center gap-2">
                            <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                :class="
                                    sensor.active
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-active text-fg-soft'
                                "
                            >
                                {{ sensor.active ? $t("sensors.active") : $t("sensors.inactive") }}
                            </span>
                            <button
                                class="rounded p-1 text-fg-soft opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                                @click="deleteSensor(sensor.id)"
                            >
                                <Icon name="lucide:trash-2" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <p v-if="sensor.enclosure" class="text-xs text-emerald-500">
                        {{ sensor.enclosure.name }}
                    </p>
                </div>
            </div>
        </template>
    </PageContainer>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });
useSeoMeta({ title: "Sensors – Cold Blood Cast" });

const { t } = useI18n();
const http = useHttp();

interface Sensor {
    id: string;
    name: string;
    type: string;
    unit: string;
    active: boolean;
    enclosure: { id: string; name: string } | null;
}

interface EnclosureOption {
    id: string;
    name: string;
}

const sensors = ref<Sensor[]>([]);
const enclosures = ref<EnclosureOption[]>([]);
const loading = ref(true);
const saving = ref(false);
const showForm = ref(false);

const sensorTypes = ["TEMPERATURE", "HUMIDITY", "PRESSURE", "WATER"] as const;

const form = reactive({
    name: "",
    type: "TEMPERATURE" as string,
    unit: "°C",
    enclosureId: "",
});

function resetForm() {
    form.name = "";
    form.type = "TEMPERATURE";
    form.unit = "°C";
    form.enclosureId = "";
    showForm.value = false;
}

async function fetchData() {
    try {
        const [senRes, encRes] = await Promise.all([
            http.get<Sensor[]>("/api/sensors"),
            http.get<EnclosureOption[]>("/api/enclosures"),
        ]);
        sensors.value = senRes.data;
        enclosures.value = encRes.data;
    } catch {
        // handled by empty state
    } finally {
        loading.value = false;
    }
}

async function createSensor() {
    if (!form.name || !form.unit || saving.value) return;
    saving.value = true;
    try {
        const payload: Record<string, unknown> = {
            name: form.name,
            type: form.type,
            unit: form.unit,
        };
        if (form.enclosureId) payload.enclosureId = form.enclosureId;

        await http.post("/api/sensors", payload);
        resetForm();
        await fetchData();
    } catch {
        // error handled by interceptor
    } finally {
        saving.value = false;
    }
}

async function deleteSensor(id: string) {
    if (!confirm(t("sensors.confirm_delete"))) return;
    try {
        await http.delete(`/api/sensors/${id}`);
        sensors.value = sensors.value.filter((s) => s.id !== id);
    } catch {
        // error handled by interceptor
    }
}

onMounted(fetchData);
</script>
