<template>
    <div class="space-y-6">
        <!-- Back + Header -->
        <div class="flex items-center gap-4">
            <NuxtLink
                to="/admin/roles"
                class="text-fg-faint hover:bg-surface-hover hover:text-fg rounded-lg p-2"
            >
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div v-if="role" class="flex-1">
                <div class="flex items-center gap-3">
                    <div
                        class="h-3 w-3 rounded-full"
                        :style="{ backgroundColor: role.color || '#6b7280' }"
                    />
                    <h1 class="text-fg text-xl font-bold">{{ role.displayName }}</h1>
                    <span
                        v-if="role.isSystem"
                        class="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400"
                    >
                        {{ $t("admin.system") }}
                    </span>
                </div>
                <p class="text-fg-muted text-[12px]">
                    {{ role.name }} · {{ $t("admin.roles.priority") }} {{ role.priority }} ·
                    {{ role._count?.users ?? 0 }} {{ $t("admin.roles.users") }}
                </p>
            </div>
            <button
                v-if="role && !role.isSystem"
                class="rounded-xl border border-red-500/30 px-4 py-2 text-[12px] font-medium text-red-400 hover:bg-red-500/10"
                @click="handleDelete"
            >
                <Icon name="lucide:trash-2" class="mr-1.5 inline h-4 w-4" />
                {{ $t("admin.delete") }}
            </button>
        </div>

        <div v-if="loading" class="space-y-6">
            <div class="glass-card space-y-4 p-6">
                <UiSkeleton width="100" height="15" />
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div v-for="i in 4" :key="i" class="space-y-1">
                        <UiSkeleton width="60" height="11" />
                        <UiSkeleton height="36" rounded="xl" />
                    </div>
                </div>
            </div>
            <div class="glass-card space-y-3 p-6">
                <UiSkeleton width="120" height="15" />
                <div class="space-y-2">
                    <div v-for="i in 6" :key="i" class="flex items-center gap-3">
                        <UiSkeleton width="36" height="20" rounded="md" />
                        <UiSkeleton width="140" height="13" />
                    </div>
                </div>
            </div>
        </div>

        <template v-else-if="role">
            <!-- Role Info — full width -->
            <div class="glass-card p-6">
                <h2 class="text-fg mb-4 text-[15px] font-semibold">{{ $t("admin.roles.info") }}</h2>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label class="text-fg-muted text-[11px] font-medium">{{
                            $t("admin.roles.displayName")
                        }}</label>
                        <input
                            v-model="editForm.displayName"
                            class="border-line text-fg mt-1 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label class="text-fg-muted text-[11px] font-medium">{{
                            $t("admin.roles.description")
                        }}</label>
                        <input
                            v-model="editForm.description"
                            class="border-line text-fg mt-1 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label class="text-fg-muted text-[11px] font-medium">{{
                            $t("admin.roles.color")
                        }}</label>
                        <div class="mt-1 flex items-center gap-2">
                            <input
                                v-model="editForm.color"
                                type="color"
                                class="border-line h-10 w-14 cursor-pointer rounded-xl border bg-transparent disabled:opacity-50"
                            />
                            <span class="text-fg-faint text-[12px]">{{ editForm.color }}</span>
                        </div>
                    </div>
                    <div>
                        <label class="text-fg-muted text-[11px] font-medium">{{
                            $t("admin.roles.priority")
                        }}</label>
                        <input
                            v-model.number="editForm.priority"
                            type="number"
                            :disabled="role.isSystem"
                            class="border-line text-fg mt-1 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none disabled:opacity-50"
                        />
                    </div>
                </div>
                <div class="mt-4 flex items-center gap-3">
                    <button
                        class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                        :class="editForm.showBadge ? 'bg-primary-500' : 'bg-gray-600'"
                        role="switch"
                        :aria-checked="editForm.showBadge"
                        @click="editForm.showBadge = !editForm.showBadge"
                    >
                        <span
                            class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200"
                            :class="editForm.showBadge ? 'translate-x-4' : 'translate-x-0'"
                        />
                    </button>
                    <div>
                        <p class="text-fg text-[13px] font-medium">
                            {{ $t("admin.roles.showBadge") }}
                        </p>
                        <p class="text-fg-faint text-[11px]">
                            {{ $t("admin.roles.showBadgeDesc") }}
                        </p>
                    </div>
                </div>
                <button
                    class="bg-primary-600 hover:bg-primary-500 mt-4 rounded-xl px-4 py-2 text-[12px] font-medium text-white"
                    @click="handleUpdate"
                >
                    {{ $t("admin.save") }}
                </button>
            </div>

            <!-- Feature Flags & Limits -->
            <div class="grid gap-6 lg:grid-cols-2">
                <!-- Feature Flags -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("admin.roles.featureFlags") }}
                    </h2>
                    <div class="max-h-96 space-y-2 overflow-y-auto">
                        <div
                            v-for="rf in role.featureFlags"
                            :key="rf.featureFlagId"
                            class="border-line-faint flex items-center justify-between gap-2 rounded-xl border p-3"
                        >
                            <div class="min-w-0 flex-1">
                                <p class="text-fg truncate text-[13px]">
                                    {{ rf.featureFlag.name }}
                                </p>
                                <p class="text-fg-faint truncate text-[11px]">
                                    {{ rf.featureFlag.key }}
                                </p>
                            </div>
                            <div class="flex shrink-0 items-center gap-2">
                                <button
                                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                                    :class="rf.enabled ? 'bg-green-500' : 'bg-gray-600'"
                                    role="switch"
                                    :aria-checked="rf.enabled"
                                    @click="handleToggleRoleFeature(rf.featureFlagId, !rf.enabled)"
                                >
                                    <span
                                        class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200"
                                        :class="rf.enabled ? 'translate-x-4' : 'translate-x-0'"
                                    />
                                </button>
                                <button
                                    class="text-fg-faint rounded-lg p-1 hover:text-red-400"
                                    :title="$t('common.delete')"
                                    @click="handleRemoveFeature(rf.featureFlagId)"
                                >
                                    <Icon name="lucide:x" class="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <p v-if="!role.featureFlags.length" class="text-fg-faint text-[12px]">
                            {{ $t("admin.roles.noFlags") }}
                        </p>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <select
                            v-model="newFeatureId"
                            class="border-line text-fg flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                        >
                            <option value="">{{ $t("admin.roles.addFlag") }}</option>
                            <option v-for="f in availableFlags" :key="f.id" :value="f.id">
                                {{ f.name }} ({{ f.key }})
                            </option>
                        </select>
                        <button
                            class="rounded-xl bg-green-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-green-500 disabled:opacity-40"
                            :disabled="!newFeatureId"
                            @click="handleToggleRoleFeature(newFeatureId, true)"
                        >
                            {{ $t("admin.roles.grant") }}
                        </button>
                    </div>
                </div>

                <!-- Limits -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("admin.roles.limits") }}
                    </h2>
                    <div class="max-h-96 space-y-2 overflow-y-auto">
                        <div
                            v-for="lim in role.limits"
                            :key="lim.key"
                            class="border-line-faint flex items-center justify-between rounded-xl border p-3"
                        >
                            <p class="text-fg text-[13px]">
                                {{ $t(`admin.limitKeys.${lim.key}`, lim.key) }}
                            </p>
                            <div class="flex items-center gap-2">
                                <span class="text-primary-400 text-[13px] font-medium">{{
                                    lim.value === -1 ? "∞" : lim.value
                                }}</span>
                                <button
                                    class="text-fg-faint rounded-lg p-1 hover:text-red-400"
                                    @click="handleRemoveLimit(lim.key)"
                                >
                                    <Icon name="lucide:x" class="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <p v-if="!role.limits.length" class="text-fg-faint text-[12px]">
                            {{ $t("admin.roles.noLimits") }}
                        </p>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <select
                            v-model="newLimitKey"
                            class="border-line text-fg flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                        >
                            <option value="">{{ $t("admin.roles.addLimit") }}</option>
                            <option v-for="lk in availableLimitKeys" :key="lk" :value="lk">
                                {{ $t(`admin.limitKeys.${lk}`, lk) }}
                            </option>
                        </select>
                        <input
                            v-model.number="newLimitValue"
                            type="number"
                            :placeholder="$t('admin.roles.unlimitedHint')"
                            class="border-line text-fg w-24 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                        />
                        <button
                            class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[12px] font-medium text-white disabled:opacity-40"
                            :disabled="!newLimitKey"
                            @click="handleSetLimit"
                        >
                            {{ $t("admin.add") }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Users with this role — full width -->
            <div class="glass-card p-6">
                <h2 class="text-fg mb-4 text-[15px] font-semibold">
                    {{ $t("admin.roles.assignedUsers") }} ({{ role.users?.length ?? 0 }})
                </h2>
                <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <NuxtLink
                        v-for="ur in role.users"
                        :key="ur.user.id"
                        :to="`/admin/users/${ur.user.id}` as any"
                        class="border-line-faint hover:bg-surface-hover flex items-center justify-between rounded-xl border p-3 transition-colors"
                    >
                        <div>
                            <p class="text-fg text-[13px] font-medium">
                                {{ ur.user.displayName || ur.user.username }}
                            </p>
                            <p class="text-fg-faint text-[11px]">{{ ur.user.email }}</p>
                        </div>
                        <Icon name="lucide:chevron-right" class="text-fg-faint h-4 w-4" />
                    </NuxtLink>
                    <p v-if="!role.users?.length" class="text-fg-faint text-[12px]">
                        {{ $t("admin.roles.noUsers") }}
                    </p>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { RoleDetail, FeatureFlag } from "~/types/api";
import { LIMIT_KEYS } from "@cold-blood-cast/shared";

definePageMeta({ layout: "admin" });

const route = useRoute();
const router = useRouter();
const admin = useAdminApi();
const toast = useToast();
const { t } = useI18n();
const queryClient = useQueryClient();

useHead({ title: () => `${t("admin.roles.title")} — Admin` });

const roleId = route.params.id as string;

const editForm = reactive({
    displayName: "",
    description: "",
    color: "#6b7280",
    priority: 0,
    showBadge: false,
});

const newFeatureId = ref("");
const newLimitKey = ref("");
const newLimitValue = ref(0);

const { data: roleData, isLoading: loading } = useQuery({
    queryKey: ["admin-role-detail", roleId],
    queryFn: async () => {
        const [r, flags] = await Promise.all([
            admin.getRoleDetail(roleId),
            admin.listFeatureFlags(),
        ]);
        return { role: r, flags };
    },
});

const role = computed(() => roleData.value?.role ?? null);
const allFlags = computed(() => roleData.value?.flags ?? []);

// Sync form when role data loads
watch(
    role,
    (r) => {
        if (r) {
            editForm.displayName = r.displayName;
            editForm.description = r.description || "";
            editForm.color = r.color || "#6b7280";
            editForm.priority = r.priority;
            editForm.showBadge = r.showBadge ?? false;
        }
    },
    { immediate: true },
);

const availableFlags = computed(() => {
    if (!role.value) return allFlags.value;
    const assigned = new Set(role.value.featureFlags.map((rf) => rf.featureFlagId));
    return allFlags.value.filter((f) => !assigned.has(f.id));
});

const availableLimitKeys = computed(() => {
    if (!role.value) return [...LIMIT_KEYS];
    const assigned = new Set(role.value.limits.map((l) => l.key));
    return LIMIT_KEYS.filter((k) => !assigned.has(k));
});

async function handleUpdate() {
    await admin.updateRole(roleId, {
        displayName: editForm.displayName,
        description: editForm.description || undefined,
        color: editForm.color,
        ...(!role.value?.isSystem && { priority: editForm.priority }),
        showBadge: editForm.showBadge,
    });
    toast.add({ title: t("admin.roles.updated"), color: "green", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-role-detail", roleId] });
}

async function handleDelete() {
    if (!confirm(t("admin.roles.confirmDelete"))) return;
    await admin.deleteRole(roleId);
    toast.add({ title: t("admin.roles.deleted"), color: "green", timeout: 3000 });
    router.push("/admin/roles");
}

async function handleToggleRoleFeature(featureFlagId: string, enabled: boolean) {
    await admin.setRoleFeature(roleId, featureFlagId, enabled);
    newFeatureId.value = "";
    toast.add({
        title: enabled ? t("admin.roles.featureGranted") : t("admin.roles.featureRevoked"),
        color: "green",
        timeout: 3000,
    });
    await queryClient.invalidateQueries({ queryKey: ["admin-role-detail", roleId] });
}

async function handleRemoveFeature(featureFlagId: string) {
    await admin.removeRoleFeature(roleId, featureFlagId);
    toast.add({ title: t("admin.roles.featureRemoved"), color: "green", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-role-detail", roleId] });
}

async function handleSetLimit() {
    if (!newLimitKey.value) return;
    await admin.setRoleLimit(roleId, newLimitKey.value, newLimitValue.value);
    newLimitKey.value = "";
    newLimitValue.value = 0;
    toast.add({ title: t("admin.roles.limitSet"), color: "green", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-role-detail", roleId] });
}

async function handleRemoveLimit(key: string) {
    await admin.removeRoleLimit(roleId, key);
    toast.add({ title: t("admin.roles.limitRemoved"), color: "green", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-role-detail", roleId] });
}
</script>
