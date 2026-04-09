<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-xl font-bold">{{ $t("admin.accessRequests.title") }}</h1>
                <p class="text-fg-muted mt-1 text-[13px]">
                    {{ $t("admin.accessRequests.subtitle") }}
                </p>
            </div>
        </div>

        <!-- Filter tabs -->
        <div class="flex flex-wrap gap-2">
            <button
                v-for="tab in statusTabs"
                :key="tab.value"
                class="rounded-xl px-4 py-1.5 text-[12px] font-medium transition"
                :class="
                    filterStatus === tab.value
                        ? 'bg-primary-600 text-white'
                        : 'border-line text-fg-muted hover:bg-surface-hover border'
                "
                @click="filterStatus = tab.value"
            >
                {{ $t(tab.label) }}
                <span
                    v-if="tab.value === 'pending' && pendingCount > 0"
                    class="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                >
                    {{ pendingCount }}
                </span>
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="glass-card overflow-hidden">
            <div
                v-for="i in 5"
                :key="i"
                class="border-line-faint flex items-center gap-4 border-b px-4 py-3"
            >
                <div class="flex-1 space-y-1">
                    <UiSkeleton width="160" height="13" />
                    <UiSkeleton width="120" height="11" />
                </div>
                <UiSkeleton width="56" height="18" rounded="full" />
                <UiSkeleton width="64" height="28" rounded="lg" />
            </div>
        </div>

        <!-- Empty -->
        <div v-else-if="!requests?.length" class="glass-card py-12 text-center">
            <Icon name="lucide:inbox" class="text-fg-faint mx-auto mb-3 h-8 w-8" />
            <p class="text-fg-muted text-[13px]">{{ $t("admin.accessRequests.empty") }}</p>
        </div>

        <!-- Table -->
        <div v-else class="glass-card overflow-x-auto">
            <div class="space-y-0 md:hidden">
                <div
                    v-for="req in requests"
                    :key="'m-' + req.id"
                    class="border-line-faint border-b px-4 py-3"
                >
                    <div class="flex items-center justify-between gap-2">
                        <div class="min-w-0">
                            <p class="text-fg truncate text-[13px] font-medium">{{ req.email }}</p>
                            <p class="text-fg-muted mt-0.5 truncate text-[11px]">
                                {{ req.reason || "—" }}
                            </p>
                            <p class="text-fg-faint mt-0.5 text-[11px]">
                                {{ new Date(req.createdAt).toLocaleDateString() }}
                            </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-2">
                            <span
                                class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                :class="suggestionStatusBadge(req.status)"
                                >{{ $t(`admin.accessRequests.statusLabel.${req.status}`) }}</span
                            >
                            <template v-if="req.status === 'pending'">
                                <button
                                    class="rounded-lg bg-green-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-green-500"
                                    @click="handleReview(req.id, 'approved')"
                                >
                                    {{ $t("admin.accessRequests.approve") }}
                                </button>
                                <button
                                    class="rounded-lg bg-red-600/80 px-3 py-2 text-[12px] font-medium text-white hover:bg-red-500"
                                    @click="handleReview(req.id, 'rejected')"
                                >
                                    {{ $t("admin.accessRequests.reject") }}
                                </button>
                            </template>
                            <button
                                v-else
                                class="text-fg-faint rounded-lg p-2.5 hover:text-red-400"
                                @click="handleDelete(req.id)"
                            >
                                <Icon name="lucide:trash-2" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <table class="hidden w-full md:table">
                <thead>
                    <tr
                        class="border-line text-fg-faint border-b text-left text-[11px] tracking-wider uppercase"
                    >
                        <th class="p-4">{{ $t("admin.accessRequests.email") }}</th>
                        <th class="p-4">{{ $t("admin.accessRequests.reason") }}</th>
                        <th class="p-4">{{ $t("admin.accessRequests.date") }}</th>
                        <th class="p-4">{{ $t("admin.accessRequests.status") }}</th>
                        <th class="w-40 p-4" />
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="req in requests"
                        :key="req.id"
                        class="border-line-faint hover:bg-surface-hover border-b transition-colors"
                    >
                        <td class="text-fg p-4 text-[13px]">{{ req.email }}</td>
                        <td class="text-fg-muted max-w-xs truncate p-4 text-[12px]">
                            {{ req.reason || "—" }}
                        </td>
                        <td class="text-fg-muted p-4 text-[12px]">
                            {{ new Date(req.createdAt).toLocaleDateString() }}
                        </td>
                        <td class="p-4">
                            <span
                                class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                :class="suggestionStatusBadge(req.status)"
                            >
                                {{ $t(`admin.accessRequests.statusLabel.${req.status}`) }}
                            </span>
                        </td>
                        <td class="p-4">
                            <div v-if="req.status === 'pending'" class="flex items-center gap-2">
                                <button
                                    class="rounded-lg bg-green-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-green-500"
                                    @click="handleReview(req.id, 'approved')"
                                >
                                    {{ $t("admin.accessRequests.approve") }}
                                </button>
                                <button
                                    class="rounded-lg bg-red-600/80 px-3 py-2 text-[12px] font-medium text-white hover:bg-red-500"
                                    @click="handleReview(req.id, 'rejected')"
                                >
                                    {{ $t("admin.accessRequests.reject") }}
                                </button>
                            </div>
                            <button
                                v-else
                                class="text-fg-faint rounded-lg p-2.5 hover:text-red-400"
                                @click="handleDelete(req.id)"
                            >
                                <Icon name="lucide:trash-2" class="h-4 w-4" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { AccessRequest } from "~/types/api";

definePageMeta({ layout: "admin" });

const admin = useAdminApi();
const toast = useToast();
const { t } = useI18n();
const queryClient = useQueryClient();

useHead({ title: () => `${t("admin.accessRequests.title")} — Admin` });

const filterStatus = ref("pending");

const statusTabs = [
    { value: "pending", label: "admin.accessRequests.statusLabel.pending" },
    { value: "approved", label: "admin.accessRequests.statusLabel.approved" },
    { value: "rejected", label: "admin.accessRequests.statusLabel.rejected" },
    { value: "", label: "admin.accessRequests.all" },
];

const { data: requests, isLoading: loading } = useQuery({
    queryKey: computed(() => ["admin-access-requests", filterStatus.value]),
    queryFn: () => admin.listAccessRequests(filterStatus.value || undefined),
});

const { data: pendingData } = useQuery({
    queryKey: ["admin-access-requests-pending-count"],
    queryFn: () => admin.listAccessRequests("pending"),
});

const pendingCount = computed(() => pendingData.value?.length ?? 0);

async function handleReview(id: string, action: "approved" | "rejected") {
    await admin.reviewAccessRequest(id, action);
    toast.add({
        title: t(
            action === "approved"
                ? "admin.accessRequests.requestApproved"
                : "admin.accessRequests.requestRejected",
        ),
        color: action === "approved" ? "green" : "red",
        timeout: 3000,
    });
    await queryClient.invalidateQueries({ queryKey: ["admin-access-requests"] });
}

async function handleDelete(id: string) {
    await admin.deleteAccessRequest(id);
    toast.add({ title: t("admin.accessRequests.requestDeleted"), color: "green", timeout: 3000 });
    await queryClient.invalidateQueries({ queryKey: ["admin-access-requests"] });
}
</script>
