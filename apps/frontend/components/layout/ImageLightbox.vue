<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="url"
                ref="overlayRef"
                class="bg-page-translucent/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
                tabindex="-1"
                @click="$emit('close')"
                @keydown.escape="$emit('close')"
            >
                <button
                    class="bg-surface/80 text-fg-muted hover:bg-surface hover:text-fg absolute top-4 right-4 rounded-full p-2 transition-colors"
                    @click.stop="$emit('close')"
                >
                    <Icon name="lucide:x" class="h-5 w-5" />
                </button>
                <img
                    :src="url"
                    :alt="alt"
                    class="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
                    @click.stop
                />
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
    url: string | null;
    alt?: string;
}>();

defineEmits<{
    close: [];
}>();

const overlayRef = ref<HTMLDivElement>();

watch(
    () => props.url,
    (v) => {
        if (v) nextTick(() => overlayRef.value?.focus());
    },
);
</script>
