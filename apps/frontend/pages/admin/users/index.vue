<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("admin.users.title") }}</h1>
        </div>

        <!-- Tabs -->
        <div class="border-line flex gap-1 border-b">
            <button
                class="px-4 py-2 text-[13px] font-medium transition-colors"
                :class="
                    activeTab === 'users'
                        ? 'border-primary-500 text-primary-400 border-b-2'
                        : 'text-fg-muted hover:text-fg'
                "
                @click="activeTab = 'users'"
            >
                {{ $t("admin.users.title") }}
            </button>
            <button
                class="flex items-center gap-2 px-4 py-2 text-[13px] font-medium transition-colors"
                :class="
                    activeTab === 'pending'
                        ? 'border-primary-500 text-primary-400 border-b-2'
                        : 'text-fg-muted hover:text-fg'
                "
                @click="
                    activeTab = 'pending';
                    fetchPending();
                "
            >
                {{ $t("admin.users.pendingApprovals") }}
                <span
                    v-if="pendingUsers.length"
                    class="rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-400"
                >
                    {{ pendingUsers.length }}
                </span>
            </button>
        </div>

        <!-- ═══ Users Tab ═══ -->
        <template v-if="activeTab === 'users'">
            <div class="glass-card flex flex-wrap items-center gap-3 p-4">
                <input
                    v-model="search"
                    type="text"
                    :placeholder="$t('admin.users.searchPlaceholder')"
                    class="border-line text-fg placeholder:text-fg-faint focus:border-primary-500 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none sm:w-60"
                    @input="debouncedFetch"
                />
                <select
                    v-model="filterRole"
                    class="border-line text-fg focus:border-primary-500 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                    @change="fetchUsers"
                >
                    <option value="">{{ $t("admin.users.allRoles") }}</option>
                    <option v-for="r in roles" :key="r.id" :value="r.name">
                        {{ r.displayName }}
                    </option>
                </select>
                <select
                    v-model="filterBanned"
                    class="border-line text-fg focus:border-primary-500 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                    @change="fetchUsers"
                >
                    <option value="">{{ $t("admin.users.allStatus") }}</option>
                    <option value="true">{{ $t("admin.users.banned") }}</option>
                    <option value="false">{{ $t("admin.users.active") }}</option>
                </select>
                <select
                    v-model="filterApproved"
                    class="border-line text-fg focus:border-primary-500 rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                    @change="fetchUsers"
                >
                    <option value="">{{ $t("admin.users.allApproval") }}</option>
                    <option value="true">{{ $t("admin.users.approvedOnly") }}</option>
                    <option value="false">{{ $t("admin.users.pendingOnly") }}</option>
                </select>

                <!-- Bulk Actions -->
                <div v-if="selectedUsers.length" class="ml-auto flex items-center gap-2">
                    <span class="text-fg-muted text-[12px]"
                        >{{ selectedUsers.length }} {{ $t("admin.users.selected") }}</span
                    >
                    <select
                        v-model="bulkRoleId"
                        class="border-line text-fg rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                    >
                        <option value="">{{ $t("admin.users.selectRole") }}</option>
                        <option v-for="r in roles" :key="r.id" :value="r.id">
                            {{ r.displayName }}
                        </option>
                    </select>
                    <button
                        class="bg-primary-600 hover:bg-primary-500 rounded-xl px-3 py-2 text-[12px] font-medium text-white disabled:opacity-40"
                        :disabled="!bulkRoleId"
                        @click="handleBulkAssign"
                    >
                        {{ $t("admin.users.bulkAssign") }}
                    </button>
                </div>
            </div>

            <!-- Users Table -->
            <div class="glass-card overflow-x-auto">
                <div v-if="loading" class="space-y-0">
                    <div
                        v-for="i in 6"
                        :key="i"
                        class="border-line-faint flex items-center gap-3 border-b px-4 py-3"
                    >
                        <UiSkeleton width="16" height="16" rounded="sm" />
                        <div class="flex-1 space-y-1">
                            <UiSkeleton width="120" height="13" />
                            <UiSkeleton width="160" height="11" />
                        </div>
                        <UiSkeleton width="48" height="18" rounded="full" />
                        <UiSkeleton width="16" height="16" />
                    </div>
                </div>

                <div v-if="!loading" class="space-y-0 md:hidden">
                    <div
                        v-for="u in users"
                        :key="'m-' + u.id"
                        class="border-line-faint flex items-start gap-3 border-b px-4 py-3"
                    >
                        <input
                            type="checkbox"
                            class="mt-1"
                            :checked="selectedUsers.includes(u.id)"
                            @change="toggleSelect(u.id)"
                        />
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center justify-between gap-2">
                                <div class="min-w-0">
                                    <p class="text-fg truncate text-[13px] font-medium">
                                        {{ u.displayName || u.username }}
                                    </p>
                                    <p class="text-fg-faint truncate text-[11px]">{{ u.email }}</p>
                                </div>
                                <NuxtLink
                                    :to="`/admin/users/${u.id}`"
                                    class="text-fg-faint hover:text-fg shrink-0 rounded-lg p-2"
                                >
                                    <Icon name="lucide:chevron-right" class="h-4 w-4" />
                                </NuxtLink>
                            </div>
                            <div class="mt-1.5 flex flex-wrap items-center gap-2">
                                <span
                                    v-for="ur in u.roles"
                                    :key="ur.role.id"
                                    class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    :style="{
                                        backgroundColor: (ur.role.color || '#6b7280') + '22',
                                        color: ur.role.color || '#6b7280',
                                    }"
                                    >{{ ur.role.displayName }}</span
                                >
                                <span
                                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    :class="
                                        u.banned
                                            ? 'bg-red-500/15 text-red-400'
                                            : !u.approved
                                              ? 'bg-amber-500/15 text-amber-400'
                                              : 'bg-green-500/15 text-green-400'
                                    "
                                    >{{
                                        u.banned
                                            ? $t("admin.users.banned")
                                            : !u.approved
                                              ? $t("admin.users.pending")
                                              : $t("admin.users.active")
                                    }}</span
                                >
                            </div>
                            <div class="text-fg-muted mt-1 flex items-center gap-3 text-[11px]">
                                <span
                                    >{{ u._count.enclosures }} {{ $t("admin.users.enclosures") }} ·
                                    {{ u._count.pets }} {{ $t("admin.users.pets") }}</span
                                >
                                <span class="text-fg-faint">{{
                                    u.lastActiveAt ? formatRelativeTime(u.lastActiveAt) : "—"
                                }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <table v-if="!loading" class="hidden w-full md:table">
                    <thead>
                        <tr
                            class="border-line text-fg-faint border-b text-left text-[11px] tracking-wider uppercase"
                        >
                            <th class="w-8 p-4">
                                <input
                                    type="checkbox"
                                    :checked="allSelected"
                                    @change="toggleSelectAll"
                                />
                            </th>
                            <th class="p-4">{{ $t("admin.users.user") }}</th>
                            <th class="hidden p-4 md:table-cell">{{ $t("admin.users.roles") }}</th>
                            <th class="hidden p-4 sm:table-cell">{{ $t("admin.users.stats") }}</th>
                            <th class="p-4">{{ $t("admin.users.status") }}</th>
                            <th class="p-4">{{ $t("admin.users.lastActive") }}</th>
                            <th class="w-20 p-4" />
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="u in users"
                            :key="u.id"
                            class="border-line-faint hover:bg-surface-hover border-b transition-colors"
                        >
                            <td class="p-4">
                                <input
                                    type="checkbox"
                                    :checked="selectedUsers.includes(u.id)"
                                    @change="toggleSelect(u.id)"
                                />
                            </td>
                            <td class="p-4">
                                <div>
                                    <p class="text-fg text-[13px] font-medium">
                                        {{ u.displayName || u.username }}
                                    </p>
                                    <p class="text-fg-faint text-[11px]">{{ u.email }}</p>
                                </div>
                            </td>
                            <td class="hidden p-4 md:table-cell">
                                <div class="flex flex-wrap gap-1">
                                    <span
                                        v-for="ur in u.roles"
                                        :key="ur.role.id"
                                        class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                        :style="{
                                            backgroundColor: (ur.role.color || '#6b7280') + '22',
                                            color: ur.role.color || '#6b7280',
                                        }"
                                    >
                                        {{ ur.role.displayName }}
                                    </span>
                                </div>
                            </td>
                            <td class="hidden p-4 sm:table-cell">
                                <p class="text-fg-muted text-[12px]">
                                    {{ u._count.enclosures }} {{ $t("admin.users.enclosures") }} ·
                                    {{ u._count.pets }} {{ $t("admin.users.pets") }}
                                </p>
                            </td>
                            <td class="p-4">
                                <span
                                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    :class="
                                        u.banned
                                            ? 'bg-red-500/15 text-red-400'
                                            : !u.approved
                                              ? 'bg-amber-500/15 text-amber-400'
                                              : 'bg-green-500/15 text-green-400'
                                    "
                                >
                                    {{
                                        u.banned
                                            ? $t("admin.users.banned")
                                            : !u.approved
                                              ? $t("admin.users.pending")
                                              : $t("admin.users.active")
                                    }}
                                </span>
                            </td>
                            <td class="text-fg-muted p-4 text-[12px]">
                                {{ u.lastActiveAt ? formatRelativeTime(u.lastActiveAt) : "—" }}
                            </td>
                            <td class="p-4">
                                <NuxtLink
                                    :to="`/admin/users/${u.id}`"
                                    class="text-fg-faint hover:bg-surface-hover hover:text-fg rounded-lg p-1.5 transition-colors"
                                >
                                    <Icon name="lucide:external-link" class="h-4 w-4" />
                                </NuxtLink>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Pagination -->
                <div v-if="meta" class="border-line flex items-center justify-between border-t p-4">
                    <p class="text-fg-muted text-[12px]">
                        {{
                            $t("admin.users.showing", {
                                from: (meta.page - 1) * meta.perPage + 1,
                                to: Math.min(meta.page * meta.perPage, meta.total),
                                total: meta.total,
                            })
                        }}
                    </p>
                    <div class="flex gap-1">
                        <button
                            class="text-fg-muted hover:bg-surface-hover rounded-lg px-3 py-2.5 text-[12px] disabled:opacity-30"
                            :disabled="meta.page <= 1"
                            @click="page = meta!.page - 1"
                        >
                            {{ $t("admin.prev") }}
                        </button>
                        <button
                            class="text-fg-muted hover:bg-surface-hover rounded-lg px-3 py-2.5 text-[12px] disabled:opacity-30"
                            :disabled="meta.page >= meta.totalPages"
                            @click="page = meta!.page + 1"
                        >
                            {{ $t("admin.next") }}
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <!-- ═══ Pending Approvals Tab ═══ -->
        <template v-else>
            <div class="glass-card overflow-x-auto">
                <div v-if="pendingLoading" class="space-y-0">
                    <div
                        v-for="i in 4"
                        :key="i"
                        class="border-line-faint flex items-center gap-3 border-b px-4 py-3"
                    >
                        <div class="flex-1 space-y-1">
                            <UiSkeleton width="140" height="13" />
                            <UiSkeleton width="180" height="11" />
                        </div>
                        <UiSkeleton width="64" height="28" rounded="lg" />
                        <UiSkeleton width="64" height="28" rounded="lg" />
                    </div>
                </div>

                <div v-else-if="!pendingUsers.length" class="py-12 text-center">
                    <Icon name="lucide:check-circle" class="mx-auto mb-3 h-8 w-8 text-green-400" />
                    <p class="text-fg-muted text-[13px]">{{ $t("admin.users.noPending") }}</p>
                </div>

                <div v-if="!pendingLoading && pendingUsers.length" class="space-y-0 md:hidden">
                    <div
                        v-for="u in pendingUsers"
                        :key="'pm-' + u.id"
                        class="border-line-faint flex items-center justify-between gap-3 border-b px-4 py-3"
                    >
                        <div class="min-w-0">
                            <p class="text-fg truncate text-[13px] font-medium">
                                {{ u.displayName || u.username }}
                            </p>
                            <p class="text-fg-faint truncate text-[11px]">{{ u.email }}</p>
                            <p class="text-fg-muted mt-0.5 text-[11px]">
                                {{ u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—" }}
                            </p>
                        </div>
                        <div class="flex shrink-0 gap-2">
                            <button
                                class="rounded-lg bg-green-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-green-500"
                                @click="handleApprove(u.id)"
                            >
                                {{ $t("admin.users.approve") }}
                            </button>
                            <button
                                class="rounded-lg bg-red-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-red-500"
                                @click="handleReject(u.id)"
                            >
                                {{ $t("admin.users.reject") }}
                            </button>
                        </div>
                    </div>
                </div>

                <table v-if="!pendingLoading && pendingUsers.length" class="hidden w-full md:table">
                    <thead>
                        <tr
                            class="border-line text-fg-faint border-b text-left text-[11px] tracking-wider uppercase"
                        >
                            <th class="p-4">{{ $t("admin.users.user") }}</th>
                            <th class="p-4">{{ $t("admin.users.registeredAt") }}</th>
                            <th class="w-40 p-4" />
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="u in pendingUsers"
                            :key="u.id"
                            class="border-line-faint hover:bg-surface-hover border-b transition-colors"
                        >
                            <td class="p-4">
                                <div>
                                    <p class="text-fg text-[13px] font-medium">
                                        {{ u.displayName || u.username }}
                                    </p>
                                    <p class="text-fg-faint text-[11px]">{{ u.email }}</p>
                                </div>
                            </td>
                            <td class="text-fg-muted p-4 text-[12px]">
                                {{ u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—" }}
                            </td>
                            <td class="p-4">
                                <div class="flex items-center gap-2">
                                    <button
                                        class="rounded-lg bg-green-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-green-500"
                                        @click="handleApprove(u.id)"
                                    >
                                        {{ $t("admin.users.approve") }}
                                    </button>
                                    <button
                                        class="rounded-lg bg-red-600/80 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-red-500"
                                        @click="handleReject(u.id)"
                                    >
                                        {{ $t("admin.users.reject") }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { AdminUser, PaginationMeta, Role } from "~/types/api";

definePageMeta({ layout: "admin" });

const admin = useAdminApi();
const toast = useToast();
const { t } = useI18n();
const queryClient = useQueryClient();

useHead({ title: () => `${t("admin.users.title")} — Admin` });

const { formatRelativeTime } = useFormatters();

// ── Tab state ──
const activeTab = ref<"users" | "pending">("users");

// ── Users tab state ──
const page = ref(1);
const search = ref("");
const filterRole = ref("");
const filterBanned = ref("");
const filterApproved = ref("");
const selectedUsers = ref<string[]>([]);
const bulkRoleId = ref("");

const debouncedSearch = ref("");
let debounceTimer: ReturnType<typeof setTimeout>;
function debouncedFetch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        page.value = 1;
        debouncedSearch.value = search.value;
    }, 300);
}

const { data: usersResult, isLoading: loading } = useQuery({
    queryKey: computed(() => [
        "admin-users",
        {
            page: page.value,
            search: debouncedSearch.value,
            role: filterRole.value,
            banned: filterBanned.value,
            approved: filterApproved.value,
        },
    ]),
    queryFn: async () => {
        const params: Record<string, string | number> = { page: page.value, limit: 20 };
        if (debouncedSearch.value) params.search = debouncedSearch.value;
        if (filterRole.value) params.role = filterRole.value;
        if (filterBanned.value) params.banned = filterBanned.value;
        if (filterApproved.value) params.approved = filterApproved.value;
        return admin.listUsers(params);
    },
});

const users = computed(() => usersResult.value?.items ?? []);
const meta = computed(() => usersResult.value?.meta ?? null);

const { data: rolesData } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => admin.listRoles(),
});

