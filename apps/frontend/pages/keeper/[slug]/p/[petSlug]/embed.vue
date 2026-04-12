<template>
    <div class="min-h-screen bg-[#0d0d0d] p-4">
        <div v-if="loading" class="flex h-full items-center justify-center py-20">
            <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-gray-500" />
        </div>

        <div v-else-if="!petData" class="flex h-full items-center justify-center py-20">
            <p class="text-sm text-gray-500">{{ $t("publicProfile.notFound") }}</p>
        </div>

        <div v-else class="space-y-3">
            <!-- Header -->
            <div class="flex items-center gap-3">
                <img
                    v-if="petData.profilePhotoId"
                    :src="profilePhotoUrl"
                    :alt="petData.name"
                    class="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
                />
                <div
                    v-else
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10"
                >
                    <Icon name="lucide:paw-print" class="h-5 w-5 text-gray-500" />
                </div>
                <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-white">{{ petData.name }}</p>
                    <div class="flex gap-1.5">
                        <span v-if="petData.species" class="text-xs text-gray-400">{{
                            petData.species
                        }}</span>
                        <span v-if="petData.morph" class="text-xs text-gray-500"
                            >· {{ petData.morph }}</span
                        >
                    </div>
                </div>
            </div>

            <!-- Bio -->
            <p v-if="petData.bio" class="line-clamp-3 text-xs leading-relaxed text-gray-300">
                {{ petData.bio }}
            </p>

            <!-- Weight -->
            <div v-if="petData.weightRecords.length" class="rounded-lg bg-white/5 p-3">
                <div class="flex items-baseline justify-between">
                    <span class="text-lg font-bold text-white">
                        {{ petData.weightRecords[0].weightGrams }}g
                    </span>
                    <span class="text-[10px] text-gray-500">
                        {{ $t("publicProfile.weight") }}
                    </span>
                </div>
            </div>

            <!-- Photos -->
            <div v-if="petData.photos.length" class="grid grid-cols-3 gap-1.5">
                <img
                    v-for="photo in petData.photos.slice(0, 3)"
                    :key="photo.id"
                    :src="photoUrl(photo.id)"
                    :alt="photo.caption || petData.name"
                    class="aspect-square rounded-lg object-cover ring-1 ring-white/10"
                    loading="lazy"
                />
            </div>

            <!-- Footer Link -->
            <a
                :href="profileUrl"
                target="_blank"
                rel="noopener"
                class="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
                <Icon name="lucide:paw-print" class="h-3 w-3" />
                {{ $t("publicProfile.viewFullProfile") }}
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
interface EmbedPetData {
    name: string;
    bio: string | null;
    species: string | null;
    morph: string | null;
    profilePhotoId: string | null;
    photos: Array<{ id: string; caption: string | null }>;
    weightRecords: Array<{ weightGrams: number; measuredAt: string }>;
    slug: string;
}

definePageMeta({ layout: false });

const route = useRoute();
const config = useRuntimeConfig();
const userSlug = route.params.slug as string;
const petSlug = route.params.petSlug as string;
const apiBase = config.public.apiBaseURL;

const loading = ref(true);
const petData = ref<EmbedPetData | null>(null);

function photoUrl(photoId: string): string {
    return `${apiBase}/api/public/pets/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}/photos/${photoId}`;
}

const profilePhotoUrl = computed(() =>
    petData.value?.profilePhotoId ? photoUrl(petData.value.profilePhotoId) : "",
);

const profileUrl = computed(
    () =>
        `${window.location.origin}/keeper/${encodeURIComponent(userSlug)}/p/${encodeURIComponent(petSlug)}`,
);

onMounted(async () => {
    try {
        const res = await fetch(
            `${apiBase}/api/public/pets/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}`,
        );
        if (res.ok) {
            const json = await res.json();
            if (json.success) petData.value = json.data;
        }
    } catch {
        // Ignore
    } finally {
        loading.value = false;
    }
});
</script>
