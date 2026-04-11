<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.pets.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.pets.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">
                {{ $t("pages.pets.add") }}
            </UiButton>
        </div>

        <!-- Filters -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UiTextInput
                v-model="searchQuery"
                :placeholder="$t('pages.pets.search')"
                size="compact"
                class="sm:max-w-xs"
            >
                <template #leading>
                    <Icon name="lucide:search" class="h-4 w-4" />
                </template>
            </UiTextInput>
            <UiSelect v-model="selectedEnclosure" size="compact" class="w-48">
                <option value="ALL">{{ $t("pages.pets.allEnclosures") }}</option>
                <option v-for="enc in enclosures ?? []" :key="enc.id" :value="enc.id">
                    {{ enc.name }}
                </option>
            </UiSelect>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 6" :key="i" class="glass-card h-48 animate-pulse rounded-xl" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <!-- Pet Grid -->
        <div
            v-else-if="filteredPets?.length"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            <NuxtLink
                v-for="pet in filteredPets"
                :key="pet.id"
                :to="`/pets/${pet.id}`"
                class="glass-card group rounded-xl p-5 transition-all hover:ring-1 hover:ring-white/10"
            >
                <!-- Header: Avatar + Name + Gender Badge -->
                <div class="flex items-start gap-3">
                    <div v-if="pet.photos.length" class="shrink-0">
                        <img
                            :src="resolveUrl(pet.photos[0].upload.url)"
                            :alt="pet.name"
                            class="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10"
                        />
                    </div>
                    <div
                        v-else
                        class="bg-surface-raised flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    >
                        <Icon name="lucide:heart" class="text-fg-faint h-5 w-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-2">
                            <h3
                                class="text-fg group-hover:text-primary-400 truncate font-semibold transition-colors"
                            >
                                {{ pet.name }}
                            </h3>
                            <span
                                v-if="pet.gender && pet.gender !== 'UNKNOWN'"
                                class="bg-primary-500/10 text-primary-400 shrink-0 rounded-md px-2 py-0.5 text-xs font-medium"
                            >
                                {{ pet.gender }}
                            </span>
                        </div>
                        <p class="text-fg-faint mt-0.5 text-sm">{{ pet.species }}</p>
                    </div>
                </div>

                <!-- Morph -->
                <p v-if="pet.morph" class="text-fg-muted mt-2 text-sm">{{ pet.morph }}</p>

                <!-- Info Row: Enclosure + Born -->
                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span
                        v-if="pet.enclosure"
                        class="text-fg-faint flex items-center gap-1.5 text-xs"
                    >
                        <Icon name="lucide:box" class="h-3.5 w-3.5" />
                        {{ pet.enclosure.name }}
                    </span>
                    <span
                        v-if="pet.birthDate"
                        class="text-fg-faint flex items-center gap-1.5 text-xs"
                    >
                        <Icon name="lucide:calendar" class="h-3.5 w-3.5" />
                        {{ new Date(pet.birthDate).toLocaleDateString() }}
                    </span>
                </div>

                <!-- Footer: Counts -->
                <div class="mt-4 flex items-center gap-4 border-t border-white/5 pt-3">
                    <span class="text-fg-muted flex items-center gap-1.5 text-xs">
                        <Icon name="lucide:utensils" class="h-3.5 w-3.5 text-amber-400" />
                        {{ pet._count.feedings }}
                    </span>
                    <span class="text-fg-muted flex items-center gap-1.5 text-xs">
                        <Icon name="lucide:layers" class="h-3.5 w-3.5 text-purple-400" />
                        {{ pet._count.sheddings }}
                    </span>
                    <span class="text-fg-muted flex items-center gap-1.5 text-xs">
                        <Icon name="lucide:scale" class="h-3.5 w-3.5 text-blue-400" />
                        {{ pet._count.weightRecords }}
                    </span>
                    <span class="text-fg-muted flex items-center gap-1.5 text-xs">
                        <Icon name="lucide:image" class="h-3.5 w-3.5 text-green-400" />
                        {{ pet._count.photos }}
                    </span>
                </div>
            </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:heart" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">
                {{
                    searchQuery || (selectedEnclosure && selectedEnclosure !== "ALL")
                        ? $t("common.noResults")
                        : $t("pages.pets.empty")
                }}
            </p>
            <UiButton
                v-if="!searchQuery && (!selectedEnclosure || selectedEnclosure === 'ALL')"
                class="mt-4"
                @click="openCreateModal"
            >
                {{ $t("pages.pets.addFirst") }}
            </UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal :show="showCreate" :title="$t('pages.pets.create')" @close="showCreate = false">
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiTextInput v-model="form.name" required :label="$t('pages.pets.fields.name')" />
                <UiSelect v-model="form.enclosureId" :label="$t('pages.pets.fields.enclosure')">
                    <option value="NONE">—</option>
                    <option v-for="enc in enclosures ?? []" :key="enc.id" :value="enc.id">
                        {{ enc.name }}
                    </option>
                </UiSelect>
                <UiTextInput
                    v-model="form.species"
                    required
                    :label="$t('pages.pets.fields.species')"
                />
                <UiTextInput v-model="form.morph" :label="$t('pages.pets.fields.morph')" />
                <UiSelect v-model="form.gender" :label="$t('pages.pets.fields.gender')">
                    <option v-for="g in genderOptions" :key="g" :value="g">{{ g }}</option>
                </UiSelect>
                <UiTextInput
                    v-model="form.birthDate"
                    type="date"
                    :label="$t('pages.pets.fields.birthDate')"
                />
                <UiTextarea v-model="form.notes" :label="$t('pages.pets.fields.notes')" />

                <!-- Feeding Schedule -->
                <div class="border-t border-white/5 pt-4">
                    <p class="text-fg-muted mb-1 text-sm font-medium">
                        {{ $t("pages.pets.feedingSchedule") }}
                    </p>
                    <p class="text-fg-faint mb-3 text-xs">
                        {{ $t("pages.pets.feedingScheduleHint") }}
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                        <UiTextInput
                            v-model="form.feedingIntervalMinDays"
                            type="number"
                            :label="$t('pages.pets.fields.feedingIntervalMinDays')"
                            min="1"
                            max="365"
                        />
                        <UiTextInput
                            v-model="form.feedingIntervalMaxDays"
                            type="number"
                            :label="$t('pages.pets.fields.feedingIntervalMaxDays')"
                            min="1"
                            max="365"
                        />
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="creating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";