const roles = computed(() => rolesData.value ?? []);

// ── Pending approvals state ──
const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-users"],
    queryFn: () => admin.listPendingApprovals(),
});

const pendingUsers = computed(() => pendingData.value ?? []);

const allSelected = computed(
    () => users.value.length > 0 && selectedUsers.value.length === users.value.length,
);

function fetchUsers() {
    debouncedSearch.value = search.value;
}

function toggleSelect(userId: string) {
    const idx = selectedUsers.value.indexOf(userId);
    if (idx >= 0) selectedUsers.value.splice(idx, 1);
    else selectedUsers.value.push(userId);
}

function toggleSelectAll() {
    if (allSelected.value) {
        selectedUsers.value = [];
    } else {
        selectedUsers.value = users.value.map((u) => u.id);
    }
}

async function handleBulkAssign() {
    if (!bulkRoleId.value || !selectedUsers.value.length) return;
    await admin.bulkAssignRole(selectedUsers.value, bulkRoleId.value);
    toast.add({ title: t("admin.users.rolesAssigned"), color: "green", timeout: 3000 });
    selectedUsers.value = [];
    bulkRoleId.value = "";
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
}

async function fetchPending() {
    await queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
}

async function handleApprove(userId: string) {
    await admin.approveUser(userId);
    toast.add({ title: t("admin.users.userApproved"), color: "green", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
}

async function handleReject(userId: string) {
    await admin.rejectUser(userId);
    toast.add({ title: t("admin.users.userRejected"), color: "red", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
}
</script>
