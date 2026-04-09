<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("admin.dashboard.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-[13px]">{{ $t("admin.dashboard.subtitle") }}</p>
            </div>
            <div class="text-fg-muted text-right text-[11px]">
                <p>Frontend: v{{ appVersion }}</p>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-6">
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <div v-for="i in 4" :key="i" class="glass-card flex items-center gap-3 p-4">
                    <UiSkeleton width="40" height="40" rounded="xl" />
                    <div class="space-y-1">
                        <UiSkeleton width="48" height="22" />
                        <UiSkeleton width="64" height="11" />
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <div v-for="i in 5" :key="i" class="glass-card space-y-1 p-4">
                    <UiSkeleton width="48" height="18" />
                    <UiSkeleton width="64" height="11" />
                </div>
            </div>
        </div>

        <template v-else-if="stats">
            <!-- Primary Stats -->
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <div v-for="stat in primaryStats" :key="stat.label" class="glass-card p-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl"
                            :class="stat.bgClass"
                        >
                            <Icon :name="stat.icon" class="h-5 w-5" :class="stat.iconClass" />
                        </div>
                        <div>
                            <p class="text-fg text-[22px] font-bold">{{ stat.value }}</p>
                            <p class="text-fg-muted text-[11px]">{{ $t(stat.label) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Secondary Stats -->
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <div v-for="stat in secondaryStats" :key="stat.label" class="glass-card p-4">
                    <p class="text-fg text-[18px] font-bold">{{ stat.value }}</p>
                    <p class="text-fg-muted text-[11px]">{{ $t(stat.label) }}</p>
                </div>
            </div>

            <!-- Pending Reviews -->
            <div v-if="stats.pendingAccessRequests > 0" class="glass-card border-amber-500/20 p-4">
                <div class="flex items-center gap-2 text-amber-300">
                    <Icon name="lucide:alert-triangle" class="h-5 w-5" />
                    <span class="text-[13px] font-semibold">{{
                        $t("admin.dashboard.pendingReviews")
                    }}</span>
                </div>
                <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    <NuxtLink
                        to="/admin/access-requests"
                        class="text-fg-muted hover:text-fg text-[13px]"
                    >
                        {{ stats.pendingAccessRequests }}
                        {{ $t("admin.dashboard.accessRequests") }}
                    </NuxtLink>
                </div>
            </div>

            <!-- User Growth Chart Placeholder -->
            <div class="glass-card p-6">
                <h2 class="text-fg mb-4 text-[15px] font-semibold">
                    {{ $t("admin.dashboard.userGrowth") }}
                </h2>
                <div v-if="growth.length" class="flex h-40 items-end gap-1">
                    <div
                        v-for="point in growth"
                        :key="point.date"
                        class="bg-primary-500/40 hover:bg-primary-500/60 flex-1 rounded-t transition-all"
                        :style="{ height: `${getBarHeight(point.count)}%` }"
                        :title="`${point.date}: ${point.count}`"
                    />
                </div>
                <p v-else class="text-fg-muted text-[13px]">{{ $t("admin.dashboard.noData") }}</p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import type { PlatformStats, UserGrowthPoint } from "~/types/api";

definePageMeta({ layout: "admin" });

const { t } = useI18n();
const {
    public: { appVersion },
} = useRuntimeConfig();

useHead({ title: () => `${t("admin.dashboard.title")} — Admin` });

const admin = useAdminApi();

const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
        const [stats, growth] = await Promise.all([
            admin.getPlatformStats(),
            admin.getUserGrowth(30),
        ]);
        return { stats, growth };
    },
});

const stats = computed(() => dashboardData.value?.stats ?? null);
const growth = computed(() => dashboardData.value?.growth ?? []);

const primaryStats = computed(() => {
    if (!stats.value) return [];
    return [
        {
            label: "admin.dashboard.totalUsers",
            value: stats.value.totalUsers,
            icon: "lucide:users",
            bgClass: "bg-primary-500/15",
            iconClass: "text-primary-400",
        },
        {
            label: "admin.dashboard.activeUsers",
            value: stats.value.activeUsers,
            icon: "lucide:activity",
            bgClass: "bg-green-500/15",
            iconClass: "text-green-400",
        },
        {
            label: "admin.dashboard.premiumUsers",
            value: stats.value.premiumUsers,
            icon: "lucide:crown",
            bgClass: "bg-amber-500/15",
            iconClass: "text-amber-400",
        },
        {
            label: "admin.dashboard.bannedUsers",
            value: stats.value.bannedUsers,
            icon: "lucide:ban",
            bgClass: "bg-red-500/15",
            iconClass: "text-red-400",
        },
    ];
});

const secondaryStats = computed(() => {
    if (!stats.value) return [];
    return [
        { label: "admin.dashboard.totalEnclosures", value: stats.value.totalEnclosures },
        { label: "admin.dashboard.totalSensors", value: stats.value.totalSensors },
        { label: "admin.dashboard.totalPets", value: stats.value.totalPets },
        { label: "admin.dashboard.todayNewUsers", value: stats.value.todayNewUsers },
        { label: "admin.dashboard.totalAuditLogs", value: stats.value.totalAuditLogs },
    ];
});

function getBarHeight(count: number): number {
    const max = Math.max(...growth.value.map((p) => p.count), 1);
    return Math.max((count / max) * 100, 4);
}
</script>
