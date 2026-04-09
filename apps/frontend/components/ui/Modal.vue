<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="show"
                class="bg-base-translucent fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
                @mousedown.self="$emit('close')"
            >
                <div
                    class="border-line bg-base relative mx-3 w-full overflow-y-auto rounded-2xl border shadow-2xl sm:mx-0"
                    :class="[maxWidthClass, maxHeightClass, paddingClass]"
                >
                    <!-- Header -->
                    <div
                        v-if="title || $slots.header"
                        class="mb-6 flex items-center justify-between"
                    >
                        <slot name="header">
                            <h2 class="text-fg text-xl font-bold tracking-tight">{{ title }}</h2>
                        </slot>
                        <button
                            class="text-fg-faint hover:bg-surface-hover hover:text-fg-dim rounded-xl p-1.5 transition-all duration-200"
                            @click="$emit('close')"
                        >
                            <Icon name="lucide:x" class="h-5 w-5" />
                        </button>
                    </div>

                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
interface Props {
    show?: boolean;
    title?: string;
    /** Max width variant */
    width?: "sm" | "md" | "lg" | "xl";
}

const props = withDefaults(defineProps<Props>(), {
    show: true,
    title: undefined,
    width: "md",
});

const emit = defineEmits<{ close: [] }>();

const widthMap: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

const maxWidthClass = computed(() => widthMap[props.width] ?? widthMap.md);
const maxHeightClass = "max-h-[90vh]";
const paddingClass = "p-4 sm:p-6";

// Close on Escape
function handleEscape(e: KeyboardEvent) {
    if (e.key === "Escape" && props.show) {
        e.stopPropagation();
        emit("close");
    }
}

onMounted(() => document.addEventListener("keydown", handleEscape));
onUnmounted(() => document.removeEventListener("keydown", handleEscape));
</script>
