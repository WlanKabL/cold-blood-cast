<template>
    <div class="bg-base flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <img
            src="/cbc.png"
            alt="KeeperLog"
            class="shadow-primary-500/20 mx-auto mb-6 h-16 w-16 rounded-2xl shadow-lg"
        />

        <h1 class="text-fg text-4xl font-bold sm:text-6xl">{{ error?.statusCode || 500 }}</h1>
        <p class="text-fg-muted mt-3 text-lg">
            {{ error?.statusMessage || $t("errorPage.fallback") }}
        </p>
        <p
            v-if="error?.message && error.message !== error.statusMessage"
            class="text-fg-dim mt-1 text-sm"
        >
            {{ error.message }}
        </p>

        <button
            class="from-primary-500 shadow-primary-500/25 hover:shadow-primary-500/40 mt-8 rounded-xl bg-linear-to-r to-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition"
            @click="handleError"
        >
            {{ $t("errorPage.goHome") }}
        </button>
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
