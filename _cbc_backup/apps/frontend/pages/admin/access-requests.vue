<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-fg text-lg font-semibold">
                    {{ $t("admin.accessRequests.title") }}
                </h2>
            </div>
            <div class="flex items-center gap-2">
                <USelect v-model="statusFilter" :options="statusOptions" class="w-36" />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="text-fg-muted h-6 w-6 animate-spin" />
        </div>

        <!-- Empty -->
        <div v-else-if="requests.length === 0" class="text-fg-muted py-12 text-center text-sm">
            {{ $t("admin.accessRequests.empty") }}
        </div>

        <!-- Table -->
        <div v-else class="glass-card overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-line text-fg-muted border-b text-xs uppercase tracking-wider">
                        <th class="px-4 py-3">{{ $t("admin.accessRequests.email") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.accessRequests.reason") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.accessRequests.status") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.accessRequests.date") }}</th>
                        <th class="px-4 py-3 text-right">{{ $t("common.actions") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="req in requests"
                        :key="req.id"
                        class="border-line hover:bg-hover border-b transition last:border-b-0"
                    >
                        <td class="text-fg px-4 py-3">{{ req.email }}</td>
                        <td class="text-fg-muted max-w-xs truncate px-4 py-3">
                            {{ req.reason || "—" }}
                        </td>
                        <td class="px-4 py-3">
                            <UBadge
                                :color="
                                    req.status === 'approved'
                                        ? 'green'
                                        : req.status === 'rejected'
                                          ? 'red'
                                          : 'amber'
                                "
                                variant="subtle"
                            >
                                {{ req.status }}
                            </UBadge>
                        </td>
                        <td class="text-fg-muted px-4 py-3 text-xs">
                            {{ formatDateShort(req.createdAt) }}
                        </td>
                        <td class="px-4 py-3 text-right">
                            <div
                                v-if="req.status === 'pending'"
                                class="flex items-center justify-end gap-2"
                            >
                                <UButton
                                    color="green"
                                    variant="ghost"
                                    size="sm"
                                    icon="i-lucide-check"
                                    :loading="approving === req.id"
                                    @click="handleApprove(req.id)"
                                />
                                <UButton
                                    color="red"
                                    variant="ghost"
                                    size="sm"
                                    icon="i-lucide-x"
                                    :loading="rejecting === req.id"
                                    @click="handleReject(req.id)"
                                />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const { t } = useI18n();
useHead({ title: () => t("admin.accessRequests.title") });

const admin = useAdmin();
const { formatDateShort } = useFormatters();
const toast = useAppToast();

interface AccessRequest {
    id: string;
    email: string;
    reason: string | null;
    status: string;
    createdAt: string;
}

const requests = ref<AccessRequest[]>([]);
const loading = ref(true);
const statusFilter = ref("all");
const approving = ref<string | null>(null);
const rejecting = ref<string | null>(null);

const statusOptions = [
    { label: t("admin.accessRequests.all"), value: "all" },
    { label: t("admin.accessRequests.pending"), value: "pending" },
    { label: t("admin.accessRequests.approved"), value: "approved" },
    { label: t("admin.accessRequests.rejected"), value: "rejected" },
];

async function loadRequests() {
    loading.value = true;
    try {
        const params: Record<string, string> = {};
        if (statusFilter.value !== "all") params.status = statusFilter.value;
        requests.value = await admin.listAccessRequests(params);
    } catch {
        // ignore
    } finally {
        loading.value = false;
    }
}

async function handleApprove(id: string) {
    approving.value = id;
    try {
        await admin.approveAccessRequest(id);
        toast.success(t("admin.accessRequests.approvedSuccess"));
        await loadRequests();
    } catch {
        toast.error(t("admin.accessRequests.approveError"));
    } finally {
        approving.value = null;
    }
}

async function handleReject(id: string) {
    rejecting.value = id;
    try {
        await admin.rejectAccessRequest(id);
        toast.success(t("admin.accessRequests.rejectedSuccess"));
        await loadRequests();
    } catch {
        toast.error(t("admin.accessRequests.rejectError"));
    } finally {
        rejecting.value = null;
    }
}

watch(statusFilter, () => loadRequests());
onMounted(loadRequests);
</script>
