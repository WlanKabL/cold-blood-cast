<template>
    <div
        class="border-line flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed"
        :class="paddingClass"
    >
        <div
            v-if="icon"
            class="flex items-center justify-center rounded-2xl"
            :class="[iconContainerSizeClass, iconContainerColorClass]"
        >
            <Icon :name="icon" :class="[iconSizeClass, iconColorClass]" />
        </div>
        <div class="text-center">
            <p v-if="title" class="text-fg-muted text-[14px] font-medium">
                {{ title }}
            </p>
            <p v-if="description" class="text-fg-faint mt-1 text-[12px]">
                {{ description }}
            </p>
        </div>
        <slot />
    </div>
</template>

<script setup lang="ts">
type EmptyStateColor = "primary" | "purple" | "amber" | "emerald" | "red" | "zinc";
type EmptyStateSize = "sm" | "md" | "lg";

interface Props {
    icon?: string;
    iconColor?: EmptyStateColor;
    title?: string;
    description?: string;
    size?: EmptyStateSize;
}

const props = withDefaults(defineProps<Props>(), {
    icon: undefined,
    iconColor: "primary",
    title: undefined,
    description: undefined,
    size: "md",
});

const ICON_CONTAINER_COLOR: Record<EmptyStateColor, string> = {
    primary: "bg-primary-500/10",
    purple: "bg-purple-500/10",
    amber: "bg-amber-500/10",
    emerald: "bg-emerald-500/10",
    red: "bg-red-500/10",
    zinc: "bg-surface-raised",
};

const ICON_COLOR: Record<EmptyStateColor, string> = {
    primary: "text-primary-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
    zinc: "text-fg-faint",
};

const iconContainerColorClass = computed(() => ICON_CONTAINER_COLOR[props.iconColor]);
const iconColorClass = computed(() => ICON_COLOR[props.iconColor]);

const iconContainerSizeClass = computed(() => {
    const sizes: Record<EmptyStateSize, string> = {
        sm: "h-10 w-10",
        md: "h-14 w-14",
        lg: "h-16 w-16",
    };
    return sizes[props.size];
});

const iconSizeClass = computed(() => {
    const sizes: Record<EmptyStateSize, string> = {
        sm: "h-5 w-5",
        md: "h-7 w-7",
        lg: "h-8 w-8",
    };
    return sizes[props.size];
});

const paddingClass = computed(() => {
    const sizes: Record<EmptyStateSize, string> = {
        sm: "py-10 px-6",
        md: "py-20 px-6",
        lg: "py-24 px-8",
    };
    return sizes[props.size];
});
</script>
