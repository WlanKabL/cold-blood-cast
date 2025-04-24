<template>
    <div
        :class="`bg-zinc-900 rounded-2xl p-6 border border-zinc-700 shadow flex items-center justify-between`"
    >
        <div>
            <h3 class="text-sm text-gray-400 font-medium uppercase tracking-wide">
                {{ title }}
            </h3>
            <p class="text-3xl font-bold text-white">
                {{ value }} <span class="text-lg text-gray-400">{{ unit }}</span>
            </p>
        </div>
        <component :is="iconMap[icon] ?? ThermometerSun" :class="`w-10 h-10 ${color}`" />
    </div>
</template>

<script setup lang="ts">
import { ThermometerSun, Droplet, Waves, GaugeCircle } from "lucide-vue-next";

defineProps<{
    title: string;
    value: string | number;
    unit?: string;
    icon: keyof typeof iconMap;
    color?: string;
}>();

const iconMap = {
    ThermometerSun,
    Droplet,
    Waves,
    GaugeCircle,
};
</script>
