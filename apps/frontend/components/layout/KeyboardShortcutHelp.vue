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
                v-if="showHelp"
                class="bg-base-translucent fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm"
                @mousedown.self="showHelp = false"
            >
                <div
                    class="border-line bg-base mx-3 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
                >
                    <div class="mb-5 flex items-center justify-between">
                        <h2 class="text-fg text-lg font-bold">
                            {{ $t("shortcuts.title") }}
                        </h2>
                        <button
                            class="text-fg-faint hover:bg-surface-hover hover:text-fg-dim rounded-xl p-1.5 transition-all"
                            @click="showHelp = false"
                        >
                            <Icon name="lucide:x" class="h-5 w-5" />
                        </button>
                    </div>

                    <!-- Navigation -->
                    <div class="mb-4">
                        <h3
                            class="text-fg-muted mb-2 text-[11px] font-semibold tracking-wider uppercase"
                        >
                            {{ $t("shortcuts.navigation") }}
                        </h3>
                        <div class="space-y-1.5">
                            <div
                                v-for="s in navigationShortcuts"
                                :key="s.key"
                                class="flex items-center justify-between rounded-lg px-2 py-1.5"
                            >
                                <span class="text-fg text-[13px]">{{ $t(s.label) }}</span>
                                <kbd
                                    class="border-line bg-surface-raised text-fg-muted rounded-md border px-2 py-0.5 font-mono text-[12px]"
                                >
                                    {{ s.key }}
                                </kbd>
                            </div>
                        </div>
                    </div>

                    <!-- Actions (page-specific) -->
                    <div v-if="actionShortcuts.length" class="mb-4">
                        <h3
                            class="text-fg-muted mb-2 text-[11px] font-semibold tracking-wider uppercase"
                        >
                            {{ $t("shortcuts.actions") }}
                        </h3>
                        <div class="space-y-1.5">
                            <div
                                v-for="s in actionShortcuts"
                                :key="s.key"
                                class="flex items-center justify-between rounded-lg px-2 py-1.5"
                            >
                                <span class="text-fg text-[13px]">{{ $t(s.label) }}</span>
                                <kbd
                                    class="border-line bg-surface-raised text-fg-muted rounded-md border px-2 py-0.5 font-mono text-[12px]"
                                >
                                    {{ s.key }}
                                </kbd>
                            </div>
                        </div>
                    </div>

                    <!-- General -->
                    <div>
                        <h3
                            class="text-fg-muted mb-2 text-[11px] font-semibold tracking-wider uppercase"
                        >
                            {{ $t("shortcuts.general") }}
                        </h3>
                        <div class="space-y-1.5">
                            <div
                                v-for="s in generalShortcuts"
                                :key="s.key"
                                class="flex items-center justify-between rounded-lg px-2 py-1.5"
                            >
                                <span class="text-fg text-[13px]">{{ $t(s.label) }}</span>
                                <kbd
                                    class="border-line bg-surface-raised text-fg-muted rounded-md border px-2 py-0.5 font-mono text-[12px]"
                                >
                                    {{ s.key }}
                                </kbd>
                            </div>
                            <div class="flex items-center justify-between rounded-lg px-2 py-1.5">
                                <span class="text-fg text-[13px]">{{
                                    $t("shortcuts.closeModal")
                                }}</span>
                                <kbd
                                    class="border-line bg-surface-raised text-fg-muted rounded-md border px-2 py-0.5 font-mono text-[12px]"
                                >
                                    Esc
                                </kbd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
const { allShortcuts, showHelp } = useKeyboardShortcuts();

const navigationShortcuts = computed(() =>
    allShortcuts.value.filter((s) => s.category === "navigation"),
);

const actionShortcuts = computed(() => allShortcuts.value.filter((s) => s.category === "actions"));

const generalShortcuts = computed(() => allShortcuts.value.filter((s) => s.category === "general"));
</script>
