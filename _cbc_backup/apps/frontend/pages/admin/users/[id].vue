<template>
    <div class="space-y-6">
        <!-- Back -->
        <button
            class="flex items-center gap-2 text-sm text-fg-muted transition hover:text-fg"
            @click="navigateTo('/admin/users')"
        >
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
            {{ $t("common.back") }}
        </button>

        <template v-if="user">
            <!-- User Info -->
            <div class="glass-card p-6">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-4">
                        <div
                            class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white"
                        >
                            {{ (user.displayName || user.username || "?").charAt(0).toUpperCase() }}
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-fg">
                                {{ user.displayName || user.username }}
                            </h2>
                            <p class="text-sm text-fg-muted">
                                {{ user.username }} · {{ user.email }}
                            </p>
                            <p class="mt-1 text-xs text-fg-soft">
                                {{ $t("admin.users.joined") }}: {{ formatDate(user.createdAt) }}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button
                            v-if="!user.banned"
                            class="rounded-lg border border-line px-3 py-1.5 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                            @click="handleBan"
                        >
                            {{ $t("admin.users.ban") }}
                        </button>
                        <button
                            v-else
                            class="rounded-lg border border-line px-3 py-1.5 text-xs text-fg-muted transition hover:border-emerald-500 hover:text-emerald-400"
                            @click="handleUnban"
                        >
                            {{ $t("admin.users.unban") }}
                        </button>
                        <button
                            class="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                            @click="handleDelete"
                        >
                            {{ $t("admin.users.delete_user") }}
                        </button>
                    </div>
                </div>

                <!-- Status badges -->
                <div class="mt-4 flex flex-wrap gap-2">
                    <span
                        v-if="user.banned"
                        class="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400"
                        >{{ $t("admin.users.banned") }}</span
                    >
                    <span
                        v-else
                        class="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400"
                        >{{ $t("admin.users.active") }}</span
                    >
                    <span
                        v-if="user.isAdmin"
                        class="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400"
                        >Admin</span
                    >
                    <span
                        v-if="user.emailVerified"
                        class="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400"
                        >{{ $t("admin.users.email_verified") }}</span
                    >
                    <span
                        v-else
                        class="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400"
                        >{{ $t("admin.users.email_not_verified") }}</span
                    >
                </div>
                <p v-if="user.banned && user.bannedReason" class="mt-2 text-xs text-red-400">
                    {{ $t("admin.users.ban_reason") }}: {{ user.bannedReason }}
                </p>

                <!-- Email verified toggle -->
                <div class="mt-4 flex items-center gap-3">
                    <label class="text-sm font-medium text-fg">{{
                        $t("admin.users.email_verified")
                    }}</label>
                    <button
                        class="relative h-6 w-11 rounded-full transition"
                        :class="user.emailVerified ? 'bg-emerald-600' : 'bg-active'"
                        @click="handleToggleEmailVerified"
                    >
                        <span
                            class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                            :class="user.emailVerified ? 'translate-x-5' : 'translate-x-0'"
                        />
                    </button>
                </div>
            </div>

            <!-- Roles -->
            <div class="glass-card p-6">
                <h3 class="mb-4 text-base font-semibold text-fg">{{ $t("admin.users.roles") }}</h3>
                <div class="flex flex-wrap gap-2">
                    <span
                        v-for="role in user.roles"
                        :key="role.id"
                        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                        :style="{
                            backgroundColor: (role.color || '#10b981') + '20',
                            color: role.color || '#10b981',
                        }"
                    >
                        {{ role.displayName }}
                        <button
                            class="ml-1 opacity-60 hover:opacity-100"
                            @click="handleRemoveRole(role.id)"
                        >
                            <Icon name="lucide:x" class="h-3 w-3" />
                        </button>
                    </span>
                </div>

                <!-- Add Role -->
                <div v-if="availableRoles.length > 0" class="mt-4 flex items-center gap-2">
                    <select
                        v-model="selectedRoleId"
                        class="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                    >
                        <option value="" disabled>{{ $t("admin.users.roles") }}...</option>
                        <option v-for="r in availableRoles" :key="r.id" :value="r.id">
                            {{ r.displayName }}
                        </option>
                    </select>
                    <button
                        :disabled="!selectedRoleId"
                        class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        @click="handleAssignRole"
                    >
                        {{ $t("common.create") }}
                    </button>
                </div>
            </div>

            <!-- Feature Flags -->
            <div class="glass-card p-6">
                <h3 class="mb-4 text-base font-semibold text-fg">
                    {{ $t("admin.feature_flags.title") }}
                </h3>
                <div v-if="user.featureFlags?.length" class="space-y-2">
                    <div
                        v-for="uf in user.featureFlags"
                        :key="uf.id"
                        class="flex items-center justify-between rounded-lg border border-line p-3"
                    >
                        <div>
                            <p class="text-sm font-medium text-fg">
                                {{ uf.featureFlag?.name || uf.featureFlagId }}
                            </p>
                            <p class="text-xs text-fg-muted">{{ uf.featureFlag?.key }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span
                                class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                :class="
                                    uf.enabled
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/20 text-red-400'
                                "
                            >
                                {{
                                    uf.enabled
                                        ? $t("admin.users.feature_granted")
                                        : $t("admin.users.feature_denied")
                                }}
                            </span>
                            <button
                                class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-amber-500 hover:text-amber-400"
                                @click="handleToggleFeature(uf.featureFlagId, !uf.enabled)"
                            >
                                {{ uf.enabled ? $t("admin.users.deny") : $t("admin.users.grant") }}
                            </button>
                            <button
                                class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                                @click="handleRemoveFeature(uf.featureFlagId)"
                            >
                                {{ $t("common.delete") }}
                            </button>
                        </div>
                    </div>
                </div>
                <p v-else class="text-sm text-fg-muted">{{ $t("common.no_data") }}</p>

                <!-- Add Feature Flag -->
                <div v-if="availableFlags.length > 0" class="mt-4 flex items-center gap-2">
                    <select
                        v-model="selectedFlagId"
                        class="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                    >
                        <option value="" disabled>{{ $t("admin.feature_flags.title") }}...</option>
                        <option v-for="f in availableFlags" :key="f.id" :value="f.id">
                            {{ f.name }}
                        </option>
                    </select>
                    <select
                        v-model="featureFlagEnabled"
                        class="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                    >
                        <option :value="true">{{ $t("admin.users.grant") }}</option>
                        <option :value="false">{{ $t("admin.users.deny") }}</option>
                    </select>
                    <button
                        :disabled="!selectedFlagId"
                        class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        @click="handleAddFeature"
                    >
                        {{ $t("common.create") }}
                    </button>
                </div>
            </div>

            <!-- Limits -->
            <div class="glass-card p-6">
                <h3 class="mb-4 text-base font-semibold text-fg">{{ $t("admin.roles.limits") }}</h3>
                <div v-if="user.limitOverrides?.length" class="space-y-2">
                    <div
                        v-for="lim in user.limitOverrides"
                        :key="lim.id"
                        class="flex items-center justify-between rounded-lg border border-line p-3"
                    >
                        <div>
                            <p class="text-sm font-medium text-fg">{{ lim.key }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-mono text-fg">{{ lim.value }}</span>
                            <button
                                class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                                @click="handleRemoveLimit(lim.key)"
                            >
                                {{ $t("common.delete") }}
                            </button>
                        </div>
                    </div>
                </div>
                <p v-else class="text-sm text-fg-muted">{{ $t("common.no_data") }}</p>

                <!-- Add Limit Override -->
                <div class="mt-4 flex items-center gap-2">
                    <select
                        v-model="newLimit.key"
                        class="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                    >
                        <option value="" disabled>{{ $t("admin.roles.limit_key") }}...</option>
                        <option v-for="lk in LIMIT_KEYS" :key="lk" :value="lk">{{ lk }}</option>
                    </select>
                    <input
                        v-model.number="newLimit.value"
                        type="number"
                        placeholder="Value"
                        class="w-24 rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-emerald-500"
                    />
                    <button
                        :disabled="!newLimit.key || newLimit.value === null"
                        class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        @click="handleAddLimit"
                    >
                        {{ $t("common.create") }}
                    </button>
                </div>
            </div>
        </template>

        <!-- Loading -->
        <div v-else class="py-20 text-center text-fg-muted">
            {{ $t("common.loading") }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });

const route = useRoute();
const admin = useAdmin();
const queryClient = useQueryClient();
const { t } = useI18n();

const userId = computed(() => route.params.id as string);

useSeoMeta({ title: "User Detail — Admin — Cold Blood Cast" });

const selectedRoleId = ref("");
const selectedFlagId = ref("");
const featureFlagEnabled = ref(true);
const newLimit = reactive({ key: "", value: null as number | null });

const LIMIT_KEYS = [
    "max_enclosures",
    "max_pets",
    "max_sensors",
    "max_alert_rules",
    "max_api_keys",
    "max_uploads",
    "max_upload_size_mb",
] as const;

interface FeatureFlag {
    id: string;
    name: string;
    key: string;
}

interface UserDetail {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    isAdmin: boolean;
    banned: boolean;
    emailVerified: boolean;
    bannedReason: string | null;
    createdAt: string;
    roles: Array<{ id: string; name: string; displayName: string; color: string | null }>;
    featureFlags?: Array<{
        id: string;
        featureFlagId: string;
        enabled: boolean;
        featureFlag?: { name: string; key: string };
    }>;
    limitOverrides?: Array<{ id: string; key: string; value: number }>;
}

interface AdminRole {
    id: string;
    name: string;
    displayName: string;
    color: string | null;
}

const { data: user } = useQuery<UserDetail>({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
        const raw = await admin.getUserDetail(userId.value);
        return {
            ...raw,
            roles: (raw.roles ?? []).map((r: Record<string, unknown>) =>
                r.role ? (r.role as UserDetail["roles"][number]) : r,
            ),
        };
    },
});

