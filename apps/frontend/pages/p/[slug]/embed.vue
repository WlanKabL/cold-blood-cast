<template>
    <div class="public-page-bg bg-base min-h-dvh p-4">
        <div class="flex min-h-[200px] items-center justify-center">
            <div v-if="loading" class="text-center">
                <Icon name="lucide:loader-2" class="text-fg-faint h-6 w-6 animate-spin" />
            </div>
            <div v-else class="text-center">
                <Icon name="lucide:shield-x" class="text-fg-faint mx-auto mb-2 h-8 w-8" />
                <p class="text-fg-muted text-sm">{{ $t("publicProfile.notFound") }}</p>
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
                `/keeper/${encodeURIComponent(json.data.userSlug)}/p/${encodeURIComponent(json.data.petSlug)}/embed`,
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
