<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Back + Header -->
        <div
            class="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div class="flex items-center gap-3">
                <NuxtLink
                    :to="`/pets/${petId}`"
                    class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors"
                >
                    <Icon name="lucide:arrow-left" class="h-5 w-5" />
                </NuxtLink>
                <div>
                    <h1 class="text-fg text-2xl font-bold tracking-tight">
                        {{ pet?.name }} — {{ $t("pages.pets.photos.title") }}
                    </h1>
                    <p class="text-fg-muted mt-0.5 text-sm">
                        {{ $t("pages.pets.photos.subtitle") }}
                    </p>
                </div>
            </div>
            <UiButton icon="lucide:upload" @click="showUpload = true">
                {{ $t("pages.pets.photos.upload") }}
            </UiButton>
        </div>

        <!-- Tag Filter -->
        <div v-if="allTags.length" class="flex flex-wrap gap-2">
            <button
                :class="[
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    !selectedTag
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-fg-muted bg-white/5 hover:bg-white/10',
                ]"
                @click="selectedTag = ''"
            >
                {{ $t("pages.pets.photos.allPhotos") }}
            </button>
            <button
                v-for="tag in allTags"
                :key="tag"
                :class="[
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    selectedTag === tag
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-fg-muted bg-white/5 hover:bg-white/10',
                ]"
                @click="selectedTag = tag"
            >
                {{ tag }}
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div
                v-for="i in 8"
                :key="i"
                class="glass-card aspect-square animate-pulse rounded-xl"
            />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <!-- Photo Grid -->
        <div
            v-else-if="filteredPhotos.length"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
            <div
                v-for="(photo, index) in filteredPhotos"
                :key="photo.id"
                class="glass-card group relative aspect-square cursor-pointer overflow-hidden rounded-xl transition-all hover:ring-1 hover:ring-white/10"
                @click="openLightbox(index)"
            >
                <img
                    :src="resolveUrl(photo.upload.url)"
                    :alt="photo.caption || ''"
                    class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                />

                <!-- Profile Badge -->
                <div
                    v-if="photo.isProfilePicture"
                    class="bg-primary-500/90 absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                >
                    <Icon name="lucide:star" class="mr-0.5 inline h-3 w-3" />
                    {{ $t("pages.pets.photos.isProfile") }}
                </div>

                <!-- Overlay on hover (desktop) -->
                <div
                    class="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity sm:group-hover:opacity-100"
                >
                    <div class="p-3">
                        <p v-if="photo.caption" class="line-clamp-2 text-sm text-white/90">
                            {{ photo.caption }}
                        </p>
                        <p class="mt-0.5 text-[10px] text-white/60">
                            {{ new Date(photo.takenAt || photo.createdAt).toLocaleDateString() }}
                        </p>
                        <div v-if="photo.tags.length" class="mt-1 flex flex-wrap gap-1">
                            <span
                                v-for="tag in photo.tags"
                                :key="tag"
                                class="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] text-white/80"
                            >
                                {{ tag }}
                            </span>
                        </div>
                    </div>

                    <!-- Actions (desktop) -->
                    <div
                        class="pointer-events-auto flex items-center justify-end gap-1 border-t border-white/10 px-2 py-1.5"
                    >
                        <button
                            v-if="!photo.isProfilePicture"
                            class="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            :title="$t('pages.pets.photos.setAsProfile')"
                            @click.stop="handleSetProfile(photo.id)"
                        >
                            <Icon name="lucide:star" class="h-3.5 w-3.5" />
                        </button>
                        <button
                            class="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            :title="$t('pages.pets.photos.editCaption')"
                            @click.stop="openEditModal(photo)"
                        >
                            <Icon name="lucide:pencil" class="h-3.5 w-3.5" />
                        </button>
                        <button
                            class="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-red-400"
                            :title="$t('common.delete')"
                            @click.stop="confirmDeletePhoto(photo)"
                        >
                            <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <!-- Mobile action bar (always visible on small screens) -->
                <div
                    class="absolute right-1 bottom-1 flex items-center gap-0.5 rounded-lg bg-black/60 px-1 py-0.5 backdrop-blur-sm sm:hidden"
                >
                    <button
                        v-if="!photo.isProfilePicture"
                        class="rounded p-1.5 text-white/80 active:bg-white/20"
                        @click.stop="handleSetProfile(photo.id)"
                    >
                        <Icon name="lucide:star" class="h-4 w-4" />
                    </button>
                    <button
                        class="rounded p-1.5 text-white/80 active:bg-white/20"
                        @click.stop="openEditModal(photo)"
                    >
                        <Icon name="lucide:pencil" class="h-4 w-4" />
                    </button>
                    <button
                        class="rounded p-1.5 text-white/80 active:text-red-400"
                        @click.stop="confirmDeletePhoto(photo)"
                    >
                        <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:image" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">
                {{
                    selectedTag
                        ? $t("pages.pets.photos.emptyFiltered")
                        : $t("pages.pets.photos.empty")
                }}
            </p>
            <UiButton v-if="!selectedTag" class="mt-4" @click="showUpload = true">
                {{ $t("pages.pets.photos.upload") }}
            </UiButton>
        </div>

        <!-- Lightbox -->
        <PhotoLightbox
            :show="lightboxOpen"
            :src="lightboxSrc"
            :caption="lightboxCaption"
            :taken-at="lightboxTakenAt"
            :tags="lightboxTags"
            :current="lightboxIndex"
            :total="filteredPhotos.length"
            :has-prev="lightboxIndex > 0"
            :has-next="lightboxIndex < filteredPhotos.length - 1"
            @close="lightboxOpen = false"
            @prev="lightboxIndex--"
            @next="lightboxIndex++"
        />

        <!-- Upload Modal -->
        <UiModal
            :show="showUpload"
            :title="$t('pages.pets.photos.upload')"
            @close="showUpload = false"
        >
            <form class="space-y-4" @submit.prevent="handleUpload">
                <!-- File Input -->
                <div>
                    <label
                        class="border-line hover:border-primary-500/50 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors"
                        @dragover.prevent
                        @drop.prevent="handleDrop"
                    >
                        <Icon name="lucide:image-plus" class="text-fg-faint mb-2 h-10 w-10" />
                        <p class="text-fg-muted text-sm">{{ $t("pages.pets.photos.dropHint") }}</p>
                        <p class="text-fg-faint mt-1 text-xs">
                            {{ $t("pages.pets.photos.maxSize", { size: 10 }) }}
                        </p>
                        <input
                            ref="fileInputRef"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                            multiple
                            class="hidden"
                            @change="handleFileSelect"
                        />
                    </label>
                    <!-- Selected files list -->
                    <div v-if="selectedFiles.length" class="mt-2 space-y-1">
                        <p
                            v-for="(file, i) in selectedFiles"
                            :key="i"
                            class="text-fg flex items-center gap-2 text-sm"
                        >
                            <Icon name="lucide:file-image" class="h-4 w-4 shrink-0" />
                            <span class="min-w-0 truncate">{{ file.name }}</span>
                            <span class="text-fg-faint shrink-0"
                                >({{ formatFileSize(file.size) }})</span
                            >
                            <button
                                type="button"
                                class="text-fg-faint shrink-0 hover:text-red-400"
                                @click="removeFile(i)"
                            >
                                <Icon name="lucide:x" class="h-3.5 w-3.5" />
                            </button>
                        </p>
                    </div>
                </div>

                <!-- Single-file fields (hidden during multi-upload) -->
                <template v-if="!isMultiUpload">
                    <UiTextInput
                        v-model="uploadForm.caption"
                        :label="$t('pages.pets.photos.caption')"
                        :placeholder="$t('pages.pets.photos.captionPlaceholder')"
                    />
                </template>

                <UiTextInput
                    v-model="uploadForm.tags"
                    :label="$t('pages.pets.photos.tags')"
                    :placeholder="$t('pages.pets.photos.tagsHint')"
                />

                <!-- Single-file fields (hidden during multi-upload) -->
                <template v-if="!isMultiUpload">
                    <UiTextInput
                        v-model="uploadForm.takenAt"
                        type="datetime-local"
                        :label="$t('pages.pets.photos.takenAt')"
                    />
                    <p
                        v-if="dateAutoDetected"
                        class="text-primary-400 -mt-2 flex items-center gap-1 text-xs"
                    >
                        <Icon name="lucide:sparkles" class="h-3 w-3" />
                        {{ $t("pages.pets.photos.dateAutoDetected") }}
                    </p>
                    <p
                        v-else-if="dateDetectionFailed && selectedFiles.length === 1"
                        class="-mt-2 flex items-center gap-1 text-xs text-amber-400"
                    >
                        <Icon name="lucide:alert-circle" class="h-3 w-3" />
                        {{ $t("pages.pets.photos.dateNotDetected") }}
                    </p>

                    <div class="flex items-center gap-3">
                        <UiToggle v-model="uploadForm.isProfilePicture" />
                        <span class="text-fg-muted text-sm">{{
                            $t("pages.pets.photos.setProfile")
                        }}</span>
                    </div>
                </template>

                <!-- Upload progress -->
                <div
                    v-if="uploading && isMultiUpload"
                    class="bg-surface-raised rounded-lg p-3 text-sm"
                >
                    <div class="text-fg-muted mb-1 flex justify-between">
                        <span>{{ $t("pages.pets.photos.uploadingProgress") }}</span>
                        <span class="text-fg font-medium"
                            >{{ uploadProgress }} / {{ selectedFiles.length }}</span
                        >
                    </div>
                    <div class="bg-surface h-1.5 overflow-hidden rounded-full">
                        <div
                            class="bg-primary-500 h-full rounded-full transition-all duration-300"
                            :style="{
                                width: `${(uploadProgress / selectedFiles.length) * 100}%`,
                            }"
                        />
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showUpload = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :disabled="!selectedFiles.length" :loading="uploading">
                        {{
                            isMultiUpload
                                ? $t("pages.pets.photos.uploadCount", {
                                      count: selectedFiles.length,
                                  })
                                : $t("pages.pets.photos.upload")
                        }}
                    </UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Edit Modal -->
        <UiModal
            :show="showEdit"
            :title="$t('pages.pets.photos.editCaption')"
            @close="showEdit = false"
        >
            <form class="space-y-4" @submit.prevent="handleEdit">
                <UiTextInput
                    v-model="editForm.caption"
                    :label="$t('pages.pets.photos.caption')"
                    :placeholder="$t('pages.pets.photos.captionPlaceholder')"
                />

                <UiTextInput
                    v-model="editForm.tags"
                    :label="$t('pages.pets.photos.tags')"
                    :placeholder="$t('pages.pets.photos.tagsHint')"
                />

                <UiTextInput
                    v-model="editForm.takenAt"
                    type="datetime-local"
                    :label="$t('pages.pets.photos.takenAt')"
                />

                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showEdit = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="editing">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Delete Confirmation -->
        <UiConfirmDialog
            :show="showDeleteConfirm"
            :title="$t('common.confirmDelete')"
            :message="$t('pages.pets.photos.confirmDelete')"
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
import exifr from "exifr";
import { formatFileSize } from "~/composables/useFormatters";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface PetPhoto {
    id: string;
    petId: string;
    uploadId: string;
    upload: { url: string };
    caption: string | null;
    tags: string[];
    isProfilePicture: boolean;
    sortOrder: number;
    takenAt: string;
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

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "photos" });

