<template>
    <div class="public-page-bg bg-base">
        <LayoutGuestControls />
        <div class="flex min-h-dvh items-center justify-center">
            <div v-if="loading" class="text-center">
                <Icon name="lucide:loader-2" class="text-fg-faint h-8 w-8 animate-spin" />
                <p class="text-fg-muted mt-3 text-sm">{{ $t("common.redirecting") }}</p>
            </div>
            <div v-else class="px-4 text-center">
                <Icon name="lucide:shield-x" class="text-fg-faint mx-auto mb-4 h-16 w-16" />
                <h1 class="text-fg mb-2 text-2xl font-bold">{{ $t("publicProfile.notFound") }}</h1>
                <p class="text-fg-muted text-sm">{{ $t("publicProfile.notFoundHint") }}</p>
                <NuxtLink to="/" class="text-primary-400 mt-6 inline-block text-sm font-medium">
                    {{ $t("publicProfile.backToHome") }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const config = useRuntimeConfig();
const slug = route.params.slug as string;

const loading = ref(true);
const apiBase = config.public.apiBaseURL;

async function resolveAndRedirect() {
    try {
        const res = await fetch(`${apiBase}/api/public/pets/resolve/${encodeURIComponent(slug)}`);
        if (!res.ok) {
            loading.value = false;
            return;
        }
        const json = await res.json();
        if (json.success) {
            await navigateTo(
                `/keeper/${encodeURIComponent(json.data.userSlug)}/p/${encodeURIComponent(json.data.petSlug)}`,
                { replace: true, redirectCode: 301 },
            );
            return;
        }
    } catch {
        // fall through to not found
    }
    loading.value = false;
}

onMounted(resolveAndRedirect);
</script>
