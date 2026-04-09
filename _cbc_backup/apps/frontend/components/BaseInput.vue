<template>
    <div class="w-full mb-4">
        <label v-if="label" :for="id" class="block mb-1 text-sm font-medium text-fg">
            {{ label }}
        </label>
        <input
            :id="id"
            :value="modelValue"
            :type="type"
            :placeholder="placeholder"
            class="w-full px-4 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-input-bg border-input-border text-fg placeholder-fg-soft"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: unknown;
    label?: string;
    placeholder?: string;
    type?: string;
    id?: string;
    error?: string;
}>();

defineEmits(["update:modelValue"]);
</script>
