<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div />
            <button
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                @click="showCreate = true"
            >
                {{ $t("admin.announcements.create") }}
            </button>
        </div>

        <!-- Announcements List -->
        <div class="space-y-4">
            <div v-for="a in announcements" :key="a.id" class="glass-card p-5">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span
                                class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                :class="{
                                    'bg-blue-500/20 text-blue-400': a.type === 'info',
                                    'bg-amber-500/20 text-amber-400': a.type === 'warning',
                                    'bg-red-500/20 text-red-400': a.type === 'critical',
                                    'bg-emerald-500/20 text-emerald-400': a.type === 'success',
                                }"
                            >
                                {{ a.type }}
                            </span>
                            <span
                                v-if="a.global"
                                class="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-400"
                                >{{ $t("admin.announcements.global") }}</span
                            >
                            <span
                                v-if="a.active"
                                class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
                                >{{ $t("common.active") }}</span
                            >
                        </div>
                        <h4 class="mt-2 text-sm font-semibold text-fg">{{ a.title }}</h4>
                        <p class="mt-1 text-sm text-fg-muted">{{ a.content }}</p>
                        <p v-if="a.startsAt || a.expiresAt" class="mt-1 text-xs text-fg-muted">
                            <template v-if="a.startsAt"
                                >{{ $t("admin.announcements.active_from") }}:
                                {{ formatDate(a.startsAt) }}</template
                            >
                            <template v-if="a.startsAt && a.expiresAt"> · </template>
                            <template v-if="a.expiresAt"
                                >{{ $t("admin.announcements.active_until") }}:
                                {{ formatDate(a.expiresAt) }}</template
                            >
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            class="relative h-6 w-11 rounded-full transition"
                            :class="a.active ? 'bg-emerald-600' : 'bg-active'"
                            @click="handleToggle(a)"
                        >
                            <span
                                class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                                :class="a.active ? 'translate-x-5' : 'translate-x-0'"
                            />
                        </button>
                        <button
                            class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                            @click="handleDelete(a.id)"
                        >
                            {{ $t("common.delete") }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <p v-if="announcements.length === 0" class="py-12 text-center text-fg-muted">
            {{ $t("common.no_data") }}
        </p>

        <!-- Create Modal -->
        <Teleport to="body">
            <div
                v-if="showCreate"
                class="fixed inset-0 z-50 flex items-center justify-center bg-overlay"
                @click.self="showCreate = false"
            >
                <div class="w-full max-w-md glass-card p-6 shadow-xl">
                    <h3 class="mb-4 text-lg font-bold text-fg">
                        {{ $t("admin.announcements.create") }}
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.announcements.title_label")
                            }}</label>
                            <input
                                v-model="createForm.title"
                                type="text"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.announcements.content")
                            }}</label>
                            <textarea
                                v-model="createForm.content"
                                rows="3"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.announcements.type")
                            }}</label>
                            <select
                                v-model="createForm.type"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                                <option value="success">Success</option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.announcements.expires")
                            }}</label>
                            <input
                                v-model="createForm.expiresAt"
                                type="datetime-local"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.announcements.starts_at")
                            }}</label>
                            <input
                                v-model="createForm.startsAt"
                                type="datetime-local"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div class="flex items-center gap-3">
                            <label class="text-sm font-medium text-fg">{{
                                $t("admin.announcements.global")
                            }}</label>
                            <button
                                class="relative h-6 w-11 rounded-full transition"
                                :class="createForm.global ? 'bg-emerald-600' : 'bg-active'"
                                @click="createForm.global = !createForm.global"
                            >
                                <span
                                    class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                                    :class="createForm.global ? 'translate-x-5' : 'translate-x-0'"
                                />
                            </button>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button
                            class="rounded-lg border border-line px-4 py-2 text-sm text-fg-muted transition hover:bg-hover"
                            @click="showCreate = false"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                            @click="handleCreate"
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
useSeoMeta({ title: "Announcements — Admin — Cold Blood Cast" });

const { t } = useI18n();
const admin = useAdmin();
const queryClient = useQueryClient();

const showCreate = ref(false);
const createForm = ref({
    title: "",
    content: "",
    type: "info",
    global: true,
    startsAt: "",
    expiresAt: "",
});

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: string;
    active: boolean;
    global: boolean;
    startsAt: string | null;
    expiresAt: string | null;
}

const { data: announcementsData } = useQuery<Announcement[]>({
    queryKey: ["admin", "announcements"],
    queryFn: () => admin.listAnnouncements(),
});

const announcements = computed(() => announcementsData.value ?? []);

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
}

async function handleToggle(a: Announcement) {
    await admin.updateAnnouncement(a.id, { active: !a.active });
    queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
}

async function handleCreate() {
    const payload: Record<string, unknown> = {
        title: createForm.value.title,
        content: createForm.value.content,
        type: createForm.value.type,
        global: createForm.value.global,
    };
    if (createForm.value.startsAt)
        payload.startsAt = new Date(createForm.value.startsAt).toISOString();
    if (createForm.value.expiresAt)
        payload.expiresAt = new Date(createForm.value.expiresAt).toISOString();
    await admin.createAnnouncement(payload);
    showCreate.value = false;
    createForm.value = { title: "", content: "", type: "info", global: true, startsAt: "", expiresAt: "" };
    queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
}

async function handleDelete(id: string) {
    if (!confirm(t("admin.announcements.confirm_delete"))) return;
    await admin.deleteAnnouncement(id);
    queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
}
</script>
