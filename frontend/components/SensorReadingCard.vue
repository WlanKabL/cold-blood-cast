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
            <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="bgColor">
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
            <div v-if="isGeneral">
                <p v-if="generalLimits.min !== undefined || generalLimits.max !== undefined">
                    <strong>Range:</strong>
                    {{ generalLimits.min ?? "–∞" }} – {{ generalLimits.max ?? "+∞" }}
                    {{ sensor.unit }}
                </p>
            </div>
            <div v-else class="space-y-2">
                <div class="flex items-center space-x-2">
                    <span
                        class="px-2 py-0.5 rounded-full text-sm font-semibold"
                        :class="
                            isDay ? 'bg-yellow-200 text-yellow-800' : 'bg-zinc-700 text-zinc-400'
                        "
                    >
                        Day
                    </span>
                    <span class="text-gray-200">
                        {{ timeBasedLimits.day.min ?? "–∞" }} –
                        {{ timeBasedLimits.day.max ?? "+∞" }} {{ sensor.unit }}
                    </span>
                </div>

                <div class="flex items-center space-x-2">
                    <span
                        class="px-2 py-0.5 rounded-full text-sm font-semibold"
                        :class="
                            !isDay ? 'bg-indigo-200 text-indigo-800' : 'bg-zinc-700 text-zinc-400'
                        "
                    >
                        Night
                    </span>
                    <span class="text-gray-200">
                        {{ timeBasedLimits.night.min ?? "–∞" }} –
                        {{ timeBasedLimits.night.max ?? "+∞" }} {{ sensor.unit }}
                    </span>
                </div>
            </div>
            <p v-if="sensor.reading?.timestamp">
                <strong>Last updated:</strong> {{ format(sensor.reading.timestamp) }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { format } from "~/utils/date";
import type { PublicSensorResponse } from "~/../snake-link-raspberry/src/types/sensor";

// Props definition
const props = defineProps<{ sensor: PublicSensorResponse }>();

const { icon: iconComponent, bgColor, isDay } = useSensorHelpers(props.sensor);

// Narrowing on limitsType
const isGeneral = computed(() => props.sensor.limitsType === "general");
const generalLimits = computed(() =>
    isGeneral.value
        ? (props.sensor.readingLimits as { min?: number; max?: number })
        : { min: undefined, max: undefined },
);
const timeBasedLimits = computed(() =>
    !isGeneral.value
        ? (props.sensor.readingLimits as {
              day: { min?: number; max?: number };
              night: { min?: number; max?: number };
          })
        : { day: { min: undefined, max: undefined }, night: { min: undefined, max: undefined } },
);
</script>
