<template>
    <div>
        <label v-if="label" class="text-fg-dim mb-1.5 block text-[13px] font-medium">
            {{ label }}
        </label>
        <select
            ref="selectRef"
            :value="modelValue"
            :disabled="disabled"
            :required="required"
            :class="[baseClass, sizeClass, accentClass, stateClass]"
            v-bind="$attrs"
            @change="onChange"
        >
            <option v-if="placeholderOption" value="" disabled>{{ placeholderOption }}</option>
            <slot />
        </select>
        <p v-if="hint" class="text-fg-faint mt-1 text-[11px]">{{ hint }}</p>
        <p v-if="error" class="mt-1 text-[11px] text-red-400">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue?: string | number | null;
    label?: string;
    hint?: string;
    error?: string;
    placeholderOption?: string;
    disabled?: boolean;
    required?: boolean;
    /** Visual size: default form field or compact filter */
    size?: "default" | "compact";
    /** Focus accent color — matches feature theme */
    accent?: "primary" | "purple" | "amber" | "emerald" | "violet" | "cyan";
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: "",
    label: undefined,
    hint: undefined,
    error: undefined,
    placeholderOption: undefined,
    disabled: false,
    required: false,
    size: "default",
    accent: "primary",
});

const emit = defineEmits<{
    "update:modelValue": [value: string];
    change: [event: Event];
}>();

const selectRef = ref<HTMLSelectElement>();

const baseClass =
    "w-full border bg-surface text-fg outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const sizeClass = computed(() =>
    props.size === "compact"
        ? "rounded-lg border-line px-3 py-1.5 text-[12px]"
        : "rounded-xl border-line px-4 py-2.5 text-[13px]",
);

const accentMap: Record<string, string> = {
    primary: "focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30",
    purple: "focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30",
    amber: "focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30",
    emerald: "focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30",
    violet: "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30",
    cyan: "focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30",
};

const accentClass = computed(() => accentMap[props.accent] ?? accentMap.primary);

const stateClass = computed(() => {
    if (props.error) return "border-red-500/60";
    return "";
});

function onChange(e: Event) {
    emit("update:modelValue", (e.target as HTMLSelectElement).value);
    emit("change", e);
}

defineExpose({ focus: () => selectRef.value?.focus(), el: selectRef });
</script>

<script lang="ts">
export default { inheritAttrs: false };
</script>
