<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.veterinarians.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.veterinarians.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">{{ $t("pages.veterinarians.add") }}</UiButton>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="glass-card h-24 animate-pulse rounded-xl" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{ $t("common.retry") }}</UiButton>
        </div>

        <!-- List -->
        <div v-else-if="vets?.length" class="space-y-2">
            <div
                v-for="vet in vets"
                :key="vet.id"
                class="glass-card flex items-center justify-between rounded-xl p-4"
            >
                <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                        <Icon name="lucide:stethoscope" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">{{ vet.name }}</p>
                        <p class="text-fg-faint text-xs">
                            <template v-if="vet.clinicName">{{ vet.clinicName }}</template>
                            <template v-if="vet.clinicName && vet.phone"> · </template>
                            <template v-if="vet.phone">{{ vet.phone }}</template>
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="bg-teal-500/10 text-teal-400 rounded-md px-2 py-0.5 text-xs font-medium">
                        {{ $t("pages.veterinarians.visitCount", { n: vet._count.vetVisits }) }}
                    </span>
                    <UiButton variant="ghost" icon="lucide:pencil" size="sm" @click="openEditModal(vet)" />
                    <UiButton variant="danger" icon="lucide:trash-2" size="sm" @click="confirmDelete(vet.id)" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:stethoscope" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.veterinarians.empty") }}</p>
            <UiButton class="mt-4" @click="openCreateModal">{{ $t("pages.veterinarians.addFirst") }}</UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal :show="showCreate" :title="$t('pages.veterinarians.create')" width="lg" @close="showCreate = false">
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiTextInput v-model="form.name" :label="$t('pages.veterinarians.fields.name')" required />
                <UiTextInput v-model="form.clinicName" :label="$t('pages.veterinarians.fields.clinicName')" />
                <UiTextInput v-model="form.address" :label="$t('pages.veterinarians.fields.address')" />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput v-model="form.phone" :label="$t('pages.veterinarians.fields.phone')" type="tel" />
                    <UiTextInput v-model="form.email" :label="$t('pages.veterinarians.fields.email')" type="email" />
                </div>
                <UiTextarea v-model="form.notes" :label="$t('pages.veterinarians.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal :show="showEdit" :title="$t('pages.veterinarians.edit')" width="lg" @close="showEdit = false">
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput v-model="editForm.name" :label="$t('pages.veterinarians.fields.name')" required />
                <UiTextInput v-model="editForm.clinicName" :label="$t('pages.veterinarians.fields.clinicName')" />
                <UiTextInput v-model="editForm.address" :label="$t('pages.veterinarians.fields.address')" />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput v-model="editForm.phone" :label="$t('pages.veterinarians.fields.phone')" type="tel" />
                    <UiTextInput v-model="editForm.email" :label="$t('pages.veterinarians.fields.email')" type="email" />
                </div>
                <UiTextarea v-model="editForm.notes" :label="$t('pages.veterinarians.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showEdit = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="updating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Delete Confirmation -->
        <UiConfirmDialog
            :show="showDeleteConfirm"
            :title="$t('common.confirmDelete')"
            :message="$t('pages.veterinarians.confirmDelete')"
            variant="danger"
            :confirm-label="$t('common.delete')"
            :cancel-label="$t('common.cancel')"
            :loading="deleting"
            @confirm="handleDelete"
            @cancel="showDeleteConfirm = false"
        />
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";

interface Veterinarian {
    id: string;
    name: string;
    clinicName: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
    _count: { vetVisits: number };
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.veterinarians.title") });

// ── Data ─────────────────────────────────────────────────
const {
    data: vets,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["veterinarians"],
    queryFn: () => api.get<Veterinarian[]>("/api/veterinarians"),
});

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    name: "",
    clinicName: "",
    address: "",
    phone: "",
    email: "",
    notes: "",
});

function resetForm() {
    Object.assign(form, { name: "", clinicName: "", address: "", phone: "", email: "", notes: "" });
}

function openCreateModal() {
    resetForm();
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/veterinarians", {
            name: form.name,
            clinicName: form.clinicName || undefined,
            address: form.address || undefined,
            phone: form.phone || undefined,
            email: form.email || undefined,
            notes: form.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["veterinarians"] });
        toast.success(t("pages.veterinarians.created"));
        showCreate.value = false;
        resetForm();
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleCreate() {
    createMutation();
}

// ── Edit ─────────────────────────────────────────────────
const showEdit = ref(false);
const editingId = ref("");
const editForm = reactive({
    name: "",
    clinicName: "",
    address: "",
    phone: "",
    email: "",
    notes: "",
});

function openEditModal(vet: Veterinarian) {
    editingId.value = vet.id;
    Object.assign(editForm, {
        name: vet.name,
        clinicName: vet.clinicName ?? "",
        address: vet.address ?? "",
        phone: vet.phone ?? "",
        email: vet.email ?? "",
        notes: vet.notes ?? "",
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/veterinarians/${editingId.value}`, {
            name: editForm.name,
            clinicName: editForm.clinicName || undefined,
            address: editForm.address || undefined,
            phone: editForm.phone || undefined,
            email: editForm.email || undefined,
            notes: editForm.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["veterinarians"] });
        toast.success(t("pages.veterinarians.saved"));
        showEdit.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleUpdate() {
    updateMutation();
}

// ── Delete ───────────────────────────────────────────────
const showDeleteConfirm = ref(false);
const deletingId = ref("");

function confirmDelete(id: string) {
    deletingId.value = id;
    showDeleteConfirm.value = true;
}

const { mutate: deleteMutation, isPending: deleting } = useMutation({
    mutationFn: () => api.del(`/api/veterinarians/${deletingId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["veterinarians"] });
        toast.success(t("pages.veterinarians.deleted"));
        showDeleteConfirm.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDelete() {
    deleteMutation();
}
</script>
