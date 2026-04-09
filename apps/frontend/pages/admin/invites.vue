<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">Invite Codes</h1>
                <p class="text-fg-muted mt-1 text-[12px]">
                    Create and manage invite codes for registration.
                </p>
            </div>
            <button
                class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                @click="showCreateModal = true"
            >
                <Icon name="lucide:plus" class="mr-1.5 inline h-4 w-4" />
                New Code
            </button>
        </div>

        <!-- Info banner: only active in invite_only mode -->
        <div
            v-if="registrationMode !== 'invite_only'"
            class="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3"
        >
            <Icon name="lucide:info" class="h-4 w-4 shrink-0 text-amber-400" />
            <p class="text-[12px] text-amber-300">
                Codes are only enforced when
                <strong>Registration Mode</strong> is set to <strong>invite_only</strong> in
                <NuxtLink to="/admin/settings" class="underline hover:no-underline"
                    >Settings</NuxtLink
                >.
            </p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="glass-card p-5">
                <div class="flex items-center justify-between">
                    <div class="space-y-2">
                        <UiSkeleton width="160" height="14" rounded="lg" />
                        <div class="flex items-center gap-2">
                            <UiSkeleton width="100" height="13" />
                            <UiSkeleton width="48" height="18" rounded="full" />
                        </div>
                    </div>
                    <UiSkeleton width="32" height="32" rounded="lg" />
                </div>
            </div>
        </div>

        <!-- List -->
        <div v-else class="space-y-3">
            <div v-if="!codes.length" class="glass-card p-8 text-center">
                <p class="text-fg-muted text-[13px]">No invite codes yet.</p>
            </div>

            <div v-for="code in codes" :key="code.id" class="glass-card p-5">
                <div
                    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                    <!-- Code + label -->
                    <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div
                            class="border-line bg-base flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5"
                        >
                            <span
                                class="text-fg font-mono text-[14px] font-semibold tracking-widest sm:text-[15px]"
                            >
                                {{ code.code }}
                            </span>
                            <button
                                class="text-fg-faint hover:text-primary-400"
                                title="Copy"
                                @click="copyCode(code.code)"
                            >
                                <Icon name="lucide:copy" class="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div class="min-w-0">
                            <p v-if="code.label" class="text-fg truncate text-[13px] font-medium">
                                {{ code.label }}
                            </p>
                            <div class="mt-0.5 flex flex-wrap items-center gap-2">
                                <span
                                    class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    :class="
                                        code.active
                                            ? 'bg-green-500/15 text-green-400'
                                            : 'bg-gray-500/15 text-gray-400'
                                    "
                                >
                                    {{ code.active ? "Active" : "Revoked" }}
                                </span>
                                <span class="text-fg-faint text-[11px]">
                                    {{ code.uses }}/{{ code.maxUses }} uses
                                </span>
                                <span v-if="code.expiresAt" class="text-fg-faint text-[11px]">
                                    · Expires {{ new Date(code.expiresAt).toLocaleDateString() }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex shrink-0 items-center gap-1">
                        <button
                            v-if="code.active"
                            class="text-fg-faint rounded-lg p-2.5 hover:text-amber-400"
                            title="Revoke"
                            @click="handleRevoke(code.id)"
                        >
                            <Icon name="lucide:ban" class="h-4 w-4" />
                        </button>
                        <button
                            class="text-fg-faint rounded-lg p-2.5 hover:text-red-400"
                            title="Delete permanently"
                            @click="handleDelete(code.id)"
                        >
                            <Icon name="lucide:trash-2" class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <!-- Used-by list -->
                <div v-if="(code.usages ?? []).length" class="border-line mt-3 border-t pt-3">
                    <p class="text-fg-faint mb-1.5 text-[10px] tracking-wider uppercase">Used by</p>
                    <div class="flex flex-wrap gap-2">
                        <span
                            v-for="use in code.usages ?? []"
                            :key="use.userId"
                            class="bg-base text-fg-muted rounded-lg px-2 py-1 text-[11px]"
                        >
                            {{ use.userId.slice(0, 8) }}…
                            <span class="text-fg-faint">
                                · {{ new Date(use.usedAt).toLocaleDateString() }}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
        <div
            v-if="showCreateModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            @click.self="showCreateModal = false"
        >
            <div class="border-line bg-surface w-full max-w-md rounded-2xl border p-6">
                <h2 class="text-fg mb-5 text-[16px] font-semibold">New Invite Code</h2>

                <div class="space-y-4">
                    <!-- Label -->
                    <div>
                        <label class="text-fg-dim mb-1.5 block text-[12px] font-medium">
                            Label (optional)
                        </label>
                        <input
                            v-model="newCode.label"
                            type="text"
                            placeholder="e.g. For John Doe"
                            class="border-line bg-base text-fg placeholder-fg-ghost focus:border-primary-500/50 w-full rounded-xl border px-3 py-2 text-[13px] outline-none"
                        />
                    </div>

                    <!-- Max Uses -->
                    <div>
                        <label class="text-fg-dim mb-1.5 block text-[12px] font-medium">
                            Max Uses
                        </label>
                        <input
                            v-model.number="newCode.maxUses"
                            type="number"
                            min="1"
                            max="100"
                            class="border-line bg-base text-fg focus:border-primary-500/50 w-full rounded-xl border px-3 py-2 text-[13px] outline-none"
                        />
                    </div>

                    <!-- Expires At -->
                    <div>
                        <label class="text-fg-dim mb-1.5 block text-[12px] font-medium">
                            Expires At (optional)
                        </label>
                        <input
                            v-model="newCode.expiresAt"
                            type="datetime-local"
                            class="border-line bg-base text-fg focus:border-primary-500/50 w-full rounded-xl border px-3 py-2 text-[13px] outline-none"
                        />
                    </div>

                    <!-- Send via Email -->
                    <div>
                        <label class="text-fg-dim mb-1.5 block text-[12px] font-medium">
                            Send to Email (optional)
                        </label>
                        <input
                            v-model="newCode.email"
                            type="email"
                            placeholder="user@example.com"
                            class="border-line bg-base text-fg placeholder-fg-ghost focus:border-primary-500/50 w-full rounded-xl border px-3 py-2 text-[13px] outline-none"
                        />
                        <p class="text-fg-faint mt-1 text-[11px]">
                            If provided, the invite code will be emailed automatically.
                        </p>
                    </div>
                </div>

                <!-- Error -->
                <p v-if="createError" class="mt-3 text-[12px] text-red-400">{{ createError }}</p>

                <!-- Actions -->
                <div class="mt-6 flex justify-end gap-2">
                    <button
                        class="border-line text-fg-muted hover:text-fg rounded-xl border px-4 py-2 text-[13px]"
                        @click="showCreateModal = false"
                    >
                        Cancel
                    </button>
                    <button
                        :disabled="creating"
                        class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                        @click="handleCreate"
                    >
                        <span v-if="creating" class="inline-flex items-center gap-2">
                            <Icon name="svg-spinners:ring-resize" class="h-3.5 w-3.5" />
                            Creating...
                        </span>
                        <span v-else>Create Code</span>
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { InviteCode } from "~/types/api";

definePageMeta({ layout: "admin" });

const { t } = useI18n();

useHead({ title: () => `${t("admin.nav.invites")} — Admin` });

const admin = useAdminApi();
const toast = useToast();
const queryClient = useQueryClient();

const { data: codes, isLoading: loading } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: () => admin.listInviteCodes(),
});

