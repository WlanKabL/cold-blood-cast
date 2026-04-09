<template>
    <div
        class="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-base text-fg"
    >
        <h1 class="text-7xl sm:text-8xl font-extrabold text-emerald-500 mb-4 animate-pulse">
            {{ error?.statusCode || 404 }}
        </h1>
        <p class="text-lg sm:text-xl mb-6 text-fg-muted max-w-md">
            {{ error?.statusMessage || $t("error.not_found_message") }}
        </p>

        <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
            {{ $t("error.back_home") }}
        </NuxtLink>

        <p class="mt-10 text-xs text-fg-soft italic">
            {{ $t("error.error_code") }}: {{ error?.statusCode || 404 }}
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    error: {
        statusCode?: number;
        statusMessage?: string;
        message?: string;
    };
}>();

definePageMeta({
    layout: false,
});

useSeoMeta({
    title: "404 – Page Not Found",
    ogTitle: "404 – Page Not Found",
    description: "This page doesn't exist or has been moved. Go back to Cold Blood Cast.",
    ogDescription: "This page doesn't exist or has been moved. Go back to Cold Blood Cast.",
});
</script>
