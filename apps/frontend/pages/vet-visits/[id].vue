<template>
    <div class="mx-auto max-w-4xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="flex items-center gap-3">
            <NuxtLink to="/vet-visits" class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors">
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="min-w-0 flex-1">
                <h1 class="text-fg truncate text-2xl font-bold tracking-tight">
                    {{ visit?.isAppointment ? $t("pages.vetVisits.detail.appointmentDetails") : $t("pages.vetVisits.detail.visitDetails") }}
                </h1>
                <p v-if="visit" class="text-fg-faint text-sm">
                    {{ visit.pet?.name }}
                    <template v-if="visit.veterinarian"> · {{ visit.veterinarian.name }}</template>
                </p>
            </div>
            <div v-if="visit" class="flex items-center gap-2">
                <UiButton
                    v-if="visit.isAppointment"
                    variant="ghost"
                    icon="lucide:check-circle"
                    :title="$t('pages.vetVisits.convertTitle')"
                    @click="router.push(`/vet-visits?convert=${visit.id}`)"
                />
                <UiButton variant="ghost" icon="lucide:pencil" @click="router.push(`/vet-visits?edit=${visit.id}`)" />
                <UiButton variant="danger" icon="lucide:trash-2" @click="showDeleteConfirm = true" />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-4">
            <div class="glass-card h-48 animate-pulse rounded-xl" />
            <div class="glass-card h-32 animate-pulse rounded-xl" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{ $t("common.retry") }}</UiButton>
        </div>

        <template v-else-if="visit">
            <!-- Status Badge + Date -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.vetVisits.detail.visitInfo") }}</h2>
                    <span
                        v-if="visit.isAppointment"
                        class="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400"
                    >
                        {{ $t("pages.vetVisits.scheduled") }}
                    </span>
                    <span v-else :class="visitTypeBadgeClass(visit.visitType)" class="rounded-md px-2.5 py-1 text-xs font-medium">
                        {{ $t(`pages.vetVisits.types.${visit.visitType}`) }}
                    </span>
                </div>
                <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.pet") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ visit.pet?.name ?? "—" }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.veterinarian") }}</dt>
                        <dd class="text-fg mt-1 text-sm">
                            {{ visit.veterinarian?.name ?? $t("pages.vetVisits.noVet") }}
                            <span v-if="visit.veterinarian?.clinicName" class="text-fg-faint"> · {{ visit.veterinarian.clinicName }}</span>
                        </dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ visit.isAppointment ? $t("pages.vetVisits.fields.appointmentDate") : $t("pages.vetVisits.fields.visitDate") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">
                            {{ visit.isAppointment ? formatDatetime(visit.visitDate) : new Date(visit.visitDate).toLocaleDateString() }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.visitType") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ $t(`pages.vetVisits.types.${visit.visitType}`) }}</dd>
                    </div>
                    <div v-if="visit.reason" class="sm:col-span-2">
                        <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.reason") }}</dt>
                        <dd class="text-fg mt-1 text-sm">{{ visit.reason }}</dd>
                    </div>
                    <template v-if="!visit.isAppointment">
                        <div v-if="visit.diagnosis" class="sm:col-span-2">
                            <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.diagnosis") }}</dt>
                            <dd class="text-fg mt-1 text-sm">{{ visit.diagnosis }}</dd>
                        </div>
                        <div v-if="visit.treatment" class="sm:col-span-2">
                            <dt class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.treatment") }}</dt>
                            <dd class="text-fg mt-1 text-sm">{{ visit.treatment }}</dd>
                        </div>
                    </template>
                </dl>
            </div>

            <!-- Cost & Weight -->
            <div v-if="!visit.isAppointment && (visit.costCents || visit.weightGrams)" class="glass-card rounded-xl p-6">
                <h2 class="text-fg mb-4 font-semibold">{{ $t("pages.vetVisits.detail.costAndWeight") }}</h2>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div v-if="visit.costCents">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Icon name="lucide:receipt" class="h-5 w-5" />
                            </div>
                            <div>
                                <p class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.cost") }}</p>
                                <p class="text-fg text-lg font-bold">{{ formatCost(visit.costCents) }}</p>
                            </div>
                        </div>
                    </div>
                    <div v-if="visit.weightGrams">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                                <Icon name="lucide:scale" class="h-5 w-5" />
                            </div>
                            <div>
                                <p class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.weight") }}</p>
                                <p class="text-fg text-lg font-bold">{{ visit.weightGrams }} g</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Next Appointment -->
            <div v-if="visit.nextAppointment" class="glass-card rounded-xl p-6">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                        <Icon name="lucide:calendar-clock" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.fields.nextAppointment") }}</p>
                        <p class="text-fg text-sm font-medium">{{ new Date(visit.nextAppointment).toLocaleDateString() }}</p>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            <div v-if="visit.notes" class="glass-card rounded-xl p-6">
                <h2 class="text-fg mb-3 font-semibold">{{ $t("pages.vetVisits.detail.notesSection") }}</h2>
                <p class="text-fg-muted whitespace-pre-wrap text-sm">{{ visit.notes }}</p>
            </div>

            <!-- Follow-Up Chain -->
            <div v-if="visit.sourceVisit || visit.followUps?.length" class="glass-card rounded-xl p-6">
                <h2 class="text-fg mb-4 font-semibold">{{ $t("pages.vetVisits.detail.followUpChain") }}</h2>
                <div class="space-y-3">
                    <!-- Source visit -->
                    <NuxtLink
                        v-if="visit.sourceVisit"
                        :to="`/vet-visits/${visit.sourceVisit.id}`"
                        class="bg-surface-raised flex items-center gap-3 rounded-lg p-3 transition hover:ring-1 hover:ring-white/10"
                    >
                        <Icon name="lucide:corner-down-right" class="text-fg-faint h-4 w-4 rotate-180" />
                        <div class="flex-1">
                            <p class="text-fg text-sm font-medium">
                                {{ $t("pages.vetVisits.detail.sourceVisit", { date: new Date(visit.sourceVisit.visitDate).toLocaleDateString() }) }}
                            </p>
                            <p v-if="visit.sourceVisit.reason" class="text-fg-faint text-xs">{{ visit.sourceVisit.reason }}</p>
                        </div>
                        <span class="text-fg-faint text-xs">{{ $t(`pages.vetVisits.types.${visit.sourceVisit.visitType}`) }}</span>
                    </NuxtLink>

                    <!-- Follow-up visits -->
                    <template v-if="visit.followUps?.length">
                        <p class="text-fg-faint text-xs font-medium uppercase">{{ $t("pages.vetVisits.detail.followUps") }}</p>
                        <NuxtLink
                            v-for="fu in visit.followUps"
                            :key="fu.id"
                            :to="`/vet-visits/${fu.id}`"
                            class="bg-surface-raised flex items-center gap-3 rounded-lg p-3 transition hover:ring-1 hover:ring-white/10"
                        >
                            <Icon name="lucide:corner-down-right" class="text-fg-faint h-4 w-4" />
                            <div class="flex-1">
                                <p class="text-fg text-sm font-medium">
                                    {{ new Date(fu.visitDate).toLocaleDateString() }}
                                    <span v-if="fu.reason" class="text-fg-faint"> — {{ fu.reason }}</span>
                                </p>
                            </div>
                            <span
                                v-if="fu.isAppointment"
                                class="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400"
                            >
                                {{ $t("pages.vetVisits.scheduled") }}
                            </span>
                            <span v-else class="text-fg-faint text-xs">{{ $t(`pages.vetVisits.types.${fu.visitType}`) }}</span>
                        </NuxtLink>
                    </template>
                </div>
            </div>

            <!-- Documents -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">
                        {{ $t("pages.vetVisits.detail.documents") }}
                        <span v-if="documents?.length" class="text-fg-faint ml-1 text-sm font-normal">({{ documents.length }})</span>
                    </h2>
                    <UiButton size="sm" icon="lucide:upload" @click="showUpload = true">
                        {{ $t("pages.vetVisits.detail.uploadDocument") }}
                    </UiButton>
                </div>

                <!-- Document List -->
                <div v-if="documents?.length" class="space-y-2">
                    <div
                        v-for="doc in documents"
                        :key="doc.id"
                        class="bg-surface-raised flex items-center gap-3 rounded-lg p-3"
                    >
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-lg"
                            :class="isImage(doc.upload.url) ? 'bg-violet-500/10 text-violet-400' : 'bg-red-500/10 text-red-400'"
                        >
                            <Icon :name="isImage(doc.upload.url) ? 'lucide:image' : 'lucide:file-text'" class="h-5 w-5" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-fg truncate text-sm font-medium">{{ doc.label || fileNameFromUrl(doc.upload.url) }}</p>
                            <p class="text-fg-faint text-xs">{{ new Date(doc.createdAt).toLocaleDateString() }}</p>
                        </div>
                        <a
                            :href="resolveUrl(doc.upload.url)"
                            target="_blank"
                            class="text-primary-400 hover:text-primary-300 rounded p-1.5 transition"
                        >
                            <Icon name="lucide:external-link" class="h-4 w-4" />
                        </a>
                        <UiButton variant="ghost" size="sm" icon="lucide:pencil" @click="openEditLabel(doc)" />
                        <UiButton variant="danger" size="sm" icon="lucide:trash-2" @click="confirmDeleteDoc(doc.id)" />
                    </div>
                </div>
                <div v-else class="flex flex-col items-center py-8">
                    <Icon name="lucide:file-plus" class="text-fg-faint mb-2 h-8 w-8" />
                    <p class="text-fg-muted text-sm">{{ $t("pages.vetVisits.detail.noDocuments") }}</p>
                </div>
            </div>

            <!-- Upload Modal -->
            <UiModal :show="showUpload" :title="$t('pages.vetVisits.detail.uploadDocument')" @close="closeUpload">
                <form class="space-y-4" @submit.prevent="handleUpload">
                    <div
                        class="rounded-xl border-2 border-dashed border-white/10 p-8 text-center transition"
                        :class="{ 'border-primary-500/50 bg-primary-500/5': isDragging }"
                        @dragover.prevent="isDragging = true"
                        @dragleave.prevent="isDragging = false"
                        @drop.prevent="handleDrop"
                    >
                        <input
                            ref="fileInputRef"
                            type="file"
                            class="hidden"
                            accept="image/jpeg,image/png,image/gif,image/webp,image/avif,application/pdf"
                            @change="handleFileSelect"
                        />
                        <div v-if="!selectedFile" class="cursor-pointer" @click="fileInputRef?.click()">
                            <Icon name="lucide:upload-cloud" class="text-fg-faint mx-auto mb-2 h-10 w-10" />
                            <p class="text-fg-muted text-sm">{{ $t("pages.vetVisits.detail.dropzone") }}</p>
                            <p class="text-fg-faint mt-1 text-xs">{{ $t("pages.vetVisits.detail.dropzoneHint") }}</p>
                        </div>
                        <div v-else class="flex items-center justify-center gap-3">
                            <Icon
                                :name="isImageFile(selectedFile) ? 'lucide:image' : 'lucide:file-text'"
                                class="text-primary-400 h-6 w-6"
                            />
                            <span class="text-fg text-sm">{{ selectedFile.name }}</span>
                            <button type="button" class="text-fg-faint hover:text-red-400" @click="selectedFile = null">
                                <Icon name="lucide:x" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <UiTextInput
                        v-model="uploadLabel"
                        :label="$t('pages.vetVisits.detail.documentLabel')"
                        :placeholder="$t('pages.vetVisits.detail.documentLabelPlaceholder')"
                    />
                    <div class="flex justify-end gap-2 pt-2">
                        <UiButton variant="ghost" @click="closeUpload">{{ $t("common.cancel") }}</UiButton>
                        <UiButton type="submit" :loading="uploading" :disabled="!selectedFile">
                            {{ uploading ? $t("pages.vetVisits.detail.uploading") : $t("pages.vetVisits.detail.uploadDocument") }}
                        </UiButton>
                    </div>
                </form>
            </UiModal>

            <!-- Edit Label Modal -->
            <UiModal :show="showEditLabel" :title="$t('pages.vetVisits.detail.editLabel')" @close="showEditLabel = false">
                <form class="space-y-4" @submit.prevent="handleUpdateLabel">
                    <UiTextInput
                        v-model="editLabelValue"
                        :label="$t('pages.vetVisits.detail.documentLabel')"
                        :placeholder="$t('pages.vetVisits.detail.documentLabelPlaceholder')"
                    />
                    <div class="flex justify-end gap-2 pt-2">
                        <UiButton variant="ghost" @click="showEditLabel = false">{{ $t("common.cancel") }}</UiButton>
                        <UiButton type="submit" :loading="updatingLabel">{{ $t("common.save") }}</UiButton>
                    </div>
                </form>
            </UiModal>

            <!-- Delete Document Confirmation -->
            <UiConfirmDialog
                :show="showDeleteDoc"
                :title="$t('common.confirmDelete')"
                :message="$t('pages.vetVisits.detail.confirmDeleteDocument')"
                variant="danger"
                :confirm-label="$t('common.delete')"
                :cancel-label="$t('common.cancel')"
                :loading="deletingDoc"
                @confirm="handleDeleteDoc"
                @cancel="showDeleteDoc = false"
            />

            <!-- Delete Visit Confirmation -->
            <UiConfirmDialog
                :show="showDeleteConfirm"
                :title="$t('common.confirmDelete')"
                :message="$t('pages.vetVisits.confirmDelete')"
                variant="danger"
                :confirm-label="$t('common.delete')"
                :cancel-label="$t('common.cancel')"
                :loading="deletingVisit"
                @confirm="handleDeleteVisit"
                @cancel="showDeleteConfirm = false"
            />
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";

interface VetVisitDocument {
    id: string;
    label: string | null;
    createdAt: string;
    upload: { id: string; url: string };
}

interface VetVisitFollowUp {
    id: string;
    visitDate: string;
    visitType: string;
    isAppointment: boolean;
    reason: string | null;
}

interface VetVisitDetail {
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
    followUps: VetVisitFollowUp[];
    documents: VetVisitDocument[];
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();
const resolveUrl = useResolveUrl();

const visitId = route.params.id as string;

definePageMeta({ layout: "default" });

// ── Data ─────────────────────────────────────────────────
const {
    data: visit,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["vet-visits", visitId],
    queryFn: () => api.get<VetVisitDetail>(`/api/vet-visits/${visitId}`),
});

useHead({ title: () => visit.value?.pet?.name ? `${visit.value.pet.name} — ${t("pages.vetVisits.detail.visitDetails")}` : t("pages.vetVisits.detail.visitDetails") });

const {
    data: documents,
    refetch: refetchDocs,
} = useQuery({
    queryKey: ["vet-visit-documents", visitId],
    queryFn: () => api.get<VetVisitDocument[]>(`/api/vet-visits/${visitId}/documents`),
});

// ── Helpers ──────────────────────────────────────────────
function formatCost(cents: number): string {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDatetime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function visitTypeBadgeClass(type: string): string {
    switch (type) {
        case "EMERGENCY": return "bg-red-500/10 text-red-400";
        case "SURGERY": return "bg-orange-500/10 text-orange-400";
        case "VACCINATION": return "bg-blue-500/10 text-blue-400";
        case "CHECKUP": return "bg-green-500/10 text-green-400";
        case "DEWORMING":
        case "FECAL_TEST": return "bg-purple-500/10 text-purple-400";
        default: return "bg-white/5 text-fg-faint";
    }
}

function isImage(url: string): boolean {
    return /\.(jpe?g|png|gif|webp|avif)$/i.test(url);
}

function isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
}

function fileNameFromUrl(url: string): string {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/\.enc$/, "");
}

