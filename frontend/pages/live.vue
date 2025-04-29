<template>
    <section class="lg:p-8 p-3">
        <div v-if="isLoading" class="text-indigo-400 animate-pulse">Loading live data...</div>

        <div v-else-if="data" class="grid lg:gap-6 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SensorReadingCard v-for="(sensor, id) in data" :key="id" :sensor />
        </div>

        <div v-else class="text-gray-500">No sensor data available.</div>
    </section>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import SensorReadingCard from "@/components/SensorReadingCard.vue";
import type { PublicSensorResponse } from "~/../snake-link-raspberry/src/types/sensor";
import { liveService } from "~/services/liveService";

const app = useAppConfigStore();

onMounted(async () => {
    await app.fetchConfig();
});

const fetchLiveData = async () => {
    const liveData = await liveService.getLiveData();
    return liveData as PublicSensorResponse[];
};

const { data, isLoading } = useQuery({
    queryKey: ["live-sensor-data"],
    queryFn: fetchLiveData,
    refetchInterval: 5000,
});
</script>
