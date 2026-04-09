<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold">{{ $t("apiKeys.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("apiKeys.description") }}</p>
            </div>
            <UButton icon="i-lucide-plus" @click="showCreate = true">
                {{ $t("apiKeys.create") }}
            </UButton>
        </div>

        <!-- Key just created -->
        <div v-if="newKey" class="border-line bg-surface rounded-xl border p-4">
            <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-lucide-alert-triangle" class="h-5 w-5 text-amber-400" />
                <span class="text-sm font-medium text-amber-400">{{
                    $t("apiKeys.copyWarning")
                }}</span>
            </div>
            <code class="bg-surface-hover text-fg block break-all rounded-lg p-3 text-sm font-mono">
                {{ newKey }}
            </code>
            <UButton variant="ghost" size="sm" class="mt-2" @click="copyKey">
                {{ $t("apiKeys.copy") }}
            </UButton>
        </div>

        <!-- Keys list -->
        <div v-if="loading" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="text-fg-muted h-6 w-6 animate-spin" />
        </div>

        <div v-else-if="keys.length === 0" class="text-fg-muted py-12 text-center text-sm">
            {{ $t("apiKeys.empty") }}
        </div>

        <div v-else class="space-y-3">
            <div
                v-for="key in keys"
                :key="key.id"
                class="border-line bg-surface flex items-center justify-between rounded-xl border p-4"
            >
                <div>
                    <p class="text-fg text-sm font-medium">{{ key.name }}</p>
                    <p class="text-fg-muted mt-0.5 text-xs font-mono">{{ key.prefix }}...</p>
                    <p class="text-fg-dim mt-1 text-xs">
                        {{
                            key.lastUsedAt
                                ? $t("apiKeys.lastUsed", { date: formatDateShort(key.lastUsedAt) })
                                : $t("apiKeys.neverUsed")
                        }}
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <UBadge v-if="key.revoked" color="red" variant="subtle">
                        {{ $t("apiKeys.revoked") }}
                    </UBadge>
                    <UButton
                        v-if="!key.revoked"
                        variant="ghost"
                        color="amber"
                        size="sm"
                        icon="i-lucide-ban"
                        :loading="revoking === key.id"
                        @click="handleRevoke(key.id)"
                    />
                    <UButton
                        variant="ghost"
                        color="red"
                        size="sm"
                        icon="i-lucide-trash-2"
                        :loading="deleting === key.id"
                        @click="handleDelete(key.id)"
                    />
                </div>
            </div>
        </div>

        <!-- Create Modal -->
        <UModal v-model:open="showCreate">
            <template #content>
                <div class="p-6">
                    <h2 class="text-fg mb-4 text-lg font-semibold">
                        {{ $t("apiKeys.createTitle") }}
                    </h2>
                    <form class="space-y-4" @submit.prevent="handleCreate">
                        <UFormField :label="$t('apiKeys.name')">
                            <UInput v-model="createName" required class="w-full" />
                        </UFormField>

                        <UFormField :label="$t('apiKeys.expiresAt')">
                            <UInput v-model="createExpires" type="date" class="w-full" />
                        </UFormField>

                        <div class="flex justify-end gap-2">
                            <UButton variant="outline" @click="showCreate = false">
                                {{ $t("common.cancel") }}
                            </UButton>
                            <UButton type="submit" :loading="creating" :disabled="!createName">
                                {{ $t("apiKeys.create") }}
                            </UButton>
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
useHead({ title: () => t("apiKeys.title") });

const http = useHttp();
const toast = useAppToast();
const { formatDateShort } = useFormatters();

interface ApiKeyItem {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    lastUsedAt: string | null;
    expiresAt: string | null;
    revoked: boolean;
    createdAt: string;
}

const keys = ref<ApiKeyItem[]>([]);
const loading = ref(true);
const newKey = ref<string | null>(null);
const showCreate = ref(false);
const createName = ref("");
const createExpires = ref("");
const creating = ref(false);
const revoking = ref<string | null>(null);
const deleting = ref<string | null>(null);

async function loadKeys() {
    loading.value = true;
    try {
        const { data } = await http.get<ApiKeyItem[]>("/api/api-keys");
        keys.value = data;
    } catch {
        // ignore
    } finally {
        loading.value = false;
    }
}

async function handleCreate() {
    creating.value = true;
    try {
        const { data } = await http.post<{ raw: string }>("/api/api-keys", {
            name: createName.value,
            expiresAt: createExpires.value
                ? new Date(createExpires.value).toISOString()
                : undefined,
        });
        newKey.value = data.raw;
        showCreate.value = false;
        createName.value = "";
        createExpires.value = "";
        await loadKeys();
    } catch {
        toast.error(t("apiKeys.createError"));
    } finally {
        creating.value = false;
    }
}

async function handleRevoke(id: string) {
    revoking.value = id;
    try {
        await http.post(`/api/api-keys/${id}/revoke`);
        await loadKeys();
    } catch {
        toast.error(t("apiKeys.revokeError"));
    } finally {
        revoking.value = null;
    }
}

async function handleDelete(id: string) {
    deleting.value = id;
    try {
        await http.delete(`/api/api-keys/${id}`);
        await loadKeys();
        newKey.value = null;
    } catch {
        toast.error(t("apiKeys.deleteError"));
    } finally {
        deleting.value = null;
    }
}

function copyKey() {
    if (newKey.value) {
        navigator.clipboard.writeText(newKey.value);
        toast.success(t("apiKeys.copied"));
    }
}

onMounted(loadKeys);
</script>