const { data: regModeData } = useQuery({
    queryKey: ["admin-registration-mode"],
    queryFn: async () => {
        const settings = await admin.getSettings();
        const entry = settings.find((s) => s.key === "registration_mode");
        return entry ? JSON.parse(entry.value) : "open";
    },
});

const registrationMode = computed(() => regModeData.value ?? "open");

// Create modal
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref<string | null>(null);
const newCode = reactive({
    label: "",
    maxUses: 1,
    expiresAt: "",
    email: "",
});

// ── Copy ─────────────────────────────────────
function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.add({ title: "Code copied!", color: "green", timeout: 2000 });
}

// ── Create ───────────────────────────────────
async function handleCreate() {
    createError.value = null;
    creating.value = true;
    try {
        await admin.createInviteCode({
            label: newCode.label || undefined,
            maxUses: newCode.maxUses,
            expiresAt: newCode.expiresAt || null,
            email: newCode.email || undefined,
        });
        const emailSent = !!newCode.email;
        showCreateModal.value = false;
        newCode.label = "";
        newCode.maxUses = 1;
        newCode.expiresAt = "";
        newCode.email = "";
        await queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
        toast.add({
            title: emailSent ? "Invite code created & email sent!" : "Invite code created!",
            color: "green",
            timeout: 3000,
        });
    } catch (err: unknown) {
        createError.value = err instanceof Error ? err.message : "Failed to create code";
    } finally {
        creating.value = false;
    }
}

// ── Revoke ───────────────────────────────────
async function handleRevoke(id: string) {
    try {
        await admin.revokeInviteCode(id);
        await queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
        toast.add({ title: "Code revoked", color: "amber", timeout: 3000 });
    } catch (err: unknown) {
        toast.add({
            title: err instanceof Error ? err.message : "Failed to revoke",
            color: "red",
            timeout: 3000,
        });
    }
}

// ── Delete ───────────────────────────────────
async function handleDelete(id: string) {
    if (!confirm("Delete this invite code permanently?")) return;
    try {
        await admin.deleteInviteCode(id);
        await queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
        toast.add({ title: "Code deleted", color: "green", timeout: 3000 });
    } catch (err: unknown) {
        toast.add({
            title: err instanceof Error ? err.message : "Failed to delete",
            color: "red",
            timeout: 3000,
        });
    }
}
</script>
