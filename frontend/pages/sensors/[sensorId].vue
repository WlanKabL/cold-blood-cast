<template>
    <div class="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Edit Sensor</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Change all relevant settings</p>
        </div>

        <form class="space-y-4" @submit.prevent="save">
            <BaseInput v-model="form.name" label="Name" placeholder="Sensor name" />
            <BaseInput
                v-model="form.type"
                label="Type"
                placeholder="temperature / humidity / ..."
            />
            <BaseInput v-model="form.unit" label="Unit" placeholder="°C / %" />
            <BaseInput v-model="form.reader" label="Reader" placeholder="bme280 / dht22 / mock" />

            <!-- Hardware Inputs -->
            <div class="border rounded p-4 dark:border-gray-600">
                <h2 class="font-semibold mb-2 text-lg text-emerald-600 dark:text-emerald-400">
                    Hardware
                </h2>
                <BaseInput
                    v-if="'pin' in form.hardware!"
                    v-model="form.hardware.pin"
                    label="Pin"
                    placeholder="GPIO17"
                />
                <BaseInput
                    v-if="'model' in form.hardware!"
                    v-model="form.hardware.model"
                    label="Model"
                    placeholder="22"
                />
                <BaseInput
                    v-if="'i2cAddress' in form.hardware!"
                    v-model="form.hardware.i2cAddress"
                    label="I2C Address"
                    placeholder="0x77"
                    type="number"
                />
                <BaseInput
                    v-if="'i2cBusNo' in form.hardware!"
                    v-model="form.hardware.i2cBusNo"
                    label="I2C Bus Number"
                    placeholder="1"
                    type="number"
                />
                <label
                    v-if="'mock' in form.hardware!"
                    class="block text-sm font-medium mt-2 text-gray-700 dark:text-gray-300"
                >
                    <input v-model="form.hardware.mock" type="checkbox" class="mr-2" />
                    Use Mock Data
                </label>
            </div>

            <!-- Limits -->
            <div class="border rounded p-4 dark:border-gray-600">
                <h2 class="font-semibold mb-2 text-lg text-emerald-600 dark:text-emerald-400">
                    Limits
                </h2>
                <select
                    v-model="form.limitsType"
                    class="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
                >
                    <option value="general">General</option>
                    <option value="timeBased">Time-Based</option>
                </select>

                <!-- General Limits -->
                <div v-if="form.limitsType === 'general'" class="grid grid-cols-2 gap-4 mt-4">
                    <BaseInput
                        v-model="form.readingLimits!.min"
                        label="Min"
                        type="number"
                        placeholder="e.g. 20"
                    />
                    <BaseInput
                        v-model="form.readingLimits!.max"
                        label="Max"
                        type="number"
                        placeholder="e.g. 30"
                    />
                </div>

                <!-- TimeBased Limits -->
                <div v-if="form.limitsType === 'timeBased'" class="grid grid-cols-2 gap-4 mt-4">
                    <BaseInput
                        v-model="form.readingLimits!.day.min"
                        label="Day Min"
                        type="number"
                        placeholder="e.g. 25"
                    />
                    <BaseInput
                        v-model="form.readingLimits!.day.max"
                        label="Day Max"
                        type="number"
                        placeholder="e.g. 32"
                    />
                    <BaseInput
                        v-model="form.readingLimits!.night.min"
                        label="Night Min"
                        type="number"
                        placeholder="e.g. 20"
                    />
                    <BaseInput
                        v-model="form.readingLimits!.night.max"
                        label="Night Max"
                        type="number"
                        placeholder="e.g. 26"
                    />
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-4">
                <button
                    type="submit"
                    class="px-5 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                >
                    Save
                </button>
                <button
                    type="button"
                    class="px-5 py-2 rounded-md bg-gray-300 dark:bg-gray-700 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                    @click="router.back()"
                >
                    Cancel
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, watch } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import BaseInput from "~/components/BaseInput.vue";
import { configService } from "~/services/configService";
import type { SensorConfig } from "../../../snake-link-raspberry/src/types/sensor";

const router = useRouter();
const route = useRoute();
const id = route.params.sensorId as string;
const queryClient = useQueryClient();

const form = ref<Partial<SensorConfig>>({
    name: "",
    type: undefined,
    unit: undefined,
    reader: undefined,
    limitsType: "general",
    hardware: {
        pin: 0,
        model: "22",
        i2cAddress: 0,
        i2cBusNo: 1,
        mock: false,
    },
    readingLimits: {
        min: 0,
        max: 0,
    },
});

const { data: sensor } = useQuery({
    queryKey: ["sensor", id],
    queryFn: () => configService.getSensor(id),
});

watch(sensor, () => {
    if (sensor.value) {
        form.value = JSON.parse(JSON.stringify(sensor.value)); // deep copy
    }
});

const mutation = useMutation({
    mutationFn: (payload: SensorConfig) => configService.updateSensor(id, payload),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sensor", id] });
        router.push("/sensors");
    },
});

function save() {
    mutation.mutate(form.value as SensorConfig);
}

watch(
    () => form.value.limitsType,
    (newType) => {
        if (
            newType === "general" &&
            (!form.value.readingLimits || "day" in form.value.readingLimits)
        ) {
            form.value.readingLimits = {
                min: 0,
                max: 0,
            };
        } else if (
            newType === "timeBased" &&
            (!form.value.readingLimits || "min" in form.value.readingLimits)
        ) {
            form.value.readingLimits = {
                day: { min: 0, max: 0 },
                night: { min: 0, max: 0 },
            };
        }
    },
    { immediate: true },
);
</script>
