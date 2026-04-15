<template>
    <PricingContent />
</template>

<script setup lang="ts">
const { t } = useI18n();
useHead({ title: () => t("pages.pricing.title") });
</script>
