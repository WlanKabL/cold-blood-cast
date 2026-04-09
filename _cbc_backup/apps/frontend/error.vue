<template>
    <div class="bg-base flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <h1 class="text-fg text-4xl font-bold sm:text-6xl">
            {{ error?.statusCode || 500 }}
        </h1>
        <p class="text-fg-muted mt-3 text-lg">
            {{ error?.statusMessage || $t("errorPage.fallback") }}
        </p>
        <p
            v-if="error?.message && error.message !== error.statusMessage"
            class="text-fg-dim mt-1 text-sm"
        >
            {{ error.message }}
        </p>

        <UButton class="mt-8" size="lg" @click="handleError">
            {{ $t("errorPage.goHome") }}
        </UButton>
    </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{ error: NuxtError }>();

const { t } = useI18n();

useHead({ title: () => t("errorPage.title") });

function handleError() {
    clearError({ redirect: "/" });
}
</script>
