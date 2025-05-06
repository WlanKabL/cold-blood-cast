<template>
    <div
        class="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-zinc-700 relative overflow-hidden"
    >
        <div
            class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 text-xl sm:text-2xl text-emerald-400 opacity-80"
        >
            <component :is="iconComponent" />
        </div>
        <div class="flex items-center justify-between mb-1">
            <h2 class="text-base sm:text-lg font-semibold text-white truncate">
                {{ sensor.name || sensor.id }}
            </h2>
            <span
                class="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                :class="bgColor"
            >
                {{ sensor.status.toUpperCase() }}
            </span>
        </div>
        <div class="flex items-baseline space-x-1">
            <p class="text-2xl sm:text-4xl font-bold text-emerald-400 leading-none">
                {{ sensor.reading?.value ?? "—" }}
            </p>
            <span class="text-sm sm:text-base text-emerald-300">
                {{ sensor.reading?.unit }}
            </span>
        </div>
        <div class="mt-3 text-sm text-gray-400 flex flex-col sm:block space-y-2">
            <template v-if="isGeneral">
                <div class="flex items-center space-x-1">
                    <component
                        :is="ChevronsRightLeft"
                        class="w-4 h-4"
                        :class="isDay ? 'text-yellow-300' : 'text-emerald-300'"
                    />
                    <span class="truncate">
                        {{ generalLimits.min ?? "–∞" }}–{{ generalLimits.max ?? "+∞" }}
                        {{ sensor.unit }}
                    </span>
                </div>
            </template>
            <template v-else>
                <div class="flex items-center space-x-1">
                    <component
                        :is="isDay ? SunIcon : MoonIcon"
                        class="w-4 h-4"
                        :class="isDay ? 'text-yellow-300' : 'text-emerald-300'"
                    />
                    <span class="truncate">
                        {{ (isDay ? timeBasedLimits.day.min : timeBasedLimits.night.min) ?? "–∞" }}
                        –
                        {{ (isDay ? timeBasedLimits.day.max : timeBasedLimits.night.max) ?? "+∞" }}
                        {{ sensor.unit }}
                    </span>
                </div>
            </template>
        </div>
        <p class="mt-2 text-xs text-gray-500 block">
            Last updated:
            {{ sensor.reading?.timestamp ? format(sensor.reading.timestamp) : "Unknown" }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { toRef, computed } from "vue";
import { Sun, Moon, ChevronsRightLeft } from "lucide-vue-next";
import { useSensorHelpers } from "~/composables/useSensorHelpers";
import { format } from "~/utils/date";
import type { PublicSensorResponse } from "~/../snake-link-raspberry/src/types/sensor";

const props = defineProps<{ sensor: PublicSensorResponse }>();
const sensorRef = toRef(props, "sensor");

const SunIcon = Sun;
const MoonIcon = Moon;

const { icon: iconComponent, bgColor, isDay } = useSensorHelpers(sensorRef);

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
        : {
              day: { min: undefined, max: undefined },
              night: { min: undefined, max: undefined },
          },
);
</script>
