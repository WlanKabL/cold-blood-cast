<template>
    <div class="space-y-6">
        <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("admin.auditLog.title") }}</h1>

        <!-- Filters -->
        <div class="glass-card flex flex-wrap items-center gap-3 p-4">
            <input
                v-model="filterAction"
                type="text"
                :placeholder="$t('admin.auditLog.filterAction')"
                class="border-line text-fg placeholder:text-fg-faint w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none sm:w-48"
                @input="debouncedFetch"
            />
            <input
                v-model="filterUserId"
                type="text"
                :placeholder="$t('admin.auditLog.filterUserId')"
                class="border-line text-fg placeholder:text-fg-faint w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:outline-none sm:w-48"
                @input="debouncedFetch"
            />
        </div>

        <div v-if="loading" class="glass-card overflow-hidden">
            <div
                v-for="i in 8"
                :key="i"
                class="border-line-faint flex items-center gap-4 border-b px-4 py-3"
            >
                <UiSkeleton width="80" height="12" />
                <UiSkeleton width="100" height="13" />
                <UiSkeleton width="120" height="12" />
                <UiSkeleton width="80" height="12" />
                <UiSkeleton width="90" height="12" />
            </div>
        </div>

        <div v-else class="glass-card overflow-x-auto">
            <div class="space-y-0 md:hidden">
                <div
                    v-for="log in logs"
                    :key="'m-' + log.id"
                    class="border-line-faint border-b px-4 py-3"
                >
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-fg text-[13px] font-medium">{{ log.action }}</span>
                        <span class="text-fg-muted shrink-0 text-[11px]">{{
                            new Date(log.createdAt).toLocaleString()
                        }}</span>
                    </div>
                    <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <span v-if="log.entity" class="text-fg-muted"
                            >{{ log.entity
                            }}<span v-if="log.entityId" class="text-fg-faint"
                                >#{{ log.entityId.slice(0, 8) }}</span
                            ></span
                        >
                        <span class="text-fg-faint">{{
                            log.userId ? log.userId.slice(0, 12) + "..." : "system"
                        }}</span>
                        <span v-if="log.ipAddress" class="text-fg-faint">{{ log.ipAddress }}</span>
                    </div>
                </div>
            </div>

            <table class="hidden w-full md:table">
                <thead>
                    <tr
                        class="border-line text-fg-faint border-b text-left text-[11px] tracking-wider uppercase"
                    >
                        <th class="p-4">{{ $t("admin.auditLog.time") }}</th>
                        <th class="p-4">{{ $t("admin.auditLog.action") }}</th>
                        <th class="hidden p-4 sm:table-cell">{{ $t("admin.auditLog.entity") }}</th>
                        <th class="hidden p-4 md:table-cell">{{ $t("admin.auditLog.userId") }}</th>
                        <th class="hidden p-4 lg:table-cell">{{ $t("admin.auditLog.ip") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="log in logs"
                        :key="log.id"
                        class="border-line-faint hover:bg-surface-hover border-b"
                    >
                        <td class="text-fg-muted p-4 text-[12px] whitespace-nowrap">
                            {{ new Date(log.createdAt).toLocaleString() }}
                        </td>
                        <td class="text-fg p-4 text-[13px] font-medium">
                            {{ log.action }}
                        </td>
                        <td class="hidden p-4 sm:table-cell">
                            <span v-if="log.entity" class="text-fg-muted text-[12px]">
                                {{ log.entity
                                }}<span v-if="log.entityId" class="text-fg-faint">
                                    #{{ log.entityId.slice(0, 8) }}</span
                                >
                            </span>
                            <span v-else class="text-fg-faint text-[12px]">—</span>
                        </td>
                        <td class="text-fg-faint hidden p-4 text-[12px] md:table-cell">
                            {{ log.userId ? log.userId.slice(0, 12) + "..." : "system" }}
                        </td>
                        <td class="text-fg-faint hidden p-4 text-[12px] lg:table-cell">
                            {{ log.ipAddress || "—" }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="meta" class="border-line flex items-center justify-between border-t p-4">
                <p class="text-fg-muted text-[12px]">
                    {{ meta.total }} {{ $t("admin.auditLog.entries") }}
                </p>
                <div class="flex gap-1">
                    <button
                        class="text-fg-muted hover:bg-surface-hover rounded-lg px-3 py-2.5 text-[12px] disabled:opacity-30"
                        :disabled="page <= 1"
                        @click="page--"
                    >
                        {{ $t("admin.prev") }}
                    </button>
                    <button
                        class="text-fg-muted hover:bg-surface-hover rounded-lg px-3 py-2.5 text-[12px] disabled:opacity-30"
                        :disabled="meta.page >= meta.totalPages"
                        @click="page++"
                    >
                        {{ $t("admin.next") }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import type { AuditLogEntry, PaginationMeta } from "~/types/api";

definePageMeta({ layout: "admin" });

const { t } = useI18n();

useHead({ title: () => `${t("admin.auditLog.title")} — Admin` });

const admin = useAdminApi();

const page = ref(1);
const filterAction = ref("");
const filterUserId = ref("");

const debouncedAction = ref("");
const debouncedUserId = ref("");
let debounceTimer: ReturnType<typeof setTimeout>;
function debouncedFetch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        page.value = 1;
        debouncedAction.value = filterAction.value;
        debouncedUserId.value = filterUserId.value;
    }, 300);
}

const { data: logsData, isLoading: loading } = useQuery({
    queryKey: computed(() => [
        "admin-audit-log",
        { page: page.value, action: debouncedAction.value, userId: debouncedUserId.value },
    ]),
    queryFn: async () => {
        const params: Record<string, string | number> = { page: page.value, limit: 50 };
        if (debouncedAction.value) params.action = debouncedAction.value;
        if (debouncedUserId.value) params.userId = debouncedUserId.value;
        return admin.getAuditLogs(params);
    },
});

const logs = computed(() => logsData.value?.items ?? []);
const meta = computed(() => logsData.value?.meta ?? null);
</script>
