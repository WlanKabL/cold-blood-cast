<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="flex items-center gap-3">
            <NuxtLink to="/sensors" class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors">
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="flex-1">
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ sensor?.name ?? "..." }}</h1>
                <p class="text-fg-faint text-sm">{{ sensor?.type }} · {{ sensor?.location }}</p>
            </div>
            <UButton v-if="sensor" variant="ghost" icon="i-lucide-trash-2" color="error" @click="handleDelete" />
        </div>

        <div v-if="loading" class="space-y-4">
            <div class="glass-card h-48 animate-pulse rounded-xl" />
        </div>

        <template v-else-if="sensor">
            <!-- Info Card -->
            <div class="glass-card rounded-xl p-6">
                <h2 class="text-fg mb-4 font-semibold">{{ $t("pages.sensors.details") }}</h2>
                <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.sensors.fields.type") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ sensor.type }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.sensors.fields.model") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ sensor.model || "—" }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.sensors.fields.location") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ sensor.location || "—" }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.sensors.fields.gpioPin") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ sensor.gpioPin ?? "—" }}</dd>
                    </div>
                </dl>
            </div>

            <!-- Readings -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.sensors.readings") }}</h2>
                    <div class="flex gap-2">
                        <USelect v-model="timeRange" :items="timeRangeOptions" size="sm" />
                    </div>
                </div>

                <div v-if="readingsLoading" class="flex items-center justify-center py-12">
                    <Icon name="lucide:loader-2" class="text-fg-faint h-6 w-6 animate-spin" />
                </div>

                <div v-else-if="readings?.length" class="space-y-2">
                    <div class="text-fg-faint grid grid-cols-5 gap-2 text-xs font-medium uppercase">
                        <span>{{ $t("pages.sensors.readingFields.time") }}</span>
                        <span>{{ $t("pages.sensors.readingFields.temperature") }}</span>
                        <span>{{ $t("pages.sensors.readingFields.humidity") }}</span>
                        <span>{{ $t("pages.sensors.readingFields.pressure") }}</span>
                        <span>{{ $t("pages.sensors.readingFields.battery") }}</span>
                    </div>
                    <div
                        v-for="r in readings"
                        :key="r.id"
                        class="bg-surface-raised grid grid-cols-5 gap-2 rounded-lg p-3 text-sm"
                    >
                        <span class="text-fg-faint text-xs">{{ new Date(r.readAt).toLocaleString() }}</span>
                        <span class="text-fg font-medium">{{ r.temperature != null ? `${r.temperature}°C` : "—" }}</span>
                        <span class="text-fg">{{ r.humidity != null ? `${r.humidity}%` : "—" }}</span>
                        <span class="text-fg">{{ r.pressure != null ? `${r.pressure} hPa` : "—" }}</span>
                        <span class="text-fg">{{ r.batteryLevel != null ? `${r.batteryLevel}%` : "—" }}</span>
                    </div>
                </div>

                <div v-else class="flex flex-col items-center py-12">
                    <Icon name="lucide:database" class="text-fg-faint mb-3 h-8 w-8" />
                    <p class="text-fg-muted text-sm">{{ $t("pages.sensors.noReadings") }}</p>
                </div>
            </div>
        </template>
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
    gpioPin: number | null;
    enclosureId: string | null;
}

interface SensorReading {
    id: string;
    readAt: string;
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
    batteryLevel: number | null;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useToast();

const sensorId = route.params.id as string;
const timeRange = ref("24h");
const timeRangeOptions = [
    { label: "1h", value: "1h" },
    { label: "6h", value: "6h" },
    { label: "24h", value: "24h" },
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
];

definePageMeta({ layout: "default" });
useHead({ title: () => sensor.value?.name ?? t("pages.sensors.title") });

const fromDate = computed(() => {
    const now = new Date();
    const hours: Record<string, number> = { "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720 };
    return new Date(now.getTime() - (hours[timeRange.value] ?? 24) * 3600000).toISOString();
});

const { data: sensor, isLoading: loading } = useQuery({
    queryKey: ["sensors", sensorId],
    queryFn: () => api.get<Sensor>(`/api/sensors/${sensorId}`),
});

const { data: readings, isLoading: readingsLoading } = useQuery({
    queryKey: ["sensorReadings", sensorId, timeRange],
    queryFn: () => api.get<SensorReading[]>(`/api/sensors/${sensorId}/readings?from=${fromDate.value}`),
});

async function handleDelete() {
    if (!confirm(t("pages.sensors.confirmDelete"))) return;
    try {
        await api.del(`/api/sensors/${sensorId}`);
        await queryClient.invalidateQueries({ queryKey: ["sensors"] });
        toast.add({ title: t("common.deleted"), color: "green" });
        router.push("/sensors");
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    }
}
</script>