const { data: pet } = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => api.get<Pet>(`/api/pets/${petId}`),
});

useHead({ title: () => `${pet.value?.name ?? "..."} — ${t("pages.pets.photos.title")}` });

// ─── Data ────────────────────────────────────────────────
const {
    data: photos,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["pet-photos", petId],
    queryFn: () => api.get<PetPhoto[]>(`/api/pets/${petId}/photos`),
});

// ─── Filters ─────────────────────────────────────────────
const selectedTag = ref("");

const allTags = computed(() => {
    const tagSet = new Set<string>();
    for (const photo of photos.value ?? []) {
        for (const tag of photo.tags) {
            tagSet.add(tag);
        }
    }
    return Array.from(tagSet).sort();
});

const filteredPhotos = computed(() => {
    const list = photos.value ?? [];
    if (!selectedTag.value) return list;
    return list.filter((p) => p.tags.includes(selectedTag.value));
});

// ─── Lightbox ────────────────────────────────────────────
const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

const lightboxSrc = computed(() => {
    const photo = filteredPhotos.value[lightboxIndex.value];
    return photo ? resolveUrl(photo.upload.url) : "";
});

const lightboxCaption = computed(() => {
    return filteredPhotos.value[lightboxIndex.value]?.caption ?? "";
});

const lightboxTags = computed(() => {
    return filteredPhotos.value[lightboxIndex.value]?.tags ?? [];
});

