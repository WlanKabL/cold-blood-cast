<template>
    <div
        class="bg-gray-900 text-white rounded-lg border border-gray-700 p-5 shadow-lg flex flex-col justify-between hover:border-emerald-500 transition"
    >
        <div>
            <h2 class="text-xl font-bold text-emerald-400">{{ sensor.name }}</h2>
            <p class="text-sm text-gray-400 mt-1 capitalize">Type: {{ sensor.type }}</p>
            <p class="text-xs text-gray-500 mt-1">ID: {{ sensor.id }}</p>
        </div>

        <button
            @click="$emit('edit')"
            class="mt-5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md text-sm font-semibold transition"
        >
            Edit Sensor
        </button>
    </div>
</template>

<script setup lang="ts">
import type { SensorConfig } from "../../snake-link-raspberry/src/types/sensor";

defineProps<{
    sensor: SensorConfig;
}>();

defineEmits<{
    (e: "edit"): void;
}>();
</script>
