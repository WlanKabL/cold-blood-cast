<template>
    <div class="bg-base min-h-dvh p-4">
        <!-- Loading -->
        <div v-if="loading" class="flex min-h-[200px] items-center justify-center">
            <Icon name="lucide:loader-2" class="text-fg-faint h-6 w-6 animate-spin" />
        </div>

        <!-- Not Found -->
        <div
            v-else-if="!petData"
            class="flex min-h-[200px] flex-col items-center justify-center text-center"
        >
            <Icon name="lucide:shield-x" class="text-fg-faint mb-2 h-8 w-8" />
            <p class="text-fg-muted text-sm">{{ $t("publicProfile.notFound") }}</p>
        </div>

        <!-- Compact Profile Card -->
        <div v-else class="space-y-4">
            <!-- Header -->
            <div class="flex items-center gap-3">
                <img
                    v-if="profilePhotoUrl"
                    :src="profilePhotoUrl"
                    :alt="petData.name"
                    class="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10"
                />
                <div
                    v-else
                    class="bg-surface-raised flex h-14 w-14 items-center justify-center rounded-xl"
                >
                    <Icon name="lucide:paw-print" class="text-fg-faint h-6 w-6" />
                </div>
                <div class="min-w-0 flex-1">
                    <h1 class="text-fg truncate text-lg font-bold">{{ petData.name }}</h1>
                    <p class="text-fg-muted truncate text-xs">
                        <template v-if="petData.species">{{ petData.species }}</template>
                        <template v-if="petData.morph"> · {{ petData.morph }}</template>
                    </p>
                    <p v-if="age" class="text-fg-faint text-xs">{{ age }}</p>
                </div>
            </div>

            <!-- Bio -->
            <p v-if="petData.bio" class="text-fg-muted text-sm leading-relaxed">
                {{ petData.bio }}
            </p>

            <!-- Photos (scrollable) -->
            <div v-if="petData.photos.length" class="flex gap-2 overflow-x-auto pb-1">
                <img
                    v-for="photo in petData.photos.slice(0, 6)"
                    :key="photo.id"
                    :src="photoUrl(photo.id)"
                    :alt="photo.caption || petData.name"
                    class="h-20 w-20 flex-shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                    loading="lazy"
                />
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-3 gap-2">
                <div
                    v-if="petData.weightRecords.length"
                    class="glass-card rounded-lg p-2.5 text-center"
                >
                    <p class="text-fg text-lg font-bold">
                        {{ petData.weightRecords[0].weightGrams }}g
                    </p>
                    <p class="text-fg-faint text-[10px] uppercase">
                        {{ $t("publicProfile.weight") }}
                    </p>
                </div>
                <div
                    v-if="petData.feedings.length"
                    class="glass-card rounded-lg p-2.5 text-center"
                >
                    <p class="text-fg text-lg font-bold">{{ petData.feedings.length }}</p>
                    <p class="text-fg-faint text-[10px] uppercase">
                        {{ $t("publicProfile.feedings") }}
                    </p>
                </div>
                <div
                    v-if="petData.sheddings.length"
                    class="glass-card rounded-lg p-2.5 text-center"
                >
                    <p class="text-fg text-lg font-bold">{{ petData.sheddings.length }}</p>
                    <p class="text-fg-faint text-[10px] uppercase">
                        {{ $t("publicProfile.sheddings") }}
                    </p>
                </div>
            </div>

            <!-- View Full Profile Link -->
            <a
                :href="fullProfileUrl"
                target="_blank"
                rel="noopener"
                class="text-primary-400 flex items-center justify-center gap-1 text-xs font-medium"
            >
                {{ $t("publicProfile.viewFullProfile") }}
                <Icon name="lucide:external-link" class="h-3 w-3" />
            </a>

            <!-- Branding -->
            <div class="flex items-center justify-center gap-1.5">
                <Icon name="lucide:paw-print" class="text-primary-400 h-2.5 w-2.5" />
                <p class="text-fg-faint text-[10px]">
                    {{ $t("publicProfile.poweredBy") }}
                    <a href="/" target="_blank" rel="noopener" class="text-primary-400 font-semibold">
                        KeeperLog
                    </a>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface PublicPetPhoto {
    id: string;
    caption: string | null;
    tags: string[];
    isProfilePicture: boolean;
    takenAt: string;
}

interface PublicPetData {
    name: string;
    bio: string | null;
    species: string | null;
    morph: string | null;
    gender: string | null;
    birthDate: string | null;
    profilePhotoId: string | null;
    photos: PublicPetPhoto[];
    feedings: { fedAt: string }[];
    sheddings: { startedAt: string }[];
    weightRecords: { weightGrams: number; measuredAt: string }[];
    slug: string;
}

definePageMeta({ layout: false });

const route = useRoute();
const { t } = useI18n();
const config = useRuntimeConfig();
const slug = route.params.slug as string;

const loading = ref(true);
const petData = ref<PublicPetData | null>(null);

const apiBase = config.public.apiBaseURL;

async function fetchPublicPet() {
    try {
        const res = await fetch(`${apiBase}/api/public/pets/${encodeURIComponent(slug)}`);
        if (!res.ok) {
            petData.value = null;
            return;
        }
        const json = await res.json();
        if (json.success) {
            petData.value = json.data;
        }
    } catch {
        petData.value = null;
    } finally {
        loading.value = false;
    }
}

onMounted(fetchPublicPet);

function photoUrl(photoId: string): string {
    return `${apiBase}/api/public/pets/${slug}/photos/${photoId}`;
}

const profilePhotoUrl = computed(() =>
    petData.value?.profilePhotoId ? photoUrl(petData.value.profilePhotoId) : null,
);

const fullProfileUrl = computed(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/p/${slug}`;
});

const age = computed(() => {
    if (!petData.value?.birthDate) return null;
    const birth = new Date(petData.value.birthDate);
    const now = new Date();
    const months =
        (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    if (months < 12) {
        return t("publicProfile.ageMonths", { months });
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
        return t("publicProfile.ageYears", { years });
    }
    return t("publicProfile.ageYearsMonths", { years, months: remainingMonths });
});
</script>