function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["vet-visits"] });
    queryClient.invalidateQueries({ queryKey: ["vet-visit-documents", visitId] });
}

// ── Document Upload ──────────────────────────────────────
const showUpload = ref(false);
const selectedFile = ref<File | null>(null);
const uploadLabel = ref("");
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
        selectedFile.value = input.files[0];
    }
}

function handleDrop(e: DragEvent) {
    isDragging.value = false;
    if (e.dataTransfer?.files.length) {
        selectedFile.value = e.dataTransfer.files[0];
    }
}

function closeUpload() {
    showUpload.value = false;
    selectedFile.value = null;
    uploadLabel.value = "";
    if (fileInputRef.value) fileInputRef.value.value = "";
}

const { mutate: uploadMutation, isPending: uploading } = useMutation({
    mutationFn: async () => {
        const formData = new FormData();
        formData.append("file", selectedFile.value!);
        if (uploadLabel.value) {
            formData.append("label", uploadLabel.value);
        }

        const baseURL = useRuntimeConfig().public.apiBaseURL;
        const authStore = useAuthStore();
        const res = await fetch(`${baseURL}/api/vet-visits/${visitId}/documents`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authStore.accessToken}` },
            body: formData,
            credentials: "include",
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message ?? "Upload failed");
        return json.data;
    },
    onSuccess: () => {
        invalidateAll();
        toast.success(t("pages.vetVisits.detail.documentUploaded"));
        closeUpload();
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleUpload() {
    if (!selectedFile.value) return;
    uploadMutation();
}

// ── Edit Document Label ──────────────────────────────────
const showEditLabel = ref(false);
const editLabelValue = ref("");
const editLabelDocId = ref("");

function openEditLabel(doc: VetVisitDocument) {
    editLabelDocId.value = doc.id;
    editLabelValue.value = doc.label ?? "";
    showEditLabel.value = true;
}

const { mutate: updateLabelMutation, isPending: updatingLabel } = useMutation({
    mutationFn: () =>
        api.patch(`/api/vet-visits/${visitId}/documents/${editLabelDocId.value}`, {
            label: editLabelValue.value || undefined,
        }),
    onSuccess: () => {
        invalidateAll();
        toast.success(t("pages.vetVisits.detail.documentUpdated"));
        showEditLabel.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleUpdateLabel() {
    updateLabelMutation();
}

// ── Delete Document ──────────────────────────────────────
const showDeleteDoc = ref(false);
const deletingDocId = ref("");

function confirmDeleteDoc(id: string) {
    deletingDocId.value = id;
    showDeleteDoc.value = true;
}

const { mutate: deleteDocMutation, isPending: deletingDoc } = useMutation({
    mutationFn: () => api.del(`/api/vet-visits/${visitId}/documents/${deletingDocId.value}`),
    onSuccess: () => {
        invalidateAll();
        toast.success(t("pages.vetVisits.detail.documentDeleted"));
        showDeleteDoc.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDeleteDoc() {
    deleteDocMutation();
}

// ── Delete Visit ─────────────────────────────────────────
const showDeleteConfirm = ref(false);

const { mutate: deleteVisitMutation, isPending: deletingVisit } = useMutation({
    mutationFn: () => api.del(`/api/vet-visits/${visitId}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vet-visits"] });
        toast.success(t("pages.vetVisits.deleted"));
        router.push("/vet-visits");
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDeleteVisit() {
    deleteVisitMutation();
}
</script>
