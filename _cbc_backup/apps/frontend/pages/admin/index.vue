<template>
    <div class="space-y-6">
        <!-- Stats Grid -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="stat in stats" :key="stat.label" class="glass-card p-5">
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg"
                        :class="stat.bgClass"
                    >
                        <Icon :name="stat.icon" class="h-5 w-5" :class="stat.iconClass" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-fg">{{ stat.value }}</p>
                        <p class="text-xs text-fg-muted">{{ stat.label }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pending Approvals -->
        <div v-if="pendingApprovals?.length">
            <h2 class="mb-4 text-lg font-semibold text-fg">
                {{ $t("admin.dashboard.pending_approvals") }}
            </h2>
            <div class="glass-card divide-y divide-line">
                <div
                    v-for="user in pendingApprovals"
                    :key="user.id"
                    class="flex items-center justify-between p-4"
                >
                    <div>
                        <p class="font-medium text-fg">{{ user.username }}</p>
                        <p class="text-sm text-fg-muted">{{ user.email }}</p>
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
                            @click="handleApprove(user.id)"
                        >
                            {{ $t("admin.users.approve") }}
                        </button>
                        <button
                            class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
                            @click="handleReject(user.id)"
                        >
                            {{ $t("admin.users.reject") }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Admin — Cold Blood Cast" });

const { t } = useI18n();
const admin = useAdmin();
const queryClient = useQueryClient();

const { data: platformStats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => admin.getStats(),
});

const { data: pendingApprovals } = useQuery({
    queryKey: ["admin", "approvals"],
    queryFn: () => admin.listApprovals(),
    select: (data: unknown[]) => data ?? [],
});

const stats = computed(() => {
    const s = platformStats.value;
    return [
        {
            icon: "lucide:users",
            label: t("admin.dashboard.total_users"),
            value: s?.totalUsers ?? 0,
            bgClass: "bg-blue-500/10",
            iconClass: "text-blue-400",
        },
        {
            icon: "lucide:activity",
            label: t("admin.dashboard.active_users"),
            value: s?.activeUsers ?? 0,
            bgClass: "bg-emerald-500/10",
            iconClass: "text-emerald-400",
        },
        {
            icon: "lucide:ban",
            label: t("admin.dashboard.banned_users"),
            value: s?.bannedUsers ?? 0,
            bgClass: "bg-red-500/10",
            iconClass: "text-red-400",
        },
        {
            icon: "lucide:user-plus",
            label: t("admin.dashboard.new_today"),
            value: s?.newToday ?? 0,
            bgClass: "bg-purple-500/10",
            iconClass: "text-purple-400",
        },
    ];
});

async function handleApprove(userId: string) {
    await admin.approveUser(userId);
    queryClient.invalidateQueries({ queryKey: ["admin", "approvals"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
}

async function handleReject(userId: string) {
    await admin.rejectUser(userId);
    queryClient.invalidateQueries({ queryKey: ["admin", "approvals"] });
}
</script>
