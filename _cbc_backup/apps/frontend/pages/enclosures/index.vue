<template>
    <PageContainer :title="$t('enclosures.title')" hide-back-button>
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
            <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-emerald-400" />
        </div>

        <!-- Empty state -->
        <div v-else-if="!enclosures.length && !showForm" class="py-16 text-center">
            <Icon name="lucide:warehouse" class="mx-auto h-12 w-12 text-fg-soft" />
            <h3 class="mt-4 text-lg font-semibold text-fg">{{ $t("enclosures.empty_title") }}</h3>
            <p class="mt-2 text-sm text-fg-muted">{{ $t("enclosures.empty_desc") }}</p>
            <button
                class="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
                @click="showForm = true"
            >
                <Icon name="lucide:plus" class="h-4 w-4" />
                {{ $t("enclosures.create") }}
            </button>
        </div>

        <!-- List + create button -->
        <template v-else>
            <div class="mb-6 flex items-center justify-end">
                <button
                    v-if="!showForm"
                    class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                    @click="showForm = true"
                >
                    <Icon name="lucide:plus" class="h-4 w-4" />
                    {{ $t("enclosures.create") }}
                </button>
            </div>

            <!-- Create form -->
            <div v-if="showForm" class="mb-8 rounded-xl border border-card-border bg-card-bg p-6">
                <form @submit.prevent="createEnclosure">
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg"
                                >{{ $t("enclosures.name") }} *</label
                            >
                            <input
                                v-model="form.name"
                                type="text"
                                required
                                :placeholder="$t('enclosures.name_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("enclosures.type")
                            }}</label>
                            <select
                                v-model="form.type"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
                            >
                                <option v-for="t in enclosureTypes" :key="t" :value="t">
                                    {{ $t(`enclosures.type_${t}`) }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("enclosures.species")
                            }}</label>
                            <input
                                v-model="form.species"
                                type="text"
                                :placeholder="$t('enclosures.species_placeholder')"
                                class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("enclosures.dimensions")
                            }}</label>
                            <div class="flex gap-2">
                                <input
                                    v-model.number="form.lengthCm"
                                    type="number"
                                    min="1"
                                    :placeholder="$t('enclosures.length')"
                                    class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                                />
                                <input
                                    v-model.number="form.widthCm"
                                    type="number"
                                    min="1"
                                    :placeholder="$t('enclosures.width')"
                                    class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                                />
                                <input
                                    v-model.number="form.heightCm"
                                    type="number"
                                    min="1"
                                    :placeholder="$t('enclosures.height')"
                                    class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="mb-1 block text-sm font-medium text-fg">{{
                                $t("enclosures.description")
                            }}</label>
                            <textarea
                                v-model="form.description"
                                rows="2"
                                :placeholder="$t('enclosures.description_placeholder')"
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
                            :disabled="saving || !form.name"
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

            <!-- Enclosure cards -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="enc in enclosures"
                    :key="enc.id"
                    class="group rounded-xl border border-card-border bg-card-bg p-5 transition-colors hover:border-line"
                >
                    <div class="mb-3 flex items-start justify-between">
                        <div>
                            <h3 class="text-base font-semibold text-fg">{{ enc.name }}</h3>
                            <span class="text-xs text-fg-soft">{{
                                $t(`enclosures.type_${enc.type}`)
                            }}</span>
                        </div>
                        <button
                            class="rounded p-1 text-fg-soft opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                            @click="deleteEnclosure(enc.id)"
                        >
                            <Icon name="lucide:trash-2" class="h-4 w-4" />
                        </button>
                    </div>
                    <p v-if="enc.species" class="mb-3 text-sm text-fg-muted">{{ enc.species }}</p>
                    <div class="flex gap-4 text-xs text-fg-soft">
                        <span class="flex items-center gap-1">
                            <Icon name="lucide:paw-print" class="h-3.5 w-3.5" />
                            {{ enc._count.pets }}
                        </span>
                        <span class="flex items-center gap-1">
                            <Icon name="lucide:thermometer" class="h-3.5 w-3.5" />
                            {{ enc._count.sensors }}
                        </span>
                    </div>
                </div>
            </div>
        </template>
    </PageContainer>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });
useSeoMeta({ title: "Enclosures – Cold Blood Cast" });

const { t } = useI18n();
const http = useHttp();

interface Enclosure {
    id: string;
    name: string;
    type: string;
    species: string | null;
    description: string | null;
    _count: { pets: number; sensors: number };
}

const enclosures = ref<Enclosure[]>([]);
const loading = ref(true);
const saving = ref(false);
const showForm = ref(false);

const enclosureTypes = [
    "TERRARIUM",
    "VIVARIUM",
    "AQUARIUM",
    "PALUDARIUM",
    "RACK",
    "OTHER",
] as const;

const form = reactive({
    name: "",
    type: "TERRARIUM" as string,
    species: "",
    description: "",
    lengthCm: undefined as number | undefined,
    widthCm: undefined as number | undefined,
    heightCm: undefined as number | undefined,
});

function resetForm() {
    form.name = "";
    form.type = "TERRARIUM";
    form.species = "";
    form.description = "";
    form.lengthCm = undefined;
    form.widthCm = undefined;
    form.heightCm = undefined;
    showForm.value = false;
}

async function fetchEnclosures() {
    try {
        const { data } = await http.get<Enclosure[]>("/api/enclosures");
        enclosures.value = data;
    } catch {
        // handled by empty state
    } finally {
        loading.value = false;
    }
}

async function createEnclosure() {
    if (!form.name || saving.value) return;
    saving.value = true;
    try {
        const payload: Record<string, unknown> = { name: form.name, type: form.type };
        if (form.species) payload.species = form.species;
        if (form.description) payload.description = form.description;
        if (form.lengthCm) payload.lengthCm = form.lengthCm;
        if (form.widthCm) payload.widthCm = form.widthCm;
        if (form.heightCm) payload.heightCm = form.heightCm;

        await http.post("/api/enclosures", payload);
        resetForm();
        await fetchEnclosures();
    } catch {
        // error handled by interceptor
    } finally {
        saving.value = false;
    }
}

async function deleteEnclosure(id: string) {
    if (!confirm(t("enclosures.confirm_delete"))) return;
    try {
        await http.delete(`/api/enclosures/${id}`);
        enclosures.value = enclosures.value.filter((e) => e.id !== id);
    } catch {
        // error handled by interceptor
    }
}

onMounted(fetchEnclosures);
</script>