const { data: allRoles } = useQuery<AdminRole[]>({
    queryKey: ["admin", "roles"],
    queryFn: () => admin.listRoles(),
});

const { data: allFlags } = useQuery<FeatureFlag[]>({
    queryKey: ["admin", "feature-flags"],
    queryFn: () => admin.listFeatureFlags(),
});

const availableRoles = computed(() => {
    if (!allRoles.value || !user.value) return [];
    const assignedIds = new Set(user.value.roles.map((r) => r.id));
    return allRoles.value.filter((r) => !assignedIds.has(r.id));
});

const availableFlags = computed(() => {
    if (!allFlags.value || !user.value) return [];
    const assignedIds = new Set((user.value.featureFlags ?? []).map((f) => f.featureFlagId));
    return allFlags.value.filter((f) => !assignedIds.has(f.id));
});

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
}

function invalidateUser() {
    queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
}

async function handleBan() {
    const reason = prompt(t("admin.users.ban_reason_prompt"));
    if (reason === null) return;
    await admin.banUser(userId.value, reason || undefined);
    invalidateUser();
}

async function handleUnban() {
    await admin.unbanUser(userId.value);
    invalidateUser();
}

async function handleDelete() {
    if (!confirm(t("admin.users.confirm_delete"))) return;
    await admin.deleteUser(userId.value);
    navigateTo("/admin/users");
}

