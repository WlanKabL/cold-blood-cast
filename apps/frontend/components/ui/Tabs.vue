<template>
    <div>
        <div class="border-line mb-6 flex gap-1 overflow-x-auto border-b" role="tablist">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                role="tab"
                :aria-selected="modelValue === tab.key"
                class="relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors"
                :class="modelValue === tab.key ? 'text-primary-400' : 'text-fg-muted hover:text-fg'"
                @click="$emit('update:modelValue', tab.key)"
            >
                <span class="flex items-center gap-2">
                    <Icon v-if="tab.icon" :name="tab.icon" class="h-4 w-4" />
                    {{ tab.label }}
                    <span
                        v-if="tab.badge"
                        class="bg-primary-500/10 text-primary-400 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold"
                    >
                        {{ tab.badge }}
                    </span>
                </span>
                <span
                    v-if="modelValue === tab.key"
                    class="bg-primary-400 absolute bottom-0 left-0 h-0.5 w-full rounded-full"
                />
            </button>
        </div>
        <slot />
    </div>
</template>

<script setup lang="ts">
interface Tab {
    key: string;
    label: string;
    icon?: string;
    badge?: string | number;
}

defineProps<{
    tabs: Tab[];
    modelValue: string;
}>();

defineEmits<{
    "update:modelValue": [key: string];
}>();
</script>
