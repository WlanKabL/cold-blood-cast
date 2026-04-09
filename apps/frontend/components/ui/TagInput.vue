<template>
    <div class="space-y-2">
        <!-- Selected tags (above input) -->
        <div v-if="!inline && modelValue.length > 0" class="flex flex-wrap gap-1.5">
            <UiTagBadge
                v-for="tag in modelValue"
                :key="tag"
                :name="tag"
                :color="getTagColor(tag)"
                removable
                @remove="removeTag(tag)"
            />
        </div>

        <!-- Input wrapper -->
        <div ref="containerRef" class="relative">
            <!-- Inline mode: chips + input in one row (filter-style) -->
            <div
                v-if="inline"
                class="border-line bg-surface focus-within:border-primary-500/50 flex min-h-7.5 cursor-text flex-wrap items-center gap-1 rounded-lg border px-2 py-1"
                @click="focusInput"
            >
                <UiTagBadge
                    v-for="tag in modelValue"
                    :key="tag"
                    :name="tag"
                    :color="getTagColor(tag)"
                    size="sm"
                    removable
                    @remove="removeTag(tag)"
                />
                <input
                    ref="inputRef"
                    v-model="input"
                    type="text"
                    class="text-fg placeholder-fg-ghost min-w-12 flex-1 bg-transparent text-[12px] outline-none"
                    :placeholder="modelValue.length === 0 ? resolvedPlaceholder : ''"
                    @focus="open = true"
                    @keydown.enter.prevent="handleEnter"
                    @keydown.escape="open = false"
                />
            </div>

            <!-- Standard mode: full-width input -->
            <input
                v-else
                ref="inputRef"
                v-model="input"
                type="text"
                :placeholder="resolvedPlaceholder"
                class="border-line bg-surface text-fg placeholder-fg-ghost focus:border-primary-500/50 focus:ring-primary-500/30 w-full rounded-xl border px-4 py-2.5 text-[13px] transition-all duration-200 outline-none focus:ring-1"
                @focus="open = true"
                @keydown.enter.prevent="handleEnter"
                @keydown.escape="open = false"
            />

            <!-- Dropdown -->
            <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="translate-y-1 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div
                    v-if="open && (filteredTags.length > 0 || canCreate)"
                    class="border-line bg-base absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border shadow-2xl"
                >
                    <button
                        v-for="tag in filteredTags"
                        :key="tag.name"
                        type="button"
                        class="text-fg-muted hover:bg-surface-hover hover:text-fg flex w-full items-center px-3 text-left text-[12px] transition-colors duration-100"
                        :class="inline ? 'py-1.5' : 'py-2.5 sm:py-2'"
                        @mousedown.prevent="toggleTag(tag.name)"
                    >
                        <span
                            v-if="tag.color"
                            class="mr-2 h-2 w-2 shrink-0 rounded-full"
                            :style="{ backgroundColor: tag.color }"
                        />
                        <Icon
                            v-else
                            :name="
                                modelValue.includes(tag.name)
                                    ? 'lucide:check-square'
                                    : 'lucide:square'
                            "
                            class="mr-2 h-3.5 w-3.5 shrink-0"
                            :class="
                                modelValue.includes(tag.name) ? 'text-primary-400' : 'text-fg-ghost'
                            "
                        />
                        {{ tag.name }}
                    </button>

                    <!-- Create new tag row -->
                    <button
                        v-if="canCreate"
                        type="button"
                        class="border-line text-primary-400 hover:bg-surface-hover flex w-full items-center gap-2 border-t px-3 py-2 text-left text-[12px] transition-colors duration-100"
                        :class="{ 'border-t-0': filteredTags.length === 0 }"
                        :disabled="creating"
                        @mousedown.prevent="createAndAdd"
                    >
                        <Icon
                            :name="creating ? 'svg-spinners:ring-resize' : 'lucide:plus'"
                            class="h-3.5 w-3.5 shrink-0"
                        />
                        <span>{{
                            $t("components.tagSelect.createTag", { name: input.trim() })
                        }}</span>
                    </button>
                </div>
            </Transition>
        </div>

        <!-- Hint text -->
        <p v-if="hint" class="text-fg-faint text-[11px]">{{ hint }}</p>
    </div>
</template>

<script setup lang="ts">
import type { Tag } from "~/types/api";

interface Props {
    modelValue: string[];
    /** Tag category to fetch — omit to fetch all */
    category?: string;
    /** Allow creating new tags inline (default: true) */
    allowCreate?: boolean;
    /** Compact inline mode (chips + input in one row, for filters) */
    inline?: boolean;
    placeholder?: string;
    hint?: string;
}

const props = withDefaults(defineProps<Props>(), {
    category: "general",
    allowCreate: true,
    inline: false,
    placeholder: undefined,
    hint: undefined,
});

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const { t } = useI18n();
const resolvedPlaceholder = computed(
    () => props.placeholder ?? t("components.tagSelect.placeholder"),
);

const containerRef = ref<HTMLElement>();
const inputRef = ref<HTMLInputElement>();
const input = ref("");
const open = ref(false);
const creating = ref(false);

const { tags, fetchTags, createTag } = useTags();

/** Tags filtered by category, then by search input */
const categoryTags = computed<Tag[]>(() => {
    if (!props.category) return tags.value;
    return tags.value.filter((t) => t.category === props.category);
});

const filteredTags = computed<Tag[]>(() => {
    const q = input.value.toLowerCase();
    return categoryTags.value.filter(
        (t) => (!q || t.name.toLowerCase().includes(q)) && !props.modelValue.includes(t.name),
    );
});

/** Show "create" row when allowCreate is on and input doesn't match any tag */
const canCreate = computed(() => {
    if (!props.allowCreate) return false;
    const q = input.value.trim();
    return (
        q.length > 0 && !categoryTags.value.some((t) => t.name.toLowerCase() === q.toLowerCase())
    );
});

function getTagColor(name: string): string | undefined {
    return categoryTags.value.find((t) => t.name === name)?.color ?? undefined;
}

function toggleTag(tag: string) {
    if (props.modelValue.includes(tag)) {
        emit(
            "update:modelValue",
            props.modelValue.filter((t) => t !== tag),
        );
    } else {
        emit("update:modelValue", [...props.modelValue, tag]);
    }
    input.value = "";
}

function removeTag(tag: string) {
    emit(
        "update:modelValue",
        props.modelValue.filter((t) => t !== tag),
    );
}

function handleEnter() {
    if (canCreate.value) {
        createAndAdd();
    } else if (filteredTags.value.length > 0 && filteredTags.value[0]) {
        toggleTag(filteredTags.value[0].name);
    }
}

async function createAndAdd() {
    const name = input.value.trim();
    if (!name || creating.value) return;
    creating.value = true;
    try {
        await createTag(name, props.category || "general");
        await fetchTags(props.category || undefined);
        emit("update:modelValue", [...props.modelValue, name]);
        input.value = "";
        open.value = false;
    } finally {
        creating.value = false;
    }
}

function focusInput() {
    inputRef.value?.focus();
}

onClickOutside(containerRef, () => {
    open.value = false;
});
</script>
