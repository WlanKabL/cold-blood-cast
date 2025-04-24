<template>
    <PageContainer
        title="🐍 Welcome to Cold-Blood-Cast"
        subtitle="Real-time monitoring & smart terrarium management. Powered by your Raspberry Pi."
        hide-back-button
    >
        <div
            class="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-px-4 md:scroll-px-0"
        >
            <div class="block md:hidden shrink-0 w-[10vw]" aria-hidden="true" />
            <DashboardStatCard
                v-for="sensor in highlightSensors"
                :key="sensor.id"
                :title="sensor.name"
                :value="sensor.reading?.value ?? '—'"
                :unit="sensor.unit"
                :icon="getSensorIcon(sensor.type)"
                :color="getSensorColor(sensor.status)"
                class="min-w-[80%] snap-center md:min-w-0 md:h-auto"
            />
            <div class="block md:hidden shrink-0 w-[10vw]" aria-hidden="true" />
        </div>
        <div class="bg-zinc-900 rounded-2xl p-6 border border-zinc-700 shadow text-center mt-10">
            <p class="text-gray-300">
                📈 Coming soon: Sensor history graph, activity trends and alerts.
            </p>
        </div>
    </PageContainer>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import type { PublicSensorResponse } from "~/../snake-link-raspberry/src/types/sensor";

// Fetch sensors
const fetchLiveData = async () => {
    const { data } = await useNuxtApp().$axios.get("/api/live");
    return (data as PublicSensorResponse[]) ?? [];
};

const { data } = await useQuery({
    queryKey: ["dashboard-sensors"],
    queryFn: fetchLiveData,
    refetchInterval: 10000,
});

const highlightSensors = computed(
    () =>
        data.value?.filter(
            (sensor) => ["temperature", "humidity"].includes(sensor.type),
            // || sensor.highlight === true // optinal for the Future
        ) ?? [],
);
</script>