async function handleToggleEmailVerified() {
    if (!user.value) return;
    await admin.updateUser(userId.value, { emailVerified: !user.value.emailVerified });
    invalidateUser();
}

async function handleAssignRole() {
    if (!selectedRoleId.value) return;
    await admin.assignUserRole(userId.value, selectedRoleId.value);
    selectedRoleId.value = "";
    invalidateUser();
}

async function handleRemoveRole(roleId: string) {
    await admin.removeUserRole(userId.value, roleId);
    invalidateUser();
}

async function handleRemoveFeature(featureFlagId: string) {
    await admin.removeUserFeature(userId.value, featureFlagId);
    invalidateUser();
}

async function handleToggleFeature(featureFlagId: string, enabled: boolean) {
    await admin.setUserFeature(userId.value, featureFlagId, { enabled });
    invalidateUser();
}

async function handleAddFeature() {
    if (!selectedFlagId.value) return;
    await admin.setUserFeature(userId.value, selectedFlagId.value, {
        enabled: featureFlagEnabled.value,
    });
    selectedFlagId.value = "";
    featureFlagEnabled.value = true;
    invalidateUser();
}

async function handleRemoveLimit(key: string) {
    await admin.removeUserLimit(userId.value, key);
    invalidateUser();
}

async function handleAddLimit() {
    if (!newLimit.key || newLimit.value === null) return;
    await admin.setUserLimit(userId.value, { key: newLimit.key, value: newLimit.value });
    newLimit.key = "";
    newLimit.value = null;
    invalidateUser();
}
</script>
