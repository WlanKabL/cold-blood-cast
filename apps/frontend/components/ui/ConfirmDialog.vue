<template>
    <UiModal :show="show" width="sm" @close="$emit('cancel')">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="flex h-10 w-10 items-center justify-center rounded-full"
                    :class="iconBgClass"
                >
                    <Icon :name="resolvedIcon" class="h-5 w-5" :class="iconColorClass" />
                </div>
                <h3 class="text-fg text-[16px] font-semibold">{{ title }}</h3>
            </div>
        </template>

        <p v-if="message" class="text-fg-muted mb-5 text-[13px]">{{ message }}</p>
        <slot />

        <div class="mt-5 flex justify-end gap-3">
            <button
                class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg rounded-xl border px-4 py-2 text-[13px] transition-all"
                @click="$emit('cancel')"
            >
                {{ cancelLabel }}
            </button>
            <button
                :disabled="loading || confirmDisabled"
                class="rounded-xl px-4 py-2 text-[13px] font-medium text-white transition-all disabled:opacity-50"
                :class="confirmBtnClass"
                @click="$emit('confirm')"
            >
                <Icon
                    v-if="loading"
                    name="lucide:loader-2"
                    class="mr-1.5 inline h-4 w-4 animate-spin"
                />
                {{ confirmLabel }}
            </button>
        </div>
    </UiModal>
</template>

<script setup lang="ts">
interface Props {
    show?: boolean;
    title: string;
    message?: string;
    icon?: string;
    /** Visual variant — 'danger' for destructive actions, 'default' for neutral confirmations */
    variant?: "default" | "danger";
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    confirmDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    show: true,
    message: undefined,
    icon: undefined,
    variant: "default",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    loading: false,
    confirmDisabled: false,
});

defineEmits<{
    confirm: [];
    cancel: [];
}>();

const resolvedIcon = computed(() => {
    if (props.icon) return props.icon;
    return props.variant === "danger" ? "lucide:alert-triangle" : "lucide:info";
});

const iconBgClass = computed(() =>
    props.variant === "danger" ? "bg-red-500/10" : "bg-primary-500/10",
);

const iconColorClass = computed(() =>
    props.variant === "danger" ? "text-red-400" : "text-primary-400",
);

const confirmBtnClass = computed(() =>
    props.variant === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-accent hover:bg-accent/90",
);
</script>
