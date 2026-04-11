<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
                <NuxtLink
                    :to="`/pets/${petId}`"
                    class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors"
                >
                    <Icon name="lucide:arrow-left" class="h-5 w-5" />
                </NuxtLink>
                <div>
                    <h1 class="text-fg text-2xl font-bold tracking-tight">
                        {{ pet?.name }} — {{ $t("pages.pets.documents.title") }}
                    </h1>
                    <p class="text-fg-muted mt-0.5 text-sm">
                        {{ $t("pages.pets.documents.subtitle") }}
                    </p>
                </div>
            </div>
            <UiButton icon="lucide:upload" @click="showUpload = true">
                {{ $t("pages.pets.documents.upload") }}
            </UiButton>
        </div>

        <!-- Category Filter -->
        <div class="flex flex-wrap gap-2">
            <button
                :class="[
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    !selectedCategory
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-white/5 text-fg-muted hover:bg-white/10',
                ]"
                @click="selectedCategory = ''"
            >
                {{ $t("pages.pets.documents.allCategories") }}
            </button>
            <button
                v-for="cat in categories"
                :key="cat"
                :class="[
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    selectedCategory === cat
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-white/5 text-fg-muted hover:bg-white/10',
                ]"
                @click="selectedCategory = cat"
            >
                {{ $t(`pages.pets.documents.categories.${cat}`) }}
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 4" :key="i" class="glass-card h-20 animate-pulse rounded-xl" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{ $t("common.retry") }}</UiButton>
        </div>

        <!-- Document List -->
        <div v-else-if="filteredDocuments.length" class="space-y-3">
            <div
                v-for="doc in filteredDocuments"
                :key="doc.id"
                class="glass-card group flex items-center gap-4 rounded-xl p-4 transition-all hover:ring-1 hover:ring-white/10"
            >
                <!-- Icon -->
                <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    :class="categoryIconBg(doc.category)"
                >
                    <Icon :name="categoryIcon(doc.category)" class="h-5 w-5" :class="categoryIconColor(doc.category)" />
                </div>

                <!-- Info -->
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <p class="text-fg truncate text-sm font-medium">
                            {{ doc.label || $t(`pages.pets.documents.categories.${doc.category}`) }}
                        </p>
                        <span class="bg-surface-raised text-fg-faint rounded-md px-2 py-0.5 text-[10px] font-medium">
                            {{ $t(`pages.pets.documents.categories.${doc.category}`) }}
                        </span>
                    </div>
                    <div class="text-fg-faint mt-0.5 flex items-center gap-3 text-xs">
                        <span v-if="doc.documentDate">
                            {{ new Date(doc.documentDate).toLocaleDateString() }}
                        </span>
                        <span>{{ new Date(doc.createdAt).toLocaleDateString() }}</span>
                    </div>
                    <p v-if="doc.notes" class="text-fg-muted mt-1 text-xs line-clamp-1">{{ doc.notes }}</p>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <a
                        :href="resolveUrl(doc.upload.url)"
                        target="_blank"
                        class="text-fg-faint hover:text-primary-400 rounded p-1.5 transition-colors"
                        :title="$t('common.download')"
                    >
                        <Icon name="lucide:download" class="h-4 w-4" />
                    </a>
                    <button
                        class="text-fg-faint hover:text-fg-muted rounded p-1.5 transition-colors"
                        :title="$t('pages.pets.documents.editDocument')"
                        @click="openEditModal(doc)"
                    >
                        <Icon name="lucide:pencil" class="h-4 w-4" />
                    </button>
                    <button
                        class="text-fg-faint hover:text-red-400 rounded p-1.5 transition-colors"
                        :title="$t('common.delete')"
                        @click="confirmDeleteDoc(doc)"
                    >
                        <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:file-text" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">
                {{ selectedCategory ? $t("pages.pets.documents.emptyCategory") : $t("pages.pets.documents.empty") }}
            </p>
            <UiButton v-if="!selectedCategory" class="mt-4" @click="showUpload = true">
                {{ $t("pages.pets.documents.upload") }}
            </UiButton>
        </div>

        <!-- Upload Modal -->
        <UiModal :show="showUpload" :title="$t('pages.pets.documents.upload')" @close="showUpload = false">
            <form class="space-y-4" @submit.prevent="handleUpload">
                <!-- File Input -->
                <div>
                    <label
                        class="border-line hover:border-primary-500/50 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors"
                        @dragover.prevent
                        @drop.prevent="handleDrop"
                    >
                        <Icon name="lucide:file-plus" class="text-fg-faint mb-2 h-10 w-10" />
                        <p class="text-fg-muted text-sm">{{ $t("pages.pets.documents.dropHint") }}</p>
                        <p class="text-fg-faint mt-1 text-xs">{{ $t("pages.pets.documents.maxSize") }}</p>
                        <input
                            ref="fileInputRef"
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/gif,image/webp,image/avif"
                            class="hidden"
                            @change="handleFileSelect"
                        />
                    </label>
                    <p v-if="selectedFile" class="text-fg mt-2 flex items-center gap-2 text-sm">
                        <Icon name="lucide:file" class="h-4 w-4" />
                        {{ selectedFile.name }}
                        <button type="button" class="text-fg-faint hover:text-red-400" @click="selectedFile = null">
                            <Icon name="lucide:x" class="h-3.5 w-3.5" />
                        </button>
                    </p>
                </div>

                <UiSelect v-model="uploadForm.category" :label="$t('pages.pets.documents.category')">
                    <option v-for="cat in categories" :key="cat" :value="cat">
                        {{ $t(`pages.pets.documents.categories.${cat}`) }}
                    </option>
                </UiSelect>

                <UiTextInput
                    v-model="uploadForm.label"
                    :label="$t('pages.pets.documents.label')"
                    :placeholder="$t('pages.pets.documents.labelPlaceholder')"
                />

                <UiTextInput
                    v-model="uploadForm.documentDate"
                    type="date"
                    :label="$t('pages.pets.documents.documentDate')"
                />

                <UiTextarea
                    v-model="uploadForm.notes"
                    :label="$t('pages.pets.documents.notes')"
                    :placeholder="$t('pages.pets.documents.notesPlaceholder')"
                />

                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showUpload = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :disabled="!selectedFile" :loading="uploading">
                        {{ $t("pages.pets.documents.upload") }}
                    </UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal :show="showEdit" :title="$t('pages.pets.documents.editDocument')" @close="showEdit = false">
            <form class="space-y-4" @submit.prevent="handleEdit">
                <UiSelect v-model="editForm.category" :label="$t('pages.pets.documents.category')">
                    <option v-for="cat in categories" :key="cat" :value="cat">
                        {{ $t(`pages.pets.documents.categories.${cat}`) }}
                    </option>
                </UiSelect>

                <UiTextInput
                    v-model="editForm.label"
                    :label="$t('pages.pets.documents.label')"
                    :placeholder="$t('pages.pets.documents.labelPlaceholder')"
                />

                <UiTextInput
                    v-model="editForm.documentDate"
                    type="date"
                    :label="$t('pages.pets.documents.documentDate')"
                />

                <UiTextarea
                    v-model="editForm.notes"
                    :label="$t('pages.pets.documents.notes')"
                    :placeholder="$t('pages.pets.documents.notesPlaceholder')"
                />

                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showEdit = false">{{ $t("common.cancel") }}</UiButton>
                    <UiButton type="submit" :loading="editing">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Delete Confirmation -->
        <UiConfirmDialog
            :show="showDeleteConfirm"
            :title="$t('common.confirmDelete')"
            :message="$t('pages.pets.documents.confirmDelete')"
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

