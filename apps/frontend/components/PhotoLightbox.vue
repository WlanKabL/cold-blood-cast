<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="show"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
                @click.self="$emit('close')"
                @keydown.escape="$emit('close')"
                @keydown.left="$emit('prev')"
                @keydown.right="$emit('next')"
            >
                <!-- Close -->
                <button
                    class="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                    @click="$emit('close')"
                >
                    <Icon name="lucide:x" class="h-5 w-5" />
                </button>

                <!-- Prev -->
                <button
                    v-if="hasPrev"
                    class="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                    @click="$emit('prev')"
                >
                    <Icon name="lucide:chevron-left" class="h-6 w-6" />
                </button>

                <!-- Image -->
                <div class="flex max-h-[90vh] max-w-[90vw] flex-col items-center">
                    <img
                        :src="src"
                        :alt="caption || 'Photo'"
                        class="max-h-[80vh] max-w-full rounded-lg object-contain"
                    />
                    <div v-if="caption || takenAt || tags.length" class="mt-3 text-center">
                        <p v-if="caption" class="text-sm text-white/90">{{ caption }}</p>
                        <p v-if="takenAt" class="mt-0.5 text-xs text-white/50">
                            {{ new Date(takenAt).toLocaleDateString() }}
                        </p>
                        <div v-if="tags.length" class="mt-1.5 flex justify-center gap-1.5">
                            <span
                                v-for="tag in tags"
                                :key="tag"
                                class="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70"
                            >
                                {{ tag }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Next -->
                <button
                    v-if="hasNext"
                    class="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                    @click="$emit('next')"
                >
                    <Icon name="lucide:chevron-right" class="h-6 w-6" />
                </button>

                <!-- Counter -->
                <div
                    v-if="total > 1"
                    class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                >
                    {{ current + 1 }} / {{ total }}
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
interface Props {
    show: boolean;
    src: string;
    caption?: string;
    takenAt?: string;
    tags?: string[];
    current?: number;
    total?: number;
    hasPrev?: boolean;
    hasNext?: boolean;
}

withDefaults(defineProps<Props>(), {
    caption: "",
    takenAt: "",
    tags: () => [],
    current: 0,
    total: 0,
    hasPrev: false,
    hasNext: false,
});

defineEmits<{
    close: [];
    prev: [];
    next: [];
}>();
</script>
