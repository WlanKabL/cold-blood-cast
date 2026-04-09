<template>
    <div class="space-y-6">
        <!-- Back -->
        <button
            class="flex items-center gap-2 text-sm text-fg-muted transition hover:text-fg"
            @click="navigateTo('/admin/roles')"
        >
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
            {{ $t("common.back") }}
        </button>

        <template v-if="role">
            <!-- Role Info -->
            <div class="glass-card p-6">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="h-4 w-4 rounded-full"
                            :style="{ backgroundColor: editForm.color || '#10b981' }"
                        />
                        <h2 class="text-xl font-bold text-fg">{{ role.displayName }}</h2>
                        <span
                            v-if="role.isSystem"
                            class="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-400"
                            >{{ $t("admin.roles.system_role") }}</span
                        >
                    </div>
                    <button
                        v-if="!role.isSystem"
                        class="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                        @click="handleDelete"
                    >
                        {{ $t("common.delete") }}
                    </button>
                </div>

                <!-- Edit form -->
                <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("admin.roles.display_name")
                        }}</label>
                        <input
                            v-model="editForm.displayName"
                            type="text"
                            class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("admin.roles.description")
                        }}</label>
                        <input
                            v-model="editForm.description"
                            type="text"
                            class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("admin.roles.color")
                        }}</label>
                        <input
                            v-model="editForm.color"
                            type="color"
                            class="h-10 w-20 cursor-pointer rounded-lg border border-input-border bg-input-bg"
                        />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-fg">{{
                            $t("admin.roles.priority")
                        }}</label>
                        <input
                            v-model.number="editForm.priority"
                            type="number"
                            class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div class="flex items-center gap-3">
                        <label class="text-sm font-medium text-fg">{{
                            $t("admin.roles.show_badge")
                        }}</label>
                        <button
                            class="relative h-6 w-11 rounded-full transition"
                            :class="editForm.showBadge ? 'bg-emerald-600' : 'bg-active'"
                            @click="editForm.showBadge = !editForm.showBadge"
                        >
                            <span
                                class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                                :class="editForm.showBadge ? 'translate-x-5' : 'translate-x-0'"
                            />
                        </button>
                    </div>
                    <div class="flex items-end">
                        <button
                            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                            @click="handleUpdateRole"
                        >
                            {{ $t("common.save") }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Feature Flags -->
            <div class="glass-card p-6">
                <h3 class="mb-4 text-base font-semibold text-fg">
                    {{ $t("admin.roles.features") }}
                </h3>

                <div v-if="role.featureFlags?.length" class="space-y-2">
                    <div
                        v-for="rf in role.featureFlags"
                        :key="rf.id"
                        class="flex items-center justify-between rounded-lg border border-line p-3"
                    >
                        <div>
                            <p class="text-sm font-medium text-fg">
                                {{ rf.featureFlag?.name || rf.featureFlagId }}
                            </p>
                            <p class="text-xs text-fg-muted">{{ rf.featureFlag?.key }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                class="relative h-6 w-11 rounded-full transition"
                                :class="rf.enabled ? 'bg-emerald-600' : 'bg-active'"
                                @click="handleToggleRoleFeature(rf.featureFlagId, !rf.enabled)"
                            >
                                <span
                                    class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                                    :class="rf.enabled ? 'translate-x-5' : 'translate-x-0'"
                                />
                            </button>
                            <button
                                class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                                @click="handleRemoveFeature(rf.featureFlagId)"
                            >
                                {{ $t("common.delete") }}
                            </button>
                        </div>
                    </div>
                </div>
                <p v-else class="text-sm text-fg-muted">{{ $t("common.no_data") }}</p>

                <!-- Add Feature -->
                <div v-if="availableFlags.length > 0" class="mt-4 flex items-center gap-2">
                    <select
                        v-model="selectedFlagId"
                        class="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                    >
                        <option value="" disabled>{{ $t("admin.feature_flags.title") }}...</option>
                        <option v-for="f in availableFlags" :key="f.id" :value="f.id">
                            {{ f.name }}
                        </option>
                    </select>
                    <button
                        :disabled="!selectedFlagId"
                        class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        @click="handleAddFeature"
                    >
                        {{ $t("common.create") }}
                    </button>
                </div>
            </div>

            <!-- Limits -->
            <div class="glass-card p-6">
                <h3 class="mb-4 text-base font-semibold text-fg">{{ $t("admin.roles.limits") }}</h3>

                <div v-if="role.limits?.length" class="space-y-2">
                    <div
                        v-for="lim in role.limits"
                        :key="lim.id"
                        class="flex items-center justify-between rounded-lg border border-line p-3"
                    >
                        <p class="text-sm font-medium text-fg">{{ lim.key }}</p>
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-sm text-fg">{{ lim.value }}</span>
                            <button
                                class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                                @click="handleRemoveLimit(lim.key)"
                            >
                                {{ $t("common.delete") }}
                            </button>
                        </div>
                    </div>
                </div>
                <p v-else class="text-sm text-fg-muted">{{ $t("common.no_data") }}</p>

                <!-- Add Limit -->
                <div class="mt-4 flex items-center gap-2">
                    <select
                        v-model="newLimit.key"
                        class="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                    >
                        <option value="" disabled>{{ $t("admin.roles.limit_key") }}...</option>
                        <option v-for="lk in LIMIT_KEYS" :key="lk" :value="lk">{{ lk }}</option>
                    </select>
                    <input
                        v-model.number="newLimit.value"
                        type="number"
                        placeholder="Value"
                        class="w-24 rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                    />
                    <button
                        :disabled="!newLimit.key || newLimit.value === null"
                        class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        @click="handleAddLimit"
                    >
                        {{ $t("common.create") }}
                    </button>
                </div>
            </div>

            <!-- Assigned Users -->
            <div class="glass-card p-6">
                <h3 class="mb-4 text-base font-semibold text-fg">
                    {{ $t("admin.roles.assigned_users") }}
                </h3>
                <div v-if="role.users?.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <NuxtLink
                        v-for="u in role.users"
                        :key="u.user?.id ?? u.userId"
                        :to="`/admin/users/${u.user?.id ?? u.userId}`"
                        class="flex items-center gap-3 rounded-lg border border-line p-3 transition hover:border-emerald-500/30"
                    >
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
                        >
                            {{
                                (u.user?.displayName || u.user?.username || "?")
                                    .charAt(0)
                                    .toUpperCase()
                            }}
                        </div>
                        <div>
                            <p class="text-sm font-medium text-fg">
                                {{ u.user?.displayName || u.user?.username }}
                            </p>
                            <p class="text-xs text-fg-muted">{{ u.user?.username }}</p>
                        </div>
                    </NuxtLink>
                </div>
                <p v-else class="text-sm text-fg-muted">{{ $t("common.no_data") }}</p>
            </div>
        </template>

        <!-- Loading -->
        <div v-else class="py-20 text-center text-fg-muted">
            {{ $t("common.loading") }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });

const route = useRoute();
const admin = useAdmin();
const queryClient = useQueryClient();
const { t } = useI18n();

const roleId = computed(() => route.params.id as string);

useSeoMeta({ title: "Role Detail — Admin — Cold Blood Cast" });

interface RoleDetail {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    color: string | null;
    priority: number;
    isSystem: boolean;
    showBadge: boolean;
    featureFlags: Array<{
        id: string;
        featureFlagId: string;
        enabled: boolean;
        featureFlag?: { name: string; key: string };
    }>;
    limits: Array<{ id: string; key: string; value: number }>;
    users: Array<{
        id: string;
        userId: string;
        user: { id: string; username: string; displayName: string | null };
    }>;
}

interface FeatureFlag {
    id: string;
    key: string;
    name: string;
}

const LIMIT_KEYS = [
    "max_enclosures",
    "max_pets",
    "max_sensors",
    "max_alert_rules",
    "max_api_keys",
    "max_uploads",
    "max_upload_size_mb",
] as const;

const selectedFlagId = ref("");
const newLimit = ref({ key: "", value: 0 });

const { data: role } = useQuery<RoleDetail>({
    queryKey: ["admin", "roles", roleId],
    queryFn: () => admin.getRoleDetail(roleId.value),
});

const { data: allFlags } = useQuery<FeatureFlag[]>({
    queryKey: ["admin", "feature-flags"],
    queryFn: () => admin.listFeatureFlags(),
});

const editForm = ref({
    displayName: "",
    description: "",
    color: "#10b981",
    priority: 0,
    showBadge: false,
});

watch(
    role,
    (r) => {
        if (r) {
            editForm.value = {
                displayName: r.displayName,
                description: r.description ?? "",
                color: r.color || "#10b981",
                priority: r.priority,
                showBadge: r.showBadge,
            };
        }
    },
    { immediate: true },
);

const availableFlags = computed(() => {
    if (!allFlags.value || !role.value) return [];
    const assignedIds = new Set(role.value.featureFlags.map((f) => f.featureFlagId));
    return allFlags.value.filter((f) => !assignedIds.has(f.id));
});

function invalidateRole() {
    queryClient.invalidateQueries({ queryKey: ["admin", "roles", roleId] });
}

async function handleUpdateRole() {
    await admin.updateRole(roleId.value, editForm.value);
    invalidateRole();
    queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
}

async function handleDelete() {
    if (!confirm(t("admin.roles.confirm_delete"))) return;
    await admin.deleteRole(roleId.value);
    navigateTo("/admin/roles");
}

async function handleAddFeature() {
    if (!selectedFlagId.value) return;
    await admin.setRoleFeature(roleId.value, selectedFlagId.value);
    selectedFlagId.value = "";
    invalidateRole();
}

async function handleToggleRoleFeature(featureFlagId: string, enabled: boolean) {
    await admin.setRoleFeature(roleId.value, featureFlagId, enabled);
    invalidateRole();
}

async function handleRemoveFeature(featureFlagId: string) {
    await admin.removeRoleFeature(roleId.value, featureFlagId);
    invalidateRole();
}

async function handleAddLimit() {
    if (!newLimit.value.key) return;
    await admin.setRoleLimit(roleId.value, newLimit.value);
    newLimit.value = { key: "", value: 0 };
    invalidateRole();
}

async function handleRemoveLimit(key: string) {
    await admin.removeRoleLimit(roleId.value, key);
    invalidateRole();
}
</script>
