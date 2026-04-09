<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
// Initialize settings store globally — ensures theme + locale are applied
// on ALL pages, including layout:false pages (login, register, landing, etc.)
useSettingsStore().init();
</script>
