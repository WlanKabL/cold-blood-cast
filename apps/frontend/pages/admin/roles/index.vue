<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("admin.roles.title") }}</h1>
            <button
                class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                @click="showCreateModal = true"
            >
                <Icon name="lucide:plus" class="mr-1.5 inline h-4 w-4" />
                {{ $t("admin.roles.create") }}
            </button>
        </div>

        <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 6" :key="i" class="glass-card space-y-3 p-5">
                <div class="flex items-center gap-2">
                    <UiSkeleton width="12" height="12" rounded="full" />
                    <UiSkeleton width="100" height="14" />
                </div>
                <UiSkeleton width="80%" height="12" />
                <div class="flex items-center justify-between">
                    <UiSkeleton width="60" height="11" />
                    <UiSkeleton width="40" height="11" />
                </div>
            </div>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="role in roles" :key="role.id" class="glass-card p-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="h-3 w-3 rounded-full"
                            :style="{ backgroundColor: role.color || '#6b7280' }"
                        />
                        <div>
                            <p class="text-fg text-[14px] font-semibold">{{ role.displayName }}</p>
                            <p class="text-fg-faint text-[11px]">{{ role.name }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <span
                            v-if="role.isSystem"
                            class="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400"
                        >
                            {{ $t("admin.system") }}
                        </span>
                        <button
                            v-if="!role.isSystem"
                            class="text-fg-faint rounded-lg p-1.5 hover:text-red-400"
                            @click="handleDelete(role.id)"
                        >
                            <Icon name="lucide:trash-2" class="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <p v-if="role.description" class="text-fg-muted mt-2 text-[12px]">
                    {{ role.description }}
                </p>
                <div class="text-fg-faint mt-3 flex items-center justify-between text-[11px]">
                    <span>{{ $t("admin.roles.priority") }}: {{ role.priority }}</span>
                    <NuxtLink
                        :to="`/admin/roles/${role.id}` as any"
                        class="text-primary-400 hover:text-primary-300"
                    >
                        {{ $t("admin.details") }} →
                    </NuxtLink>
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
                    <div class="glass-card w-full max-w-md p-6">
                        <h2 class="text-fg mb-4 text-lg font-semibold">
                            {{ $t("admin.roles.create") }}
                        </h2>
                        <div class="space-y-3">
                            <input
                                v-model="form.name"
                                :placeholder="$t('admin.roles.namePlaceholder')"
                                class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                            />
                            <input
                                v-model="form.displayName"
                                :placeholder="$t('admin.roles.displayNamePlaceholder')"
                                class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                            />
                            <input
                                v-model="form.description"
                                :placeholder="$t('admin.roles.descriptionPlaceholder')"
                                class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                            />
                            <div class="flex gap-3">
                                <input
                                    v-model="form.color"
                                    type="color"
                                    class="border-line h-10 w-14 cursor-pointer rounded-xl border bg-transparent"
                                />
                                <input
                                    v-model.number="form.priority"
                                    type="number"
                                    :placeholder="$t('admin.roles.priorityPlaceholder')"
                                    class="border-line text-fg flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                                />
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
import type { Role } from "~/types/api";

definePageMeta({ layout: "admin" });

const admin = useAdminApi();
const toast = useAppToast();
const { t } = useI18n();
const queryClient = useQueryClient();

useHead({ title: () => `${t("admin.roles.title")} — Admin` });

const showCreateModal = ref(false);
const form = reactive({
    name: "",
    displayName: "",
    description: "",
    color: "#6b7280",
    priority: 0,
});

const { data: rolesData, isLoading: loading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => admin.listRoles(),
});

const roles = computed(() => rolesData.value ?? []);

async function handleCreate() {
    await admin.createRole({
        name: form.name,
        displayName: form.displayName,
        description: form.description || undefined,
        color: form.color,
        priority: form.priority,
    });
    showCreateModal.value = false;
    toast.add({ title: t("admin.roles.created"), color: "green", timeout: 3000 });
    Object.assign(form, {
        name: "",
        displayName: "",
        description: "",
        color: "#6b7280",
        priority: 0,
    });
    await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
}

async function handleDelete(roleId: string) {
    if (!confirm(t("admin.roles.confirmDelete"))) return;
    await admin.deleteRole(roleId);
    toast.add({ title: t("admin.roles.deleted"), color: "green", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
}
</script>
