<template>
    <div
        class="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-[#0D1117] text-zinc-100"
    >
        <h1 class="text-7xl sm:text-8xl font-extrabold text-indigo-500 mb-4 animate-pulse">
            {{ error?.statusCode || 404 }}
        </h1>
        <p class="text-lg sm:text-xl mb-6 text-zinc-400 max-w-md">
            {{ error?.statusMessage || "Oops. This page doesn't exist anymore or has been moved." }}
        </p>

        <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
            Back to Homepage
            <span class="animate-bounce">🏠</span>
        </NuxtLink>

        <p class="mt-10 text-xs text-zinc-600/50 italic">
            Error code: {{ error?.statusCode || 404 }}
        </p>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
});

defineProps<{
    error: {
        statusCode?: number;
        statusMessage?: string;
        message?: string;
    };
}>();

useSeoMeta({
    title: "404 – Page Not Found",
    ogTitle: "404 – Page Not Found",
    description:
        "Oops! This page doesn’t exist or might have been moved. Head back to explore more about WlanKabL.",
    ogDescription:
        "Oops! This page doesn’t exist or might have been moved. Head back to explore more about WlanKabL.",
    ogImage: "/Crowd-Nation-Logo-BETTER.png",
    twitterCard: "summary_large_image",
});
</script>
