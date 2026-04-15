<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("admin.tags.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-[12px]">{{ $t("admin.tags.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreate">
                {{ $t("admin.tags.create") }}
            </UiButton>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-6">
            <div v-for="i in 3" :key="i" class="space-y-3">
                <UiSkeleton width="80" height="13" />
                <div class="glass-card divide-line-faint divide-y">
                    <div
                        v-for="j in 2"
                        :key="j"
                        class="flex items-center justify-between px-5 py-4"
                    >
                        <div class="flex items-center gap-3">
                            <UiSkeleton width="12" height="12" rounded="full" />
                            <UiSkeleton width="100" height="13" />
                        </div>
                        <UiSkeleton width="60" height="24" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div
            v-else-if="!tags?.length"
            class="glass-card flex flex-col items-center justify-center rounded-xl px-6 py-12 text-center"
        >
            <Icon name="lucide:tags" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("admin.tags.empty") }}</p>
        </div>

        <!-- Grouped by category -->
        <template v-else>
            <div v-for="[category, categoryTags] in groupedTags" :key="category" class="space-y-3">
                <h2 class="text-fg-faint text-[13px] font-semibold tracking-wider uppercase">
                    {{ $t(`admin.tags.categories.${category}`) }}
                </h2>
                <div class="glass-card divide-line-faint divide-y">
                    <div
                        v-for="tag in categoryTags"
                        :key="tag.id"
                        class="flex items-center justify-between px-5 py-4"
                    >
                        <div class="flex items-center gap-3">
                            <span
                                class="h-3 w-3 shrink-0 rounded-full"
                                :style="{ background: tag.color || '#6b7280' }"
                            />
                            <span class="text-fg text-[13px] font-medium">{{ tag.name }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                class="text-fg-muted hover:text-fg rounded p-1.5 transition-colors"
                                :title="$t('admin.tags.edit')"
                                @click="openEdit(tag)"
                            >
                                <Icon name="lucide:pencil" class="h-4 w-4" />
                            </button>
                            <button
                                class="rounded p-1.5 text-red-400 transition-colors hover:text-red-300"
                                :title="$t('admin.tags.delete')"
                                @click="confirmDelete(tag)"
                            >
                                <Icon name="lucide:trash-2" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Create / Edit Modal -->
        <UiModal
            :show="showForm"
            :title="editingTag ? $t('admin.tags.edit') : $t('admin.tags.create')"
            @close="showForm = false"
        >
            <form class="space-y-4" @submit.prevent="handleSave">
                <div>
                    <label class="text-fg-muted mb-1 block text-xs font-medium">
                        {{ $t("admin.tags.fields.name") }}
                    </label>
                    <input
                        v-model="form.name"
                        type="text"
                        required
                        maxlength="50"
                        class="glass-card text-fg w-full rounded-lg border-0 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        :placeholder="$t('admin.tags.fields.namePlaceholder')"
                    />
                </div>
                <div>
                    <label class="text-fg-muted mb-1 block text-xs font-medium">
                        {{ $t("admin.tags.fields.category") }}
                    </label>
                    <select
                        v-model="form.category"
                        required
                        class="glass-card text-fg w-full rounded-lg border-0 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option v-for="cat in CATEGORIES" :key="cat" :value="cat">
                            {{ $t(`admin.tags.categories.${cat}`) }}
                        </option>
                    </select>
                </div>
                <div>
                    <label class="text-fg-muted mb-1 block text-xs font-medium">
                        {{ $t("admin.tags.fields.color") }}
                    </label>
                    <div class="flex items-center gap-3">
                        <input
                            v-model="form.color"
                            type="color"
                            class="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
                        />
                        <span class="text-fg-faint text-xs">{{ form.color }}</span>
                    </div>
                </div>
                <div class="flex justify-end gap-3 pt-2">
                    <UiButton variant="ghost" @click="showForm = false">
                        {{ $t("common.cancel") }}
                    </UiButton>
                    <UiButton type="submit" :loading="saving">
                        {{ $t("common.save") }}
                    </UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Delete confirmation -->
        <UiModal
            :show="showDelete"
            :title="$t('admin.tags.confirmDelete')"
            @close="showDelete = false"
        >
            <p class="text-fg-muted text-sm">
                {{ $t("admin.tags.confirmDeleteMsg", { name: deletingTag?.name }) }}
            </p>
            <div class="mt-4 flex justify-end gap-3">
                <UiButton variant="ghost" @click="showDelete = false">
                    {{ $t("common.cancel") }}
                </UiButton>
                <UiButton variant="danger" :loading="deleting" @click="handleDelete">
                    {{ $t("common.delete") }}
                </UiButton>
            </div>
        </UiModal>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";
import type { Tag } from "@cold-blood-cast/shared";

definePageMeta({ layout: "admin" });

const { t } = useI18n();

useHead({ title: () => `${t("admin.tags.title")} — Admin` });

const admin = useAdminApi();
const queryClient = useQueryClient();
const toast = useAppToast();

const CATEGORIES = ["general", "care", "monitoring", "vet", "maintenance", "media", "organization"];

const { data: tags, isLoading: loading } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: () => admin.adminListGlobalTags(),
});

const groupedTags = computed(() => {
    const map = new Map<string, Tag[]>();
    for (const tag of tags.value ?? []) {
        const group = map.get(tag.category) || [];
        group.push(tag);
        map.set(tag.category, group);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => {
            const ia = CATEGORIES.indexOf(a);
            const ib = CATEGORIES.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        })
        .map(
            ([cat, catTags]) =>
                [cat, [...catTags].sort((a, b) => a.name.localeCompare(b.name))] as [string, Tag[]],
        );
});

// ── Form state ───────────────────────────────────
const showForm = ref(false);
const editingTag = ref<Tag | null>(null);
const form = ref({ name: "", category: "general", color: "#6b7280" });

function openCreate() {
    editingTag.value = null;
    form.value = { name: "", category: "general", color: "#6b7280" };
    showForm.value = true;
}

function openEdit(tag: Tag) {
    editingTag.value = tag;
    form.value = { name: tag.name, category: tag.category, color: tag.color || "#6b7280" };
    showForm.value = true;
}

const { mutate: saveTag, isPending: saving } = useMutation({
    mutationFn: async () => {
        if (editingTag.value) {
            return admin.updateGlobalTag(editingTag.value.id, form.value);
        }
        return admin.createGlobalTag(form.value);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
        showForm.value = false;
        toast.success(editingTag.value ? t("admin.tags.saved") : t("admin.tags.created"));
    },
});

function handleSave() {
    saveTag();
}

// ── Delete state ─────────────────────────────────
const showDelete = ref(false);
const deletingTag = ref<Tag | null>(null);

function confirmDelete(tag: Tag) {
    deletingTag.value = tag;
    showDelete.value = true;
}

const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: () => admin.deleteGlobalTag(deletingTag.value!.id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
        showDelete.value = false;
        toast.success(t("admin.tags.deleted"));
    },
});

function handleDelete() {
    doDelete();
}
</script>
