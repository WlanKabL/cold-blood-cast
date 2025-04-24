<template>
    <div
        class="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-700 relative overflow-hidden"
    >
        <div class="absolute bottom-5 right-5 text-3xl text-indigo-400 opacity-80">
            <component :is="iconComponent" />
        </div>
        <div class="flex justify-between items-center mb-1">
            <h2 class="text-lg font-semibold text-white truncate">
                {{ sensor.name || sensor.id }}
            </h2>
            <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="{
                    'bg-green-600 text-white': sensor.status === 'ok',
                    'bg-yellow-600 text-white': sensor.status === 'warning',
                    'bg-red-600 text-white': sensor.status === 'unknown',
                }"
            >
                {{ sensor.status.toUpperCase() }}
            </span>
        </div>
        <div class="text-4xl font-bold text-indigo-400">
            {{ sensor.reading?.value ?? "—" }}
            <span class="text-xl font-normal text-indigo-300">
                {{ sensor.reading?.unit }}
            </span>
        </div>
        <div class="mt-4 text-sm text-gray-400 space-y-1">
            <p v-if="sensor.min !== undefined || sensor.max !== undefined">
                <strong>Range:</strong>
                {{ sensor.min ?? "–∞" }} – {{ sensor.max ?? "+∞" }} {{ sensor.unit }}
            </p>
            <p v-if="sensor.reading?.timestamp">
                <strong>Last updated:</strong> {{ format(sensor.reading.timestamp) }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { format } from "~/utils/date";
import { ThermometerSun, Droplet, Waves, GaugeCircle } from "lucide-vue-next";

import type { PublicSensorResponse } from "~/../snake-link-raspberry/src/types/sensor";

const props = defineProps<{ sensor: PublicSensorResponse }>();

const iconMap = {
    ThermometerSun,
    Droplet,
    Waves,
    GaugeCircle,
};

const iconComponent = computed(() => {
    return iconMap[getSensorIcon(props.sensor.type)] ?? GaugeCircle;
});
</script>
