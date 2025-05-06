<!-- layouts/background.vue -->
<template>
    <div class="relative min-h-screen flex flex-col bg-[#0D1117] text-zinc-100">
        <!-- Dynamischer Background -->
        <div class="fixed inset-0 z-0">
            <img
                :src="backgroundImage"
                alt="Background"
                class="w-full h-full object-cover object-center"
            />
            <div
                class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0D1117]"
            />
        </div>

        <!-- App-Content -->
        <div class="min-h-screen flex flex-col text-zinc-100 relative z-10">
            <NavBar class="bg-[#161B22]/95 shadow-sm backdrop-blur-sm" />
            <main class="flex-1 bg-transparent">
                <NuxtPage />
            </main>
            <PageFooter class="bg-[#161B22]/90" />
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
const defaultImage = "/background.png";

// aus definePageMeta lesen
const backgroundImage = computed(() => {
    return (route.meta.layoutBackgroundImage as string) ?? defaultImage;
});
</script>
