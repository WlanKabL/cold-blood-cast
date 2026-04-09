<template>
    <component
        :is="to ? resolveComponent('NuxtLink') : 'button'"
        :to="to"
        :type="to ? undefined : type"
        :disabled="disabled || loading"
        :class="[baseClass, variantClass, sizeClass, widthClass]"
        v-bind="$attrs"
    >
        <Icon v-if="loading" name="svg-spinners:ring-resize" :class="iconSizeClass" />
        <Icon v-else-if="icon" :name="icon" :class="iconSizeClass" />
        <slot />
    </component>
</template>

<script setup lang="ts">
import { resolveComponent } from "vue";

interface Props {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
    size?: "sm" | "md" | "lg";
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
    type?: "button" | "submit" | "reset";
    to?: string;
}

const props = withDefaults(defineProps<Props>(), {
    variant: "primary",
    size: "md",
    icon: undefined,
    loading: false,
    disabled: false,
    block: false,
    type: "button",
    to: undefined,
});

const baseClass =
    "inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";

const variantClass = computed(() => {
    const variants: Record<string, string> = {
        primary:
            "rounded-xl bg-linear-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 hover:brightness-110",
        secondary:
            "rounded-xl border border-line text-fg-muted hover:bg-surface-hover hover:text-fg",
        danger: "rounded-xl bg-red-500 text-white hover:bg-red-600",
        ghost: "rounded-xl text-fg-muted hover:text-fg hover:bg-surface-hover",
        accent: "rounded-xl bg-accent text-white hover:bg-accent/90",
    };
    return variants[props.variant];
});

const sizeClass = computed(() => {
    const sizes: Record<string, string> = {
        sm: "px-3 py-1.5 text-[12px]",
        md: "px-4 py-2.5 text-[13px]",
        lg: "px-6 py-3 text-[14px]",
    };
    return sizes[props.size];
});

const iconSizeClass = computed(() => {
    const iconSizes: Record<string, string> = {
        sm: "h-3.5 w-3.5",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    };
    return iconSizes[props.size];
});

const widthClass = computed(() => (props.block ? "w-full" : ""));
</script>

<script lang="ts">
export default { inheritAttrs: false };
</script>
