<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.vetVisits.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.vetVisits.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">{{ $t("pages.vetVisits.add") }}</UiButton>
        </div>

        <!-- Cost Summary -->
        <div v-if="costs" class="glass-card rounded-xl p-5">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Icon name="lucide:receipt" class="h-5 w-5" />
                </div>
                <div>
                    <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                        {{ $t("pages.vetVisits.totalCosts") }}
                    </p>
                    <p class="text-fg text-xl font-bold">{{ formatCost(costs.totalCents) }}</p>
                </div>
                <div class="ml-auto text-right">
                    <p class="text-fg-faint text-xs">{{ $t("pages.vetVisits.visitCountLabel", { n: costs.visitCount }) }}</p>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
            <UiSelect v-model="selectedPet" class="w-48">
                <option value="ALL">{{ $t("pages.vetVisits.allPets") }}</option>
                <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
            </UiSelect>
            <UiSelect v-model="selectedVet" class="w-48">
                <option value="ALL">{{ $t("pages.vetVisits.allVets") }}</option>
                <option v-for="v in vets" :key="v.id" :value="v.id">{{ v.name }}</option>
            </UiSelect>
            <UiSelect v-model="selectedType" class="w-48">
                <option value="ALL">{{ $t("pages.vetVisits.allTypes") }}</option>
                <option v-for="vt in visitTypes" :key="vt" :value="vt">{{ $t(`pages.vetVisits.types.${vt}`) }}</option>
            </UiSelect>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="glass-card h-20 animate-pulse rounded-xl" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{ $t("common.retry") }}</UiButton>
        </div>

        <!-- List -->
        <div v-else-if="visits?.length" class="space-y-2">
            <div
                v-for="visit in visits"
                :key="visit.id"
                class="glass-card flex items-center justify-between rounded-xl p-4"
            >
                <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                        <Icon name="lucide:stethoscope" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">
                            {{ visit.pet?.name }}
                            <span v-if="visit.reason" class="text-fg-faint"> — {{ visit.reason }}</span>
                        </p>
                        <p class="text-fg-faint text-xs">
                            {{ visit.veterinarian?.name ?? $t("pages.vetVisits.noVet") }}
                            <template v-if="visit.veterinarian?.clinicName"> · {{ visit.veterinarian.clinicName }}</template>
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <p class="text-fg-muted text-sm">{{ new Date(visit.visitDate).toLocaleDateString() }}</p>
                        <p v-if="visit.costCents" class="text-fg-faint text-xs">{{ formatCost(visit.costCents) }}</p>
                    </div>
                    <span :class="visitTypeBadgeClass(visit.visitType)" class="rounded-md px-2 py-0.5 text-xs font-medium">
                        {{ $t(`pages.vetVisits.types.${visit.visitType}`) }}
                    </span>
                    <UiButton variant="ghost" icon="lucide:pencil" size="sm" @click="openEditModal(visit)" />
                    <UiButton variant="danger" icon="lucide:trash-2" size="sm" @click="confirmDelete(visit.id)" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:stethoscope" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.vetVisits.empty") }}</p>
            <UiButton class="mt-4" @click="openCreateModal">{{ $t("pages.vetVisits.addFirst") }}</UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal :show="showCreate" :title="$t('pages.vetVisits.create')" width="lg" @close="showCreate = false">
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiSelect v-model="form.petId" :label="$t('pages.vetVisits.fields.pet')" required>
                    <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
                </UiSelect>
                <UiSelect v-model="form.veterinarianId" :label="$t('pages.vetVisits.fields.veterinarian')">
                    <option value="">{{ $t("pages.vetVisits.fields.noVet") }}</option>
                    <option v-for="v in vets" :key="v.id" :value="v.id">{{ v.name }}</option>
                </UiSelect>
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput v-model="form.visitDate" :label="$t('pages.vetVisits.fields.visitDate')" type="date" required />
                    <UiSelect v-model="form.visitType" :label="$t('pages.vetVisits.fields.visitType')">
                        <option v-for="vt in visitTypes" :key="vt" :value="vt">{{ $t(`pages.vetVisits.types.${vt}`) }}</option>
                    </UiSelect>
                </div>
                <UiTextInput v-model="form.reason" :label="$t('pages.vetVisits.fields.reason')" />
                <UiTextarea v-model="form.diagnosis" :label="$t('pages.vetVisits.fields.diagnosis')" />
                <UiTextarea v-model="form.treatment" :label="$t('pages.vetVisits.fields.treatment')" />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput v-model.number="form.costEur" :label="$t('pages.vetVisits.fields.cost')" type="number" step="0.01" min="0" />
                    <UiTextInput v-model.number="form.weightGrams" :label="$t('pages.vetVisits.fields.weight')" type="number" min="0" />
                </div>
                <UiTextInput v-model="form.nextAppointment" :label="$t('pages.vetVisits.fields.nextAppointment')" type="date" />
                <UiTextarea v-model="form.notes" :label="$t('pages.vetVisits.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal :show="showEdit" :title="$t('pages.vetVisits.edit')" width="lg" @close="showEdit = false">
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiSelect v-model="editForm.veterinarianId" :label="$t('pages.vetVisits.fields.veterinarian')">
                    <option value="">{{ $t("pages.vetVisits.fields.noVet") }}</option>
                    <option v-for="v in vets" :key="v.id" :value="v.id">{{ v.name }}</option>
                </UiSelect>
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput v-model="editForm.visitDate" :label="$t('pages.vetVisits.fields.visitDate')" type="date" required />
                    <UiSelect v-model="editForm.visitType" :label="$t('pages.vetVisits.fields.visitType')">
                        <option v-for="vt in visitTypes" :key="vt" :value="vt">{{ $t(`pages.vetVisits.types.${vt}`) }}</option>
                    </UiSelect>
                </div>
                <UiTextInput v-model="editForm.reason" :label="$t('pages.vetVisits.fields.reason')" />
                <UiTextarea v-model="editForm.diagnosis" :label="$t('pages.vetVisits.fields.diagnosis')" />
                <UiTextarea v-model="editForm.treatment" :label="$t('pages.vetVisits.fields.treatment')" />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput v-model.number="editForm.costEur" :label="$t('pages.vetVisits.fields.cost')" type="number" step="0.01" min="0" />
                    <UiTextInput v-model.number="editForm.weightGrams" :label="$t('pages.vetVisits.fields.weight')" type="number" min="0" />
                </div>
                <UiTextInput v-model="editForm.nextAppointment" :label="$t('pages.vetVisits.fields.nextAppointment')" type="date" />
                <UiTextarea v-model="editForm.notes" :label="$t('pages.vetVisits.fields.notes')" />
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
            :message="$t('pages.vetVisits.confirmDelete')"
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

