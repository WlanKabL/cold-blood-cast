<template>
    <div
        class="relative bg-zinc-900 rounded-2xl p-6 border border-zinc-700 shadow flex items-center justify-between overflow-hidden"
    >
        <div
            v-if="sensor.limitsType === 'timeBased'"
            class="absolute top-2 right-2 w-4 h-4 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
            <component
                :is="isDay ? SunIcon : MoonIcon"
                class="w-5 h-5"
                :class="isDay ? 'text-yellow-300' : 'text-indigo-300'"
            />
        </div>
        <div>
            <h3 class="text-sm text-gray-400 font-medium uppercase tracking-wide">
                {{ sensor.name || sensor.id }}
            </h3>
            <p class="text-3xl font-bold text-white">
                {{ sensor.reading?.value ?? "—" }}
                <span class="text-lg text-gray-400">
                    {{ sensor.reading?.unit ?? sensor.unit }}
                </span>
            </p>
        </div>
        <component :is="iconComponent" :class="`w-10 h-10 ${textColor}`" />
    </div>
</template>

<script setup lang="ts">
import { Sun, Moon } from "lucide-vue-next";
import type { PublicSensorResponse } from "../../snake-link-raspberry/src/types/sensor";
import { useSensorHelpers } from "~/composables/useSensorHelpers";

const props = defineProps<{ sensor: PublicSensorResponse }>();
const sensorRef = toRef(props, "sensor");

// pull icon & color for the main status
const { icon: iconComponent, textColor, isDay } = useSensorHelpers(sensorRef);

// local aliases for the badge
const SunIcon = Sun;
const MoonIcon = Moon;
</script>
