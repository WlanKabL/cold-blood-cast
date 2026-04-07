<template>
    <div class="p-6">
        <h1 class="text-3xl font-bold">Sensor Overview</h1>
        <p class="text-gray-500 mt-1">Manage and configure your connected sensors.</p>

        <div v-if="isLoading" class="mt-6 text-gray-400">Loading sensors...</div>
        <div v-else-if="error" class="mt-6 text-red-500">Error loading sensors 😢</div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            <SensorCard
                v-for="sensor in sensors"
                :key="sensor.id"
                :sensor="sensor"
                @edit="navigateToSensor(sensor.id)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { configService } from "@/services/configService";
import { useRouter } from "vue-router";

const router = useRouter();

const {
    data: sensors = [],
    isLoading,
    error,
} = useQuery({
    queryKey: ["sensors"],
    queryFn: () => configService.getSensors(),
});

const navigateToSensor = (id: string) => {
    router.push(`/sensors/${id}`);
};
</script>
