<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div
            class="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.vetVisits.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.vetVisits.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="showModeChoice = true">{{
                $t("pages.vetVisits.add")
            }}</UiButton>
        </div>

        <!-- Cost Summary -->
        <div v-if="costs" class="glass-card stat-card animate-fade-in-up rounded-xl p-5 delay-75">
            <div class="flex items-center gap-3">
                <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
                >
                    <Icon name="lucide:receipt" class="h-5 w-5" />
                </div>
                <div>
                    <p class="text-fg-faint text-xs font-medium tracking-wider uppercase">
                        {{ $t("pages.vetVisits.totalCosts") }}
                    </p>
                    <p class="text-fg text-xl font-bold">{{ formatCost(costs.totalCents) }}</p>
                </div>
                <div class="ml-auto text-right">
                    <p class="text-fg-faint text-xs">
                        {{ $t("pages.vetVisits.visitCountLabel", { n: costs.visitCount }) }}
                    </p>
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
                <option v-for="vt in visitTypes" :key="vt" :value="vt">
                    {{ $t(`pages.vetVisits.types.${vt}`) }}
                </option>
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
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <!-- List -->
        <div v-else-if="visits?.length" class="animate-fade-in-up space-y-2 delay-200">
            <NuxtLink
                v-for="visit in visits"
                :key="visit.id"
                :to="`/vet-visits/${visit.id}`"
                class="glass-card flex items-center justify-between rounded-xl p-4 transition hover:ring-1 hover:ring-white/10"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg"
                        :class="
                            visit.isAppointment
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-teal-500/10 text-teal-400'
                        "
                    >
                        <Icon
                            :name="
                                visit.isAppointment ? 'lucide:calendar-clock' : 'lucide:stethoscope'
                            "
                            class="h-5 w-5"
                        />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">
                            {{ visit.pet?.name }}
                            <span v-if="visit.reason" class="text-fg-faint">
                                — {{ visit.reason }}</span
                            >
                        </p>
                        <p class="text-fg-faint text-xs">
                            {{ visit.veterinarian?.name ?? $t("pages.vetVisits.noVet") }}
                            <template v-if="visit.veterinarian?.clinicName">
                                · {{ visit.veterinarian.clinicName }}</template
                            >
                        </p>
                        <p
                            v-if="visit.sourceVisit"
                            class="text-fg-faint mt-0.5 flex items-center gap-1 text-xs"
                        >
                            <Icon name="lucide:corner-down-right" class="h-3 w-3" />
                            {{
                                $t("pages.vetVisits.followUpFrom", {
                                    date: new Date(
                                        visit.sourceVisit.visitDate,
                                    ).toLocaleDateString(),
                                })
                            }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <p class="text-fg-muted text-sm">
                            {{
                                visit.isAppointment
                                    ? formatDatetime(visit.visitDate)
                                    : new Date(visit.visitDate).toLocaleDateString()
                            }}
                        </p>
                        <p v-if="visit.costCents" class="text-fg-faint text-xs">
                            {{ formatCost(visit.costCents) }}
                        </p>
                    </div>
                    <span
                        v-if="visit.isAppointment"
                        class="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400"
                    >
                        {{ $t("pages.vetVisits.scheduled") }}
                    </span>
                    <span
                        v-else
                        :class="visitTypeBadgeClass(visit.visitType)"
                        class="rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ $t(`pages.vetVisits.types.${visit.visitType}`) }}
                    </span>
                    <span
                        v-if="visit.documents?.length"
                        class="text-fg-faint flex items-center gap-1 text-xs"
                    >
                        <Icon name="lucide:paperclip" class="h-3 w-3" />
                        {{ visit.documents.length }}
                    </span>
                    <UiButton
                        v-if="visit.isAppointment"
                        variant="ghost"
                        icon="lucide:check-circle"
                        size="sm"
                        :title="$t('pages.vetVisits.convertTitle')"
                        @click.prevent="openConvertModal(visit)"
                    />
                    <UiButton
                        variant="ghost"
                        icon="lucide:pencil"
                        size="sm"
                        @click.prevent="openEditModal(visit)"
                    />
                    <UiButton
                        variant="danger"
                        icon="lucide:trash-2"
                        size="sm"
                        @click.prevent="confirmDelete(visit.id)"
                    />
                </div>
            </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:stethoscope" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.vetVisits.empty") }}</p>
            <UiButton class="mt-4" @click="showModeChoice = true">{{
                $t("pages.vetVisits.addFirst")
            }}</UiButton>
        </div>

        <!-- Mode Choice Dialog -->
        <UiModal
            :show="showModeChoice"
            :title="$t('pages.vetVisits.chooseMode')"
            @close="showModeChoice = false"
        >
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                    class="glass-card flex flex-col items-center gap-3 rounded-xl p-6 text-center transition hover:ring-2 hover:ring-amber-500/50"
                    @click="startAppointmentMode"
                >
                    <div
                        class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"
                    >
                        <Icon name="lucide:calendar-clock" class="h-6 w-6" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-semibold">
                            {{ $t("pages.vetVisits.modeAppointment") }}
                        </p>
                        <p class="text-fg-faint mt-1 text-xs">
                            {{ $t("pages.vetVisits.modeAppointmentDesc") }}
                        </p>
                    </div>
                </button>
                <button
                    class="glass-card flex flex-col items-center gap-3 rounded-xl p-6 text-center transition hover:ring-2 hover:ring-teal-500/50"
                    @click="startPastVisitMode"
                >
                    <div
                        class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400"
                    >
                        <Icon name="lucide:stethoscope" class="h-6 w-6" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-semibold">
                            {{ $t("pages.vetVisits.modePastVisit") }}
                        </p>
                        <p class="text-fg-faint mt-1 text-xs">
                            {{ $t("pages.vetVisits.modePastVisitDesc") }}
                        </p>
                    </div>
                </button>
            </div>
        </UiModal>

        <!-- Appointment Modal (future — minimal fields) -->
        <UiModal
            :show="showAppointment"
            :title="$t('pages.vetVisits.createAppointment')"
            width="lg"
            @close="showAppointment = false"
        >
            <form class="space-y-4" @submit.prevent="handleCreateAppointment">
                <UiSelect v-model="form.petId" :label="$t('pages.vetVisits.fields.pet')" required>
                    <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
                </UiSelect>
                <UiSelect
                    v-model="form.veterinarianId"
                    :label="$t('pages.vetVisits.fields.veterinarian')"
                >
                    <option value="">{{ $t("pages.vetVisits.fields.noVet") }}</option>
                    <option v-for="v in vets" :key="v.id" :value="v.id">{{ v.name }}</option>
                </UiSelect>
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model="form.visitDate"
                        :label="$t('pages.vetVisits.fields.appointmentDate')"
                        type="datetime-local"
                        required
                    />
                    <UiSelect
                        v-model="form.visitType"
                        :label="$t('pages.vetVisits.fields.visitType')"
                    >
                        <option v-for="vt in visitTypes" :key="vt" :value="vt">
                            {{ $t(`pages.vetVisits.types.${vt}`) }}
                        </option>
                    </UiSelect>
                </div>
                <UiTextInput v-model="form.reason" :label="$t('pages.vetVisits.fields.reason')" />
                <UiTextarea v-model="form.notes" :label="$t('pages.vetVisits.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showAppointment = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Past Visit Modal (full fields) -->
        <UiModal
            :show="showPastVisit"
            :title="$t('pages.vetVisits.create')"
            width="lg"
            @close="showPastVisit = false"
        >
            <form class="space-y-4" @submit.prevent="handleCreatePastVisit">
                <UiSelect v-model="form.petId" :label="$t('pages.vetVisits.fields.pet')" required>
                    <option v-for="p in pets" :key="p.id" :value="p.id">{{ p.name }}</option>
                </UiSelect>
                <UiSelect
                    v-model="form.veterinarianId"
                    :label="$t('pages.vetVisits.fields.veterinarian')"
                >
                    <option value="">{{ $t("pages.vetVisits.fields.noVet") }}</option>
                    <option v-for="v in vets" :key="v.id" :value="v.id">{{ v.name }}</option>
                </UiSelect>
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model="form.visitDate"
                        :label="$t('pages.vetVisits.fields.visitDate')"
                        type="date"
                        required
                    />
                    <UiSelect
                        v-model="form.visitType"
                        :label="$t('pages.vetVisits.fields.visitType')"
                    >
                        <option v-for="vt in visitTypes" :key="vt" :value="vt">
                            {{ $t(`pages.vetVisits.types.${vt}`) }}
                        </option>
                    </UiSelect>
                </div>
                <UiTextInput v-model="form.reason" :label="$t('pages.vetVisits.fields.reason')" />
                <UiTextarea
                    v-model="form.diagnosis"
                    :label="$t('pages.vetVisits.fields.diagnosis')"
                />
                <UiTextarea
                    v-model="form.treatment"
                    :label="$t('pages.vetVisits.fields.treatment')"
                />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model.number="form.costEur"
                        :label="$t('pages.vetVisits.fields.cost')"
                        type="number"
                        step="0.01"
                        min="0"
                    />
                    <UiTextInput
                        v-model.number="form.weightGrams"
                        :label="$t('pages.vetVisits.fields.weight')"
                        type="number"
                        min="0"
                    />
                </div>
                <UiTextInput
                    v-model="form.nextAppointment"
                    :label="$t('pages.vetVisits.fields.nextAppointment')"
                    type="date"
                />
                <UiTextarea v-model="form.notes" :label="$t('pages.vetVisits.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showPastVisit = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Convert Appointment Modal -->
        <UiModal
            :show="showConvert"
            :title="$t('pages.vetVisits.convertTitle')"
            width="lg"
            @close="showConvert = false"
        >
            <form class="space-y-4" @submit.prevent="handleConvert">
                <!-- Appointment info summary -->
                <div
                    v-if="convertingVisit"
                    class="glass-card flex items-center gap-3 rounded-lg p-3"
                >
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400"
                    >
                        <Icon name="lucide:calendar-clock" class="h-4 w-4" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">{{ convertingVisit.pet?.name }}</p>
                        <p class="text-fg-faint text-xs">
                            {{
                                $t("pages.vetVisits.scheduledFor", {
                                    date: new Date(convertingVisit.visitDate).toLocaleDateString(),
                                })
                            }}
                        </p>
                    </div>
                </div>
                <UiTextInput
                    v-model="convertForm.visitDate"
                    :label="$t('pages.vetVisits.fields.actualVisitDate')"
                    type="date"
                    required
                />
                <UiTextarea
                    v-model="convertForm.diagnosis"
                    :label="$t('pages.vetVisits.fields.diagnosis')"
                />
                <UiTextarea
                    v-model="convertForm.treatment"
                    :label="$t('pages.vetVisits.fields.treatment')"
                />
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model.number="convertForm.costEur"
                        :label="$t('pages.vetVisits.fields.cost')"
                        type="number"
                        step="0.01"
                        min="0"
                    />
                    <UiTextInput
                        v-model.number="convertForm.weightGrams"
                        :label="$t('pages.vetVisits.fields.weight')"
                        type="number"
                        min="0"
                    />
                </div>
                <UiTextInput
                    v-model="convertForm.nextAppointment"
                    :label="$t('pages.vetVisits.fields.nextAppointment')"
                    type="date"
                />
                <UiTextarea
                    v-model="convertForm.notes"
                    :label="$t('pages.vetVisits.fields.notes')"
                />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showConvert = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="converting">{{
                        $t("pages.vetVisits.convertConfirm")
                    }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal
            :show="showEdit"
            :title="$t('pages.vetVisits.edit')"
            width="lg"
            @close="showEdit = false"
        >
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiSelect
                    v-model="editForm.veterinarianId"
                    :label="$t('pages.vetVisits.fields.veterinarian')"
                >
                    <option value="">{{ $t("pages.vetVisits.fields.noVet") }}</option>
                    <option v-for="v in vets" :key="v.id" :value="v.id">{{ v.name }}</option>
                </UiSelect>
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model="editForm.visitDate"
                        :label="
                            editingIsAppointment
                                ? $t('pages.vetVisits.fields.appointmentDate')
                                : $t('pages.vetVisits.fields.visitDate')
                        "
                        :type="editingIsAppointment ? 'datetime-local' : 'date'"
                        required
                    />
                    <UiSelect
                        v-model="editForm.visitType"
                        :label="$t('pages.vetVisits.fields.visitType')"
                    >
                        <option v-for="vt in visitTypes" :key="vt" :value="vt">
                            {{ $t(`pages.vetVisits.types.${vt}`) }}
                        </option>
                    </UiSelect>
                </div>
                <UiTextInput
                    v-model="editForm.reason"
                    :label="$t('pages.vetVisits.fields.reason')"
                />
                <template v-if="!editingIsAppointment">
                    <UiTextarea
                        v-model="editForm.diagnosis"
                        :label="$t('pages.vetVisits.fields.diagnosis')"
                    />
                    <UiTextarea
                        v-model="editForm.treatment"
                        :label="$t('pages.vetVisits.fields.treatment')"
                    />
                    <div class="grid grid-cols-2 gap-3">
                        <UiTextInput
                            v-model.number="editForm.costEur"
                            :label="$t('pages.vetVisits.fields.cost')"
                            type="number"
                            step="0.01"
                            min="0"
                        />
                        <UiTextInput
                            v-model.number="editForm.weightGrams"
                            :label="$t('pages.vetVisits.fields.weight')"
                            type="number"
                            min="0"
                        />
                    </div>
                    <UiTextInput
                        v-model="editForm.nextAppointment"
                        :label="$t('pages.vetVisits.fields.nextAppointment')"
                        type="date"
                    />
                </template>
                <UiTextarea v-model="editForm.notes" :label="$t('pages.vetVisits.fields.notes')" />
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showEdit = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="updating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Follow-Up Dialog (after creating past visit with nextAppointment) -->
        <UiModal
            :show="showFollowUp"
            :title="$t('pages.vetVisits.followUpTitle')"
            @close="showFollowUp = false"
        >
            <div class="space-y-4">
                <p class="text-fg-muted text-sm">
                    {{ $t("pages.vetVisits.followUpMessage", { date: followUpDate }) }}
                </p>
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showFollowUp = false">{{
                        $t("pages.vetVisits.followUpSkip")
                    }}</UiButton>
                    <UiButton @click="openFollowUpAppointment">{{
                        $t("pages.vetVisits.followUpCreate")
                    }}</UiButton>
                </div>
            </div>
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
    sourceVisitId: string | null;
    visitDate: string;
    visitType: string;
    isAppointment: boolean;
    reason: string | null;
    diagnosis: string | null;
    treatment: string | null;
    costCents: number | null;
    weightGrams: number | null;
    nextAppointment: string | null;
    notes: string | null;
    pet: { id: string; name: string; species: string } | null;
    veterinarian: { id: string; name: string; clinicName: string | null } | null;
    sourceVisit: { id: string; visitDate: string; visitType: string; reason: string | null } | null;
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

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "vet_visits" });
useHead({ title: () => t("pages.vetVisits.title") });

