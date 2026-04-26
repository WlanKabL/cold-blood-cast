<template>
    <div class="public-page-bg bg-page">
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
const slug = route.params.slug as string;
const api = useApi();

const loading = ref(true);

async function resolveAndRedirect() {
    try {
        const data = await api.get<{ userSlug: string; petSlug: string }>(
            `/api/public/pets/resolve/${encodeURIComponent(slug)}`,
        );
        await navigateTo(
            `/keeper/${encodeURIComponent(data.userSlug)}/p/${encodeURIComponent(data.petSlug)}`,
            { replace: true, redirectCode: 301 },
        );
        return;
    } catch {
        // fall through to not found
    }
    loading.value = false;
}

onMounted(resolveAndRedirect);
</script>
