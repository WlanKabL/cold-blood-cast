<template>
    <div class="min-w-0 space-y-6">
        <!-- Back + Header -->
        <div class="flex flex-wrap items-center gap-3 sm:gap-4">
            <NuxtLink
                to="/admin/users"
                class="text-fg-faint hover:bg-surface-hover hover:text-fg rounded-lg p-2"
            >
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div v-if="user" class="min-w-0 flex-1">
                <h1 class="text-fg truncate text-xl font-bold">
                    {{ user.displayName || user.username }}
                </h1>
                <p class="text-fg-muted truncate text-[12px]">
                    {{ user.email }} · {{ $t("admin.users.joined") }}
                    {{ new Date(user.createdAt).toLocaleDateString() }}
                </p>
            </div>
            <div v-if="user" class="flex gap-2">
                <button
                    v-if="!user.banned"
                    class="rounded-xl border border-red-500/30 p-2 text-[12px] font-medium text-red-400 hover:bg-red-500/10 sm:px-4"
                    @click="handleBan"
                >
                    <Icon name="lucide:ban" class="inline h-4 w-4 sm:mr-1.5" />
                    <span class="hidden sm:inline">{{ $t("admin.users.ban") }}</span>
                </button>
                <button
                    v-else
                    class="rounded-xl border border-green-500/30 p-2 text-[12px] font-medium text-green-400 hover:bg-green-500/10 sm:px-4"
                    @click="handleUnban"
                >
                    <Icon name="lucide:check-circle" class="inline h-4 w-4 sm:mr-1.5" />
                    <span class="hidden sm:inline">{{ $t("admin.users.unban") }}</span>
                </button>
                <button
                    class="rounded-xl border border-red-700/40 p-2 text-[12px] font-medium text-red-500 hover:bg-red-500/10 sm:px-4"
                    @click="showDeleteModal = true"
                >
                    <Icon name="lucide:trash-2" class="inline h-4 w-4 sm:mr-1.5" />
                    <span class="hidden sm:inline">{{ $t("admin.users.delete") }}</span>
                </button>
                <button
                    v-if="false /* impersonation deferred — backend ready, UI hidden */"
                    class="rounded-xl border border-amber-500/30 px-4 py-2 text-[12px] font-medium text-amber-400 hover:bg-amber-500/10"
                    @click="handleImpersonate"
                >
                    <Icon name="lucide:eye" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("admin.users.impersonate") }}
                </button>
            </div>
        </div>

        <div v-if="loading" class="grid gap-6 lg:grid-cols-2">
            <div v-for="i in 2" :key="i" class="glass-card space-y-3 p-6">
                <UiSkeleton width="100" height="15" />
                <div v-for="j in 5" :key="j" class="flex justify-between">
                    <UiSkeleton width="80" height="13" />
                    <UiSkeleton width="120" height="13" />
                </div>
            </div>
        </div>

        <template v-else-if="user">
            <div class="grid gap-6 lg:grid-cols-2">
                <!-- User Info -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("admin.users.info") }}
                    </h2>
                    <div class="space-y-3">
                        <div class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("admin.users.username") }}</span>
                            <span class="text-fg">{{ user.username }}</span>
                        </div>
                        <div class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("admin.users.email") }}</span>
                            <span class="text-fg">{{ user.email }}</span>
                        </div>
                        <div class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("admin.users.displayName") }}</span>
                            <span class="text-fg">{{ user.displayName || "—" }}</span>
                        </div>
                        <div class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("admin.users.status") }}</span>
                            <span
                                :class="user.banned ? 'text-red-400' : 'text-green-400'"
                                class="text-[13px] font-medium"
                            >
                                {{
                                    user.banned
                                        ? $t("admin.users.banned")
                                        : $t("admin.users.active")
                                }}
                            </span>
                        </div>
                        <div v-if="user.bannedReason" class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("admin.users.banReason") }}</span>
                            <span class="text-red-300">{{ user.bannedReason }}</span>
                        </div>
                        <div class="flex items-center justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("admin.users.emailVerified") }}</span>
                            <button
                                :disabled="togglingVerify"
                                class="hover:bg-surface-hover flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium transition disabled:opacity-50"
                                :class="user.emailVerified ? 'text-green-400' : 'text-amber-400'"
                                @click="toggleEmailVerified"
                            >
                                <Icon
                                    :name="
                                        togglingVerify
                                            ? 'svg-spinners:ring-resize'
                                            : user.emailVerified
                                              ? 'lucide:check-circle-2'
                                              : 'lucide:alert-circle'
                                    "
                                    class="h-3.5 w-3.5"
                                />
                                {{
                                    user.emailVerified
                                        ? $t("admin.users.verified")
                                        : $t("admin.users.unverified")
                                }}
                            </button>
                        </div>
                        <div class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("admin.users.lastActive") }}</span>
                            <span class="text-fg">{{
                                user.lastActiveAt
                                    ? new Date(user.lastActiveAt).toLocaleString()
                                    : "—"
                            }}</span>
                        </div>
                        <div class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("admin.users.stats") }}</span>
                            <span class="text-fg"
                                >{{ user._count.enclosures }} {{ $t("admin.users.enclosures") }} ·
                                {{ user._count.pets }} {{ $t("admin.users.pets") }}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Roles -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("admin.users.roles") }}
                    </h2>
                    <div class="space-y-2">
                        <div
                            v-for="ur in user.roles"
                            :key="ur.role.id"
                            class="border-line-faint flex items-center justify-between rounded-xl border p-3"
                        >
                            <span
                                class="rounded-full px-3 py-1 text-[12px] font-medium"
                                :style="{
                                    backgroundColor: (ur.role.color || '#6b7280') + '22',
                                    color: ur.role.color || '#6b7280',
                                }"
                            >
                                {{ ur.role.displayName }}
                            </span>
                            <button
                                class="text-fg-faint rounded-lg p-1 hover:text-red-400"
                                @click="handleRemoveRole(ur.role.id)"
                            >
                                <Icon name="lucide:x" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <select
                            v-model="newRoleId"
                            class="border-line text-fg flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                        >
                            <option value="">{{ $t("admin.users.addRole") }}</option>
                            <option v-for="r in availableRoles" :key="r.id" :value="r.id">
                                {{ r.displayName }}
                            </option>
                        </select>
                        <button
                            class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[12px] font-medium text-white disabled:opacity-40"
                            :disabled="!newRoleId"
                            @click="handleAssignRole"
                        >
                            {{ $t("admin.add") }}
                        </button>
                    </div>
                </div>

                <!-- Feature Overrides -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("admin.users.featureOverrides") }}
                    </h2>
                    <div class="space-y-2">
                        <div
                            v-for="uf in user.featureFlags"
                            :key="uf.featureFlagId"
                            class="border-line-faint flex items-center justify-between rounded-xl border p-3"
                        >
                            <div>
                                <p class="text-fg text-[13px]">{{ uf.featureFlag.name }}</p>
                                <p class="text-fg-faint text-[11px]">{{ uf.featureFlag.key }}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    class="text-[11px] font-medium"
                                    :class="uf.enabled ? 'text-green-400' : 'text-red-400'"
                                >
                                    {{ uf.enabled ? $t("admin.enabled") : $t("admin.disabled") }}
                                </span>
                                <button
                                    class="text-fg-faint rounded-lg p-1 hover:text-red-400"
                                    @click="handleRemoveFeatureOverride(uf.featureFlagId)"
                                >
                                    <Icon name="lucide:x" class="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                        <select
                            v-model="newFeatureId"
                            class="border-line text-fg flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                        >
                            <option value="">{{ $t("admin.users.addFeature") }}</option>
                            <option v-for="f in allFlags" :key="f.id" :value="f.id">
                                {{ f.name }} ({{ f.key }})
                            </option>
                        </select>
                        <div class="flex gap-2">
                            <button
                                class="rounded-xl bg-green-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-green-500 disabled:opacity-40"
                                :disabled="!newFeatureId"
                                @click="handleSetFeatureOverride(true)"
                            >
                                {{ $t("admin.grant") }}
                            </button>
                            <button
                                class="rounded-xl bg-red-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-red-500 disabled:opacity-40"
                                :disabled="!newFeatureId"
                                @click="handleSetFeatureOverride(false)"
                            >
                                {{ $t("admin.deny") }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Limit Overrides -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("admin.users.limitOverrides") }}
                    </h2>
                    <div class="space-y-2">
                        <div
                            v-for="lo in user.limitOverrides"
                            :key="lo.key"
                            class="border-line-faint flex items-center justify-between rounded-xl border p-3"
                        >
                            <p class="text-fg text-[13px]">
                                {{ $t(`admin.limitKeys.${lo.key}`, lo.key) }}
                            </p>
                            <div class="flex items-center gap-2">
                                <span class="text-primary-400 text-[13px] font-medium">{{
                                    lo.value === -1 ? "∞" : lo.value
                                }}</span>
                                <button
                                    class="text-fg-faint rounded-lg p-1 hover:text-red-400"
                                    @click="handleRemoveLimitOverride(lo.key)"
                                >
                                    <Icon name="lucide:x" class="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                        <select
                            v-model="newLimitKey"
                            class="border-line text-fg flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                        >
                            <option value="">{{ $t("admin.users.addLimit") }}</option>
                            <option v-for="lk in availableLimitKeys" :key="lk" :value="lk">
                                {{ $t(`admin.limitKeys.${lk}`, lk) }}
                            </option>
                        </select>
                        <div class="flex gap-2">
                            <input
                                v-model.number="newLimitValue"
                                type="number"
                                :placeholder="$t('admin.users.valuePlaceholder')"
                                class="border-line text-fg w-24 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                            />
                            <button
                                class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[12px] font-medium text-white disabled:opacity-40"
                                :disabled="!newLimitKey"
                                @click="handleSetLimitOverride"
                            >
                                {{ $t("admin.set") }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>

    <!-- Delete Confirmation Modal -->
    <UiConfirmDialog
        :show="showDeleteModal"
        :title="$t('admin.users.deleteTitle')"
        :message="$t('admin.users.deleteWarning')"
        variant="danger"
        icon="lucide:trash-2"
        :confirm-label="$t('admin.users.deleteConfirm')"
        :cancel-label="$t('common.cancel')"
        :loading="deleting"
        @confirm="handleDelete"
        @cancel="showDeleteModal = false"
    >
        <div class="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p class="text-[13px] font-medium text-red-400">
                {{ user?.displayName || user?.username }}
                <span class="text-fg-faint font-normal">({{ user?.email }})</span>
            </p>
            <p class="text-fg-faint mt-1 text-[11px]">
                {{ user?._count.enclosures }} {{ $t("admin.users.enclosures") }} ·
                {{ user?._count.pets }} {{ $t("admin.users.pets") }}
            </p>
        </div>
    </UiConfirmDialog>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { AdminUserDetail, Role, FeatureFlag } from "~/types/api";
import { LIMIT_KEYS } from "@cold-blood-cast/shared";

definePageMeta({ layout: "admin" });

const { t } = useI18n();

useHead({ title: () => `${t("admin.users.title")} — Admin` });

const route = useRoute();
const admin = useAdminApi();
const toast = useAppToast();
const queryClient = useQueryClient();

const userId = route.params.id as string;

const newRoleId = ref("");
const newFeatureId = ref("");
const newLimitKey = ref("");
const newLimitValue = ref(0);
const showDeleteModal = ref(false);
const deleting = ref(false);
const togglingVerify = ref(false);

const { data: userData, isLoading: loading } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
        const [u, roles, flags] = await Promise.all([
            admin.getUserDetail(userId),
            admin.listRoles(),
            admin.listFeatureFlags(),
        ]);
        return { user: u, roles, flags };
    },
});

