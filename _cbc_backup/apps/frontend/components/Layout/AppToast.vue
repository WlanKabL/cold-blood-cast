<template>
    <Teleport to="body">
        <div class="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
            <TransitionGroup
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="translate-x-full opacity-0"
                enter-to-class="translate-x-0 opacity-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="translate-x-0 opacity-100"
                leave-to-class="translate-x-full opacity-0"
            >
                <div
                    v-for="toast in toasts"
                    :key="toast.id"
                    class="pointer-events-auto w-80 rounded-lg border p-4 backdrop-blur-xl"
                    :class="toastClasses(toast.color)"
                >
                    <div class="flex items-start gap-3">
                        <Icon :name="toastIcon(toast.color)" class="mt-0.5 h-4 w-4 shrink-0" />
                        <div class="flex-1">
                            <p class="text-sm font-medium">{{ toast.title }}</p>
                            <p v-if="toast.description" class="mt-1 text-xs opacity-80">
                                {{ toast.description }}
                            </p>
                        </div>
                        <button
                            class="shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
                            @click="removeToast(toast.id)"
                        >
                            <Icon name="lucide:x" class="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
const { toasts, remove: removeToast } = useAppToast();

function toastClasses(color: string): string {
    const map: Record<string, string> = {
        green: "border-green-500/30 bg-green-500/10 text-green-400",
        red: "border-red-500/30 bg-red-500/10 text-red-400",
        amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    };
    return map[color] ?? "border-blue-500/30 bg-blue-500/10 text-blue-400";
}

function toastIcon(color: string): string {
    const map: Record<string, string> = {
        green: "lucide:check-circle",
        red: "lucide:alert-circle",
        amber: "lucide:alert-triangle",
        blue: "lucide:info",
    };
    return map[color] ?? "lucide:info";
}
</script>
