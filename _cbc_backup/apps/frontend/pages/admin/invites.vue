<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div />
            <button
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                @click="showCreate = true"
            >
                {{ $t("admin.invites.create") }}
            </button>
        </div>

        <!-- Invite Codes -->
        <div class="overflow-x-auto glass-card">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-b border-line text-xs uppercase tracking-wider text-fg-muted">
                        <th class="px-4 py-3">{{ $t("admin.invites.code") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.invites.label") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.invites.max_uses") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.invites.used") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.users.status") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.invites.expires") }}</th>
                        <th class="px-4 py-3 text-right">{{ $t("common.actions") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="invite in invites"
                        :key="invite.id"
                        class="border-b border-line last:border-b-0 transition hover:bg-hover"
                    >
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <code class="rounded bg-surface-alt px-2 py-0.5 text-xs text-fg">{{
                                    invite.code
                                }}</code>
                                <button
                                    class="text-fg-soft transition hover:text-fg"
                                    @click="copyCode(invite.code)"
                                >
                                    <Icon name="lucide:copy" class="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-fg-muted">{{ invite.label || "—" }}</td>
                        <td class="px-4 py-3 text-fg-muted">{{ invite.maxUses ?? "∞" }}</td>
                        <td class="px-4 py-3 text-fg-muted">
                            {{ invite._count?.usages ?? invite.uses ?? 0 }}
                        </td>
                        <td class="px-4 py-3">
                            <span
                                v-if="invite.active"
                                class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
                                >{{ $t("admin.invites.active") }}</span
                            >
                            <span
                                v-else
                                class="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-400"
                                >{{ $t("admin.invites.deactivated") }}</span
                            >
                        </td>
                        <td class="px-4 py-3 text-fg-muted">
                            {{
                                invite.expiresAt
                                    ? new Date(invite.expiresAt).toLocaleDateString()
                                    : "—"
                            }}
                        </td>
                        <td class="px-4 py-3 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button
                                    v-if="invite.active"
                                    class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-amber-500 hover:text-amber-400"
                                    @click="handleDeactivate(invite.id)"
                                >
                                    {{ $t("admin.invites.deactivate") }}
                                </button>
                                <button
                                    class="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted transition hover:border-red-500 hover:text-red-400"
                                    @click="handleDeleteInvite(invite.id)"
                                >
                                    {{ $t("common.delete") }}
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="invites.length === 0">
                        <td colspan="7" class="px-4 py-12 text-center text-fg-muted">
                            {{ $t("common.no_data") }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Create Modal -->
        <Teleport to="body">
            <div
                v-if="showCreate"
                class="fixed inset-0 z-50 flex items-center justify-center bg-overlay"
                @click.self="showCreate = false"
            >
                <div class="w-full max-w-md glass-card p-6 shadow-xl">
                    <h3 class="mb-4 text-lg font-bold text-fg">{{ $t("admin.invites.create") }}</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.invites.label")
                            }}</label>
                            <input
                                v-model="createForm.label"
                                type="text"
                                :placeholder="$t('admin.invites.label_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.invites.max_uses")
                            }}</label>
                            <input
                                v-model.number="createForm.maxUses"
                                type="number"
                                min="1"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("admin.invites.expires")
                            }}</label>
                            <input
                                v-model="createForm.expiresAt"
                                type="date"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button
                            class="rounded-lg border border-line px-4 py-2 text-sm text-fg-muted transition hover:bg-hover"
                            @click="showCreate = false"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                            @click="handleCreate"
                        >
                            {{ $t("common.save") }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Invites — Admin — Cold Blood Cast" });

const admin = useAdmin();
const queryClient = useQueryClient();

const showCreate = ref(false);
const createForm = ref({
    label: "",
    maxUses: 1,
    expiresAt: "",
});

interface InviteCode {
    id: string;
    code: string;
    label: string | null;
    maxUses: number | null;
    uses: number;
    _count?: { usages: number };
    active: boolean;
    expiresAt: string | null;
}

const { data: invitesData } = useQuery<InviteCode[]>({
    queryKey: ["admin", "invites"],
    queryFn: () => admin.listInvites(),
});

const invites = computed(() => invitesData.value ?? []);

async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
}

async function handleCreate() {
    const payload: Record<string, unknown> = {};
    if (createForm.value.label) payload.label = createForm.value.label;
    if (createForm.value.maxUses) payload.maxUses = createForm.value.maxUses;
    if (createForm.value.expiresAt)
        payload.expiresAt = new Date(createForm.value.expiresAt).toISOString();
    await admin.createInvite(payload);
    showCreate.value = false;
    createForm.value = { label: "", maxUses: 1, expiresAt: "" };
    queryClient.invalidateQueries({ queryKey: ["admin", "invites"] });
}

async function handleDeactivate(id: string) {
    await admin.deactivateInvite(id);
    queryClient.invalidateQueries({ queryKey: ["admin", "invites"] });
}

async function handleDeleteInvite(id: string) {
    await admin.deleteInvite(id);
    queryClient.invalidateQueries({ queryKey: ["admin", "invites"] });
}
</script>
