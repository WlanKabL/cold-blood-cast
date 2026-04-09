<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div />
            <button
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                @click="showCreate = true"
            >
                {{ $t("admin.roles.create") }}
            </button>
        </div>

        <!-- Roles Grid -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
                v-for="role in roles"
                :key="role.id"
                :to="`/admin/roles/${role.id}`"
                class="glass-card p-5 transition hover:border-emerald-500/30"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="h-3 w-3 rounded-full"
                        :style="{ backgroundColor: role.color || '#10b981' }"
                    />
                    <h3 class="font-semibold text-fg">{{ role.displayName }}</h3>
                    <span
                        v-if="role.isSystem"
                        class="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-400"
                    >
                        {{ $t("admin.roles.system_role") }}
                    </span>
                </div>
                <p class="mt-2 text-xs text-fg-muted">
                    {{ role.name }} · {{ $t("admin.roles.priority") }}: {{ role.priority }}
                </p>
                <p v-if="role.description" class="mt-1 text-xs text-fg-soft">
                    {{ role.description }}
                </p>
            </NuxtLink>
        </div>

        <p v-if="roles.length === 0" class="py-12 text-center text-fg-muted">
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
                    <h3 class="mb-4 text-lg font-bold text-fg">{{ $t("admin.roles.create") }}</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.roles.name")
                            }}</label>
                            <input
                                v-model="form.name"
                                type="text"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.roles.display_name")
                            }}</label>
                            <input
                                v-model="form.displayName"
                                type="text"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.roles.description")
                            }}</label>
                            <input
                                v-model="form.description"
                                type="text"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.roles.color")
                            }}</label>
                            <input
                                v-model="form.color"
                                type="color"
                                class="h-10 w-20 cursor-pointer rounded-lg border border-input-border bg-input-bg"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.roles.priority")
                            }}</label>
                            <input
                                v-model.number="form.priority"
                                type="number"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
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
useSeoMeta({ title: "Roles — Admin — Cold Blood Cast" });

const admin = useAdmin();
const queryClient = useQueryClient();

const showCreate = ref(false);
const form = ref({
    name: "",
    displayName: "",
    description: "",
    color: "#10b981",
    priority: 0,
});

interface AdminRole {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    color: string | null;
    priority: number;
    isSystem: boolean;
}

const { data: rolesData } = useQuery<AdminRole[]>({
    queryKey: ["admin", "roles"],
    queryFn: () => admin.listRoles(),
});

const roles = computed(() => rolesData.value ?? []);

async function handleCreate() {
    await admin.createRole(form.value);
    showCreate.value = false;
    form.value = { name: "", displayName: "", description: "", color: "#10b981", priority: 0 };
    queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
}
</script>
