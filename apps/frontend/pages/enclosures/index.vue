<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Header -->
        <div
            class="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.enclosures.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.enclosures.subtitle") }}</p>
            </div>
            <UiButton icon="lucide:plus" @click="openCreateModal">
                {{ $t("pages.enclosures.add") }}
            </UiButton>
        </div>

        <!-- Filters -->
        <div class="animate-fade-in-up flex flex-col gap-3 delay-75 sm:flex-row sm:items-center">
            <UiTextInput
                v-model="searchQuery"
                :placeholder="$t('pages.enclosures.search')"
                size="compact"
                class="sm:max-w-xs"
            >
                <template #leading>
                    <Icon name="lucide:search" class="h-4 w-4" />
                </template>
            </UiTextInput>
            <div class="flex gap-2">
                <UiButton
                    v-for="f in filterOptions"
                    :key="f.value"
                    size="sm"
                    :variant="activeFilter === f.value ? 'primary' : 'ghost'"
                    @click="activeFilter = f.value"
                >
                    {{ f.label }}
                </UiButton>
            </div>
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

        <!-- Enclosure Grid -->
        <div
            v-else-if="enclosures?.length"
            class="animate-fade-in-up grid grid-cols-1 gap-4 delay-150 sm:grid-cols-2 lg:grid-cols-3"
        >
            <NuxtLink
                v-for="enc in enclosures"
                :key="enc.id"
                :to="`/enclosures/${enc.id}`"
                class="glass-card group relative rounded-xl p-5 transition-all hover:shadow-lg hover:ring-1 hover:shadow-black/5 hover:ring-white/10"
                :class="{ 'opacity-60': !enc.active }"
            >
                <!-- Header: Name + Type Badge -->
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <h3
                            class="text-fg group-hover:text-primary-400 truncate font-semibold transition-colors"
                        >
                            {{ enc.name }}
                        </h3>
                        <p class="text-fg-faint mt-0.5 text-sm">
                            {{ enc.species || $t("pages.enclosures.noSpecies") }}
                        </p>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                        <span
                            v-if="!enc.active"
                            class="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400"
                        >
                            {{ $t("pages.enclosures.archived") }}
                        </span>
                        <span
                            class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                            {{ enc.type }}
                        </span>
                    </div>
                </div>

                <!-- Description -->
                <p v-if="enc.description" class="text-fg-muted mt-3 line-clamp-2 text-sm">
                    {{ enc.description }}
                </p>

                <!-- Info Row: Room + Dimensions -->
                <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span v-if="enc.room" class="text-fg-faint flex items-center gap-1.5 text-xs">
                        <Icon name="lucide:map-pin" class="h-3.5 w-3.5" />
                        {{ enc.room }}
                    </span>
                    <span
                        v-if="enc.lengthCm || enc.widthCm || enc.heightCm"
                        class="text-fg-faint flex items-center gap-1.5 text-xs"
                    >
                        <Icon name="lucide:ruler" class="h-3.5 w-3.5" />
                        {{ [enc.lengthCm, enc.widthCm, enc.heightCm].filter(Boolean).join(" × ") }}
                        cm
                    </span>
                </div>

                <!-- Footer: Pet + Sensor Counts -->
                <div class="mt-4 flex items-center gap-4 border-t border-white/5 pt-3">
                    <span class="text-fg-muted flex items-center gap-1.5 text-xs">
                        <Icon name="lucide:heart" class="h-3.5 w-3.5 text-pink-400" />
                        {{
                            $t(
                                "pages.enclosures.petCount",
                                { count: enc._count.pets },
                                enc._count.pets,
                            )
                        }}
                    </span>
                    <span class="text-fg-muted flex items-center gap-1.5 text-xs">
                        <Icon name="lucide:thermometer" class="h-3.5 w-3.5 text-green-400" />
                        {{
                            $t(
                                "pages.enclosures.sensorCount",
                                { count: enc._count.sensors },
                                enc._count.sensors,
                            )
                        }}
                    </span>
                </div>
            </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:box" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">
                {{
                    searchQuery || activeFilter !== "all"
                        ? $t("common.noResults")
                        : $t("pages.enclosures.empty")
                }}
            </p>
            <UiButton
                v-if="!searchQuery && activeFilter === 'all'"
                class="mt-4"
                @click="openCreateModal"
            >
                {{ $t("pages.enclosures.addFirst") }}
            </UiButton>
        </div>

        <!-- Create Modal -->
        <UiModal
            :show="showCreate"
            :title="$t('pages.enclosures.create')"
            @close="showCreate = false"
        >
            <form class="space-y-4" @submit.prevent="handleCreate">
                <UiTextInput
                    v-model="form.name"
                    required
                    :label="$t('pages.enclosures.fields.name')"
                />
                <div class="grid grid-cols-2 gap-3">
                    <UiSelect v-model="form.type" :label="$t('pages.enclosures.fields.type')">
                        <option v-for="t in ENCLOSURE_TYPES" :key="t" :value="t">{{ t }}</option>
                    </UiSelect>
                    <UiTextInput
                        v-model="form.room"
                        :label="$t('pages.enclosures.fields.room')"
                        :placeholder="$t('pages.enclosures.fields.roomPlaceholder')"
                    />
                </div>
                <UiTextInput
                    v-model="form.species"
                    :label="$t('pages.enclosures.fields.species')"
                    :placeholder="$t('pages.enclosures.fields.speciesPlaceholder')"
                />
                <UiTextarea
                    v-model="form.description"
                    :label="$t('pages.enclosures.fields.description')"
                />
                <div class="grid grid-cols-3 gap-3">
                    <UiTextInput
                        v-model.number="form.lengthCm"
                        type="number"
                        min="1"
                        :label="$t('pages.enclosures.fields.length')"
                    />
                    <UiTextInput
                        v-model.number="form.widthCm"
                        type="number"
                        min="1"
                        :label="$t('pages.enclosures.fields.width')"
                    />
                    <UiTextInput
                        v-model.number="form.heightCm"
                        type="number"
                        min="1"
                        :label="$t('pages.enclosures.fields.height')"
                    />
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showCreate = false">
                        {{ $t("common.cancel") }}
                    </UiButton>
                    <UiButton type="submit" :loading="creating">
                        {{ $t("common.save") }}
                    </UiButton>
                </div>
            </form>
        </UiModal>
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";
import { ENCLOSURE_TYPES } from "@cold-blood-cast/shared";

