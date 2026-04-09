<template>
    <div class="space-y-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.apiKeys.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-[13px]">
                    {{ $t("pages.apiKeys.subtitle") }}
                </p>
            </div>
            <button
                class="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-violet-600 px-4 py-2 text-[13px] font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:shadow-violet-500/30 hover:brightness-110"
                @click="openCreate"
            >
                <Icon name="lucide:plus" class="h-4 w-4" />
                {{ $t("pages.apiKeys.create") }}
            </button>
        </div>

        <!-- Newly Created Key Banner -->
        <div v-if="newKeySecret" class="glass-card border-amber-500/30 bg-amber-500/5 p-4">
            <div class="flex items-start gap-3">
                <Icon
                    name="lucide:alert-triangle"
                    class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400"
                />
                <div class="flex-1">
                    <p class="text-[13px] font-medium text-amber-400">
                        {{ $t("pages.apiKeys.keyWarning") }}
                    </p>
                    <div class="mt-2 flex items-center gap-2">
                        <code
                            class="text-fg flex-1 rounded-lg bg-black/30 px-3 py-2 font-mono text-[12px] break-all"
                            >{{ newKeySecret }}</code
                        >
                        <button
                            class="flex-shrink-0 rounded-lg bg-amber-500/20 px-3 py-2 text-[12px] font-medium text-amber-400 hover:bg-amber-500/30"
                            @click="copyKey"
                        >
                            <Icon name="lucide:copy" class="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <button class="text-fg-faint hover:text-fg" @click="newKeySecret = ''">
                    <Icon name="lucide:x" class="h-4 w-4" />
                </button>
            </div>
        </div>

        <!-- Documentation -->
        <details class="glass-card group/docs">
            <summary
                class="text-fg flex cursor-pointer items-center gap-2 px-5 py-4 text-[13px] font-medium select-none"
            >
                <Icon name="lucide:book-open" class="h-4 w-4 text-violet-400" />
                {{ $t("pages.apiKeys.docsTitle") }}
                <Icon
                    name="lucide:chevron-down"
                    class="text-fg-faint ml-auto h-4 w-4 transition-transform group-open/docs:rotate-180"
                />
            </summary>
            <div class="border-line space-y-4 border-t px-5 pt-4 pb-5">
                <p class="text-fg-muted text-[12px] leading-relaxed">
                    {{ $t("pages.apiKeys.docsIntro") }}
                </p>

                <!-- Authentication -->
                <div>
                    <h4 class="text-fg mb-1.5 text-[12px] font-semibold">
                        {{ $t("pages.apiKeys.docsAuthTitle") }}
                    </h4>
                    <p class="text-fg-muted mb-2 text-[11px]">
                        {{ $t("pages.apiKeys.docsAuthDesc") }}
                    </p>
                    <code
                        class="text-fg-muted block rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] break-all whitespace-pre-wrap"
                        >Authorization: Bearer &lt;your-api-key&gt;</code
                    >
                </div>

                <!-- cURL Example -->
                <div>
                    <h4 class="text-fg mb-1.5 text-[12px] font-semibold">
                        {{ $t("pages.apiKeys.docsCurlTitle") }}
                    </h4>
                    <code
                        class="text-fg-muted block rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap"
                        >curl -H "Authorization: Bearer &lt;your-api-key&gt;" \
                        {{ apiBaseUrl }}/api/trades</code
                    >
                </div>

                <!-- Fetch Example -->
                <div>
                    <h4 class="text-fg mb-1.5 text-[12px] font-semibold">
                        {{ $t("pages.apiKeys.docsFetchTitle") }}
                    </h4>
                    <code
                        class="text-fg-muted block rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap"
                        >fetch("{{ apiBaseUrl }}/api/trades", { headers: { "Authorization": "Bearer
                        &lt;key&gt;" } })</code
                    >
                </div>

                <!-- Available endpoints -->
                <div>
                    <h4 class="text-fg mb-1.5 text-[12px] font-semibold">
                        {{ $t("pages.apiKeys.docsEndpointsTitle") }}
                    </h4>
                    <div class="space-y-1">
                        <div
                            v-for="ep in availableEndpoints"
                            :key="ep"
                            class="flex items-center gap-2"
                        >
                            <code
                                class="rounded bg-violet-500/10 px-1.5 py-0.5 font-mono text-[10px] text-violet-400"
                                >{{ ep.split(" ")[0] }}</code
                            >
                            <span class="text-fg-faint font-mono text-[11px]">{{
                                ep.split(" ").slice(1).join(" ")
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </details>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="glass-card space-y-3 p-5">
                <div class="flex items-center gap-3">
                    <UiSkeleton width="20" height="20" rounded="md" />
                    <UiSkeleton width="120" height="16" />
                    <UiSkeleton width="80" height="20" rounded="md" />
                </div>
                <div class="flex gap-2">
                    <UiSkeleton width="56" height="20" rounded="full" />
                    <UiSkeleton width="72" height="20" rounded="full" />
                    <UiSkeleton width="64" height="20" rounded="full" />
                </div>
                <div class="flex gap-4">
                    <UiSkeleton width="100" height="12" />
                    <UiSkeleton width="80" height="12" />
                    <UiSkeleton width="90" height="12" />
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="keys.length === 0" class="glass-card p-8 text-center">
            <Icon name="lucide:key" class="text-fg-ghost mx-auto mb-3 h-12 w-12" />
            <p class="text-fg-muted text-[13px]">{{ $t("pages.apiKeys.empty") }}</p>
        </div>

        <!-- Keys List -->
        <div v-else class="space-y-3">
            <div
                v-for="key in keys"
                :key="key.id"
                class="glass-card group p-5 transition-all duration-200"
                :class="key.revoked ? 'opacity-60' : 'hover:border-violet-500/20'"
            >
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-3">
                            <Icon name="lucide:key" class="h-4 w-4 text-violet-400" />
                            <span class="text-fg text-[14px] font-semibold">{{ key.name }}</span>
                            <code
                                class="bg-surface-raised text-fg-faint rounded px-1.5 py-0.5 font-mono text-[11px]"
                                >{{ key.prefix }}...****</code
                            >
                            <span
                                v-if="key.revoked"
                                class="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400"
                            >
                                {{ $t("pages.apiKeys.revoked") }}
                            </span>
                        </div>

                        <div class="mt-2 flex flex-wrap gap-1.5">
                            <span
                                v-for="scope in key.scopes"
                                :key="scope"
                                class="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400"
                            >
                                {{ scope }}
                            </span>
                        </div>

                        <div
                            class="text-fg-faint mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]"
                        >
                            <span
                                >{{ $t("pages.apiKeys.created") }}:
                                {{ new Date(key.createdAt).toLocaleDateString() }}</span
                            >
                            <span v-if="key.lastUsedAt"
                                >{{ $t("pages.apiKeys.lastUsed") }}:
                                {{ new Date(key.lastUsedAt).toLocaleDateString() }}</span
                            >
                            <span
                                v-if="key.expiresAt"
                                :class="isExpired(key) ? 'text-red-400' : ''"
                            >
                                {{ $t("pages.apiKeys.expiresAt") }}:
                                {{ new Date(key.expiresAt).toLocaleDateString() }}
                            </span>
                        </div>
                    </div>

                    <div
                        v-if="!key.revoked"
                        class="flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                    >
                        <button
                            class="rounded-lg px-2.5 py-1.5 text-[11px] text-amber-400 hover:bg-amber-500/10"
                            @click="confirmRevoke(key)"
                        >
                            {{ $t("pages.apiKeys.revoke") }}
                        </button>
                        <button
                            class="text-fg-faint rounded-lg p-1.5 hover:bg-red-500/10 hover:text-red-400"
                            @click="confirmDelete(key)"
                        >
                            <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div
                        v-else
                        class="flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                    >
                        <button
                            class="text-fg-faint rounded-lg p-1.5 hover:bg-red-500/10 hover:text-red-400"
                            @click="confirmDelete(key)"
                        >
                            <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Modal -->
        <Teleport to="body">
            <div
                v-if="showModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @click.self="showModal = false"
            >
                <div
                    class="border-line bg-base mx-3 w-full max-w-lg rounded-2xl border p-4 shadow-2xl sm:mx-0 sm:p-6"
                >
                    <h2 class="text-fg mb-4 text-[16px] font-semibold">
                        {{ $t("pages.apiKeys.create") }}
                    </h2>
                    <div class="space-y-3">
                        <div>
                            <label class="text-fg-faint mb-1.5 block text-[12px] font-medium">{{
                                $t("pages.apiKeys.nameLabel")
                            }}</label>
                            <input
                                v-model="form.name"
                                type="text"
                                :placeholder="$t('pages.apiKeys.namePlaceholder')"
                                class="border-line bg-surface text-fg placeholder-fg-ghost w-full rounded-xl border px-4 py-2.5 text-[13px] outline-none focus:border-violet-500/50"
                            />
                        </div>

                        <div>
                            <div class="mb-1.5 flex items-center justify-between">
                                <label class="text-fg-faint block text-[12px] font-medium">{{
                                    $t("pages.apiKeys.scopes")
                                }}</label>
                                <button
                                    type="button"
                                    class="text-fg-faint hover:text-fg text-[11px]"
                                    @click="
                                        form.scopes =
                                            form.scopes.length === availableScopes.length
                                                ? []
                                                : [...availableScopes]
                                    "
                                >
                                    {{
                                        form.scopes.length === availableScopes.length
                                            ? $t("common.deselectAll")
                                            : $t("common.selectAll")
                                    }}
                                </button>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <label
                                    v-for="scope in availableScopes"
                                    :key="scope"
                                    class="flex items-center gap-1.5"
                                >
                                    <input
                                        v-model="form.scopes"
                                        type="checkbox"
                                        :value="scope"
                                        class="border-line rounded"
                                    />
                                    <span class="text-fg-muted text-[12px]">{{ scope }}</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label class="text-fg-faint mb-1 block text-[12px] font-medium">{{
                                $t("pages.apiKeys.expiresIn")
                            }}</label>
                            <select
                                v-model.number="form.expiresInDays"
                                class="border-line bg-surface text-fg w-full rounded-xl border px-4 py-2.5 text-[13px] outline-none focus:border-violet-500/50"
                            >
                                <option :value="0">{{ $t("pages.apiKeys.noExpiration") }}</option>
                                <option :value="30">30 {{ $t("common.days") }}</option>
                                <option :value="60">60 {{ $t("common.days") }}</option>
                                <option :value="90">90 {{ $t("common.days") }}</option>
                                <option :value="365">365 {{ $t("common.days") }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-5 flex justify-end gap-2">
                        <button
                            class="text-fg-muted hover:bg-surface-hover rounded-xl px-4 py-2 text-[13px]"
                            @click="showModal = false"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            class="rounded-xl bg-violet-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-violet-600"
                            :disabled="saving"
                            @click="createKey"
                        >
                            {{ saving ? $t("common.loading") : $t("pages.apiKeys.create") }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Revoke Confirmation -->
        <Teleport to="body">
            <div
                v-if="revokeTarget"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @click.self="revokeTarget = undefined"
            >
                <div class="border-line bg-base w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
                    <h2 class="text-fg mb-2 text-[16px] font-semibold">
                        {{ $t("pages.apiKeys.revokeTitle") }}
                    </h2>
                    <p class="text-fg-muted text-[13px]">
                        {{ $t("pages.apiKeys.revokeConfirm", { name: revokeTarget.name }) }}
                    </p>
                    <div class="mt-5 flex justify-end gap-2">
                        <button
                            class="text-fg-muted hover:bg-surface-hover rounded-xl px-4 py-2 text-[13px]"
                            @click="revokeTarget = undefined"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            class="rounded-xl bg-amber-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-amber-600"
                            @click="handleRevoke"
                        >
                            {{ $t("pages.apiKeys.revoke") }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Delete Confirmation -->
        <Teleport to="body">
            <div
                v-if="deleteTarget"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @click.self="deleteTarget = undefined"
            >
                <div class="border-line bg-base w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
                    <h2 class="text-fg mb-2 text-[16px] font-semibold">
                        {{ $t("common.confirmDelete") }}
                    </h2>
                    <p class="text-fg-muted text-[13px]">
                        {{ $t("pages.apiKeys.deleteConfirm", { name: deleteTarget.name }) }}
                    </p>
                    <div class="mt-5 flex justify-end gap-2">
                        <button
                            class="text-fg-muted hover:bg-surface-hover rounded-xl px-4 py-2 text-[13px]"
                            @click="deleteTarget = undefined"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            class="rounded-xl bg-red-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-red-600"
                            @click="handleDelete"
                        >
                            {{ $t("common.delete") }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { ApiKey, ApiKeyWithSecret } from "~/types/api";

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();

definePageMeta({ middleware: ["feature-gate"], requiredFeature: "api_access" });

useHead({ title: () => t("pages.apiKeys.title") });

const saving = ref(false);
const showModal = ref(false);
const deleteTarget = ref<ApiKey | undefined>();
const revokeTarget = ref<ApiKey | undefined>();
const newKeySecret = ref("");

const { data: keys, isLoading: loading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => api.get<ApiKey[]>("/api/api-keys"),
});

const availableScopes = ["read", "write", "trades", "accounts"];

const apiBaseUrl = useRuntimeConfig().public.apiBaseURL;

const availableEndpoints = [
    "GET /api/trades",
    "POST /api/trades",
    "PUT /api/trades/:id",
    "DELETE /api/trades/:id",
    "GET /api/accounts",
    "GET /api/analytics/:accountId",
];

const form = reactive({
    name: "",
    scopes: ["read"] as string[],
    expiresInDays: 90,
});

function isExpired(key: ApiKey): boolean {
    if (!key.expiresAt) return false;
    return new Date(key.expiresAt) < new Date();
}

function openCreate() {
    form.name = "";
    form.scopes = ["read"];
    form.expiresInDays = 90;
    showModal.value = true;
}

function confirmRevoke(key: ApiKey) {
    revokeTarget.value = key;
}

function confirmDelete(key: ApiKey) {
    deleteTarget.value = key;
}

async function createKey() {
    saving.value = true;
    try {
        const payload: Record<string, unknown> = {
            name: form.name,
            scopes: form.scopes,
        };
        if (form.expiresInDays > 0) payload.expiresInDays = form.expiresInDays;
        const res = await api.post<ApiKeyWithSecret>("/api/api-keys", payload);
        newKeySecret.value = res.key;
        showModal.value = false;
        await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        useToast().add({ title: t("common.saved"), color: "green", timeout: 3000 });
    } catch {
        useToast().add({ title: t("common.error"), color: "red", timeout: 5000 });
    } finally {
        saving.value = false;
    }
}

async function handleRevoke() {
    if (!revokeTarget.value) return;
    try {
        await api.patch(`/api/api-keys/${revokeTarget.value.id}/revoke`, {});
        revokeTarget.value = undefined;
        await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        useToast().add({ title: t("pages.apiKeys.revoked"), color: "green", timeout: 3000 });
    } catch {
        useToast().add({ title: t("common.error"), color: "red", timeout: 5000 });
    }
}

async function handleDelete() {
    if (!deleteTarget.value) return;
    try {
        await api.del(`/api/api-keys/${deleteTarget.value.id}`);
        deleteTarget.value = undefined;
        await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        useToast().add({ title: t("common.deleted"), color: "green", timeout: 3000 });
    } catch {
        useToast().add({ title: t("common.error"), color: "red", timeout: 5000 });
    }
}

async function copyKey() {
    try {
        await navigator.clipboard.writeText(newKeySecret.value);
        useToast().add({ title: t("common.copied"), color: "green", timeout: 2000 });
    } catch {
        /* ignore */
    }
}

useLocalShortcuts([
    { key: "N", label: "shortcuts.newApiKey", category: "actions", handler: () => openCreate() },
]);
</script>