interface VetVisit {
    id: string;
    petId: string;
    veterinarianId: string | null;
    visitDate: string;
    visitType: string;
    reason: string | null;
    diagnosis: string | null;
    treatment: string | null;
    costCents: number | null;
    weightGrams: number | null;
    nextAppointment: string | null;
    notes: string | null;
    pet: { id: string; name: string; species: string } | null;
    veterinarian: { id: string; name: string; clinicName: string | null } | null;
    documents: Array<{ id: string; label: string | null; upload: { url: string } }>;
}

interface Pet {
    id: string;
    name: string;
}

interface Veterinarian {
    id: string;
    name: string;
    clinicName: string | null;
}

interface CostSummary {
    totalCents: number;
    visitCount: number;
    perPet: Array<{ petId: string; petName: string; totalCents: number; visitCount: number }>;
}

const visitTypes = [
    "CHECKUP",
    "EMERGENCY",
    "SURGERY",
    "VACCINATION",
    "DEWORMING",
    "FECAL_TEST",
    "CONSULTATION",
    "FOLLOW_UP",
    "OTHER",
] as const;

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.vetVisits.title") });

const selectedPet = ref("ALL");
const selectedVet = ref("ALL");
const selectedType = ref("ALL");

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (selectedPet.value && selectedPet.value !== "ALL") params.set("petId", selectedPet.value);
    if (selectedVet.value && selectedVet.value !== "ALL") params.set("veterinarianId", selectedVet.value);
    if (selectedType.value && selectedType.value !== "ALL") params.set("visitType", selectedType.value);
    return params.toString();
});

