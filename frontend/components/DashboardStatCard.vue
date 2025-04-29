<template>
    <div
        :class="`bg-zinc-900 rounded-2xl p-6 border border-zinc-700 shadow flex items-center justify-between`"
    >
        <div>
            <h3 class="text-sm text-gray-400 font-medium uppercase tracking-wide">
                {{ sensor.name || sensor.id }}
            </h3>
            <p class="text-3xl font-bold text-white">
                {{ sensor.reading?.value ?? "—" }}
                <span class="text-lg text-gray-400">{{ sensor.reading?.unit ?? sensor.unit }}</span>
            </p>
        </div>
        <component :is="iconComponent" :class="`w-10 h-10 ${textColor}`" />
    </div>
</template>

<script setup lang="ts">
import type { PublicSensorResponse } from "../../snake-link-raspberry/src/types/sensor";

const props = defineProps<{ sensor: PublicSensorResponse }>();

const { icon: iconComponent, textColor } = useSensorHelpers(props.sensor);
</script>
