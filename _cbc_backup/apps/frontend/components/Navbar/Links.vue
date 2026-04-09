<template>
    <NuxtLink
        to="/enclosures"
        class="block hover:text-emerald-400 transition-colors"
        exact-active-class="border-b-2 border-emerald-600 pb-1"
    >
        {{ $t("nav.enclosures") }}
    </NuxtLink>
    <NuxtLink
        to="/pets"
        class="block hover:text-emerald-400 transition-colors"
        exact-active-class="border-b-2 border-emerald-600 pb-1"
    >
        {{ $t("nav.pets") }}
    </NuxtLink>
    <NuxtLink
        to="/sensors"
        class="block hover:text-emerald-400 transition-colors"
        exact-active-class="border-b-2 border-emerald-600 pb-1"
    >
        {{ $t("nav.sensors") }}
    </NuxtLink>
    <NuxtLink
        to="/about"
        class="block hover:text-emerald-400 transition-colors"
        exact-active-class="border-b-2 border-emerald-600 pb-1"
    >
        {{ $t("nav.about") }}
    </NuxtLink>
</template>
