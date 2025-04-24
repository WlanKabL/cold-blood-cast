<template>
    <div class="container mx-auto px-4 py-8">
        <div v-if="!hideBackButton" class="mb-0">
            <button
                class="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                @click="goBack"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
                Back
            </button>
        </div>
        <div class="bg-[#0D1117] p-6">
            <div class="text-center max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <h2 v-if="title" class="text-3xl sm:text-4xl font-bold text-white mb-4">
                    {{ title }}
                </h2>
                <p v-if="subtitle" class="text-gray-400">
                    {{ subtitle }}
                </p>
            </div>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title?: string;
    subtitle?: string;
    hideBackButton?: boolean;
}>();

const route = useRoute();
const router = useRouter();

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // fallback: geh einen Pfad höher, z.B. /projects/slug → /projects
        const segments = route.fullPath.split("/");
        segments.pop(); // letzten Teil (slug) entfernen
        router.push(segments.join("/") || "/");
    }
}
</script>
