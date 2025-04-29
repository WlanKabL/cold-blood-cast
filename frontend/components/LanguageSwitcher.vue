<template>
    <select v-model="$i18n.locale" class="bg-zinc-800 text-white rounded px-2 py-1">
        <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
            {{ locale.name }}
        </option>
    </select>
</template>

<script setup lang="ts">
const availableLocales = useI18n().locales.value.filter((l) => typeof l !== "string") as {
    code: string;
    name: string;
}[];
</script>
