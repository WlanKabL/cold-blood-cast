<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.pets.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.pets.subtitle") }}</p>
            </div>
            <UButton
                icon="i-lucide-plus"
                :label="$t('pages.pets.add')"
                @click="showCreate = true"
            />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 6" :key="i" class="glass-card h-40 animate-pulse rounded-xl" />
        </div>

        <!-- List -->
        <div v-else-if="pets?.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
                v-for="pet in pets"
                :key="pet.id"
                :to="`/pets/${pet.id}`"
                class="glass-card group rounded-xl p-5 transition-all hover:ring-1 hover:ring-white/10"
            >
                <div class="flex items-start justify-between">
                    <div>
                        <h3
                            class="text-fg group-hover:text-primary-400 font-semibold transition-colors"
                        >
                            {{ pet.name }}
                        </h3>
                        <p class="text-fg-faint mt-1 text-sm">{{ pet.species }}</p>
                    </div>
                    <span
                        v-if="pet.gender"
                        class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ pet.gender }}
                    </span>
                </div>
                <p v-if="pet.morph" class="text-fg-muted mt-2 text-sm">{{ pet.morph }}</p>
                <p v-if="pet.birthDate" class="text-fg-faint mt-2 text-xs">
                    {{ $t("pages.pets.born") }}: {{ new Date(pet.birthDate).toLocaleDateString() }}
                </p>
            </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:heart" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.pets.empty") }}</p>
            <UButton class="mt-4" :label="$t('pages.pets.addFirst')" @click="showCreate = true" />
        </div>

        <!-- Create Modal -->
        <UModal v-model:open="showCreate">
            <template #content>
                <div class="p-6">
                    <h2 class="text-fg mb-4 text-lg font-semibold">
                        {{ $t("pages.pets.create") }}
                    </h2>
                    <form class="space-y-4" @submit.prevent="handleCreate">
                        <UFormField :label="$t('pages.pets.fields.name')">
                            <UInput v-model="form.name" required />
                        </UFormField>
                        <UFormField :label="$t('pages.pets.fields.enclosure')">
                            <USelect v-model="form.enclosureId" :items="enclosureOptions" />
                        </UFormField>
                        <UFormField :label="$t('pages.pets.fields.species')">
                            <UInput v-model="form.species" required />
                        </UFormField>
                        <UFormField :label="$t('pages.pets.fields.morph')">
                            <UInput v-model="form.morph" />
                        </UFormField>
                        <UFormField :label="$t('pages.pets.fields.gender')">
                            <USelect v-model="form.gender" :items="genderOptions" />
                        </UFormField>
                        <UFormField :label="$t('pages.pets.fields.birthDate')">
                            <UInput v-model="form.birthDate" type="date" />
                        </UFormField>
                        <UFormField :label="$t('pages.pets.fields.notes')">
                            <UTextarea v-model="form.notes" />
                        </UFormField>
                        <div class="flex justify-end gap-2 pt-2">
                            <UButton
                                variant="ghost"
                                :label="$t('common.cancel')"
                                @click="showCreate = false"
                            />
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

interface Pet {
    id: string;
    name: string;
    species: string;
    morph: string | null;
    gender: string | null;
    birthDate: string | null;
    enclosureId: string;
}

interface Enclosure {
    id: string;
    name: string;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.pets.title") });

const genderOptions = ["MALE", "FEMALE", "UNKNOWN"];

const showCreate = ref(false);
const creating = ref(false);
const form = reactive({
    name: "",
    enclosureId: "",
    species: "",
    morph: "",
    gender: "UNKNOWN",
    birthDate: "",
    notes: "",
});

const { data: pets, isLoading: loading } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.get<Pet[]>("/api/pets"),
});

const { data: enclosures } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

const enclosureOptions = computed(() =>
    (enclosures.value ?? []).map((e) => ({ label: e.name, value: e.id })),
);

async function handleCreate() {
    creating.value = true;
    try {
        await api.post("/api/pets", {
            name: form.name,
            enclosureId: form.enclosureId,
            species: form.species,
            morph: form.morph || undefined,
            gender: form.gender,
            birthDate: form.birthDate || undefined,
            notes: form.notes || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.add({ title: t("common.saved"), color: "green" });
        showCreate.value = false;
        Object.assign(form, {
            name: "",
            enclosureId: "",
            species: "",
            morph: "",
            gender: "UNKNOWN",
            birthDate: "",
            notes: "",
        });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    } finally {
        creating.value = false;
    }
}
</script>
