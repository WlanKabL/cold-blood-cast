<template>
    <div class="space-y-6">
        <div v-for="setting in settings" :key="setting.key" class="glass-card p-5">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="font-semibold text-fg">{{ getSettingLabel(setting.key) }}</h3>
                    <p class="text-xs text-fg-muted">{{ setting.key }}</p>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Boolean toggle -->
                    <template v-if="setting.value === 'true' || setting.value === 'false'">
                        <button
                            class="relative h-6 w-11 rounded-full transition"
                            :class="setting.value === 'true' ? 'bg-emerald-600' : 'bg-active'"
                            @click="handleToggle(setting)"
                        >
                            <span
                                class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                                :class="
                                    setting.value === 'true' ? 'translate-x-5' : 'translate-x-0'
                                "
                            />
                        </button>
                    </template>
                    <!-- Registration mode dropdown -->
                    <template v-else-if="setting.key === 'registration_mode'">
                        <select
                            :value="setting.value"
                            class="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                            @change="
                                handleUpdate(
                                    setting.key,
                                    ($event.target as HTMLSelectElement).value,
                                )
                            "
                        >
                            <option value="open">
                                {{ $t("admin.settings.registration_open") }}
                            </option>
                            <option value="invite">
                                {{ $t("admin.settings.registration_invite") }}
                            </option>
                            <option value="closed">
                                {{ $t("admin.settings.registration_closed") }}
                            </option>
                        </select>
                    </template>
                    <!-- Default role dropdown -->
                    <template v-else-if="setting.key === 'default_role'">
                        <select
                            :value="setting.value"
                            class="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                            @change="
                                handleUpdate(
                                    setting.key,
                                    ($event.target as HTMLSelectElement).value,
                                )
                            "
                        >
                            <option v-for="r in roles" :key="r.id" :value="r.name">
                                {{ r.displayName }}
                            </option>
                        </select>
                    </template>
                    <!-- Text input fallback -->
                    <template v-else>
                        <input
                            :value="setting.value"
                            type="text"
                            class="w-64 rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                            @blur="
                                handleUpdate(setting.key, ($event.target as HTMLInputElement).value)
                            "
                            @keydown.enter="
                                handleUpdate(setting.key, ($event.target as HTMLInputElement).value)
                            "
                        />
                    </template>
                </div>
            </div>
        </div>

        <p v-if="settings.length === 0" class="py-12 text-center text-fg-muted">
            {{ $t("common.no_data") }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Settings — Admin — Cold Blood Cast" });

const { t } = useI18n();
const admin = useAdmin();
const queryClient = useQueryClient();
const toast = useAppToast();

interface SystemSetting {
    id: string;
    key: string;
    value: string;
}

interface AdminRole {
    id: string;
    name: string;
    displayName: string;
}

const { data: settingsData } = useQuery<SystemSetting[]>({
    queryKey: ["admin", "settings"],
    queryFn: () => admin.getSettings(),
});

const { data: rolesData } = useQuery<AdminRole[]>({
    queryKey: ["admin", "roles"],
    queryFn: () => admin.listRoles(),
});

const settings = computed(() => settingsData.value ?? []);
const roles = computed(() => rolesData.value ?? []);

function getSettingLabel(key: string): string {
    const labels: Record<string, string> = {
        registration_mode: t("admin.settings.registration_mode"),
        maintenance_mode: t("admin.settings.maintenance_mode"),
        require_email_verification: t("admin.settings.require_email"),
        require_approval: t("admin.settings.require_approval"),
        platform_name: t("admin.settings.platform_name"),
        default_role: t("admin.settings.default_role"),
    };
    return labels[key] || key;
}

async function handleToggle(setting: SystemSetting) {
    const newValue = setting.value === "true" ? "false" : "true";
    try {
        await admin.updateSetting(setting.key, newValue);
        queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
        toast.success(t("admin.settings.saved"));
    } catch {
        toast.error(t("error.generic"));
    }
}

async function handleUpdate(key: string, value: string) {
    const current = settings.value.find((s) => s.key === key);
    if (current && current.value === value) return;
    try {
        await admin.updateSetting(key, value);
        queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
        toast.success(t("admin.settings.saved"));
    } catch {
        toast.error(t("error.generic"));
    }
}
</script>