const selectedPet = ref("ALL");
const selectedVet = ref("ALL");
const selectedType = ref("ALL");

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (selectedPet.value && selectedPet.value !== "ALL") params.set("petId", selectedPet.value);
    if (selectedVet.value && selectedVet.value !== "ALL")
        params.set("veterinarianId", selectedVet.value);
    if (selectedType.value && selectedType.value !== "ALL")
        params.set("visitType", selectedType.value);
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
    queryFn: () =>
        api.get<VetVisit[]>(`/api/vet-visits${queryParams.value ? `?${queryParams.value}` : ""}`),
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
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
        cents / 100,
    );
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

function toDatetime(val: string): string {
    if (!val) return val;
    if (val.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(val)) return val;
    if (val.includes("T")) return new Date(val).toISOString();
    return `${val}T00:00:00.000Z`;
}

function toLocalDatetimeStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}`;
}

function formatDatetime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function invalidateVetQueries() {
    queryClient.invalidateQueries({ queryKey: ["vet-visits"] });
    queryClient.invalidateQueries({ queryKey: ["vet-costs"] });
    queryClient.invalidateQueries({ queryKey: ["weights"] });
}

// ── Mode Choice ──────────────────────────────────────────
const showModeChoice = ref(false);

// ── Shared Create Form ───────────────────────────────────
const form = reactive({
    petId: "",
    veterinarianId: "",
    visitDate: "",
    visitType: "CHECKUP" as string,
    sourceVisitId: "" as string,
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
        sourceVisitId: "",
        reason: "",
        diagnosis: "",
        treatment: "",
        costEur: null,
        weightGrams: null,
        nextAppointment: "",
        notes: "",
    });
}

// ── Future Appointment ───────────────────────────────────
const showAppointment = ref(false);

function startAppointmentMode() {
    showModeChoice.value = false;
    resetForm();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    form.visitDate = toLocalDatetimeStr(tomorrow);
    showAppointment.value = true;
}

const { mutate: createAppointmentMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/vet-visits", {
            petId: form.petId,
            veterinarianId: form.veterinarianId || undefined,
            visitDate: toDatetime(form.visitDate),
            visitType: form.visitType,
            isAppointment: true,
            sourceVisitId: form.sourceVisitId || undefined,
            reason: form.reason || undefined,
            notes: form.notes || undefined,
        }),
    onSuccess: () => {
        invalidateVetQueries();
        toast.success(t("pages.vetVisits.appointmentCreated"));
        showAppointment.value = false;
        resetForm();
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleCreateAppointment() {
    createAppointmentMutation();
}

// ── Past Visit ───────────────────────────────────────────
const showPastVisit = ref(false);

function startPastVisitMode() {
    showModeChoice.value = false;
    resetForm();
    form.visitDate = new Date().toISOString().slice(0, 10);
    showPastVisit.value = true;
}

// For storing data needed for the follow-up dialog
const followUpDate = ref("");
const followUpRawDate = ref("");
const followUpPetId = ref("");
const followUpVetId = ref("");
const followUpSourceVisitId = ref("");
const showFollowUp = ref(false);

const { mutate: createPastVisitMutation } = useMutation({
    mutationFn: () =>
        api.post<VetVisit>("/api/vet-visits", {
            petId: form.petId,
            veterinarianId: form.veterinarianId || undefined,
            visitDate: toDatetime(form.visitDate),
            visitType: form.visitType,
            isAppointment: false,
            reason: form.reason || undefined,
            diagnosis: form.diagnosis || undefined,
            treatment: form.treatment || undefined,
            costCents: form.costEur != null ? Math.round(form.costEur * 100) : undefined,
            weightGrams: form.weightGrams ?? undefined,
            nextAppointment: form.nextAppointment ? toDatetime(form.nextAppointment) : undefined,
            notes: form.notes || undefined,
        }),
    onSuccess: (createdVisit) => {
        invalidateVetQueries();
        toast.success(t("pages.vetVisits.created"));
        showPastVisit.value = false;

        // Check if follow-up should be offered
        if (form.nextAppointment) {
            followUpDate.value = new Date(form.nextAppointment).toLocaleDateString();
            followUpRawDate.value = form.nextAppointment;
            followUpPetId.value = form.petId;
            followUpVetId.value = form.veterinarianId;
            followUpSourceVisitId.value = createdVisit?.id ?? "";
            showFollowUp.value = true;
        }

        resetForm();
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleCreatePastVisit() {
    createPastVisitMutation();
}

// ── Follow-Up Appointment ────────────────────────────────
function openFollowUpAppointment() {
    showFollowUp.value = false;
    resetForm();
    form.petId = followUpPetId.value;
    form.veterinarianId = followUpVetId.value;
    form.visitType = "FOLLOW_UP";
    form.sourceVisitId = followUpSourceVisitId.value;
    form.reason = t("pages.vetVisits.followUpReason");
    // Convert the date to a datetime-local value at 9:00
    const d = new Date(followUpRawDate.value);
    d.setHours(9, 0, 0, 0);
    form.visitDate = toLocalDatetimeStr(d);
    showAppointment.value = true;
}

// ── Convert Appointment ──────────────────────────────────
const showConvert = ref(false);
const convertingVisit = ref<VetVisit | null>(null);
const convertForm = reactive({
    visitDate: "",
    diagnosis: "",
    treatment: "",
    costEur: null as number | null,
    weightGrams: null as number | null,
    nextAppointment: "",
    notes: "",
});

function openConvertModal(visit: VetVisit) {
    convertingVisit.value = visit;
    Object.assign(convertForm, {
        visitDate: new Date().toISOString().slice(0, 10),
        diagnosis: "",
        treatment: "",
        costEur: null,
        weightGrams: null,
        nextAppointment: "",
        notes: visit.notes ?? "",
    });
    showConvert.value = true;
}

const { mutate: convertMutation, isPending: converting } = useMutation({
    mutationFn: () =>
        api.post(`/api/vet-visits/${convertingVisit.value!.id}/convert`, {
            visitDate: toDatetime(convertForm.visitDate),
            diagnosis: convertForm.diagnosis || undefined,
            treatment: convertForm.treatment || undefined,
            costCents:
                convertForm.costEur != null ? Math.round(convertForm.costEur * 100) : undefined,
            weightGrams: convertForm.weightGrams ?? undefined,
            nextAppointment: convertForm.nextAppointment
                ? toDatetime(convertForm.nextAppointment)
                : undefined,
            notes: convertForm.notes || undefined,
        }),
    onSuccess: () => {
        invalidateVetQueries();
        toast.success(t("pages.vetVisits.converted"));
        showConvert.value = false;

        // Offer follow-up if nextAppointment was set
        if (convertForm.nextAppointment) {
            followUpDate.value = new Date(convertForm.nextAppointment).toLocaleDateString();
            followUpRawDate.value = convertForm.nextAppointment;
            followUpPetId.value = convertingVisit.value!.petId;
            followUpVetId.value = convertingVisit.value!.veterinarianId ?? "";
            followUpSourceVisitId.value = convertingVisit.value!.id;
            showFollowUp.value = true;
        }
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleConvert() {
    convertMutation();
}

// ── Edit ─────────────────────────────────────────────────
const showEdit = ref(false);
const editingId = ref("");
const editingIsAppointment = ref(false);
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
    editingIsAppointment.value = visit.isAppointment;
    Object.assign(editForm, {
        veterinarianId: visit.veterinarianId ?? "",
        visitDate: visit.isAppointment
            ? toLocalDatetimeStr(new Date(visit.visitDate))
            : visit.visitDate.slice(0, 10),
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
            visitDate: toDatetime(editForm.visitDate),
            visitType: editForm.visitType,
            reason: editForm.reason || undefined,
            diagnosis: editingIsAppointment.value ? undefined : editForm.diagnosis || undefined,
            treatment: editingIsAppointment.value ? undefined : editForm.treatment || undefined,
            costCents: editingIsAppointment.value
                ? undefined
                : editForm.costEur != null
                  ? Math.round(editForm.costEur * 100)
                  : null,
            weightGrams: editingIsAppointment.value ? undefined : editForm.weightGrams,
            nextAppointment: editingIsAppointment.value
                ? undefined
                : editForm.nextAppointment
                  ? toDatetime(editForm.nextAppointment)
                  : null,
            notes: editForm.notes || undefined,
        }),
    onSuccess: () => {
        invalidateVetQueries();
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
        invalidateVetQueries();
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
