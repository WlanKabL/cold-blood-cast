<template>
    <div
        class="bg-surface-2 animate-pulse"
        :class="[roundedClass, customClass]"
        :style="dimensionStyle"
    />
</template>

<script setup lang="ts">
type RoundedVariant = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

interface Props {
    /** CSS width value (e.g. '100px', '80%', '20') — numbers treated as px */
    width?: string;
    /** CSS height value (e.g. '16px', '4') — numbers treated as px */
    height?: string;
    /** Border radius variant */
    rounded?: RoundedVariant;
    /** Additional Tailwind classes */
    class?: string;
}

const props = withDefaults(defineProps<Props>(), {
    width: undefined,
    height: "16",
    rounded: "md",
    class: undefined,
});

const ROUNDED_MAP: Record<RoundedVariant, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
};

const roundedClass = computed(() => ROUNDED_MAP[props.rounded]);
const customClass = computed(() => props.class);

function toCss(value: string | undefined): string | undefined {
    if (!value) return undefined;
    // If it's purely numeric, append "px"
    return /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
}

const dimensionStyle = computed(() => ({
    width: toCss(props.width),
    height: toCss(props.height),
}));
</script>
