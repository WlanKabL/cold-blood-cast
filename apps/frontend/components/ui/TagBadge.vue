<template>
    <span
        class="inline-flex items-center gap-1 font-medium"
        :class="[sizeClass, colorClass, removable ? 'pr-1' : '']"
    >
        <span
            v-if="color"
            class="shrink-0 rounded-full"
            :class="dotSize"
            :style="{ backgroundColor: color }"
        />
        <span class="truncate">{{ name }}</span>
        <button
            v-if="removable"
            type="button"
            class="hover:text-primary-200 shrink-0 rounded-full p-0.5 transition-colors"
            @click.stop="$emit('remove')"
        >
            <Icon name="lucide:x" :class="iconSize" />
        </button>
    </span>
</template>

<script setup lang="ts">
interface Props {
    name: string;
    /** Optional hex color for a dot indicator */
    color?: string;
    /** Whether to show a remove (X) button */
    removable?: boolean;
    /** Visual size */
    size?: "sm" | "md";
}

const props = withDefaults(defineProps<Props>(), {
    color: undefined,
    removable: false,
    size: "md",
});

defineEmits<{ remove: [] }>();

const sizeClass = computed(() =>
    props.size === "sm"
        ? "rounded-md bg-primary-500/10 px-1.5 py-0.5 text-[10px] text-primary-400"
        : "rounded-lg bg-primary-500/10 px-2 py-1 text-[11px] text-primary-400",
);

const dotSize = computed(() => (props.size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"));
const iconSize = computed(() => (props.size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"));

const colorClass = "";
</script>