// ── Data ─────────────────────────────────────────────────
const {
    data: visits,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["vet-visits", selectedPet, selectedVet, selectedType],
    queryFn: () => api.get<VetVisit[]>(`/api/vet-visits${queryParams.value ? `?${queryParams.value}` : ""}`),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const { data: vets } = useQuery({
    queryKey: ["veterinarians"],
    queryFn: () => api.get<Veterinarian[]>("/api/veterinarians"),
});

const { data: costs } = useQuery({
    queryKey: ["vet-costs"],
    queryFn: () => api.get<CostSummary>("/api/vet-visits/costs"),
});

// ── Helpers ──────────────────────────────────────────────
function formatCost(cents: number): string {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function visitTypeBadgeClass(type: string): string {
    switch (type) {
        case "EMERGENCY":
            return "bg-red-500/10 text-red-400";
        case "SURGERY":
            return "bg-orange-500/10 text-orange-400";
        case "VACCINATION":
            return "bg-blue-500/10 text-blue-400";
        case "CHECKUP":
            return "bg-green-500/10 text-green-400";
        case "DEWORMING":
        case "FECAL_TEST":
            return "bg-purple-500/10 text-purple-400";
        default:
            return "bg-white/5 text-fg-faint";
    }
}

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    petId: "",
    veterinarianId: "",
    visitDate: "",
    visitType: "CHECKUP" as string,
    reason: "",
    diagnosis: "",
    treatment: "",
    costEur: null as number | null,
    weightGrams: null as number | null,
    nextAppointment: "",
    notes: "",
});

function resetForm() {
    Object.assign(form, {
        petId: "",
        veterinarianId: "",
        visitDate: "",
        visitType: "CHECKUP",
        reason: "",
        diagnosis: "",
        treatment: "",
        costEur: null,
        weightGrams: null,
        nextAppointment: "",
        notes: "",
    });
}

function openCreateModal() {
    resetForm();
    form.visitDate = new Date().toISOString().slice(0, 10);
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/vet-visits", {
            petId: form.petId,
            veterinarianId: form.veterinarianId || undefined,
            visitDate: form.visitDate,
            visitType: form.visitType,
            reason: form.reason || undefined,
            diagnosis: form.diagnosis || undefined,
            treatment: form.treatment || undefined,
            costCents: form.costEur != null ? Math.round(form.costEur * 100) : undefined,
            weightGrams: form.weightGrams ?? undefined,
            nextAppointment: form.nextAppointment || undefined,
            notes: form.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vet-visits"] });
        queryClient.invalidateQueries({ queryKey: ["vet-costs"] });
        queryClient.invalidateQueries({ queryKey: ["weights"] });
        toast.success(t("pages.vetVisits.created"));
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
    veterinarianId: "",
    visitDate: "",
    visitType: "CHECKUP" as string,
    reason: "",
    diagnosis: "",
    treatment: "",
    costEur: null as number | null,
    weightGrams: null as number | null,
    nextAppointment: "",
    notes: "",
});

function openEditModal(visit: VetVisit) {
    editingId.value = visit.id;
    Object.assign(editForm, {
        veterinarianId: visit.veterinarianId ?? "",
        visitDate: visit.visitDate.slice(0, 10),
        visitType: visit.visitType,
        reason: visit.reason ?? "",
        diagnosis: visit.diagnosis ?? "",
        treatment: visit.treatment ?? "",
        costEur: visit.costCents != null ? visit.costCents / 100 : null,
        weightGrams: visit.weightGrams,
        nextAppointment: visit.nextAppointment?.slice(0, 10) ?? "",
        notes: visit.notes ?? "",
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/vet-visits/${editingId.value}`, {
            veterinarianId: editForm.veterinarianId || null,
            visitDate: editForm.visitDate,
            visitType: editForm.visitType,
            reason: editForm.reason || undefined,
            diagnosis: editForm.diagnosis || undefined,
            treatment: editForm.treatment || undefined,
            costCents: editForm.costEur != null ? Math.round(editForm.costEur * 100) : null,
            weightGrams: editForm.weightGrams,
            nextAppointment: editForm.nextAppointment || null,
            notes: editForm.notes || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vet-visits"] });
        queryClient.invalidateQueries({ queryKey: ["vet-costs"] });
        toast.success(t("pages.vetVisits.saved"));
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
    mutationFn: () => api.del(`/api/vet-visits/${deletingId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vet-visits"] });
        queryClient.invalidateQueries({ queryKey: ["vet-costs"] });
        toast.success(t("pages.vetVisits.deleted"));
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
