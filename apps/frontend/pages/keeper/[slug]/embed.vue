<template>
    <div class="min-h-screen bg-[#0d0d0d] p-4">
        <div v-if="loading" class="flex h-full items-center justify-center py-20">
            <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-gray-500" />
        </div>

        <div v-else-if="!userData" class="flex h-full items-center justify-center py-20">
            <p class="text-sm text-gray-500">{{ $t("publicProfile.notFound") }}</p>
        </div>

        <div v-else class="space-y-3">
            <!-- Header -->
            <div class="flex items-center gap-3">
                <img
                    v-if="userData.hasAvatar"
                    :src="avatarUrl"
                    :alt="userData.displayName || userData.username"
                    class="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
                />
                <div
                    v-else
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"
                >
                    <Icon name="lucide:user" class="h-5 w-5 text-gray-500" />
                </div>
                <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-white">
                        {{ userData.displayName || userData.username }}
                    </p>
                    <p v-if="userData.tagline" class="truncate text-xs text-gray-400">
                        {{ userData.tagline }}
                    </p>
                </div>
            </div>

            <!-- Bio -->
            <p v-if="userData.bio" class="line-clamp-3 text-xs leading-relaxed text-gray-300">
                {{ userData.bio }}
            </p>

            <!-- Stats -->
            <div v-if="userData.stats" class="grid grid-cols-2 gap-2">
                <div class="rounded-lg bg-white/5 p-2 text-center">
                    <p class="text-sm font-bold text-white">{{ userData.stats.petCount }}</p>
                    <p class="text-[10px] text-gray-500">{{ $t("userProfile.statPets") }}</p>
                </div>
                <div class="rounded-lg bg-white/5 p-2 text-center">
                    <p class="text-sm font-bold text-white">{{ userData.stats.totalPhotos }}</p>
                    <p class="text-[10px] text-gray-500">{{ $t("userProfile.statPhotos") }}</p>
                </div>
            </div>

            <!-- Pets -->
            <div v-if="userData.pets.length" class="space-y-1.5">
                <div
                    v-for="pet in userData.pets.slice(0, 4)"
                    :key="pet.id"
                    class="flex items-center gap-2 rounded-lg bg-white/5 p-2"
                >
                    <Icon name="lucide:paw-print" class="h-3.5 w-3.5 text-gray-500" />
                    <span class="truncate text-xs font-medium text-gray-200">{{ pet.name }}</span>
                    <span v-if="pet.species" class="text-[10px] text-gray-500">{{
                        pet.species
                    }}</span>
                </div>
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
interface EmbedUserData {
    slug: string;
    displayName: string | null;
    username: string;
    bio: string | null;
    tagline: string | null;
    hasAvatar: boolean;
    stats: { petCount: number; totalPhotos: number } | null;
    pets: Array<{ id: string; name: string; species: string }>;
}

definePageMeta({ layout: false });

const route = useRoute();
const config = useRuntimeConfig();
const slug = route.params.slug as string;
const apiBase = config.public.apiBaseURL;

const loading = ref(true);
const userData = ref<EmbedUserData | null>(null);

const avatarUrl = computed(() => `${apiBase}/api/public/users/${encodeURIComponent(slug)}/avatar`);

const profileUrl = computed(() => `${window.location.origin}/keeper/${encodeURIComponent(slug)}`);

onMounted(async () => {
    try {
        const res = await fetch(`${apiBase}/api/public/users/${encodeURIComponent(slug)}`);
        if (res.ok) {
            const json = await res.json();
            if (json.success) userData.value = json.data;
        }
    } catch {
        // Ignore
    } finally {
        loading.value = false;
    }
});
</script>