interface Pet {
    id: string;
    name: string;
    species: string;
    morph: string | null;
    gender: string | null;
    birthDate: string | null;
    enclosureId: string | null;
    enclosure: { id: string; name: string } | null;
    photos: { id: string; uploadId: string; upload: { url: string } }[];
    _count: { feedings: number; sheddings: number; weightRecords: number; photos: number };
}

interface Enclosure {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();
const resolveUrl = useResolveUrl();

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "pets" });
useHead({ title: () => t("pages.pets.title") });

const genderOptions = ["MALE", "FEMALE", "UNKNOWN"];

// ── Filters ──────────────────────────────────────────────
const searchQuery = ref("");
const selectedEnclosure = ref("ALL");
const debouncedSearch = refDebounced(searchQuery, 300);

// ── Data ─────────────────────────────────────────────────
const {
    data: pets,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const { data: enclosures } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

const filteredPets = computed(() => {
    let result = pets.value ?? [];
    const search = debouncedSearch.value.toLowerCase();
    if (search) {
        result = result.filter(
            (p) =>
                p.name.toLowerCase().includes(search) ||
                p.species.toLowerCase().includes(search) ||
                (p.morph && p.morph.toLowerCase().includes(search)),
        );
    }
    if (selectedEnclosure.value && selectedEnclosure.value !== "ALL") {
        result = result.filter((p) => p.enclosureId === selectedEnclosure.value);
    }
    return result;
});

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    name: "",
    enclosureId: "NONE",
    species: "",
    morph: "",
    gender: "UNKNOWN",
    birthDate: "",
    notes: "",
    feedingIntervalMinDays: "",
    feedingIntervalMaxDays: "",
});

function resetForm() {
    Object.assign(form, {
        name: "",
        enclosureId: "NONE",
        species: "",
        morph: "",
        gender: "UNKNOWN",
        birthDate: "",
        notes: "",
        feedingIntervalMinDays: "",
        feedingIntervalMaxDays: "",
    });
}

function openCreateModal() {
    resetForm();
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/pets", {
            name: form.name,
            enclosureId: form.enclosureId === "NONE" ? undefined : form.enclosureId,
            species: form.species,
            morph: form.morph || undefined,
            gender: form.gender,
            birthDate: form.birthDate || undefined,
            notes: form.notes || undefined,
            feedingIntervalMinDays: form.feedingIntervalMinDays
                ? Number(form.feedingIntervalMinDays)
                : undefined,
            feedingIntervalMaxDays: form.feedingIntervalMaxDays
                ? Number(form.feedingIntervalMaxDays)
                : undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.created"));
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
</script>
