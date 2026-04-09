<template>
    <PageContainer :title="$t('sensors.detail_title')">
        <p class="text-fg-muted">{{ $t("sensors.coming_soon") }}</p>
    </PageContainer>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "default",
});

const route = useRoute();
const sensorId = computed(() => route.params.sensorId as string);

useSeoMeta({
    title: "Sensor – Cold Blood Cast",
});
</script>
