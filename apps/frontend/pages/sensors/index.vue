<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.sensors.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.sensors.subtitle") }}</p>
            </div>
            <UButton
                icon="i-lucide-plus"
                :label="$t('pages.sensors.add')"
                @click="showCreate = true"
            />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 6" :key="i" class="glass-card h-36 animate-pulse rounded-xl" />
        </div>

        <!-- List -->
        <div
            v-else-if="sensors?.length"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            <NuxtLink
                v-for="sensor in sensors"
                :key="sensor.id"
                :to="`/sensors/${sensor.id}`"
                class="glass-card group rounded-xl p-5 transition-all hover:ring-1 hover:ring-white/10"
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
                            <p class="text-fg-faint text-sm">{{ sensor.type }}</p>
                        </div>
                    </div>
                </div>
                <div class="text-fg-muted mt-3 text-sm">
                    <span v-if="sensor.location">{{ sensor.location }}</span>
                    <span v-if="sensor.model" class="text-fg-faint"> · {{ sensor.model }}</span>
                </div>
            </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:thermometer" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.sensors.empty") }}</p>
            <UButton
                class="mt-4"
                :label="$t('pages.sensors.addFirst')"
                @click="showCreate = true"
            />
        </div>

        <!-- Create Modal -->
        <UModal v-model:open="showCreate">
            <template #content>
                <div class="p-6">
                    <h2 class="text-fg mb-4 text-lg font-semibold">
                        {{ $t("pages.sensors.create") }}
                    </h2>
                    <form class="space-y-4" @submit.prevent="handleCreate">
                        <UFormField :label="$t('pages.sensors.fields.name')">
                            <UInput v-model="form.name" required />
                        </UFormField>
                        <UFormField :label="$t('pages.sensors.fields.type')">
                            <USelect v-model="form.type" :items="sensorTypes" />
                        </UFormField>
                        <UFormField :label="$t('pages.sensors.fields.enclosure')">
                            <USelect v-model="form.enclosureId" :items="enclosureOptions" />
                        </UFormField>
                        <UFormField :label="$t('pages.sensors.fields.model')">
                            <UInput v-model="form.model" placeholder="DHT22, BME280, ..." />
                        </UFormField>
                        <UFormField :label="$t('pages.sensors.fields.location')">
                            <UInput
                                v-model="form.location"
                                :placeholder="$t('pages.sensors.fields.locationPlaceholder')"
                            />
                        </UFormField>
                        <div class="flex justify-end gap-2 pt-2">
                            <UButton
                                variant="ghost"
                                :label="$t('common.cancel')"
                                @click="showCreate = false"
                            />
                            <UButton type="submit" :loading="creating" :label="$t('common.save')" />
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface Sensor {
    id: string;
    name: string;
    type: string;
    model: string | null;
    location: string | null;
    enclosureId: string | null;
}

interface Enclosure {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.sensors.title") });

const sensorTypes = ["DHT22", "BME280", "DS18B20", "HOME_ASSISTANT", "OTHER"];

const showCreate = ref(false);
const creating = ref(false);
const form = reactive({
    name: "",
    type: "DHT22",
    enclosureId: "",
    model: "",
    location: "",
});

const { data: sensors, isLoading: loading } = useQuery({
    queryKey: ["sensors"],
    queryFn: () => api.get<Sensor[]>("/api/sensors"),
});

const { data: enclosures } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

const enclosureOptions = computed(() => [
    { label: "—", value: "" },
    ...(enclosures.value ?? []).map((e) => ({ label: e.name, value: e.id })),
]);

function sensorIcon(type: string): string {
    const icons: Record<string, string> = {
        DHT22: "lucide:thermometer",
        BME280: "lucide:cloud",
        DS18B20: "lucide:thermometer-sun",
        HOME_ASSISTANT: "lucide:home",
    };
    return icons[type] ?? "lucide:cpu";
}

function sensorIconClass(type: string): string {
    const classes: Record<string, string> = {
        DHT22: "bg-green-500/10 text-green-400",
        BME280: "bg-blue-500/10 text-blue-400",
        DS18B20: "bg-orange-500/10 text-orange-400",
        HOME_ASSISTANT: "bg-cyan-500/10 text-cyan-400",
    };
    return classes[type] ?? "bg-gray-500/10 text-gray-400";
}

async function handleCreate() {
    creating.value = true;
    try {
        await api.post("/api/sensors", {
            name: form.name,
            type: form.type,
            enclosureId: form.enclosureId || undefined,
            model: form.model || undefined,
            location: form.location || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["sensors"] });
        toast.add({ title: t("common.saved"), color: "green" });
        showCreate.value = false;
        Object.assign(form, { name: "", type: "DHT22", enclosureId: "", model: "", location: "" });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    } finally {
        creating.value = false;
    }
}
</script>
