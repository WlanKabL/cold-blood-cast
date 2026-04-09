<template>
    <div class="space-y-6">
        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
            <input
                v-model="filters.action"
                type="text"
                :placeholder="$t('admin.audit_log.action')"
                class="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
            />
            <input
                v-model="filters.entity"
                type="text"
                :placeholder="$t('admin.audit_log.entity')"
                class="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
            />
            <button
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                @click="refetch()"
            >
                {{ $t("common.filter") }}
            </button>
        </div>

        <!-- Audit Log Table -->
        <div class="overflow-x-auto glass-card">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-b border-line text-xs uppercase tracking-wider text-fg-muted">
                        <th class="px-4 py-3">{{ $t("admin.audit_log.timestamp") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.audit_log.user") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.audit_log.action") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.audit_log.entity") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.audit_log.ip") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.audit_log.details") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="entry in entries"
                        :key="entry.id"
                        class="border-b border-line last:border-b-0 transition hover:bg-hover"
                    >
                        <td class="px-4 py-3 text-fg-muted whitespace-nowrap">
                            {{ formatDate(entry.createdAt) }}
                        </td>
                        <td class="px-4 py-3 text-fg">{{ entry.userId || "—" }}</td>
                        <td class="px-4 py-3">
                            <span
                                class="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-400"
                            >
                                {{ entry.action }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-fg-muted">{{ entry.entity || "—" }}</td>
                        <td class="px-4 py-3 text-xs text-fg-soft font-mono">{{ entry.ipAddress || "—" }}</td>
                        <td class="px-4 py-3 text-xs text-fg-soft max-w-xs truncate">
                            {{ entry.details ? JSON.stringify(entry.details) : "—" }}
                        </td>
                    </tr>
                    <tr v-if="entries.length === 0">
                        <td colspan="6" class="px-4 py-12 text-center text-fg-muted">
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
                {{ $t("common.back") }}
            </button>
            <span class="text-sm text-fg-muted">{{ page }} / {{ totalPages }}</span>
            <button
                :disabled="page >= totalPages"
                class="rounded-lg border border-line px-3 py-1.5 text-xs text-fg-muted transition hover:bg-hover disabled:opacity-50"
                @click="page++"
            >
                →
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Audit Log — Admin — Cold Blood Cast" });

const admin = useAdmin();

const page = ref(1);
const filters = ref({
    action: "",
    entity: "",
});

interface AuditEntry {
    id: string;
    action: string;
    entity: string | null;
    entityId: string | null;
    userId: string | null;
    ipAddress: string | null;
    details: Record<string, unknown> | null;
    createdAt: string;
}

const queryParams = computed(() => ({
    page: page.value,
    limit: 25,
    action: filters.value.action || undefined,
    entity: filters.value.entity || undefined,
}));

const { data: auditData, refetch } = useQuery({
    queryKey: ["admin", "audit-log", queryParams],
    queryFn: () => admin.getAuditLog(queryParams.value),
});

const entries = computed<AuditEntry[]>(() => {
    const d = auditData.value;
    return d?.items ?? [];
});

const totalPages = computed(() => {
    const d = auditData.value;
    return d?.meta?.totalPages ?? 1;
});

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
}
</script>
