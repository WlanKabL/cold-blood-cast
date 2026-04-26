<template>
    <div class="bg-page text-fg relative min-h-dvh">
        <PublicNav />

        <!-- ═══ Content ═══ -->
        <div class="pt-24">
            <PricingContent :is-public="true" />
        </div>

        <PublicFooter />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { t } = useI18n();

useHead({
    htmlAttrs: { class: "scroll-smooth" },
    title: () => t("pages.pricing.title"),
    meta: [
        { name: "description", content: () => t("seo.home.description") },
        { property: "og:title", content: () => t("pages.pricing.title") },
    ],
});
</script>
