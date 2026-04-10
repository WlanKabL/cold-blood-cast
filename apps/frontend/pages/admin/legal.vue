<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("admin.legal.title") }}
            </h1>
            <p class="text-fg-muted mt-1 text-[12px]">{{ $t("admin.legal.subtitle") }}</p>
        </div>

        <div v-if="loading" class="space-y-3">
            <div v-for="i in 4" :key="i" class="glass-card flex items-center justify-between p-5">
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <UiSkeleton width="56" height="18" rounded="lg" />
                        <UiSkeleton width="140" height="14" />
                    </div>
                    <UiSkeleton width="100" height="11" />
                </div>
                <UiSkeleton width="32" height="32" rounded="lg" />
            </div>
        </div>

        <template v-else>
            <!-- Document List -->
            <div v-if="!editingDoc" class="space-y-3">
                <div
                    v-for="doc in documents"
                    :key="doc.key"
                    class="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-3">
                            <span
                                class="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                                :class="
                                    doc.isPublished
                                        ? 'bg-green-500/15 text-green-400'
                                        : 'bg-gray-500/15 text-gray-400'
                                "
                            >
                                {{
                                    doc.isPublished
                                        ? $t("admin.legal.published")
                                        : $t("admin.legal.draft")
                                }}
                            </span>
                            <h3 class="text-fg text-[14px] font-medium">{{ doc.title }}</h3>
                        </div>
                        <p class="text-fg-faint mt-1 text-[11px]">
                            {{ doc.key }} · {{ doc.titleDe }}
                        </p>
                        <p v-if="doc.updater" class="text-fg-faint mt-0.5 text-[11px]">
                            {{ $t("admin.legal.lastEditedBy", { name: doc.updater.username }) }}
                            · {{ new Date(doc.updatedAt).toLocaleString() }}
                        </p>
                        <p
                            class="mt-1 text-[11px]"
                            :class="doc.content ? 'text-fg-muted' : 'text-amber-400'"
                        >
                            {{
                                doc.content
                                    ? $t("admin.legal.hasContent")
                                    : $t("admin.legal.noContent")
                            }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            class="border-line text-fg-muted hover:bg-surface-hover hover:text-fg rounded-xl border px-3 py-1.5 text-[12px] font-medium transition"
                            @click="startEdit(doc)"
                        >
                            <Icon name="lucide:pencil" class="mr-1 inline h-3.5 w-3.5" />
                            {{ $t("common.edit") }}
                        </button>
                        <button
                            class="rounded-xl px-3 py-1.5 text-[12px] font-medium transition"
                            :class="
                                doc.isPublished
                                    ? 'border border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                    : 'border border-green-500/30 text-green-400 hover:bg-green-500/10'
                            "
                            @click="handleToggle(doc)"
                        >
                            <Icon
                                :name="doc.isPublished ? 'lucide:eye-off' : 'lucide:eye'"
                                class="mr-1 inline h-3.5 w-3.5"
                            />
                            {{
                                doc.isPublished
                                    ? $t("admin.legal.unpublish")
                                    : $t("admin.legal.publish")
                            }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Edit View -->
            <div v-else class="space-y-6">
                <div class="flex items-center justify-between">
                    <button
                        class="text-fg-muted hover:text-fg flex items-center gap-2 text-[13px] transition"
                        @click="cancelEdit"
                    >
                        <Icon name="lucide:arrow-left" class="h-4 w-4" />
                        {{ $t("common.back") }}
                    </button>
                    <button
                        class="bg-primary-500 hover:bg-primary-400 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition"
                        :disabled="saving"
                        @click="saveDocument"
                    >
                        <Icon
                            v-if="saving"
                            name="lucide:loader-2"
                            class="mr-1 inline h-4 w-4 animate-spin"
                        />
                        {{ $t("common.save") }}
                    </button>
                </div>

                <div class="glass-card space-y-5 p-6">
                    <h2 class="text-fg text-lg font-semibold">
                        {{ editingDoc.key }}
                    </h2>

                    <!-- Titles -->
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label class="text-fg-muted mb-1 block text-[12px] font-medium">
                                {{ $t("admin.legal.titleEn") }}
                            </label>
                            <input
                                v-model="editForm.title"
                                type="text"
                                class="border-line text-fg focus:ring-primary-500 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:ring-1 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label class="text-fg-muted mb-1 block text-[12px] font-medium">
                                {{ $t("admin.legal.titleDe") }}
                            </label>
                            <input
                                v-model="editForm.titleDe"
                                type="text"
                                class="border-line text-fg focus:ring-primary-500 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:ring-1 focus:outline-none"
                            />
                        </div>
                    </div>

                    <!-- Impressum Metadata (only for impressum) -->
                    <template v-if="editingDoc.key === 'impressum'">
                        <div class="border-line border-t pt-4">
                            <h3 class="text-fg mb-3 text-[13px] font-semibold">
                                {{ $t("admin.legal.impressumData") }}
                            </h3>
                            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div v-for="field in impressumFields" :key="field.key">
                                    <label class="text-fg-muted mb-1 block text-[11px] font-medium">
                                        {{ $t(`admin.legal.impressum.${field.key}`) }}
                                    </label>
                                    <input
                                        v-model="impressumData[field.key]"
                                        type="text"
                                        :placeholder="field.placeholder"
                                        class="border-line text-fg placeholder:text-fg-faint focus:ring-primary-500 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:ring-1 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Content EN -->
                    <div>
                        <label class="text-fg-muted mb-1 block text-[12px] font-medium">
                            {{ $t("admin.legal.contentEn") }}
                        </label>
                        <textarea
                            v-model="editForm.content"
                            rows="16"
                            class="border-line text-fg placeholder:text-fg-faint focus:ring-primary-500 w-full rounded-xl border bg-transparent px-4 py-3 font-mono text-[12px] leading-relaxed focus:ring-1 focus:outline-none"
                            :placeholder="$t('admin.legal.contentPlaceholder')"
                        />
                    </div>

                    <!-- Content DE -->
                    <div>
                        <label class="text-fg-muted mb-1 block text-[12px] font-medium">
                            {{ $t("admin.legal.contentDe") }}
                        </label>
                        <textarea
                            v-model="editForm.contentDe"
                            rows="16"
                            class="border-line text-fg placeholder:text-fg-faint focus:ring-primary-500 w-full rounded-xl border bg-transparent px-4 py-3 font-mono text-[12px] leading-relaxed focus:ring-1 focus:outline-none"
                            :placeholder="$t('admin.legal.contentPlaceholder')"
                        />
                    </div>

                    <!-- Sort Order -->
                    <div class="max-w-xs">
                        <label class="text-fg-muted mb-1 block text-[12px] font-medium">
                            {{ $t("admin.legal.sortOrder") }}
                        </label>
                        <input
                            v-model.number="editForm.sortOrder"
                            type="number"
                            min="0"
                            class="border-line text-fg focus:ring-primary-500 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] focus:ring-1 focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { AdminLegalDocument, ImpressumMetadata } from "~/types/api";

definePageMeta({ layout: "admin" });

const admin = useAdminApi();
const toast = useAppToast();
const { t } = useI18n();
const queryClient = useQueryClient();

useHead({ title: () => `${t("admin.legal.title")} — Admin` });

const saving = ref(false);
const editingDoc = ref<AdminLegalDocument | null>(null);
const editForm = ref({
    title: "",
    titleDe: "",
    content: "",
    contentDe: "",
    sortOrder: 0,
});

const { data: documentsData, isLoading: loading } = useQuery({
    queryKey: ["admin-legal-documents"],
    queryFn: () => admin.listLegalDocuments(),
});

const documents = computed(
    () =>
        (documentsData.value ?? []) as (AdminLegalDocument & { updater?: { username: string } })[],
);

const impressumFields = [
    { key: "companyName", placeholder: "KeeperLog" },
    { key: "legalForm", placeholder: "Einzelunternehmen" },
    { key: "ownerName", placeholder: "Max Mustermann" },
    { key: "street", placeholder: "Musterstraße 1" },
    { key: "zip", placeholder: "12345" },
    { key: "city", placeholder: "Berlin" },
    { key: "country", placeholder: "Deutschland" },
    { key: "email", placeholder: "legal@cold-blood-cast.app" },
    { key: "phone", placeholder: "+49 ..." },
    { key: "registerCourt", placeholder: "Amtsgericht Berlin" },
    { key: "registerNumber", placeholder: "HRB 12345" },
    { key: "vatId", placeholder: "DE123456789" },
    { key: "responsiblePerson", placeholder: "Max Mustermann" },
    { key: "websiteUrl", placeholder: "https://cold-blood-cast.app" },
] as const;

const impressumData = ref<Record<string, string>>({});

function startEdit(doc: AdminLegalDocument) {
    editingDoc.value = doc;
    editForm.value = {
        title: doc.title,
        titleDe: doc.titleDe,
        content: doc.content,
        contentDe: doc.contentDe,
        sortOrder: doc.sortOrder,
    };
    if (doc.key === "impressum" && doc.metadata) {
        const meta = doc.metadata as ImpressumMetadata;
        impressumData.value = {
            companyName: meta.companyName || "",
            legalForm: meta.legalForm || "",
            ownerName: meta.ownerName || "",
            street: meta.street || "",
            zip: meta.zip || "",
            city: meta.city || "",
            country: meta.country || "",
            email: meta.email || "",
            phone: meta.phone || "",
            registerCourt: meta.registerCourt || "",
            registerNumber: meta.registerNumber || "",
            vatId: meta.vatId || "",
            responsiblePerson: meta.responsiblePerson || "",
            websiteUrl: meta.websiteUrl || "",
        };
    } else {
        impressumData.value = {};
    }
}

function cancelEdit() {
    editingDoc.value = null;
}

async function saveDocument() {
    if (!editingDoc.value) return;
    saving.value = true;
    try {
        const payload: Record<string, unknown> = {
            title: editForm.value.title,
            titleDe: editForm.value.titleDe,
            content: editForm.value.content,
            contentDe: editForm.value.contentDe,
            sortOrder: editForm.value.sortOrder,
        };

        if (editingDoc.value.key === "impressum") {
            payload.metadata = impressumData.value;
        }

        await admin.updateLegalDocument(editingDoc.value.key, payload);
        toast.add({ title: t("admin.legal.saved"), color: "green", timeout: 3000 });
        editingDoc.value = null;
        await queryClient.invalidateQueries({ queryKey: ["admin-legal-documents"] });
    } catch {
        toast.add({ title: t("admin.legal.saveFailed"), color: "red", timeout: 5000 });
    } finally {
        saving.value = false;
    }
}

async function handleToggle(doc: AdminLegalDocument) {
    try {
        await admin.toggleLegalDocumentPublished(doc.key);
        toast.add({
            title: doc.isPublished
                ? t("admin.legal.unpublished")
                : t("admin.legal.publishedSuccess"),
            color: "green",
            timeout: 3000,
        });
        await queryClient.invalidateQueries({ queryKey: ["admin-legal-documents"] });
    } catch {
        toast.add({ title: t("admin.legal.toggleFailed"), color: "red", timeout: 5000 });
    }
}
</script>
