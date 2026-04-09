<template>
    <div>
        <label v-if="label" class="text-fg-dim mb-1.5 block text-[13px] font-medium">
            {{ label }}
        </label>
        <div class="relative">
            <div
                v-if="$slots.leading"
                class="text-fg-faint pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
            >
                <slot name="leading" />
            </div>
            <input
                ref="inputRef"
                :value="modelValue"
                :type="type"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                :required="required"
                :min="min"
                :max="max"
                :step="step"
                :autocomplete="autocomplete"
                :inputmode="inputmode"
                :class="[
                    baseClass,
                    sizeClass,
                    accentClass,
                    stateClass,
                    $slots.leading ? 'pl-9' : '',
                    $slots.trailing ? 'pr-9' : '',
                ]"
                v-bind="$attrs"
                @input="onInput"
                @focus="$emit('focus', $event)"
                @blur="$emit('blur', $event)"
            />
            <div v-if="$slots.trailing" class="absolute inset-y-0 right-0 flex items-center pr-3">
                <slot name="trailing" />
            </div>
        </div>
        <p v-if="hint" class="text-fg-faint mt-1 text-[11px]">{{ hint }}</p>
        <p v-if="error" class="mt-1 text-[11px] text-red-400">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue?: string | number | null;
    type?: string;
    placeholder?: string;
    label?: string;
    hint?: string;
    error?: string;
    /** Amber warning border state (non-blocking, informational) */
    warning?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    autocomplete?: string;
    inputmode?: "email" | "text" | "search" | "url" | "numeric" | "decimal" | "tel" | "none";
    /** Visual size: default form field or compact filter */
    size?: "default" | "compact";
    /** Focus accent color — matches feature theme */
    accent?: "primary" | "purple" | "amber" | "emerald" | "violet" | "cyan";
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: "",
    type: "text",
    placeholder: undefined,
    label: undefined,
    hint: undefined,
    error: undefined,
    warning: false,
    disabled: false,
    readonly: false,
    required: false,
    min: undefined,
    max: undefined,
    step: undefined,
    autocomplete: undefined,
    inputmode: undefined,
    size: "default",
    accent: "primary",
});

const emit = defineEmits<{
    "update:modelValue": [value: string | number];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
}>();

const inputRef = ref<HTMLInputElement>();

const baseClass =
    "w-full border bg-surface text-fg placeholder-fg-ghost outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

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

const accentClass = computed(() => {
    if (props.error) return "focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30";
    if (props.warning) return "focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30";
    return accentMap[props.accent] ?? accentMap.primary;
});

const stateClass = computed(() => {
    if (props.error) return "border-red-500/60";
    if (props.warning) return "border-amber-500/40";
    return "";
});

function onInput(e: Event) {
    const target = e.target as HTMLInputElement;
    emit("update:modelValue", props.type === "number" ? target.valueAsNumber : target.value);
}

defineExpose({ focus: () => inputRef.value?.focus(), el: inputRef });
</script>

<script lang="ts">
export default { inheritAttrs: false };
</script>