const lightboxTakenAt = computed(() => {
    const photo = filteredPhotos.value[lightboxIndex.value];
    return photo?.takenAt || photo?.createdAt || "";
});

function openLightbox(index: number) {
    lightboxIndex.value = index;
    lightboxOpen.value = true;
}

// ─── Upload ──────────────────────────────────────────────
const showUpload = ref(false);
const selectedFiles = ref<File[]>([]);
const fileInputRef = ref<HTMLInputElement>();
const uploadProgress = ref(0);

const isMultiUpload = computed(() => selectedFiles.value.length > 1);

const uploadForm = reactive({
    caption: "",
    tags: "",
    isProfilePicture: false,
    takenAt: new Date().toISOString().slice(0, 16),
});

const dateAutoDetected = ref(false);
const dateDetectionFailed = ref(false);

function resetUploadForm() {
    selectedFiles.value = [];
    uploadProgress.value = 0;
    dateAutoDetected.value = false;
    dateDetectionFailed.value = false;
    Object.assign(uploadForm, {
        caption: "",
        tags: "",
        isProfilePicture: false,
        takenAt: new Date().toISOString().slice(0, 16),
    });
    if (fileInputRef.value) fileInputRef.value.value = "";
}

function removeFile(index: number) {
    selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index);
    if (selectedFiles.value.length === 1) {
        extractExifDate(selectedFiles.value[0]);
    }
    if (selectedFiles.value.length === 0 && fileInputRef.value) {
        fileInputRef.value.value = "";
    }
}

