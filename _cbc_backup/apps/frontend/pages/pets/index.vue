<template>
    <PageContainer :title="$t('pets.title')" hide-back-button>
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
            <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-emerald-400" />
        </div>

        <!-- Empty state -->
        <div v-else-if="!pets.length && !showForm" class="py-16 text-center">
            <Icon name="lucide:paw-print" class="mx-auto h-12 w-12 text-fg-soft" />
            <h3 class="mt-4 text-lg font-semibold text-fg">{{ $t("pets.empty_title") }}</h3>
            <p class="mt-2 text-sm text-fg-muted">{{ $t("pets.empty_desc") }}</p>
            <button
                class="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
                @click="showForm = true"
            >
                <Icon name="lucide:plus" class="h-4 w-4" />
                {{ $t("pets.create") }}
            </button>
        </div>

        <template v-else>
            <div class="mb-6 flex items-center justify-end">
                <button
                    v-if="!showForm"
                    class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                    @click="showForm = true"
                >
                    <Icon name="lucide:plus" class="h-4 w-4" />
                    {{ $t("pets.create") }}
                </button>
            </div>

            <!-- Create form -->
            <div v-if="showForm" class="mb-8 rounded-xl border border-card-border bg-card-bg p-6">
                <form @submit.prevent="createPet">
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg"
                                >{{ $t("pets.name") }} *</label
                            >
                            <input
                                v-model="form.name"
                                type="text"
                                required
                                :placeholder="$t('pets.name_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg"
                                >{{ $t("pets.species") }} *</label
                            >
                            <input
                                v-model="form.species"
                                type="text"
                                required
                                :placeholder="$t('pets.species_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("pets.morph")
                            }}</label>
                            <input
                                v-model="form.morph"
                                type="text"
                                :placeholder="$t('pets.morph_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("pets.gender")
                            }}</label>
                            <select
                                v-model="form.gender"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            >
                                <option value="UNKNOWN">{{ $t("pets.gender_UNKNOWN") }}</option>
                                <option value="MALE">{{ $t("pets.gender_MALE") }}</option>
                                <option value="FEMALE">{{ $t("pets.gender_FEMALE") }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("pets.enclosure")
                            }}</label>
                            <select
                                v-model="form.enclosureId"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            >
                                <option value="">{{ $t("pets.no_enclosure") }}</option>
                                <option v-for="enc in enclosures" :key="enc.id" :value="enc.id">
                                    {{ enc.name }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("pets.birth_date")
                            }}</label>
                            <input
                                v-model="form.birthDate"
                                type="date"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div class="md:col-span-2">
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("pets.notes")
                            }}</label>
                            <textarea
                                v-model="form.notes"
                                rows="2"
                                :placeholder="$t('pets.notes_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div class="mt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            class="rounded-lg px-4 py-2 text-sm text-fg-muted transition hover:text-fg"
                            @click="resetForm"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            type="submit"
                            :disabled="saving || !form.name || !form.species"
                            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                            <Icon
                                v-if="saving"
                                name="lucide:loader-2"
                                class="h-4 w-4 animate-spin"
                            />
                            {{ $t("common.create") }}
                        </button>
                    </div>
                </form>
            </div>

            <!-- Pet cards -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="pet in pets"
                    :key="pet.id"
                    class="group rounded-xl border border-card-border bg-card-bg p-5 transition-colors hover:border-line"
                >
                    <div class="mb-3 flex items-start justify-between">
                        <div>
                            <h3 class="text-base font-semibold text-fg">{{ pet.name }}</h3>
                            <span class="text-xs text-fg-soft">{{ pet.species }}</span>
                        </div>
                        <button
                            class="rounded p-1 text-fg-soft opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                            @click="deletePet(pet.id)"
                        >
                            <Icon name="lucide:trash-2" class="h-4 w-4" />
                        </button>
                    </div>
                    <p v-if="pet.morph" class="mb-2 text-xs text-fg-muted">{{ pet.morph }}</p>
                    <p v-if="pet.enclosure" class="mb-3 text-xs text-emerald-500">
                        {{ pet.enclosure.name }}
                    </p>
                    <div class="flex gap-4 text-xs text-fg-soft">
                        <span
                            >{{ pet._count.feedings }}
                            {{ $t("pets.feedings_count", pet._count.feedings) }}</span
                        >
                        <span
                            >{{ pet._count.sheddings }}
                            {{ $t("pets.sheddings_count", pet._count.sheddings) }}</span
                        >
                    </div>
                </div>
            </div>
        </template>
    </PageContainer>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });
useSeoMeta({ title: "Pets – Cold Blood Cast" });

const { t } = useI18n();
const http = useHttp();

interface Pet {
    id: string;
    name: string;
    species: string;
    morph: string | null;
    gender: string;
    enclosure: { id: string; name: string } | null;
    _count: { feedings: number; sheddings: number; weightRecords: number };
}

interface EnclosureOption {
    id: string;
    name: string;
}

const pets = ref<Pet[]>([]);
const enclosures = ref<EnclosureOption[]>([]);
const loading = ref(true);
const saving = ref(false);
const showForm = ref(false);

const form = reactive({
    name: "",
    species: "",
    morph: "",
    gender: "UNKNOWN",
    enclosureId: "",
    birthDate: "",
    notes: "",
});

function resetForm() {
    form.name = "";
    form.species = "";
    form.morph = "";
    form.gender = "UNKNOWN";
    form.enclosureId = "";
    form.birthDate = "";
    form.notes = "";
    showForm.value = false;
}

async function fetchData() {
    try {
        const [petRes, encRes] = await Promise.all([
            http.get<Pet[]>("/api/pets"),
            http.get<EnclosureOption[]>("/api/enclosures"),
        ]);
        pets.value = petRes.data;
        enclosures.value = encRes.data;
    } catch {
        // handled by empty state
    } finally {
        loading.value = false;
    }
}

async function createPet() {
    if (!form.name || !form.species || saving.value) return;
    saving.value = true;
    try {
        const payload: Record<string, unknown> = {
            name: form.name,
            species: form.species,
            gender: form.gender,
        };
        if (form.morph) payload.morph = form.morph;
        if (form.enclosureId) payload.enclosureId = form.enclosureId;
        if (form.birthDate) payload.birthDate = form.birthDate;
        if (form.notes) payload.notes = form.notes;

        await http.post("/api/pets", payload);
        resetForm();
        await fetchData();
    } catch {
        // error handled by interceptor
    } finally {
        saving.value = false;
    }
}

async function deletePet(id: string) {
    if (!confirm(t("pets.confirm_delete"))) return;
    try {
        await http.delete(`/api/pets/${id}`);
        pets.value = pets.value.filter((p) => p.id !== id);
    } catch {
        // error handled by interceptor
    }
}

onMounted(fetchData);
</script>
