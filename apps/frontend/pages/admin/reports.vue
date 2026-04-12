<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("admin.reports.title") }}
            </h1>
        </div>

        <!-- Stats -->
        <div v-if="stats" class="flex flex-wrap gap-3">
            <button
                v-for="s in statusFilters"
                :key="s.value"
                class="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
                :class="
                    statusFilter === s.value
                        ? s.activeClass
                        : 'border-line text-fg-dim hover:bg-surface-hover border'
                "
                @click="statusFilter = s.value"
            >
                {{ $t(`admin.reports.${s.value}`) }}
                <span class="ml-1 opacity-70">{{ stats[s.value] ?? 0 }}</span>
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="glass-card space-y-3 p-5">
                <div class="flex items-center gap-2">
                    <UiSkeleton width="60" height="18" rounded="full" />
                    <UiSkeleton width="80" height="18" rounded="full" />
                </div>
                <UiSkeleton width="100%" height="12" />
                <UiSkeleton width="140" height="11" />
            </div>
        </div>

        <!-- Reports List -->
        <div v-else class="space-y-3">
            <div v-if="!reports.length" class="glass-card p-8 text-center">
                <Icon name="lucide:shield-check" class="text-fg-faint mx-auto mb-3 h-10 w-10" />
                <p class="text-fg-muted text-[13px]">{{ $t("admin.reports.empty") }}</p>
            </div>

            <div v-for="report in reports" :key="report.id" class="glass-card p-5">
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                :class="targetTypeClass(report.targetType)"
                            >
                                {{ $t(`admin.reports.type.${report.targetType}`) }}
                            </span>
                            <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                :class="reasonClass(report.reason)"
                            >
                                {{ $t(`report.reasons.${report.reason}`) }}
                            </span>
                            <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                :class="statusClass(report.status)"
                            >
                                {{ $t(`admin.reports.${report.status}`) }}
                            </span>
                        </div>

                        <p v-if="report.description" class="text-fg-muted mt-2 text-[13px]">
                            {{ report.description }}
                        </p>

                        <div class="text-fg-faint mt-2 flex flex-wrap gap-3 text-[11px]">
                            <span v-if="report.reporterName">
                                <Icon name="lucide:user" class="mr-0.5 inline h-3 w-3" />
                                {{ report.reporterName }}
                            </span>
                            <span>
                                <Icon name="lucide:clock" class="mr-0.5 inline h-3 w-3" />
                                {{ new Date(report.createdAt).toLocaleString() }}
                            </span>
                            <NuxtLink
                                v-if="report.targetUser"
                                :to="`/admin/users/${report.targetUser.id}`"
                                class="text-primary-400 hover:text-primary-300"
                            >
                                <Icon name="lucide:user-cog" class="mr-0.5 inline h-3 w-3" />
                                {{ report.targetUser.username }}
                                <span v-if="report.targetUser.banned" class="ml-0.5 text-red-400"
                                    >({{ $t("admin.reports.banned") }})</span
                                >
                            </NuxtLink>
                            <a
                                v-if="report.targetUrl"
                                :href="report.targetUrl"
                                target="_blank"
                                class="text-primary-400 hover:text-primary-300"
                            >
                                <Icon name="lucide:external-link" class="mr-0.5 inline h-3 w-3" />
                                {{ $t("admin.reports.viewTarget") }}
                            </a>
                        </div>

                        <div v-if="report.resolvedBy" class="text-fg-faint mt-2 text-[11px]">
                            {{ $t("admin.reports.resolvedBy") }} {{ report.resolvedBy.username }}
                            <span v-if="report.adminNote"> — {{ report.adminNote }}</span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div v-if="report.status === 'pending'" class="flex shrink-0 gap-1">
                        <button
                            class="text-fg-faint rounded-lg p-2 hover:text-green-400"
                            :title="$t('admin.reports.markReviewed')"
                            @click="openResolveModal(report.id, 'reviewed')"
                        >
                            <Icon name="lucide:check-circle" class="h-4 w-4" />
                        </button>
                        <button
                            class="text-fg-faint rounded-lg p-2 hover:text-amber-400"
                            :title="$t('admin.reports.dismiss')"
                            @click="openResolveModal(report.id, 'dismissed')"
                        >
                            <Icon name="lucide:x-circle" class="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center gap-2">
            <button
                v-for="p in totalPages"
                :key="p"
                class="rounded-lg px-3 py-1 text-[12px] transition-colors"
                :class="
                    p === page
                        ? 'bg-primary-500 text-white'
                        : 'border-line text-fg-dim hover:bg-surface-hover border'
                "
                @click="page = p"
            >
                {{ p }}
            </button>
        </div>

        <!-- Resolve Modal -->
        <Teleport to="body">
            <Transition name="fade">
                <div
                    v-if="resolveModal.open"
                    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    @click.self="resolveModal.open = false"
                >
                    <div class="glass-card w-full max-w-md p-6">
                        <h2 class="text-fg mb-4 text-lg font-semibold">
                            {{
                                resolveModal.status === "reviewed"
                                    ? $t("admin.reports.markReviewed")
                                    : $t("admin.reports.dismiss")
                            }}
                        </h2>

                        <!-- Admin Actions -->
                        <div
                            v-if="resolveModal.status === 'reviewed' && resolveModal.report"
                            class="mb-4 space-y-2"
                        >
                            <p
                                class="text-fg-faint text-[11px] font-semibold tracking-wider uppercase"
                            >
                                {{ $t("admin.reports.actions") }}
                            </p>

                            <!-- Ban reported user (for user_profile reports) -->
                            <button
                                v-if="
                                    resolveModal.report.targetType === 'user_profile' &&
                                    resolveModal.report.targetUser
                                "
                                class="border-line text-fg-dim flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-[12px] hover:border-red-500/40 hover:text-red-400"
                                :disabled="actionLoading"
                                @click="handleBanUser(resolveModal.report!.targetUser!.id)"
                            >
                                <Icon name="lucide:ban" class="h-3.5 w-3.5" />
                                {{ $t("admin.reports.banUser") }}
                            </button>

                            <!-- Delete comment (for comment reports) -->
                            <button
                                v-if="resolveModal.report.targetType === 'comment'"
                                class="border-line text-fg-dim flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-[12px] hover:border-red-500/40 hover:text-red-400"
                                :disabled="actionLoading"
                                @click="handleDeleteComment(resolveModal.report!.targetId)"
                            >
                                <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                                {{ $t("admin.reports.deleteContent") }}
                            </button>

                            <!-- View user in admin panel -->
                            <NuxtLink
                                v-if="
                                    resolveModal.report.targetType === 'user_profile' &&
                                    resolveModal.report.targetUser
                                "
                                :to="`/admin/users/${resolveModal.report.targetUser.id}`"
                                class="border-line text-fg-dim hover:border-primary-500/40 hover:text-primary-400 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-[12px]"
                            >
                                <Icon name="lucide:user-cog" class="h-3.5 w-3.5" />
                                {{ $t("admin.reports.viewUserAdmin") }}
                            </NuxtLink>
                        </div>

                        <textarea
                            v-model="resolveModal.note"
                            :placeholder="$t('admin.reports.adminNotePlaceholder')"
                            rows="3"
                            class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
                        />
                        <div class="mt-4 flex justify-end gap-2">
                            <button
                                class="border-line text-fg-dim rounded-xl border px-4 py-2 text-[13px]"
                                @click="resolveModal.open = false"
                            >
                                {{ $t("common.cancel") }}
                            </button>
                            <button
                                class="rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                                :class="
                                    resolveModal.status === 'reviewed'
                                        ? 'bg-green-600 hover:bg-green-500'
                                        : 'bg-amber-600 hover:bg-amber-500'
                                "
                                :disabled="resolving"
                                @click="handleResolve"
                            >
                                {{ $t("common.confirm") }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const { t } = useI18n();
const toast = useAppToast();
const { listReports, getReportStats, resolveReport, banUser, deleteAdminComment } = useAdminApi();

const loading = ref(true);
const resolving = ref(false);
const actionLoading = ref(false);
const page = ref(1);
const totalPages = ref(1);
const statusFilter = ref<"pending" | "reviewed" | "dismissed">("pending");

interface ReportItem {
    id: string;
    targetType: string;
    targetId: string;
    targetUrl: string | null;
    reason: string;
    description: string | null;
    reporterName: string | null;
    status: "pending" | "reviewed" | "dismissed";
    adminNote: string | null;
    resolvedAt: string | null;
    resolvedBy: { id: string; username: string } | null;
    targetUser: { id: string; username: string; banned: boolean } | null;
    createdAt: string;
}

const reports = ref<ReportItem[]>([]);
const stats = ref<{ pending: number; reviewed: number; dismissed: number } | null>(null);

const resolveModal = reactive({
    open: false,
    reportId: "",
    status: "reviewed" as "reviewed" | "dismissed",
    note: "",
    report: null as ReportItem | null,
});

const statusFilters = [
    { value: "pending" as const, activeClass: "bg-amber-500/15 text-amber-400" },
    { value: "reviewed" as const, activeClass: "bg-green-500/15 text-green-400" },
    { value: "dismissed" as const, activeClass: "bg-gray-500/15 text-gray-400" },
];

function targetTypeClass(type: string) {
    const map: Record<string, string> = {
        comment: "bg-blue-500/15 text-blue-400",
        user_profile: "bg-purple-500/15 text-purple-400",
        pet_profile: "bg-cyan-500/15 text-cyan-400",
    };
    return map[type] ?? "bg-gray-500/15 text-gray-400";
}

function reasonClass(reason: string) {
    const map: Record<string, string> = {
        spam: "bg-orange-500/15 text-orange-400",
        harassment: "bg-red-500/15 text-red-400",
        inappropriate: "bg-pink-500/15 text-pink-400",
        misinformation: "bg-yellow-500/15 text-yellow-400",
        other: "bg-gray-500/15 text-gray-400",
    };
    return map[reason] ?? "bg-gray-500/15 text-gray-400";
}

function statusClass(status: string) {
    const map: Record<string, string> = {
        pending: "bg-amber-500/15 text-amber-400",
        reviewed: "bg-green-500/15 text-green-400",
        dismissed: "bg-gray-500/15 text-gray-400",
    };
    return map[status] ?? "bg-gray-500/15 text-gray-400";
}

async function fetchReports() {
    loading.value = true;
    try {
        const res = await listReports({ status: statusFilter.value, page: page.value, limit: 20 });
        reports.value = res?.items ?? [];
        totalPages.value = res?.meta?.totalPages ?? 1;
    } catch {
        reports.value = [];
    }
    loading.value = false;
}

async function fetchStats() {
    try {
        stats.value = await getReportStats();
    } catch {
        stats.value = null;
    }
}

function openResolveModal(reportId: string, status: "reviewed" | "dismissed") {
    resolveModal.reportId = reportId;
    resolveModal.status = status;
    resolveModal.note = "";
    resolveModal.report = reports.value.find((r) => r.id === reportId) ?? null;
    resolveModal.open = true;
}

async function handleResolve() {
    resolving.value = true;
    try {
        await resolveReport(resolveModal.reportId, {
            status: resolveModal.status,
            adminNote: resolveModal.note || undefined,
        });
        toast.success(t("admin.reports.resolved"));
        resolveModal.open = false;
        await Promise.all([fetchReports(), fetchStats()]);
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
    resolving.value = false;
}

async function handleBanUser(userId: string) {
    actionLoading.value = true;
    try {
        await banUser(userId, t("admin.reports.bannedViaReport"));
        toast.success(t("admin.reports.userBanned"));
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
    actionLoading.value = false;
}

async function handleDeleteComment(commentId: string) {
    actionLoading.value = true;
    try {
        await deleteAdminComment(commentId);
        toast.success(t("admin.reports.contentDeleted"));
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
    actionLoading.value = false;
}

watch([statusFilter, page], () => fetchReports());

onMounted(async () => {
    await Promise.all([fetchReports(), fetchStats()]);
});
</script>