function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const valid: File[] = [];
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            toast.error(
                t("common.fileTooLarge", { max: formatFileSize(MAX_FILE_SIZE) }) +
                    ` (${file.name})`,
            );
            continue;
        }
        valid.push(file);
    }
    selectedFiles.value = valid;
    if (valid.length === 1) extractExifDate(valid[0]);
}

function handleDrop(event: DragEvent) {
    const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
    );
    const valid: File[] = [];
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            toast.error(
                t("common.fileTooLarge", { max: formatFileSize(MAX_FILE_SIZE) }) +
                    ` (${file.name})`,
            );
            continue;
        }
        valid.push(file);
    }
    selectedFiles.value = valid;
    if (valid.length === 1) extractExifDate(valid[0]);
}

async function extractExifDate(file: File) {
    dateAutoDetected.value = false;
    dateDetectionFailed.value = false;

    try {
        const exif = await exifr.parse(file, [
            "DateTimeOriginal",
            "DateTimeDigitized",
            "CreateDate",
        ]);
        const date = exif?.DateTimeOriginal ?? exif?.DateTimeDigitized ?? exif?.CreateDate;
        if (date instanceof Date && !isNaN(date.getTime())) {
            uploadForm.takenAt = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            dateAutoDetected.value = true;
            return;
        }
    } catch {
        // No EXIF data or unsupported format
    }

    // Fallback: File.lastModified
    if (file.lastModified) {
        const lastMod = new Date(file.lastModified);
        if (!isNaN(lastMod.getTime())) {
            uploadForm.takenAt = new Date(lastMod.getTime() - lastMod.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            dateAutoDetected.value = true;
            return;
        }
    }

    // Could not extract
    uploadForm.takenAt = new Date().toISOString().slice(0, 16);
    dateDetectionFailed.value = true;
}

const { mutate: uploadMutation, isPending: uploading } = useMutation({
    mutationFn: async () => {
        if (!selectedFiles.value.length) return;

        const baseURL = useRuntimeConfig().public.apiBaseURL;
        const authStore = useAuthStore();
        const headers = { Authorization: `Bearer ${authStore.accessToken}` };

        const tags = uploadForm.tags || undefined;

        async function uploadSingleFile(
            file: File,
            opts?: { caption?: string; isProfilePicture?: boolean; takenAt?: string },
        ) {
            const formData = new FormData();
            if (opts?.caption) formData.append("caption", opts.caption);
            if (tags) formData.append("tags", tags);
            if (opts?.isProfilePicture) formData.append("isProfilePicture", "true");
            if (opts?.takenAt) formData.append("takenAt", new Date(opts.takenAt).toISOString());
            formData.append("file", file);

            const res = await fetch(`${baseURL}/api/pets/${petId}/photos`, {
                method: "POST",
                headers,
                body: formData,
                credentials: "include",
            });

            const json = await res.json();
            if (!json.success) throw new Error(json.error?.message ?? "Upload failed");
            return json.data;
        }

        if (selectedFiles.value.length === 1) {
            // Single file — use form fields
            await uploadSingleFile(selectedFiles.value[0], {
                caption: uploadForm.caption || undefined,
                isProfilePicture: uploadForm.isProfilePicture,
                takenAt: uploadForm.takenAt || undefined,
            });
        } else {
            // Multi-file — upload sequentially, auto-detect takenAt per file
            uploadProgress.value = 0;
            for (const file of selectedFiles.value) {
                let takenAt: string | undefined;
                try {
                    const exif = await exifr.parse(file, [
                        "DateTimeOriginal",
                        "DateTimeDigitized",
                        "CreateDate",
                    ]);
                    const date =
                        exif?.DateTimeOriginal ?? exif?.DateTimeDigitized ?? exif?.CreateDate;
                    if (date instanceof Date && !isNaN(date.getTime())) {
                        takenAt = date.toISOString();
                    }
                } catch {
                    // No EXIF
                }
                if (!takenAt && file.lastModified) {
                    takenAt = new Date(file.lastModified).toISOString();
                }

                await uploadSingleFile(file, { takenAt });
                uploadProgress.value++;
            }
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pet-photos", petId] });
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        const count = selectedFiles.value.length;
        toast.success(
            count > 1
                ? t("pages.pets.photos.uploadedCount", { count })
                : t("pages.pets.photos.uploaded"),
        );
        showUpload.value = false;
        resetUploadForm();
    },
    onError: (err: Error) => {
        toast.error(err.message || t("common.error"));
    },
});

function handleUpload() {
    uploadMutation();
}

// ─── Edit ────────────────────────────────────────────────
const showEdit = ref(false);
const editPhotoId = ref("");

const editForm = reactive({
    caption: "",
    tags: "",
    takenAt: "",
});

function openEditModal(photo: PetPhoto) {
    editPhotoId.value = photo.id;
    editForm.caption = photo.caption ?? "";
    editForm.tags = photo.tags.join(", ");
    editForm.takenAt = photo.takenAt ? new Date(photo.takenAt).toISOString().slice(0, 16) : "";
    showEdit.value = true;
}

const { mutate: editMutation, isPending: editing } = useMutation({
    mutationFn: () =>
        api.patch(`/api/pets/${petId}/photos/${editPhotoId.value}`, {
            caption: editForm.caption || undefined,
            tags: editForm.tags
                ? editForm.tags
                      .split(",")
                      .map((t: string) => t.trim())
                      .filter(Boolean)
                : [],
            takenAt: editForm.takenAt ? new Date(editForm.takenAt).toISOString() : undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pet-photos", petId] });
        toast.success(t("pages.pets.photos.updated"));
        showEdit.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleEdit() {
    editMutation();
}

// ─── Set Profile Picture ─────────────────────────────────
const { mutate: setProfileMutation } = useMutation({
    mutationFn: (photoId: string) => api.post(`/api/pets/${petId}/photos/${photoId}/profile`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pet-photos", petId] });
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.photos.profileSet"));
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleSetProfile(photoId: string) {
    setProfileMutation(photoId);
}

// ─── Delete ──────────────────────────────────────────────
const showDeleteConfirm = ref(false);
const deletePhotoId = ref("");

function confirmDeletePhoto(photo: PetPhoto) {
    deletePhotoId.value = photo.id;
    showDeleteConfirm.value = true;
}

const { mutate: deleteMutation, isPending: deleting } = useMutation({
    mutationFn: () => api.del(`/api/pets/${petId}/photos/${deletePhotoId.value}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pet-photos", petId] });
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.photos.deleted"));
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
