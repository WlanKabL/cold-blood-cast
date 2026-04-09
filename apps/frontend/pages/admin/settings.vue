<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("admin.settings.title") }}
            </h1>
            <p class="text-fg-muted mt-1 text-[12px]">{{ $t("admin.settings.subtitle") }}</p>
        </div>

        <div v-if="loading" class="space-y-4">
            <div v-for="i in 5" :key="i" class="glass-card flex items-center justify-between p-5">
                <div class="space-y-1">
                    <UiSkeleton width="140" height="14" />
                    <UiSkeleton width="100" height="11" />
                </div>
                <UiSkeleton width="44" height="24" rounded="full" />
            </div>
        </div>

        <div v-else class="space-y-4">
            <div
                v-for="setting in settings"
                :key="setting.key"
                class="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <p class="text-fg text-[14px] font-medium">
                        {{ $t(`admin.settings.keys.${setting.key}`, formatKey(setting.key)) }}
                    </p>
                    <p class="text-fg-faint text-[11px]">{{ setting.key }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <!-- Boolean toggle (maintenance_mode) -->
                    <template v-if="isBool(setting.value)">
                        <button
                            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                            :class="parseBool(setting.value) ? 'bg-green-500' : 'bg-gray-600'"
                            role="switch"
                            :aria-checked="parseBool(setting.value)"
                            @click="handleToggle(setting)"
                        >
                            <span
                                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200"
                                :class="
                                    parseBool(setting.value) ? 'translate-x-5' : 'translate-x-0'
                                "
                            />
                        </button>
                    </template>
                    <!-- Registration Mode dropdown -->
                    <template v-else-if="setting.key === 'registration_mode'">
                        <select
                            :value="parseValue(setting.value)"
                            class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-right text-[13px] focus:outline-none sm:w-48"
                            @change="
                                handleUpdate(
                                    setting.key,
                                    ($event.target as HTMLSelectElement).value,
                                )
                            "
                        >
                            <option v-for="mode in REGISTRATION_MODES" :key="mode" :value="mode">
                                {{ $t(`admin.settings.registrationModes.${mode}`, mode) }}
                            </option>
                        </select>
                    </template>
                    <!-- Default Role dropdown -->
                    <template v-else-if="setting.key === 'default_role'">
                        <select
                            :value="parseValue(setting.value)"
                            class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-right text-[13px] focus:outline-none sm:w-48"
                            @change="
                                handleUpdate(
                                    setting.key,
                                    ($event.target as HTMLSelectElement).value,
                                )
                            "
                        >
                            <option v-for="r in roles" :key="r.name" :value="r.name">
                                {{ r.displayName }}
                            </option>
                        </select>
                    </template>
                    <!-- Fallback text input -->
                    <template v-else>
                        <input
                            :value="parseValue(setting.value)"
                            class="border-line text-fg w-full rounded-xl border bg-transparent px-3 py-2 text-right text-[13px] focus:outline-none sm:w-48"
                            @blur="
                                handleUpdate(setting.key, ($event.target as HTMLInputElement).value)
                            "
                        />
                    </template>
                    <p class="text-fg-faint w-full text-left text-[11px] sm:w-36 sm:text-right">
                        {{ new Date(setting.updatedAt).toLocaleString() }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { SystemSettingEntry, Role } from "~/types/api";
import { REGISTRATION_MODES, NOTIFICATION_SETTING_KEYS } from "@cold-blood-cast/shared";

definePageMeta({ layout: "admin" });

const admin = useAdminApi();
const toast = useToast();
const { t } = useI18n();
const queryClient = useQueryClient();

useHead({ title: () => `${t("admin.settings.title")} — Admin` });

const HIDDEN_KEYS = new Set<string>([
    ...NOTIFICATION_SETTING_KEYS,
    "require_approval",
    "platform_name",
    "max_upload_size_mb",
    "max_uploads_per_entity",
    "max_sensors_per_enclosure",
    "max_enclosures_per_user",
    "max_api_keys_per_user",
    "maintenance_schedule",
]);

const { data: settingsData, isLoading: loading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
        const [settingsRes, rolesRes] = await Promise.all([admin.getSettings(), admin.listRoles()]);
        return { settings: settingsRes, roles: rolesRes };
    },
});

const allSettings = computed(() => settingsData.value?.settings ?? []);
const settings = computed(() => allSettings.value.filter((s) => !HIDDEN_KEYS.has(s.key)));
const roles = computed(() => settingsData.value?.roles ?? []);

function formatKey(key: string): string {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isBool(value: string): boolean {
    try {
        const v = JSON.parse(value);
        return typeof v === "boolean";
    } catch {
        return false;
    }
}

function parseBool(value: string): boolean {
    try {
        return JSON.parse(value) === true;
    } catch {
        return false;
    }
}

function parseValue(value: string): string {
    try {
        return String(JSON.parse(value));
    } catch {
        return value;
    }
}

async function handleToggle(setting: SystemSettingEntry) {
    const current = parseBool(setting.value);
    await admin.updateSetting(setting.key, !current);
    await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    toast.add({ title: t("admin.settings.updated"), color: "green", timeout: 3000 });
}

async function handleUpdate(key: string, val: string) {
    await admin.updateSetting(key, val);
    await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    toast.add({ title: t("admin.settings.updated"), color: "green", timeout: 3000 });
}
</script>