const user = computed(() => userData.value?.user ?? null);
const allRoles = computed(() => userData.value?.roles ?? []);
const allFlags = computed(() => userData.value?.flags ?? []);

const availableRoles = computed(() => {
    if (!user.value) return allRoles.value;
    const assigned = new Set(user.value.roles.map((r) => r.role.id));
    return allRoles.value.filter((r) => !assigned.has(r.id));
});

const availableLimitKeys = computed(() => {
    if (!user.value) return [...LIMIT_KEYS];
    const assigned = new Set(user.value.limitOverrides.map((l) => l.key));
    return LIMIT_KEYS.filter((k) => !assigned.has(k));
});

async function reload() {
    await queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
}

async function handleAssignRole() {
    if (!newRoleId.value) return;
    await admin.assignRole(userId, newRoleId.value);
    newRoleId.value = "";
    toast.add({ title: t("admin.users.roleAssigned"), color: "green", timeout: 3000 });
    await reload();
}

async function handleRemoveRole(roleId: string) {
    await admin.removeRole(userId, roleId);
    toast.add({ title: t("admin.users.roleRemoved"), color: "green", timeout: 3000 });
    await reload();
}

async function handleSetFeatureOverride(enabled: boolean) {
    if (!newFeatureId.value) return;
    await admin.setFeatureOverride(userId, newFeatureId.value, enabled);
    newFeatureId.value = "";
    toast.add({ title: t("admin.users.featureOverrideSet"), color: "green", timeout: 3000 });
    await reload();
}

