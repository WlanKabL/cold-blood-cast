<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-fg text-2xl font-bold tracking-tight">
                    {{ $t("pages.enclosures.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-sm">{{ $t("pages.enclosures.subtitle") }}</p>
            </div>
            <UButton
                icon="i-lucide-plus"
                :label="$t('pages.enclosures.add')"
                @click="showCreate = true"
            />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 6" :key="i" class="glass-card h-40 animate-pulse rounded-xl" />
        </div>

        <!-- List -->
        <div
            v-else-if="enclosures?.length"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            <NuxtLink
                v-for="enc in enclosures"
                :key="enc.id"
                :to="`/enclosures/${enc.id}`"
                class="glass-card group rounded-xl p-5 transition-all hover:ring-1 hover:ring-white/10"
            >
                <div class="flex items-start justify-between">
                    <div>
                        <h3
                            class="text-fg group-hover:text-primary-400 font-semibold transition-colors"
                        >
                            {{ enc.name }}
                        </h3>
                        <p class="text-fg-faint mt-1 text-sm">
                            {{ enc.species || $t("pages.enclosures.noSpecies") }}
                        </p>
                    </div>
                    <span
                        class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ enc.type }}
                    </span>
                </div>
                <div v-if="enc.description" class="text-fg-muted mt-3 line-clamp-2 text-sm">
                    {{ enc.description }}
                </div>
                <div
                    v-if="enc.lengthCm || enc.widthCm || enc.heightCm"
                    class="text-fg-faint mt-3 text-xs"
                >
                    {{ [enc.lengthCm, enc.widthCm, enc.heightCm].filter(Boolean).join(" × ") }} cm
                </div>
            </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:box" class="text-fg-faint mb-3 h-12 w-12" />
            <p class="text-fg-muted text-sm">{{ $t("pages.enclosures.empty") }}</p>
            <UButton
                class="mt-4"
                :label="$t('pages.enclosures.addFirst')"
                @click="showCreate = true"
            />
        </div>

        <!-- Create Modal -->
        <UModal v-model:open="showCreate">
            <template #content>
                <div class="p-6">
                    <h2 class="text-fg mb-4 text-lg font-semibold">
                        {{ $t("pages.enclosures.create") }}
                    </h2>
                    <form class="space-y-4" @submit.prevent="handleCreate">
                        <UFormField :label="$t('pages.enclosures.fields.name')">
                            <UInput v-model="form.name" required />
                        </UFormField>
                        <UFormField :label="$t('pages.enclosures.fields.type')">
                            <USelect v-model="form.type" :items="enclosureTypes" />
                        </UFormField>
                        <UFormField :label="$t('pages.enclosures.fields.species')">
                            <UInput v-model="form.species" />
                        </UFormField>
                        <UFormField :label="$t('pages.enclosures.fields.description')">
                            <UTextarea v-model="form.description" />
                        </UFormField>
                        <div class="grid grid-cols-3 gap-3">
                            <UFormField :label="$t('pages.enclosures.fields.length')">
                                <UInput v-model.number="form.lengthCm" type="number" />
                            </UFormField>
                            <UFormField :label="$t('pages.enclosures.fields.width')">
                                <UInput v-model.number="form.widthCm" type="number" />
                            </UFormField>
                            <UFormField :label="$t('pages.enclosures.fields.height')">
                                <UInput v-model.number="form.heightCm" type="number" />
                            </UFormField>
                        </div>
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

interface Enclosure {
    id: string;
    name: string;
    type: string;
    species: string | null;
    description: string | null;
    imageUrl: string | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
}

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useToast();

definePageMeta({ layout: "default" });
useHead({ title: () => t("pages.enclosures.title") });

const enclosureTypes = ["TERRARIUM", "VIVARIUM", "PALUDARIUM", "RACK", "OTHER"];

const showCreate = ref(false);
const creating = ref(false);
const form = reactive({
    name: "",
    type: "TERRARIUM",
    species: "",
    description: "",
    lengthCm: null as number | null,
    widthCm: null as number | null,
    heightCm: null as number | null,
});

const { data: enclosures, isLoading: loading } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

async function handleCreate() {
    creating.value = true;
    try {
        await api.post("/api/enclosures", {
            name: form.name,
            type: form.type,
            species: form.species || undefined,
            description: form.description || undefined,
            lengthCm: form.lengthCm || undefined,
            widthCm: form.widthCm || undefined,
            heightCm: form.heightCm || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["enclosures"] });
        toast.add({ title: t("common.saved"), color: "green" });
        showCreate.value = false;
        Object.assign(form, {
            name: "",
            type: "TERRARIUM",
            species: "",
            description: "",
            lengthCm: null,
            widthCm: null,
            heightCm: null,
        });
    } catch {
        toast.add({ title: t("common.error"), color: "red" });
    } finally {
        creating.value = false;
    }
}
</script>
