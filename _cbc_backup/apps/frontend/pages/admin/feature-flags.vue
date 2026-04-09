<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div />
            <UButton icon="i-lucide-plus" @click="openCreateModal">
                {{ $t("admin.feature_flags.create") }}
            </UButton>
        </div>

        <!-- Grouped Feature Flags -->
        <template v-for="(flags, category) in groupedFlags" :key="category">
            <div class="glass-card p-6">
                <h3 class="mb-4 text-base font-semibold capitalize text-fg">{{ category }}</h3>
                <div class="space-y-3">
                    <div
                        v-for="flag in flags"
                        :key="flag.id"
                        class="flex items-center justify-between rounded-lg border border-line p-3"
                    >
                        <div class="flex-1 cursor-pointer" @click="openEditModal(flag)">
                            <p class="text-sm font-medium text-fg">{{ flag.name }}</p>
                            <p class="text-xs text-fg-muted">{{ flag.key }}</p>
                            <p v-if="flag.description" class="mt-0.5 text-xs text-fg-soft">
                                {{ flag.description }}
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                class="relative h-6 w-11 rounded-full transition"
                                :class="flag.enabled ? 'bg-emerald-600' : 'bg-active'"
                                @click="handleToggle(flag.id)"
                            >
                                <span
                                    class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                                    :class="flag.enabled ? 'translate-x-5' : 'translate-x-0'"
                                />
                            </button>
                            <button
                                class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                                @click="handleDelete(flag)"
                            >
                                {{ $t("common.delete") }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <p v-if="Object.keys(groupedFlags).length === 0" class="py-12 text-center text-fg-muted">
            {{ $t("common.no_data") }}
        </p>

        <!-- Create / Edit Modal -->
        <Teleport to="body">
            <div
                v-if="showModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-overlay"
                @click.self="showModal = false"
            >
                <div class="w-full max-w-md glass-card p-6 shadow-xl">
                    <h3 class="mb-4 text-lg font-bold text-fg">
                        {{
                            editingFlag
                                ? $t("common.edit")
                                : $t("admin.feature_flags.create")
                        }}
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.feature_flags.key")
                            }}</label>
                            <input
                                v-model="form.key"
                                type="text"
                                :disabled="!!editingFlag"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.feature_flags.name")
                            }}</label>
                            <input
                                v-model="form.name"
                                type="text"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.feature_flags.description")
                            }}</label>
                            <input
                                v-model="form.description"
                                type="text"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.feature_flags.category")
                            }}</label>
                            <input
                                v-model="form.category"
                                type="text"
                                placeholder="general"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div class="flex items-center gap-3">
                            <label class="text-sm font-medium text-fg">{{
                                $t("admin.feature_flags.enabled")
                            }}</label>
                            <button
                                class="relative h-6 w-11 rounded-full transition"
                                :class="form.enabled ? 'bg-emerald-600' : 'bg-active'"
                                @click="form.enabled = !form.enabled"
                            >
                                <span
                                    class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                                    :class="form.enabled ? 'translate-x-5' : 'translate-x-0'"
                                />
                            </button>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button
                            class="rounded-lg border border-line px-4 py-2 text-sm text-fg-muted transition hover:bg-hover"
                            @click="showModal = false"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                            @click="handleSave"
                        >
                            {{ $t("common.save") }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Feature Flags — Admin — Cold Blood Cast" });

const { t } = useI18n();
const admin = useAdmin();
const queryClient = useQueryClient();
const toast = useAppToast();

interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description: string | null;
    category: string | null;
    enabled: boolean;
}

const showModal = ref(false);
const editingFlag = ref<FeatureFlag | null>(null);
const form = ref({
    key: "",
    name: "",
    description: "",
    category: "",
    enabled: true,
});

const { data: flagsData } = useQuery<FeatureFlag[]>({
    queryKey: ["admin", "feature-flags"],
    queryFn: () => admin.listFeatureFlags(),
});

const groupedFlags = computed(() => {
    const flags = flagsData.value ?? [];
    const groups: Record<string, FeatureFlag[]> = {};
    for (const flag of flags) {
        const cat = flag.category || "general";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(flag);
    }
    return groups;
});

function openCreateModal() {
    editingFlag.value = null;
    form.value = { key: "", name: "", description: "", category: "", enabled: true };
    showModal.value = true;
}

function openEditModal(flag: FeatureFlag) {
    editingFlag.value = flag;
    form.value = {
        key: flag.key,
        name: flag.name,
        description: flag.description ?? "",
        category: flag.category ?? "",
        enabled: flag.enabled,
    };
    showModal.value = true;
}

function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
}

async function handleToggle(flagId: string) {
    await admin.toggleFeatureFlag(flagId);
    invalidate();
}

async function handleSave() {
    try {
        const payload: Record<string, unknown> = {
            name: form.value.name,
            description: form.value.description || null,
            category: form.value.category || null,
            enabled: form.value.enabled,
        };
        if (editingFlag.value) {
            await admin.updateFeatureFlag(editingFlag.value.id, payload);
        } else {
            payload.key = form.value.key;
            await admin.createFeatureFlag(payload);
        }
        showModal.value = false;
        invalidate();
    } catch {
        toast.error(t("error.generic"));
    }
}

async function handleDelete(flag: FeatureFlag) {
    if (!confirm(t("admin.feature_flags.confirm_delete"))) return;
    try {
        await admin.deleteFeatureFlag(flag.id);
        invalidate();
    } catch {
        toast.error(t("error.generic"));
    }
}
</script>
