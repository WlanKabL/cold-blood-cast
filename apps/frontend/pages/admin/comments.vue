<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("admin.comments.title") }}
            </h1>
        </div>

        <!-- Filter -->
        <div class="flex flex-wrap gap-3">
            <button
                v-for="f in approvalFilters"
                :key="f.value"
                class="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
                :class="
                    approvalFilter === f.value
                        ? f.activeClass
                        : 'border-line text-fg-dim hover:bg-surface-hover border'
                "
                @click="approvalFilter = f.value"
            >
                {{ $t(`admin.comments.${f.label}`) }}
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="glass-card space-y-3 p-5">
                <UiSkeleton width="120" height="14" />
                <UiSkeleton width="100%" height="12" />
                <UiSkeleton width="80" height="11" />
            </div>
        </div>

        <!-- Comments List -->
        <div v-else class="space-y-3">
            <div v-if="!comments.length" class="glass-card p-8 text-center">
                <Icon name="lucide:message-square" class="text-fg-faint mx-auto mb-3 h-10 w-10" />
                <p class="text-fg-muted text-[13px]">{{ $t("admin.comments.empty") }}</p>
            </div>

            <div v-for="comment in comments" :key="comment.id" class="glass-card p-5">
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-fg text-[13px] font-medium">
                                {{ comment.authorName }}
                            </span>
                            <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                :class="
                                    comment.approved
                                        ? 'bg-green-500/15 text-green-400'
                                        : 'bg-amber-500/15 text-amber-400'
                                "
                            >
                                {{
                                    comment.approved
                                        ? $t("admin.comments.approved")
                                        : $t("admin.comments.pending")
                                }}
                            </span>
                        </div>
                        <p class="text-fg-muted mt-1 text-[13px]">{{ comment.content }}</p>
                        <div class="text-fg-faint mt-2 flex flex-wrap gap-3 text-[11px]">
                            <span>
                                <Icon name="lucide:tag" class="mr-0.5 inline h-3 w-3" />
                                {{ $t(`admin.reports.type.${comment.profileType}`) }}
                            </span>
                            <span>
                                <Icon name="lucide:clock" class="mr-0.5 inline h-3 w-3" />
                                {{ new Date(comment.createdAt).toLocaleString() }}
                            </span>
                        </div>
                    </div>
                    <button
                        class="text-fg-faint shrink-0 rounded-lg p-2 hover:text-red-400"
                        :title="$t('admin.comments.delete')"
                        @click="handleDelete(comment.id)"
                    >
                        <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </button>
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
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const { t } = useI18n();
const toast = useAppToast();
const { listAdminComments, deleteAdminComment } = useAdminApi();

const loading = ref(true);
const page = ref(1);
const totalPages = ref(1);
const approvalFilter = ref<"all" | "approved" | "pending">("all");

const comments = ref<
    Array<{
        id: string;
        authorName: string;
        content: string;
        approved: boolean;
        profileType: string;
        profileId: string;
        createdAt: string;
    }>
>([]);

const approvalFilters = [
    { value: "all" as const, label: "all", activeClass: "bg-primary-500/15 text-primary-400" },
    {
        value: "approved" as const,
        label: "approved",
        activeClass: "bg-green-500/15 text-green-400",
    },
    { value: "pending" as const, label: "pending", activeClass: "bg-amber-500/15 text-amber-400" },
];

async function fetchComments() {
    loading.value = true;
    try {
        const params: Record<string, string | number> = { page: page.value, limit: 20 };
        if (approvalFilter.value === "approved") params.approved = "true";
        else if (approvalFilter.value === "pending") params.approved = "false";
        const res = await listAdminComments(params);
        comments.value = res?.items ?? [];
        totalPages.value = res?.meta?.totalPages ?? 1;
    } catch {
        comments.value = [];
    }
    loading.value = false;
}

async function handleDelete(commentId: string) {
    if (!confirm(t("admin.comments.deleteConfirm"))) return;
    try {
        await deleteAdminComment(commentId);
        toast.success(t("admin.comments.deleted"));
        await fetchComments();
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
}

watch([approvalFilter, page], () => fetchComments());

onMounted(() => fetchComments());
</script>