interface PetDocument {
    id: string;
    petId: string;
    userId: string;
    uploadId: string;
    upload: { id: string; url: string };
    category: string;
    label: string | null;
    notes: string | null;
    documentDate: string | null;
    createdAt: string;
}

interface Pet {
    id: string;
    name: string;
}

const route = useRoute();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();
const resolveUrl = useResolveUrl();

const petId = route.params.id as string;

const categories = [
    "PURCHASE_RECEIPT",
    "CITES",
    "ORIGIN_CERTIFICATE",
    "VET_REPORT",
    "INSURANCE",
    "OTHER",
] as const;

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "pet_documents" });

const { data: pet } = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => api.get<Pet>(`/api/pets/${petId}`),
});

useHead({ title: () => `${pet.value?.name ?? "..."} — ${t("pages.pets.documents.title")}` });

// ─── Data ────────────────────────────────────────────────
const {
    data: documents,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["pet-documents", petId],
    queryFn: () => api.get<PetDocument[]>(`/api/pets/${petId}/documents`),
});

// ─── Filters ─────────────────────────────────────────────
const selectedCategory = ref("");

const filteredDocuments = computed(() => {
    const list = documents.value ?? [];
    if (!selectedCategory.value) return list;
    return list.filter((d) => d.category === selectedCategory.value);
});

