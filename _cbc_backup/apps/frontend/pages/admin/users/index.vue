<template>
    <div class="space-y-6">
        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
            <input
                v-model="search"
                type="text"
                :placeholder="$t('admin.users.search')"
                class="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-sm text-fg placeholder-fg-soft outline-none transition focus:border-emerald-500 sm:max-w-sm"
                @input="debouncedRefetch"
            />
            <select
                v-model="statusFilter"
                class="rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-emerald-500"
                @change="resetAndRefetch"
            >
                <option value="all">{{ $t("admin.users.all_status") }}</option>
                <option value="active">{{ $t("admin.users.active") }}</option>
                <option value="banned">{{ $t("admin.users.banned") }}</option>
                <option value="pending">{{ $t("admin.users.pending") }}</option>
            </select>
        </div>

        <!-- Users Table -->
        <div class="overflow-x-auto glass-card">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-b border-line text-xs uppercase tracking-wider text-fg-muted">
                        <th class="px-4 py-3">{{ $t("admin.users.username") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.users.email") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.users.roles") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.users.status") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.users.joined") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.users.last_active") }}</th>
                        <th class="px-4 py-3 text-right">{{ $t("common.actions") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="u in users"
                        :key="u.id"
                        class="border-b border-line last:border-b-0 transition hover:bg-hover cursor-pointer"
                        @click="navigateTo(`/admin/users/${u.id}`)"
                    >
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <div
                                    class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
                                >
                                    {{
                                        (u.displayName || u.username || "?").charAt(0).toUpperCase()
                                    }}
                                </div>
                                <div>
                                    <p class="font-medium text-fg">
                                        {{ u.displayName || u.username }}
                                    </p>
                                    <p class="text-xs text-fg-muted">{{ u.username }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-fg-muted">{{ u.email }}</td>
                        <td class="px-4 py-3">
                            <div class="flex flex-wrap gap-1">
                                <span
                                    v-for="role in u.roles"
                                    :key="role.id"
                                    class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                    :style="{
                                        backgroundColor: (role.color || '#10b981') + '20',
                                        color: role.color || '#10b981',
                                    }"
                                >
                                    {{ role.displayName }}
                                </span>
                            </div>
                        </td>
                        <td class="px-4 py-3">
                            <span
                                v-if="u.banned"
                                class="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-400"
                                >{{ $t("admin.users.banned") }}</span
                            >
                            <span
                                v-else-if="u.approved === false"
                                class="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-400"
                                >{{ $t("admin.users.pending") }}</span
                            >
                            <span
                                v-else
                                class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
                                >{{ $t("admin.users.active") }}</span
                            >
                        </td>
                        <td class="px-4 py-3 text-fg-muted">{{ formatDate(u.createdAt) }}</td>
                        <td class="px-4 py-3 text-fg-muted text-xs">
                            {{ u.lastActiveAt ? formatDate(u.lastActiveAt) : "—" }}
                        </td>
                        <td class="px-4 py-3 text-right" @click.stop>
                            <div class="flex items-center justify-end gap-2">
                                <button
                                    v-if="!u.banned"
                                    class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                                    @click="handleBan(u.id)"
                                >
                                    {{ $t("admin.users.ban") }}
                                </button>
                                <button
                                    v-else
                                    class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-emerald-500 hover:text-emerald-400"
                                    @click="handleUnban(u.id)"
                                >
                                    {{ $t("admin.users.unban") }}
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="users.length === 0 && !isLoading">
                        <td colspan="7" class="px-4 py-12 text-center text-fg-muted">
                            {{ $t("common.no_data") }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
            <button
                :disabled="page <= 1"
                class="rounded-lg border border-line px-3 py-1.5 text-xs text-fg-muted transition hover:bg-hover disabled:opacity-50"
                @click="page--"
            >
                {{ $t("common.prev") }}
            </button>
            <span class="text-sm text-fg-muted">{{ page }} / {{ totalPages }}</span>
            <button
                :disabled="page >= totalPages"
                class="rounded-lg border border-line px-3 py-1.5 text-xs text-fg-muted transition hover:bg-hover disabled:opacity-50"
                @click="page++"
            >
                {{ $t("common.next") }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Users — Admin — Cold Blood Cast" });

const admin = useAdmin();
const queryClient = useQueryClient();

const search = ref("");
const page = ref(1);
const statusFilter = ref("all");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedRefetch() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        page.value = 1;
    }, 300);
}

function resetAndRefetch() {
    page.value = 1;
}

interface AdminUser {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    isAdmin: boolean;
    banned: boolean;
    approved: boolean;
    lastActiveAt: string | null;
    createdAt: string;
    roles: Array<{ id: string; name: string; displayName: string; color: string | null }>;
}

const queryParams = computed(() => {
    const params: Record<string, string | number> = {
        page: page.value,
        limit: 25,
    };
    if (search.value) params.search = search.value;
    if (statusFilter.value === "banned") params.banned = "true";
    else if (statusFilter.value === "pending") params.approved = "false";
    else if (statusFilter.value === "active") {
        params.banned = "false";
        params.approved = "true";
    }
    return params;
});

const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin", "users", queryParams],
    queryFn: () => admin.listUsers(queryParams.value),
});

const users = computed<AdminUser[]>(() => {
    const d = usersData.value;
    if (!d) return [];
    const list = d.items ?? d.users ?? (Array.isArray(d) ? d : []);
    return list.map((u: Record<string, unknown>) => ({
        ...u,
        roles:
            (u.roles as Array<Record<string, unknown>>)?.map((r: Record<string, unknown>) =>
                r.role ? { ...(r.role as object), userRoleId: r.id } : r,
            ) ?? [],
    }));
});

const totalPages = computed(() => {
    const d = usersData.value;
    return d?.meta?.totalPages ?? 1;
});

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
}

async function handleBan(userId: string) {
    await admin.banUser(userId);
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
}

async function handleUnban(userId: string) {
    await admin.unbanUser(userId);
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
}
</script>
