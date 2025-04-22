<template>
    <div class="p-8">
        <h1 class="text-3xl font-bold">Projekt: {{ slug }}</h1>
        <p class="text-gray-400 mt-2">Du bist auf einer Projekt-Detailseite.</p>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const slug = route.params.slug as string;
</script>