interface EnclosureListItem {
    id: string;
    name: string;
    type: string;
    species: string | null;
    description: string | null;
    imageUrl: string | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    room: string | null;
    active: boolean;
    _count: { pets: number; sensors: number };
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "enclosures" });
useHead({ title: () => t("pages.enclosures.title") });

// ── Filters ──────────────────────────────────────────────
const searchQuery = ref("");
const activeFilter = ref<"all" | "active" | "inactive">("all");
const debouncedSearch = refDebounced(searchQuery, 300);

const filterOptions = computed(() => [
    { value: "all" as const, label: t("pages.enclosures.all") },
    { value: "active" as const, label: t("pages.enclosures.active") },
    { value: "inactive" as const, label: t("pages.enclosures.archived") },
]);

const queryParams = computed(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.value) params.set("search", debouncedSearch.value);
    if (activeFilter.value === "active") params.set("active", "true");
    if (activeFilter.value === "inactive") params.set("active", "false");
    return params.toString();
});

// ── Data ─────────────────────────────────────────────────
const {
    data: enclosures,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["enclosures", queryParams],
    queryFn: () => {
        const qs = queryParams.value;
        return api.get<EnclosureListItem[]>(`/api/enclosures${qs ? `?${qs}` : ""}`);
    },
});

// ── Create ───────────────────────────────────────────────
const showCreate = ref(false);
const form = reactive({
    name: "",
    type: "TERRARIUM",
    species: "",
    description: "",
    room: "",
    lengthCm: null as number | null,
    widthCm: null as number | null,
    heightCm: null as number | null,
});

function resetForm() {
    Object.assign(form, {
        name: "",
        type: "TERRARIUM",
        species: "",
        description: "",
        room: "",
        lengthCm: null,
        widthCm: null,
        heightCm: null,
    });
}

function openCreateModal() {
    resetForm();
    showCreate.value = true;
}

const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () =>
        api.post("/api/enclosures", {
            name: form.name,
            type: form.type,
            species: form.species || undefined,
            description: form.description || undefined,
            room: form.room || undefined,
            lengthCm: form.lengthCm || undefined,
            widthCm: form.widthCm || undefined,
            heightCm: form.heightCm || undefined,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["enclosures"] });
        toast.success(t("pages.enclosures.created"));
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