// ─── Category helpers ────────────────────────────────────
function categoryIcon(category: string): string {
    switch (category) {
        case "PURCHASE_RECEIPT":
            return "lucide:receipt";
        case "CITES":
            return "lucide:shield-check";
        case "ORIGIN_CERTIFICATE":
            return "lucide:award";
        case "VET_REPORT":
            return "lucide:stethoscope";
        case "INSURANCE":
            return "lucide:shield";
        default:
            return "lucide:file-text";
    }
}

function categoryIconBg(category: string): string {
    switch (category) {
        case "PURCHASE_RECEIPT":
            return "bg-green-500/10";
        case "CITES":
            return "bg-blue-500/10";
        case "ORIGIN_CERTIFICATE":
            return "bg-purple-500/10";
        case "VET_REPORT":
            return "bg-teal-500/10";
        case "INSURANCE":
            return "bg-amber-500/10";
        default:
            return "bg-white/5";
    }
}

function categoryIconColor(category: string): string {
    switch (category) {
        case "PURCHASE_RECEIPT":
            return "text-green-400";
        case "CITES":
            return "text-blue-400";
        case "ORIGIN_CERTIFICATE":
            return "text-purple-400";
        case "VET_REPORT":
            return "text-teal-400";
        case "INSURANCE":
            return "text-amber-400";
        default:
            return "text-fg-faint";
    }
}

// ─── Upload ──────────────────────────────────────────────
const showUpload = ref(false);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement>();

const uploadForm = reactive({
    category: "OTHER" as string,
    label: "",
    notes: "",
    documentDate: "",
});

function resetUploadForm() {
    selectedFile.value = null;
    Object.assign(uploadForm, { category: "OTHER", label: "", notes: "", documentDate: "" });
    if (fileInputRef.value) fileInputRef.value.value = "";
}

function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    selectedFile.value = input.files?.[0] ?? null;
}

function handleDrop(event: DragEvent) {
    const file = event.dataTransfer?.files[0];
    if (file) {
        selectedFile.value = file;
    }
}

const { mutate: uploadMutation, isPending: uploading } = useMutation({
    mutationFn: async () => {
        if (!selectedFile.value) return;

        const formData = new FormData();
        if (uploadForm.category) formData.append("category", uploadForm.category);
        if (uploadForm.label) formData.append("label", uploadForm.label);
        if (uploadForm.notes) formData.append("notes", uploadForm.notes);
        if (uploadForm.documentDate) formData.append("documentDate", new Date(uploadForm.documentDate).toISOString());
        formData.append("file", selectedFile.value);

        const baseURL = useRuntimeConfig().public.apiBaseURL;
        const authStore = useAuthStore();
        const res = await fetch(`${baseURL}/api/pets/${petId}/documents`, {
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
        queryClient.invalidateQueries({ queryKey: ["pet-documents", petId] });
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.documents.uploaded"));
        showUpload.value = false;
        resetUploadForm();
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleUpload() {
    uploadMutation();
}

// ─── Edit ────────────────────────────────────────────────
const showEdit = ref(false);
const editDocId = ref("");

const editForm = reactive({
    category: "OTHER" as string,
    label: "",
    notes: "",
    documentDate: "",
});

function openEditModal(doc: PetDocument) {
    editDocId.value = doc.id;
    editForm.category = doc.category;
    editForm.label = doc.label ?? "";
    editForm.notes = doc.notes ?? "";
    editForm.documentDate = doc.documentDate ? doc.documentDate.split("T")[0] : "";
    showEdit.value = true;
}

const { mutate: editMutation, isPending: editing } = useMutation({
    mutationFn: () =>
        api.patch(`/api/pets/${petId}/documents/${editDocId.value}`, {
            category: editForm.category || undefined,
            label: editForm.label || undefined,
            notes: editForm.notes || undefined,
            documentDate: editForm.documentDate ? new Date(editForm.documentDate).toISOString() : null,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pet-documents", petId] });
        toast.success(t("pages.pets.documents.updated"));
        showEdit.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleEdit() {
    editMutation();
}

// ─── Delete ──────────────────────────────────────────────
const showDeleteConfirm = ref(false);
const deleteDocId = ref("");

function confirmDeleteDoc(doc: PetDocument) {
    deleteDocId.value = doc.id;
    showDeleteConfirm.value = true;
}

const { mutate: deleteMutation, isPending: deleting } = useMutation({
    mutationFn: () =>
        api.del(`/api/pets/${petId}/documents/${deleteDocId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pet-documents", petId] });
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.documents.deleted"));
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
