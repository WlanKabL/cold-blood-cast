<template>
    <div class="bg-page flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <img
            src="/cbc.png"
            alt="KeeperLog"
            class="shadow-primary-500/20 mx-auto mb-6 h-16 w-16 rounded-2xl shadow-lg"
        />

        <!-- 404 -->
        <template v-if="error?.statusCode === 404">
            <h1 class="text-fg text-5xl font-bold sm:text-7xl">404</h1>
            <p class="text-fg-muted mt-3 text-lg">
                {{ $t("errorPage.notFoundMessage") }}
            </p>
            <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <UiButton @click="handleError">
                    {{ $t("errorPage.goHome") }}
                </UiButton>
                <UiButton variant="ghost" @click="$router.back()">
                    {{ $t("errorPage.goBack") }}
                </UiButton>
            </div>
        </template>

        <!-- Other errors -->
        <template v-else>
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
            <UiButton class="mt-8" @click="handleError">
                {{ $t("errorPage.goHome") }}
            </UiButton>
        </template>
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
