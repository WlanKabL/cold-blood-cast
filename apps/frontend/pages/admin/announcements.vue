<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("admin.announcements.title") }}
            </h1>
            <button
                class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                @click="showCreateModal = true"
            >
                <Icon name="lucide:plus" class="mr-1.5 inline h-4 w-4" />
                {{ $t("admin.announcements.create") }}
            </button>
        </div>

        <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="glass-card space-y-3 p-5">
                <div class="flex items-center gap-2">
                    <UiSkeleton width="56" height="18" rounded="full" />
                    <UiSkeleton width="48" height="18" rounded="full" />
                </div>
                <UiSkeleton width="200" height="14" />
                <UiSkeleton width="100%" height="12" />
                <UiSkeleton width="100" height="11" />
            </div>
        </div>

        <div v-else class="space-y-3">
            <div v-if="!announcements.length" class="glass-card p-8 text-center">
                <p class="text-fg-muted text-[13px]">{{ $t("admin.announcements.empty") }}</p>
            </div>
            <div v-for="ann in announcements" :key="ann.id" class="glass-card p-5">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                :class="typeClass(ann.type)"
                            >
                                {{ typeLabel(ann.type) }}
                            </span>
                            <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                :class="
                                    ann.active
                                        ? 'bg-green-500/15 text-green-400'
                                        : 'bg-gray-500/15 text-gray-400'
                                "
                            >
                                {{ ann.active ? $t("admin.active") : $t("admin.inactive") }}
                            </span>
                            <span
                                v-if="!ann.global"
                                class="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] text-purple-400"
                            >
                                {{ $t("admin.announcements.individual") }}
                            </span>
                        </div>
                        <h3 class="text-fg mt-2 text-[14px] font-semibold">{{ ann.title }}</h3>
                        <p class="text-fg-muted mt-1 text-[12px]">{{ ann.content }}</p>
                        <p class="text-fg-faint mt-2 text-[11px]">
                            {{ new Date(ann.createdAt).toLocaleString() }}
                            <span v-if="ann.expiresAt">
                                · {{ $t("admin.announcements.expires") }}
                                {{ new Date(ann.expiresAt).toLocaleDateString() }}</span
                            >
                        </p>
                    </div>
                    <div class="flex gap-1">
                        <button
                            class="text-fg-faint rounded-lg p-2.5 hover:text-amber-400"
                            @click="handleToggle(ann)"
                        >
                            <Icon
                                :name="ann.active ? 'lucide:eye-off' : 'lucide:eye'"
                                class="h-4 w-4"
                            />
                        </button>
                        <button
                            class="text-fg-faint rounded-lg p-2.5 hover:text-red-400"
                            @click="handleDelete(ann.id)"
                        >
                            <Icon name="lucide:trash-2" class="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Modal -->
        <Teleport to="body">
            <Transition name="fade">
                <div
                    v-if="showCreateModal"
                    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    @click.self="showCreateModal = false"
                >
                    <div class="glass-card w-full max-w-lg p-6">
                        <h2 class="text-fg mb-4 text-lg font-semibold">
                            {{ $t("admin.announcements.create") }}
                        </h2>
                        <div class="space-y-3">
                            <input
                                v-model="form.title"
                                :placeholder="$t('admin.announcements.titlePlaceholder')"
                                class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                            />
                            <textarea
                                v-model="form.content"
                                :placeholder="$t('admin.announcements.contentPlaceholder')"
                                rows="3"
                                class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                            />
                            <div class="flex flex-col gap-3 sm:flex-row">
                                <select
                                    v-model="form.type"
                                    class="border-line text-fg flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                                >
                                    <option value="info">
                                        {{ $t("admin.announcements.typeInfo") }}
                                    </option>
                                    <option value="warning">
                                        {{ $t("admin.announcements.typeWarning") }}
                                    </option>
                                    <option value="success">
                                        {{ $t("admin.announcements.typeSuccess") }}
                                    </option>
                                    <option value="error">
                                        {{ $t("admin.announcements.typeError") }}
                                    </option>
                                </select>
                                <label class="text-fg-muted flex items-center gap-2 text-[13px]">
                                    <input v-model="form.global" type="checkbox" />
                                    {{ $t("admin.announcements.global") }}
                                </label>
                            </div>
                            <div class="flex gap-3">
                                <div class="flex-1">
                                    <label class="text-fg-faint text-[11px]">{{
                                        $t("admin.announcements.startsAt")
                                    }}</label>
                                    <input
                                        v-model="form.startsAt"
                                        type="datetime-local"
                                        class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                                    />
                                </div>
                                <div class="flex-1">
                                    <label class="text-fg-faint text-[11px]">{{
                                        $t("admin.announcements.expiresAt")
                                    }}</label>
                                    <input
                                        v-model="form.expiresAt"
                                        type="datetime-local"
                                        class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 flex justify-end gap-2">
                            <button
                                class="border-line text-fg-muted hover:bg-surface-hover rounded-xl border px-4 py-2 text-[13px]"
                                @click="showCreateModal = false"
                            >
                                {{ $t("admin.cancel") }}
                            </button>
                            <button
                                class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                                @click="handleCreate"
                            >
                                {{ $t("admin.create") }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { Announcement } from "~/types/api";

definePageMeta({ layout: "admin" });

const admin = useAdminApi();
const toast = useAppToast();
const { t } = useI18n();
const queryClient = useQueryClient();

useHead({ title: () => `${t("admin.announcements.title")} — Admin` });

const { data: announcements, isLoading: loading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: () => admin.adminListAnnouncements(),
});

const showCreateModal = ref(false);

const form = reactive({
    title: "",
    content: "",
    type: "info" as string,
    global: true,
    startsAt: "",
    expiresAt: "",
});

function typeLabel(type: string) {
    const key = `admin.announcements.type${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    return t(key);
}

function typeClass(type: string) {
    switch (type) {
        case "warning":
            return "bg-amber-500/15 text-amber-400";
        case "error":
            return "bg-red-500/15 text-red-400";
        case "success":
            return "bg-green-500/15 text-green-400";
        default:
            return "bg-primary-500/15 text-primary-400";
    }
}

async function handleCreate() {
    await admin.createAnnouncement({
        title: form.title,
        content: form.content,
        type: form.type,
        global: form.global,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
    });
    showCreateModal.value = false;
    toast.add({ title: t("admin.announcements.created"), color: "green", timeout: 3000 });
    Object.assign(form, {
        title: "",
        content: "",
        type: "info",
        global: true,
        startsAt: "",
        expiresAt: "",
    });
    await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
}

async function handleToggle(ann: Announcement) {
    await admin.updateAnnouncement(ann.id, { active: !ann.active });
    await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
}

async function handleDelete(id: string) {
    if (!confirm(t("admin.announcements.confirmDelete"))) return;
    await admin.deleteAnnouncement(id);
    toast.add({ title: t("admin.announcements.deleted"), color: "green", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
}
</script>
