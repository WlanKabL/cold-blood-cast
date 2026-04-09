<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">{{ $t("pages.sheddings.title") }}</h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.sheddings.subtitle") }}</p>
            </div>
            <UButton icon="i-lucide-plus" :label="$t('pages.sheddings.add')" @click="showCreate = true" />
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
            <USelect v-model="selectedPet" :items="petOptions" :placeholder="$t('pages.sheddings.allPets')" class="w-48" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="glass-card h-16 animate-pulse rounded-xl" />
        </div>

        <!-- List -->
        <div v-else-if="sheddings?.length" class="space-y-2">
            <div
                v-for="shed in sheddings"
                :key="shed.id"
                class="glass-card flex items-center justify-between rounded-xl p-4"
            >
                <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                        <Icon name="lucide:layers" class="h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm font-medium">{{ shed.pet?.name ?? "" }}</p>
                        <p class="text-fg-faint text-xs">
                            {{ $t("pages.sheddings.started") }}: {{ new Date(shed.startedAt).toLocaleDateString() }}
                            <span v-if="shed.completedAt">
                                · {{ $t("pages.sheddings.completed") }}: {{ new Date(shed.completedAt).toLocaleDateString() }}
                            </span>
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span
                        :class="shed.complete ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'"
                        class="rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ shed.complete ? $t("pages.sheddings.complete") : $t("pages.sheddings.inProgress") }}
                    </span>
                    <span v-if="shed.quality" class="text-fg-faint text-xs">{{ shed.quality }}</span>
                    <UButton variant="ghost" icon="i-lucide-trash-2" size="xs" color="error" @click="handleDelete(shed.id)" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:layers" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.sheddings.empty") }}</p>
            <UButton class="mt-4" :label="$t('pages.sheddings.addFirst')" @click="showCreate = true" />
        </div>

        <!-- Create Modal -->
        <UModal v-model:open="showCreate">
            <template #content>
                <div class="p-6">
                    <h2 class="text-fg mb-4 text-lg font-semibold">{{ $t("pages.sheddings.create") }}</h2>
                    <form class="space-y-4" @submit.prevent="handleCreate">
                        <UFormField :label="$t('pages.sheddings.fields.pet')">
                            <USelect v-model="form.petId" :items="petOptions.filter((p) => p.value)" required />
                        </UFormField>
                        <UFormField :label="$t('pages.sheddings.fields.startedAt')">
                            <UInput v-model="form.startedAt" type="date" required />
                        </UFormField>
                        <UFormField :label="$t('pages.sheddings.fields.completedAt')">
                            <UInput v-model="form.completedAt" type="date" />
                        </UFormField>
                        <UFormField :label="$t('pages.sheddings.fields.complete')">
                            <UCheckbox v-model="form.complete" :label="$t('pages.sheddings.fields.completeLabel')" />
                        </UFormField>
                        <UFormField :label="$t('pages.sheddings.fields.quality')">
                            <UInput v-model="form.quality" :placeholder="$t('pages.sheddings.fields.qualityPlaceholder')" />
                        </UFormField>
                        <UFormField :label="$t('pages.sheddings.fields.notes')">
                            <UTextarea v-model="form.notes" />
                        </UFormField>
                        <div class="flex justify-end gap-2 pt-2">
                            <UButton variant="ghost" :label="$t('common.cancel')" @click="showCreate = false" />
                            <UButton type="submit" :loading="creating" :label="$t('common.save')" />
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface Shedding {
    id: string;
    startedAt: string;
    completedAt: string | null;
    complete: boolean;
    quality: string | null;
    notes: string | null;
    pet?: { name: string };
}

interface Pet {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.sheddings.title") });

const selectedPet = ref("");
const showCreate = ref(false);
const creating = ref(false);
const form = reactive({
    petId: "",
    startedAt: "",
    completedAt: "",
    complete: false,
    quality: "",
    notes: "",
});

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (selectedPet.value) params.set("petId", selectedPet.value);
    return params.toString();
});

const { data: sheddings, isLoading: loading } = useQuery({
    queryKey: ["sheddings", selectedPet],
    queryFn: () => api.get<Shedding[]>(`/api/sheddings${queryParams.value ? `?${queryParams.value}` : ""}`),
});

const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const petOptions = computed(() => [
    { label: t("pages.sheddings.allPets"), value: "" },
    ...(pets.value ?? []).map((p) => ({ label: p.name, value: p.id })),
]);

async function handleCreate() {
    creating.value = true;
    try {
        await api.post("/api/sheddings", {
            petId: form.petId,
            startedAt: form.startedAt,
            completedAt: form.completedAt || undefined,
            complete: form.complete,
            quality: form.quality || undefined,
            notes: form.notes || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["sheddings"] });
        toast.add({ title: t("common.saved"), color: "green" });
        showCreate.value = false;
        Object.assign(form, { petId: "", startedAt: "", completedAt: "", complete: false, quality: "", notes: "" });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    } finally {
        creating.value = false;
    }
}

async function handleDelete(id: string) {
    if (!confirm(t("pages.sheddings.confirmDelete"))) return;
    try {
        await api.del(`/api/sheddings/${id}`);
        await queryClient.invalidateQueries({ queryKey: ["sheddings"] });
        toast.add({ title: t("common.deleted"), color: "green" });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    }
}
</script>
