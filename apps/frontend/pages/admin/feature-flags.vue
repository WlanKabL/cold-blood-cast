<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("admin.featureFlags.title") }}
            </h1>
            <p class="text-fg-muted mt-1 text-[12px]">{{ $t("admin.featureFlags.subtitle") }}</p>
        </div>

        <div v-if="loading" class="space-y-6">
            <div v-for="i in 2" :key="i" class="space-y-3">
                <UiSkeleton width="80" height="13" />
                <div class="glass-card divide-line-faint divide-y">
                    <div
                        v-for="j in 3"
                        :key="j"
                        class="flex items-center justify-between px-5 py-4"
                    >
                        <div class="space-y-1">
                            <UiSkeleton width="120" height="13" />
                            <UiSkeleton width="160" height="12" />
                        </div>
                        <UiSkeleton width="44" height="24" rounded="full" />
                    </div>
                </div>
            </div>
        </div>

        <template v-else>
            <!-- Group by category -->
            <div
                v-for="[category, categoryFlags] in groupedFlags"
                :key="category"
                class="space-y-3"
            >
                <h2 class="text-fg-faint text-[13px] font-semibold tracking-wider uppercase">
                    {{ category }}
                </h2>
                <div class="glass-card divide-line-faint divide-y">
                    <div
                        v-for="flag in categoryFlags"
                        :key="flag.id"
                        class="flex items-center justify-between px-5 py-4"
                    >
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <p class="text-fg text-[13px] font-medium">{{ flag.name }}</p>
                                <span
                                    class="bg-surface-raised text-fg-faint rounded-full px-2 py-0.5 text-[10px]"
                                    >{{ flag.key }}</span
                                >
                            </div>
                            <p v-if="flag.description" class="text-fg-muted mt-0.5 text-[12px]">
                                {{ flag.description }}
                            </p>
                        </div>
                        <!-- Toggle Switch -->
                        <button
                            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                            :class="flag.enabled ? 'bg-green-500' : 'bg-gray-600'"
                            role="switch"
                            :aria-checked="flag.enabled"
                            @click="handleToggle(flag.id)"
                        >
                            <span
                                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200"
                                :class="flag.enabled ? 'translate-x-5' : 'translate-x-0'"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { FeatureFlag } from "~/types/api";

definePageMeta({ layout: "admin" });

const { t } = useI18n();

useHead({ title: () => `${t("admin.featureFlags.title")} — Admin` });

const admin = useAdminApi();
const queryClient = useQueryClient();

const { data: flags, isLoading: loading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: () => admin.listFeatureFlags(),
});

const CATEGORY_ORDER = ["core", "care", "monitoring", "organization", "integration", "admin"];

const groupedFlags = computed(() => {
    const map = new Map<string, FeatureFlag[]>();
    for (const f of flags.value ?? []) {
        const group = map.get(f.category) || [];
        group.push(f);
        map.set(f.category, group);
    }
    // Sort groups by predefined order, unknowns go last
    // Sort flags within each group alphabetically by name
    return Array.from(map.entries())
        .sort(([a], [b]) => {
            const ia = CATEGORY_ORDER.indexOf(a);
            const ib = CATEGORY_ORDER.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        })
        .map(
            ([cat, catFlags]) =>
                [cat, [...catFlags].sort((a, b) => a.name.localeCompare(b.name))] as [
                    string,
                    FeatureFlag[],
                ],
        );
});

async function handleToggle(flagId: string) {
    await admin.toggleFeatureFlag(flagId);
    await queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
}
</script>
