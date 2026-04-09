<template>
    <div class="space-y-6">
        <!-- Legal Documents List -->
        <div v-for="doc in documents" :key="doc.id" class="glass-card p-6">
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="font-semibold text-fg">{{ getLegalLabel(doc.key) }}</h3>
                    <p class="text-xs text-fg-muted">{{ doc.key }}</p>
                    <p v-if="doc.updatedAt" class="mt-1 text-xs text-fg-soft">
                        {{ $t("legal.last_updated") }}: {{ formatDate(doc.updatedAt) }}
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Published toggle -->
                    <button
                        class="relative h-6 w-11 rounded-full transition"
                        :class="doc.isPublished ? 'bg-emerald-600' : 'bg-active'"
                        @click="handleTogglePublished(doc)"
                    >
                        <span
                            class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                            :class="doc.isPublished ? 'translate-x-5' : 'translate-x-0'"
                        />
                    </button>
                    <button
                        class="rounded-lg border border-line px-3 py-1.5 text-xs text-fg-muted transition hover:border-emerald-500 hover:text-emerald-400"
                        @click="openEdit(doc)"
                    >
                        {{ $t("common.edit") }}
                    </button>
                </div>
            </div>
        </div>

        <p v-if="documents.length === 0" class="py-12 text-center text-fg-muted">
            {{ $t("common.no_data") }}
        </p>

        <!-- Edit Modal -->
        <Teleport to="body">
            <div
                v-if="editingDoc"
                class="fixed inset-0 z-50 flex items-center justify-center bg-overlay"
                @click.self="editingDoc = null"
            >
                <div class="w-full max-w-2xl glass-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                    <h3 class="mb-4 text-lg font-bold text-fg">
                        {{ getLegalLabel(editingDoc.key) }}
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">Title (EN)</label>
                            <input
                                v-model="editForm.title"
                                type="text"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">Title (DE)</label>
                            <input
                                v-model="editForm.titleDe"
                                type="text"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg"
                                >Content (DE)</label
                            >
                            <textarea
                                v-model="editForm.contentDe"
                                rows="10"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg"
                                >Content (EN)</label
                            >
                            <textarea
                                v-model="editForm.content"
                                rows="10"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button
                            class="rounded-lg border border-line px-4 py-2 text-sm text-fg-muted transition hover:bg-hover"
                            @click="editingDoc = null"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                            @click="handleSave"
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
useSeoMeta({ title: "Legal — Admin — Cold Blood Cast" });

const { t } = useI18n();
const admin = useAdmin();
const queryClient = useQueryClient();

interface LegalDocument {
    id: string;
    key: string;
    title: string;
    titleDe: string;
    content: string;
    contentDe: string;
    isPublished: boolean;
    updatedAt: string;
}

const editingDoc = ref<LegalDocument | null>(null);
const editForm = ref({
    title: "",
    titleDe: "",
    content: "",
    contentDe: "",
});

const { data: documentsData } = useQuery<LegalDocument[]>({
    queryKey: ["admin", "legal"],
    queryFn: () => admin.listLegalDocuments(),
});

const documents = computed(() => documentsData.value ?? []);

function getLegalLabel(key: string): string {
    const labels: Record<string, string> = {
        "privacy-policy": t("admin.legal.privacy_policy"),
        terms: t("admin.legal.terms"),
        imprint: t("admin.legal.imprint"),
    };
    return labels[key] || key;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
}

function openEdit(doc: LegalDocument) {
    editingDoc.value = doc;
    editForm.value = {
        title: doc.title || "",
        titleDe: doc.titleDe || "",
        content: doc.content || "",
        contentDe: doc.contentDe || "",
    };
}

async function handleSave() {
    if (!editingDoc.value) return;
    await admin.upsertLegalDocument({
        key: editingDoc.value.key,
        title: editForm.value.title,
        titleDe: editForm.value.titleDe,
        content: editForm.value.content,
        contentDe: editForm.value.contentDe,
    });
    editingDoc.value = null;
    queryClient.invalidateQueries({ queryKey: ["admin", "legal"] });
}

async function handleTogglePublished(doc: LegalDocument) {
    await admin.toggleLegalPublished(doc.id, !doc.isPublished);
    queryClient.invalidateQueries({ queryKey: ["admin", "legal"] });
}
</script>
