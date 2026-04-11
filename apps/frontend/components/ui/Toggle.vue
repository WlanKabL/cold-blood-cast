<template>
    <button
        type="button"
        class="relative shrink-0 rounded-full transition-colors"
        :class="[sizeClass, active ? activeBgClass : 'bg-line']"
        :disabled="disabled"
        @click="$emit('update:modelValue', !active)"
    >
        <span
            class="absolute rounded-full bg-white shadow-sm transition-transform"
            :class="[thumbSizeClass, thumbPositionClass]"
        />
    </button>
</template>

<script setup lang="ts">
interface Props {
    modelValue: boolean;
    /** Size variant */
    size?: "sm" | "md";
    /** Color when active */
    color?: "primary" | "accent" | "emerald" | "red";
    disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    size: "md",
    color: "primary",
    disabled: false,
});

defineEmits<{
    "update:modelValue": [value: boolean];
}>();

const active = computed(() => props.modelValue);

const sizeClass = computed(() => (props.size === "sm" ? "h-4 w-7" : "h-5 w-9"));

const thumbSizeClass = computed(() => (props.size === "sm" ? "h-3 w-3" : "h-4 w-4"));

const thumbPositionClass = computed(() => {
    if (props.size === "sm") {
        return active.value ? "top-0.5 left-3.5" : "top-0.5 left-0.5";
    }
    return active.value ? "top-0.5 left-4.5" : "top-0.5 left-0.5";
});

const colorMap: Record<string, string> = {
    primary: "bg-primary-500",
    accent: "bg-accent",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
};

const activeBgClass = computed(() => colorMap[props.color] ?? colorMap.primary);
</script>
