<template>
    <span
        class="inline-flex items-center gap-1 font-medium"
        :class="[sizeClass, colorClasses, roundedClass]"
    >
        <span v-if="dot" class="shrink-0 rounded-full" :class="[dotSizeClass, dotColorClass]" />
        <Icon v-if="icon" :name="icon" :class="iconSizeClass" />
        <slot />
    </span>
</template>

<script setup lang="ts">
export type BadgeColor =
    | "emerald"
    | "amber"
    | "primary"
    | "violet"
    | "zinc"
    | "purple"
    | "red"
    | "blue"
    | "orange";

export type BadgeSize = "sm" | "md" | "lg";

interface Props {
    color?: BadgeColor;
    size?: BadgeSize;
    icon?: string;
    dot?: boolean;
    uppercase?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    color: "zinc",
    size: "sm",
    icon: undefined,
    dot: false,
    uppercase: false,
});

const COLOR_MAP: Record<BadgeColor, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    primary: "bg-primary-500/10 text-primary-400",
    violet: "bg-violet-500/10 text-violet-400",
    zinc: "bg-zinc-500/10 text-zinc-400",
    purple: "bg-purple-500/10 text-purple-400",
    red: "bg-red-500/10 text-red-400",
    blue: "bg-blue-500/10 text-blue-400",
    orange: "bg-orange-500/10 text-orange-400",
};

const DOT_COLOR_MAP: Record<BadgeColor, string> = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    primary: "bg-primary-400",
    violet: "bg-violet-400",
    zinc: "bg-zinc-400",
    purple: "bg-purple-400",
    red: "bg-red-400",
    blue: "bg-blue-400",
    orange: "bg-orange-400",
};

const colorClasses = computed(() => COLOR_MAP[props.color]);
const dotColorClass = computed(() => DOT_COLOR_MAP[props.color]);

const sizeClass = computed(() => {
    const base = props.uppercase ? "uppercase tracking-wider " : "";
    const sizes: Record<BadgeSize, string> = {
        sm: `${base}px-2 py-0.5 text-[10px]`,
        md: `${base}px-2.5 py-0.5 text-[11px]`,
        lg: `${base}px-3 py-1 text-[12px]`,
    };
    return sizes[props.size];
});

const roundedClass = "rounded-full";

const dotSizeClass = computed(() => {
    const sizes: Record<BadgeSize, string> = {
        sm: "h-1.5 w-1.5",
        md: "h-2 w-2",
        lg: "h-2 w-2",
    };
    return sizes[props.size];
});

const iconSizeClass = computed(() => {
    const sizes: Record<BadgeSize, string> = {
        sm: "h-3 w-3",
        md: "h-3.5 w-3.5",
        lg: "h-4 w-4",
    };
    return sizes[props.size];
});
</script>