async function handleRemoveFeatureOverride(featureFlagId: string) {
    await admin.removeFeatureOverride(userId, featureFlagId);
    toast.add({ title: t("admin.users.featureOverrideRemoved"), color: "green", timeout: 3000 });
    await reload();
}

async function handleSetLimitOverride() {
    if (!newLimitKey.value) return;
    await admin.setLimitOverride(userId, newLimitKey.value, newLimitValue.value);
    newLimitKey.value = "";
    newLimitValue.value = 0;
    toast.add({ title: t("admin.users.limitOverrideSet"), color: "green", timeout: 3000 });
    await reload();
}

async function handleRemoveLimitOverride(key: string) {
    await admin.removeLimitOverride(userId, key);
    toast.add({ title: t("admin.users.limitOverrideRemoved"), color: "green", timeout: 3000 });
    await reload();
}

async function handleBan() {
    const reason = prompt(t("admin.users.banPrompt"));
    await admin.banUser(userId, reason || undefined);
    toast.add({ title: t("admin.users.userBanned"), color: "green", timeout: 3000 });
    await reload();
}

async function handleUnban() {
    await admin.unbanUser(userId);
    toast.add({ title: t("admin.users.userUnbanned"), color: "green", timeout: 3000 });
    await reload();
}

async function handleImpersonate() {
    try {
        await admin.impersonateUser(userId);
        toast.add({ title: t("admin.users.impersonatingToast"), color: "green", timeout: 3000 });
    } catch {
        toast.add({ title: t("admin.users.cannotImpersonate"), color: "red", timeout: 3000 });
    }
}

async function toggleEmailVerified() {
    if (!user.value) return;
    togglingVerify.value = true;
    try {
        const newValue = !user.value.emailVerified;
        await admin.updateUser(userId, { emailVerified: newValue });
        toast.add({
            title: newValue
                ? t("admin.users.emailVerifiedToast")
                : t("admin.users.emailUnverifiedToast"),
            color: "green",
            timeout: 3000,
        });
        await reload();
    } catch {
        toast.add({ title: t("admin.users.updateFailed"), color: "red", timeout: 3000 });
    } finally {
        togglingVerify.value = false;
    }
}

async function handleDelete() {
    deleting.value = true;
    try {
        await admin.deleteUser(userId);
        toast.add({ title: t("admin.users.userDeleted"), color: "green", timeout: 3000 });
        await navigateTo("/admin/users");
    } catch {
        toast.add({ title: t("admin.users.deleteFailed"), color: "red", timeout: 3000 });
        deleting.value = false;
        showDeleteModal.value = false;
    }
}
</script>
