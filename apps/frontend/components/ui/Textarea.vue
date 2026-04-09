<template>
    <div>
        <label v-if="label" class="text-fg-dim mb-1.5 block text-[13px] font-medium">
            {{ label }}
        </label>
        <textarea
            ref="textareaRef"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :required="required"
            :rows="rows"
            :class="[baseClass, sizeClass, accentClass, stateClass]"
            v-bind="$attrs"
            @input="onInput"
            @focus="$emit('focus', $event)"
            @blur="$emit('blur', $event)"
        />
        <p v-if="hint" class="text-fg-faint mt-1 text-[11px]">{{ hint }}</p>
        <p v-if="error" class="mt-1 text-[11px] text-red-400">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue?: string;
    placeholder?: string;
    label?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    rows?: number;
    /** Visual size: default form field or compact filter */
    size?: "default" | "compact";
    /** Focus accent color — matches feature theme */
    accent?: "primary" | "purple" | "amber" | "emerald" | "violet" | "cyan";
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: "",
    placeholder: undefined,
    label: undefined,
    hint: undefined,
    error: undefined,
    disabled: false,
    readonly: false,
    required: false,
    rows: 3,
    size: "default",
    accent: "primary",
});

const emit = defineEmits<{
    "update:modelValue": [value: string];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
}>();

const textareaRef = ref<HTMLTextAreaElement>();

const baseClass =
    "w-full border bg-surface text-fg placeholder-fg-ghost outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 resize-none";

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

function onInput(e: Event) {
    emit("update:modelValue", (e.target as HTMLTextAreaElement).value);
}

defineExpose({ focus: () => textareaRef.value?.focus(), el: textareaRef });
</script>

<script lang="ts">
export default { inheritAttrs: false };
</script>
